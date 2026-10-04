#!/usr/bin/env python3
"""
Promotes approved v2 outputs for the 6 products, cleans old files,
deploys transparent WebP media, and updates databases to use transparent WebP images.

Products:
1. Qaz piltəsi Lotus F-TB941CMW (lotus-f-tb941cmw)
2. Tozsoran Lotus LT 18 Orange (lotus-lt-18-orange)
3. Tozsoran Lotus LT 20 Blue (lotus-lt-20-blue)
4. Utu Buxarli Lotus LT-8803 (lotus-lt-8803)
5. Plite Lotus LT6455 Black (lotus-lt6455-black)
6. Plitə Ardo 6331 GB (ardo-6331-gb)
"""

import os
import shutil
import sqlite3
import datetime
from pathlib import Path

ROOT_DIR = Path('/home/oni10/Desktop/ArdoKataloq')

PRODUCTS_CONFIG = [
    {
        'id': 'lotus-f-tb941cmw',
        'code': 'F-TB941CMW',
        'title': 'Qaz piltəsi Lotus F-TB941CMW',
        'brand': 'LOTUS',
        'cat_folder': 'LOTUS_BISIRME_PANELI',
        'prod_folder': 'Qaz piltəsi Lotus F-TB941CMW',
        'primary_stem': 'Qaz piltəsi Lotus F-TB941CMW',
    },
    {
        'id': 'lotus-lt-18-orange',
        'code': 'LT 18 Orange',
        'title': 'Tozsoran Lotus LT 18 Orange',
        'brand': 'LOTUS',
        'cat_folder': 'LOTUS_TOZSORAN',
        'prod_folder': 'Tozsoran Lotus LT 18 Orange',
        'primary_stem': 'Tozsoran Lotus LT 18 Orange',
    },
    {
        'id': 'lotus-lt-20-blue',
        'code': 'LT 20 Blue',
        'title': 'Tozsoran Lotus LT 20 Blue',
        'brand': 'LOTUS',
        'cat_folder': 'LOTUS_TOZSORAN',
        'prod_folder': 'Tozsoran Lotus LT 20 Blue',
        'primary_stem': 'Tozsoran Lotus LT 20 Blue',
    },
    {
        'id': 'lotus-lt-8803',
        'code': 'LT-8803',
        'title': 'Utu Buxarli Lotus LT-8803',
        'brand': 'LOTUS',
        'cat_folder': 'LOTUS_UTU',
        'prod_folder': 'Utu Buxarli Lotus LT-8803',
        'primary_stem': 'Utu Buxarli Lotus LT-8803',
    },
    {
        'id': 'lotus-lt6455-black',
        'code': 'LT6455 Black',
        'title': 'Plite Lotus LT6455 Black',
        'brand': 'LOTUS',
        'cat_folder': 'LOTUS_BISIRME_PANELI',
        'prod_folder': 'Plite Lotus LT6455 Black',
        'primary_stem': 'Plite Lotus LT6455 Black',
    },
    {
        'id': 'ardo-6331-gb',
        'code': '6331 GB',
        'title': 'Plitə Ardo 6331 GB',
        'brand': 'ARDO',
        'cat_folder': 'ARDO_BISIRME_PANELI',
        'prod_folder': 'Plitə Ardo 6331 GB',
        'primary_stem': 'Plitə Ardo 6331 GB',
    },
]

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
            backup_file = backup_dir / f'{db_path.stem}_backup_{ts}{db_path.suffix}'
            shutil.copy2(db_path, backup_file)
            print(f'[BACKUP] {db_path} -> {backup_file}')


def promote_output_folder(output_dir: Path):
    """
    Overwrites the old files in output_dir with the files from output_dir/yenilənmiş_v2
    and deletes yenilənmiş_v2.
    """
    v2_dir = output_dir / 'yenilənmiş_v2'
    if not v2_dir.exists():
        print(f'[SKIP] No yenilənmiş_v2 in {output_dir}')
        return

    print(f'[PROMOTE] Processing {output_dir}...')
    # Folders to promote
    sub_folders = [
        '01_original',
        '02_transparent',
        '03_mask',
        '04_light_preview',
        '05_dark_preview',
        '06_comparison',
    ]

    for sub in sub_folders:
        src_sub = v2_dir / sub
        dst_sub = output_dir / sub
        if src_sub.exists():
            dst_sub.mkdir(parents=True, exist_ok=True)
            for f in src_sub.iterdir():
                if f.is_file():
                    shutil.copy2(f, dst_sub / f.name)
            print(f'   Updated {sub} ({len(list(src_sub.iterdir()))} files)')

    # Report CSV
    src_report = v2_dir / 'report.csv'
    if src_report.exists():
        shutil.copy2(src_report, output_dir / 'report.csv')
        print('   Updated report.csv')

    # Remove yenilənmiş_v2
    shutil.rmtree(v2_dir)
    print(f'   Cleaned and removed {v2_dir}')


def deploy_media(cfg):
    """
    Copies transparent WebP (and preview WebP) to public/media and site/public/media.
    """
    brand_output_dir = ROOT_DIR / 'Media' / 'BRENDS' / cfg['brand'] / cfg['cat_folder'] / f"{cfg['prod_folder']}_output"
    trans_dir = brand_output_dir / '02_transparent'
    light_dir = brand_output_dir / '04_light_preview'
    dark_dir = brand_output_dir / '05_dark_preview'

    pub_dest = ROOT_DIR / 'public' / 'media' / 'products' / cfg['brand'] / cfg['cat_folder'] / cfg['prod_folder']
    site_pub_dest = ROOT_DIR / 'site' / 'public' / 'media' / 'products' / cfg['brand'] / cfg['cat_folder'] / cfg['prod_folder']

    pub_dest.mkdir(parents=True, exist_ok=True)
    site_pub_dest.mkdir(parents=True, exist_ok=True)

    copied = 0
    # Copy transparent WebPs
    for f in trans_dir.iterdir():
        if f.suffix.lower() == '.webp':
            shutil.copy2(f, pub_dest / f.name)
            shutil.copy2(f, site_pub_dest / f.name)
            copied += 1

    # Also copy light & dark preview WebPs for fallback
    if light_dir.exists():
        for f in light_dir.iterdir():
            if f.suffix.lower() == '.webp':
                shutil.copy2(f, pub_dest / f.name)
                shutil.copy2(f, site_pub_dest / f.name)
    if dark_dir.exists():
        for f in dark_dir.iterdir():
            if f.suffix.lower() == '.webp':
                shutil.copy2(f, pub_dest / f.name)
                shutil.copy2(f, site_pub_dest / f.name)

    print(f"[DEPLOY] {cfg['title']}: Deployed {copied} transparent WebP files to {pub_dest} & {site_pub_dest}")


def update_databases():
    """
    Updates the 4 databases to set primary_image, dark_image, original_image,
    and product_media url/dark_url to transparent .webp paths.
    """
    for db_path in DB_PATHS:
        if not db_path.exists():
            continue

        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        print(f'\n[DATABASE UPDATE] {db_path.name}...')

        for cfg in PRODUCTS_CONFIG:
            rel_folder = f"/media/products/{cfg['brand']}/{cfg['cat_folder']}/{cfg['prod_folder']}"
            primary_webp = f"{rel_folder}/{cfg['primary_stem']}.webp"

            # 1. Update products
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
                (primary_webp, primary_webp, primary_webp, cfg['id'])
            )

            # 2. Update product_media
            # Query existing media for product to preserve sort_order, alt_text, etc.
            cur.execute("SELECT id, sort_order, url FROM product_media WHERE product_id = ? ORDER BY sort_order", (cfg['id'],))
            rows = cur.fetchall()
            for media_id, sort_order, current_url in rows:
                # Strip _light or _dark if present
                clean_url = current_url.replace('_light.webp', '.webp').replace('_dark.webp', '.webp')
                # Make sure it points to rel_folder/<stem>.webp
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
                    (clean_url, clean_url, clean_url, media_id)
                )

            print(f"   Updated {cfg['id']} -> primary: {primary_webp}, media rows: {len(rows)}")

        conn.commit()
        conn.close()


def verify():
    print('\n[VERIFYING DEPLOYED ASSETS AND DATABASE VALUES]...')
    for cfg in PRODUCTS_CONFIG:
        rel_folder = f"/media/products/{cfg['brand']}/{cfg['cat_folder']}/{cfg['prod_folder']}"
        primary_webp = f"{rel_folder}/{cfg['primary_stem']}.webp"

        pub_file = ROOT_DIR / 'public' / primary_webp.lstrip('/')
        site_file = ROOT_DIR / 'site' / 'public' / primary_webp.lstrip('/')

        assert pub_file.exists(), f"Missing public file: {pub_file}"
        assert site_file.exists(), f"Missing site file: {site_file}"
        print(f"   [OK] {cfg['title']}: {pub_file.name} exists ({pub_file.stat().st_size} bytes)")

    for db_path in DB_PATHS:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        for cfg in PRODUCTS_CONFIG:
            cur.execute("SELECT primary_image, dark_image FROM products WHERE id = ?", (cfg['id'],))
            row = cur.fetchone()
            assert row is not None, f"Product {cfg['id']} missing in {db_path}"
            assert '_light' not in row[0] and '_dark' not in row[0], f"Product {cfg['id']} still has theme suffix: {row[0]}"
            assert row[0].endswith('.webp'), f"Product {cfg['id']} primary not webp: {row[0]}"
            cur.execute("SELECT url, dark_url FROM product_media WHERE product_id = ?", (cfg['id'],))
            for m in cur.fetchall():
                assert '_light' not in m[0] and '_dark' not in m[0], f"Media for {cfg['id']} has theme suffix: {m[0]}"
        conn.close()
        print(f"   [OK] Database {db_path.name} verified 100% transparent webp!")


def main():
    print('=== STEP 1: Backing up databases ===')
    backup_databases()

    print('\n=== STEP 2: Promoting v2 and cleaning output folders ===')
    for cfg in PRODUCTS_CONFIG:
        # 1. Media/BRENDS/
        b_out = ROOT_DIR / 'Media' / 'BRENDS' / cfg['brand'] / cfg['cat_folder'] / f"{cfg['prod_folder']}_output"
        promote_output_folder(b_out)
        # 2. Media/ScriptŞəkilMod/Məhsul/
        s_out = ROOT_DIR / 'Media' / 'ScriptŞəkilMod' / 'Məhsul' / cfg['brand'] / cfg['cat_folder'] / f"{cfg['prod_folder']}_output"
        promote_output_folder(s_out)

    print('\n=== STEP 3: Deploying media to public/ and site/public/ ===')
    for cfg in PRODUCTS_CONFIG:
        deploy_media(cfg)

    print('\n=== STEP 4: Updating databases to transparent WebP ===')
    update_databases()

    print('\n=== STEP 5: Verification ===')
    verify()
    print('\n[COMPLETED SUCCESSFULLY]')


if __name__ == '__main__':
    main()
