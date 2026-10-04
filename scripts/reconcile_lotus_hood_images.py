#!/usr/bin/env python3
"""
Reconciles LOTUS hood (havaçəkən / aspirator) products with new Light & Dark mode WebP media assets.
Cleans all legacy records/cache, deploys WebP media assets to public/ and site/public/,
and re-inserts fresh products, media, and specs across both Topdan Kataloq (data/) and Site (site/data/).
"""

import os
import re
import json
import sqlite3
import shutil
from datetime import datetime, timezone

SCRIPTPATH = os.path.abspath(__file__)
ROOT = os.path.dirname(os.path.dirname(SCRIPTPATH))
SOURCE_DIR = os.path.join(ROOT, 'Media/BRENDS/LOTUS/LOTUS_HAVACEKEN')
DEST_PUBLIC = os.path.join(ROOT, 'public/media/products/LOTUS/LOTUS_HAVACEKEN')
DEST_SITE_PUBLIC = os.path.join(ROOT, 'site/public/media/products/LOTUS/LOTUS_HAVACEKEN')
BACKUP_JSON = os.path.join(ROOT, 'scratch/lotus_hoods_backup.json')

DATABASES = [
    os.path.join(ROOT, 'data/catalog.sqlite'),
    os.path.join(ROOT, 'data/catalog-draft.sqlite'),
    os.path.join(ROOT, 'site/data/catalog.sqlite'),
    os.path.join(ROOT, 'site/data/catalog-draft.sqlite'),
]

def utc_now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def sort_key(name):
    m = re.search(r'\((\d+)\)', name)
    return int(m.group(1)) if m else 1

def create_db_backups():
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    for db_path in DATABASES:
        if os.path.exists(db_path):
            backup_dir = os.path.join(os.path.dirname(db_path), 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            db_name = os.path.basename(db_path)
            backup_file = os.path.join(backup_dir, f"{db_name}.{ts}.before_lotus_hood_update.sqlite")
            shutil.copy2(db_path, backup_file)
            print(f"Backed up {db_name} to {backup_file}")

def backup_current_lotus_hoods():
    print("\n--- Backing up current Lotus Hood data ---")
    source_db = DATABASES[2] if os.path.exists(DATABASES[2]) else DATABASES[0]
    conn = sqlite3.connect(source_db)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT * FROM products WHERE brand_id = 'lotus' AND category_id = 'hood' ORDER BY id;")
    products = [dict(r) for r in cur.fetchall()]

    for p in products:
        cur.execute("SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order, id;", (p['id'],))
        p['media'] = [dict(r) for r in cur.fetchall()]

        cur.execute("SELECT * FROM product_specs WHERE product_id = ? ORDER BY sort_order, id;", (p['id'],))
        p['specs'] = [dict(r) for r in cur.fetchall()]

    conn.close()

    os.makedirs(os.path.dirname(BACKUP_JSON), exist_ok=True)
    with open(BACKUP_JSON, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print(f"Successfully backed up {len(products)} Lotus Hood products to {BACKUP_JSON}")
    return products

def deploy_media_assets():
    print("\n--- Deploying Media Assets from _output folders ---")
    subdirs = sorted(os.listdir(SOURCE_DIR))
    output_dirs = [d for d in subdirs if d.endswith('_output')]
    print(f"Found {len(output_dirs)} model output directories.")

    total_deployed = 0
    for od in output_dirs:
        model_name = od.replace('_output', '')
        src_model_dir = os.path.join(SOURCE_DIR, od)

        light_src = os.path.join(src_model_dir, '04_light_preview')
        dark_src = os.path.join(src_model_dir, '05_dark_preview')
        trans_src = os.path.join(src_model_dir, '02_transparent')

        target_dirs = [
            os.path.join(DEST_PUBLIC, model_name),
            os.path.join(DEST_SITE_PUBLIC, model_name)
        ]

        for td in target_dirs:
            os.makedirs(td, exist_ok=True)
            # Remove legacy/stale files (e.g. .jpg, .JPG, .png)
            for f in os.listdir(td):
                os.remove(os.path.join(td, f))

            # Copy light preview files
            for f in sorted(os.listdir(light_src)):
                shutil.copy2(os.path.join(light_src, f), os.path.join(td, f))
                total_deployed += 1

            # Copy dark preview files
            for f in sorted(os.listdir(dark_src)):
                shutil.copy2(os.path.join(dark_src, f), os.path.join(td, f))
                total_deployed += 1

            # Copy transparent webp files
            for f in sorted(os.listdir(trans_src)):
                shutil.copy2(os.path.join(trans_src, f), os.path.join(td, f))
                total_deployed += 1

    print(f"Successfully deployed {total_deployed} media files across public and site/public.")

def ensure_columns(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA table_info(products);")
    prod_cols = [c[1] for c in cur.fetchall()]
    if 'dark_image' not in prod_cols:
        conn.execute("ALTER TABLE products ADD COLUMN dark_image TEXT DEFAULT NULL;")
    if 'crop_rect' not in prod_cols:
        conn.execute("ALTER TABLE products ADD COLUMN crop_rect TEXT DEFAULT NULL;")
    if 'original_image' not in prod_cols:
        conn.execute("ALTER TABLE products ADD COLUMN original_image TEXT DEFAULT NULL;")

    cur.execute("PRAGMA table_info(product_media);")
    pm_cols = [c[1] for c in cur.fetchall()]
    if 'dark_url' not in pm_cols:
        conn.execute("ALTER TABLE product_media ADD COLUMN dark_url TEXT DEFAULT NULL;")
    if 'crop_rect' not in pm_cols:
        conn.execute("ALTER TABLE product_media ADD COLUMN crop_rect TEXT DEFAULT NULL;")
    if 'original_url' not in pm_cols:
        conn.execute("ALTER TABLE product_media ADD COLUMN original_url TEXT DEFAULT NULL;")
    conn.commit()

def delete_lotus_hoods(conn):
    cur = conn.cursor()
    cur.execute("SELECT id FROM products WHERE brand_id = 'lotus' AND category_id = 'hood';")
    product_ids = [r[0] for r in cur.fetchall()]
    print(f"Found {len(product_ids)} existing Lotus Hood products to clean.")

    if not product_ids:
        return product_ids

    placeholders = ','.join('?' for _ in product_ids)
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]

    child_tables_with_prod_id = [
        'product_media_variants', 'product_spec_values', 'product_revisions',
        'publication_jobs', 'product_translations', 'product_variants',
        'product_media', 'product_highlights', 'product_specs',
        'product_view_stats', 'contact_action_stats', 'analytics_events'
    ]

    for t in child_tables_with_prod_id:
        if t in tables:
            cur.execute(f"DELETE FROM {t} WHERE product_id IN ({placeholders});", product_ids)

    if 'media_assets' in tables and 'product_media_variants' in tables:
        cur.execute("""
            DELETE FROM media_assets 
            WHERE id NOT IN (SELECT media_id FROM product_media_variants)
              AND url LIKE '%LOTUS/LOTUS_HAVACEKEN%'
        """)

    cur.execute(f"DELETE FROM products WHERE id IN ({placeholders});", product_ids)
    conn.commit()
    return product_ids

def reconcile_database(db_path, products_data):
    print(f"\n=======================================================")
    print(f"Reconciling: {db_path}")
    print(f"=======================================================")

    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON;")
    ensure_columns(conn)

    # Step 1: Clean out all existing Lotus Hood products and old cache
    delete_lotus_hoods(conn)

    cur = conn.cursor()
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]

    now = utc_now()
    inserted_products = 0
    inserted_media = 0
    inserted_specs = 0

    for p in products_data:
        prod_id = p['id']
        code = p['code']
        title = p['title']
        model_name = title

        folder = os.path.join(DEST_PUBLIC, model_name)
        if not os.path.isdir(folder):
            raise RuntimeError(f"Media folder not found for {model_name} at {folder}")

        # Map each existing media item to new WebP files
        existing_media = p.get('media', [])
        media_items_to_insert = []

        if existing_media:
            for idx, m_old in enumerate(existing_media):
                old_fname = os.path.basename(m_old.get('url', ''))
                base_name = os.path.splitext(old_fname)[0]
                
                light_fname = f"{base_name}_light.webp"
                dark_fname = f"{base_name}_dark.webp"
                trans_fname = f"{base_name}.webp"

                light_file_path = os.path.join(folder, light_fname)
                dark_file_path = os.path.join(folder, dark_fname)
                trans_file_path = os.path.join(folder, trans_fname)

                if not os.path.exists(light_file_path) or not os.path.exists(dark_file_path):
                    raise RuntimeError(f"Missing expected webp files for {old_fname} in {folder}")

                img_url = f"/media/products/LOTUS/LOTUS_HAVACEKEN/{model_name}/{light_fname}"
                dark_url = f"/media/products/LOTUS/LOTUS_HAVACEKEN/{model_name}/{dark_fname}"
                orig_url = f"/media/products/LOTUS/LOTUS_HAVACEKEN/{model_name}/{trans_fname}" if os.path.exists(trans_file_path) else img_url

                media_items_to_insert.append({
                    'id': f"media-{prod_id}-{idx + 1}",
                    'url': img_url,
                    'dark_url': dark_url,
                    'orig_url': orig_url,
                    'sort_order': m_old.get('sort_order', idx),
                    'alt_text': f"{title} - {idx + 1}",
                    'original_name': light_fname
                })
        else:
            files = sorted(os.listdir(folder))
            light_files = sorted([f for f in files if f.endswith('_light.webp')], key=sort_key)
            dark_files = sorted([f for f in files if f.endswith('_dark.webp')], key=sort_key)
            trans_files = sorted([f for f in files if not f.endswith('_light.webp') and not f.endswith('_dark.webp') and f.endswith('.webp')], key=sort_key)

            for idx, lf in enumerate(light_files):
                df = dark_files[idx] if idx < len(dark_files) else None
                tf = trans_files[idx] if idx < len(trans_files) else None
                img_url = f"/media/products/LOTUS/LOTUS_HAVACEKEN/{model_name}/{lf}"
                dark_url = f"/media/products/LOTUS/LOTUS_HAVACEKEN/{model_name}/{df}" if df else None
                orig_url = f"/media/products/LOTUS/LOTUS_HAVACEKEN/{model_name}/{tf}" if tf else img_url

                media_items_to_insert.append({
                    'id': f"media-{prod_id}-{idx + 1}",
                    'url': img_url,
                    'dark_url': dark_url,
                    'orig_url': orig_url,
                    'sort_order': idx,
                    'alt_text': f"{title} - {idx + 1}",
                    'original_name': lf
                })

        if not media_items_to_insert:
            raise RuntimeError(f"No media items found for {model_name}")

        primary_light = media_items_to_insert[0]['url']
        primary_dark = media_items_to_insert[0]['dark_url']

        # 1. Insert Product
        prod_row = {
            'id': prod_id,
            'code': code,
            'title': title,
            'brand_id': 'lotus',
            'category_id': 'hood',
            'primary_image': primary_light,
            'dark_image': primary_dark,
            'is_featured': p.get('is_featured') or 0,
            'is_new': p.get('is_new') or 0,
            'badge_text': p.get('badge_text') or '',
            'badge_color': p.get('badge_color') or 'red',
            'price': p.get('price'),
            'old_price': p.get('old_price'),
            'currency': p.get('currency') or '₼',
            'stock_status': p.get('stock_status') or 'in_stock',
            'short_description': p.get('short_description') or '',
            'description': p.get('description') or '',
            'manufacturing_country': p.get('manufacturing_country') or 'Türkiyə',
            'status': 'published',
            'created_at': p.get('created_at') or now,
            'updated_at': now,
            'image_position': 'center',
            'image_fit': 'contain',
            'crop_rect': None,
            'version': 1,
            'publication_status': 'published',
            'completeness_score': 85
        }

        cur.execute("PRAGMA table_info(products);")
        valid_cols = [c[1] for c in cur.fetchall()]
        insert_dict = {k: v for k, v in prod_row.items() if k in valid_cols}
        cols_str = ', '.join(insert_dict.keys())
        vals_str = ', '.join('?' for _ in insert_dict)
        cur.execute(f"INSERT INTO products ({cols_str}) VALUES ({vals_str})", list(insert_dict.values()))
        inserted_products += 1

        # 2. Insert Product Media
        cur.execute("PRAGMA table_info(product_media);")
        pm_valid = [c[1] for c in cur.fetchall()]

        for m_item in media_items_to_insert:
            pm_row = {
                'id': m_item['id'],
                'product_id': prod_id,
                'url': m_item['url'],
                'media_type': 'image',
                'sort_order': m_item['sort_order'],
                'created_at': now,
                'alt_text': m_item['alt_text'],
                'dark_url': m_item['dark_url'],
                'original_url': m_item['orig_url'],
                'object_position': 'center',
                'fit_mode': 'contain',
                'crop_rect': None,
                'original_name': m_item['original_name']
            }
            pm_insert = {k: v for k, v in pm_row.items() if k in pm_valid}
            pm_cols = ', '.join(pm_insert.keys())
            pm_vals = ', '.join('?' for _ in pm_insert)
            cur.execute(f"INSERT INTO product_media ({pm_cols}) VALUES ({pm_vals})", list(pm_insert.values()))
            inserted_media += 1

        # 3. Insert Product Specs
        specs = p.get('specs', [])
        for s_idx, s in enumerate(specs):
            spec_id = f"spec-{prod_id}-{s_idx}"
            cur.execute("PRAGMA table_info(product_specs);")
            ps_valid = [c[1] for c in cur.fetchall()]

            ps_row = {
                'id': spec_id,
                'product_id': prod_id,
                'name': s.get('name') or s.get('spec_key') or '',
                'value': s.get('value') or s.get('spec_value') or '',
                'description': s.get('description') or '',
                'icon': s.get('icon') or '',
                'spec_group': s.get('spec_group') or 'Əsas',
                'sort_order': s_idx + 1
            }
            ps_insert = {k: v for k, v in ps_row.items() if k in ps_valid}
            ps_cols = ', '.join(ps_insert.keys())
            ps_vals = ', '.join('?' for _ in ps_insert)
            cur.execute(f"INSERT INTO product_specs ({ps_cols}) VALUES ({ps_vals})", list(ps_insert.values()))
            inserted_specs += 1

    conn.commit()
    conn.execute("VACUUM;")
    conn.close()

    print(f"Results for {os.path.basename(db_path)}:")
    print(f"  Products Inserted: {inserted_products}")
    print(f"  Media Records Inserted: {inserted_media}")
    print(f"  Specs Inserted: {inserted_specs}")

def main():
    print("=== LOTUS Hood (Havaçəkən) Images & DB Reconciliation ===")
    create_db_backups()
    products_data = backup_current_lotus_hoods()
    deploy_media_assets()

    for db_path in DATABASES:
        if os.path.exists(db_path):
            reconcile_database(db_path, products_data)

    print("\n=== All databases reconciled successfully! ===")

if __name__ == '__main__':
    main()
