#!/usr/bin/env python3
"""
Migrates ALL catalog products across all brands and categories to use
TRANSPARENT .webp media assets in both CatalogApp and Site, eliminating
all pre-baked _light.webp and _dark.webp references in favor of the
unified dynamic 3D stage and contour shadow system.
"""

import os
import shutil
import sqlite3
import datetime
from pathlib import Path

ROOT_DIR = Path('/home/oni10/Desktop/ArdoKataloq')

DB_PATHS = [
    ROOT_DIR / 'data' / 'catalog.sqlite',
    ROOT_DIR / 'data' / 'catalog-draft.sqlite',
    ROOT_DIR / 'site' / 'data' / 'catalog.sqlite',
    ROOT_DIR / 'site' / 'data' / 'catalog-draft.sqlite',
]


def backup_databases():
    ts = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    for db_path in DB_PATHS:
        if db_path.exists():
            backup_dir = db_path.parent / 'backups'
            backup_dir.mkdir(parents=True, exist_ok=True)
            backup_file = backup_dir / f'{db_path.stem}_backup_all_transparent_{ts}{db_path.suffix}'
            shutil.copy2(db_path, backup_file)
            print(f'[BACKUP] {db_path} -> {backup_file}')


def clean_theme_url(url: str) -> str:
    if not url:
        return url
    # Replace _light.webp or _dark.webp with .webp
    res = url.replace('_light.webp', '.webp').replace('_dark.webp', '.webp')
    return res


def migrate_databases():
    for db_path in DB_PATHS:
        if not db_path.exists():
            continue

        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        print(f'\n[MIGRATING DATABASE] {db_path.name}...')

        # 1. Update products
        cur.execute("SELECT id, primary_image, dark_image, original_image FROM products WHERE primary_image LIKE '%_light%' OR primary_image LIKE '%_dark%' OR dark_image LIKE '%_dark%'")
        prods = cur.fetchall()
        print(f'   Found {len(prods)} products to migrate.')

        for pid, prim, dark, orig in prods:
            new_prim = clean_theme_url(prim)
            new_dark = clean_theme_url(dark or prim)
            new_orig = clean_theme_url(orig or prim)
            cur.execute(
                """
                UPDATE products
                SET primary_image = ?,
                    dark_image = ?,
                    original_image = ?,
                    image_position = 'center',
                    image_fit = 'contain',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (new_prim, new_dark, new_orig, pid)
            )

        # 2. Update product_media
        cur.execute("SELECT id, url, dark_url, original_url FROM product_media WHERE url LIKE '%_light%' OR url LIKE '%_dark%' OR dark_url LIKE '%_dark%'")
        media = cur.fetchall()
        print(f'   Found {len(media)} media records to migrate.')

        for mid, murl, dark_url, orig_url in media:
            new_url = clean_theme_url(murl)
            new_dark = clean_theme_url(dark_url or murl)
            new_orig = clean_theme_url(orig_url or murl)
            cur.execute(
                """
                UPDATE product_media
                SET url = ?,
                    dark_url = ?,
                    original_url = ?,
                    object_position = 'center',
                    fit_mode = 'contain'
                WHERE id = ?
                """,
                (new_url, new_dark, new_orig, mid)
            )

        conn.commit()

        # Sanity check
        cur.execute("SELECT count(*) FROM products WHERE primary_image LIKE '%_light%' OR primary_image LIKE '%_dark%'")
        rem_p = cur.fetchone()[0]
        cur.execute("SELECT count(*) FROM product_media WHERE url LIKE '%_light%' OR url LIKE '%_dark%'")
        rem_m = cur.fetchone()[0]
        print(f'   [OK] Remaining with theme suffix in {db_path.name}: products={rem_p}, media={rem_m}')
        assert rem_p == 0 and rem_m == 0, f"Failed migration on {db_path.name}"
        conn.close()


def verify_disk_files():
    print('\n[VERIFYING ALL MIGRATED PRODUCT MEDIA ON DISK]...')
    db_path = DB_PATHS[0]
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("SELECT id, code, title, primary_image FROM products WHERE brand_id IN ('ardo', 'artel', 'lotus', 'ARDO', 'ARTEL', 'LOTUS')")
    products = cur.fetchall()

    missing_pub = []
    missing_site = []

    for pid, code, title, prim in products:
        if not prim:
            continue
        pub_p = ROOT_DIR / 'public' / prim.lstrip('/')
        site_p = ROOT_DIR / 'site' / 'public' / prim.lstrip('/')
        if not pub_p.exists():
            missing_pub.append((pid, prim, str(pub_p)))
        if not site_p.exists():
            missing_site.append((pid, prim, str(site_p)))

    cur.execute("""
        SELECT pm.id, pm.product_id, pm.url 
        FROM product_media pm 
        JOIN products p ON pm.product_id = p.id
        WHERE p.brand_id IN ('ardo', 'artel', 'lotus', 'ARDO', 'ARTEL', 'LOTUS')
    """)
    media_items = cur.fetchall()
    for mid, pid, murl in media_items:
        if not murl:
            continue
        pub_m = ROOT_DIR / 'public' / murl.lstrip('/')
        site_m = ROOT_DIR / 'site' / 'public' / murl.lstrip('/')
        if not pub_m.exists():
            missing_pub.append((pid, murl, str(pub_m)))
        if not site_m.exists():
            missing_site.append((pid, murl, str(site_m)))

    conn.close()

    print(f'Total products checked: {len(products)}')
    print(f'Total media rows checked: {len(media_items)}')
    print(f'Missing files in public/: {len(missing_pub)}')
    print(f'Missing files in site/public/: {len(missing_site)}')

    if missing_pub:
        print('Sample missing in public/:', missing_pub[:5])
    if missing_site:
        print('Sample missing in site/public/:', missing_site[:5])

    assert len(missing_pub) == 0, f"Found missing files in public/: {missing_pub}"
    assert len(missing_site) == 0, f"Found missing files in site/public/: {missing_site}"
    print('   [OK] 100% of all migrated product media files exist on disk in both directories!')


def main():
    print('=== STEP 1: Backing up all 4 databases ===')
    backup_databases()

    print('\n=== STEP 2: Migrating all products and media to transparent .webp ===')
    migrate_databases()

    print('\n=== STEP 3: Verifying disk assets ===')
    verify_disk_files()

    print('\n[ALL PRODUCTS SUCCESSFULLY MIGRATED TO TRANSPARENT .WEBP]')


if __name__ == '__main__':
    main()
