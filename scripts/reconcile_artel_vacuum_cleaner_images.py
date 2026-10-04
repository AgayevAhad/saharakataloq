#!/usr/bin/env python3
"""
Reconciles ARTEL vacuum cleaner (tozsoran) products with new Light & Dark mode WebP media assets.
Cleans all legacy records/cache, deploys WebP media assets to public/ and site/public/,
and re-inserts fresh products, media, and specs across both Topdan Kataloq (data/) and Site (site/data/).
"""

import os
import re
import json
import sqlite3
import shutil
import hashlib
from datetime import datetime, timezone

SCRIPTPATH = os.path.abspath(__file__)
ROOT = os.path.dirname(os.path.dirname(SCRIPTPATH))
SOURCE_DIR = os.path.join(ROOT, 'Media/BRENDS/ARTEL/ARTEL_TOZSORAN')
DEST_PUBLIC = os.path.join(ROOT, 'public/media/products/ARTEL/ARTEL_TOZSORAN')
DEST_SITE_PUBLIC = os.path.join(ROOT, 'site/public/media/products/ARTEL/ARTEL_TOZSORAN')
BACKUP_JSON = os.path.join(ROOT, 'scratch/artel_vacuum_cleaners_backup.json')

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
    return int(m.group(1)) if m else 0

def create_db_backups():
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    for db_path in DATABASES:
        if os.path.exists(db_path):
            backup_dir = os.path.join(os.path.dirname(db_path), 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            db_name = os.path.basename(db_path)
            backup_file = os.path.join(backup_dir, f"{db_name}.{ts}.before_artel_vc_update.sqlite")
            shutil.copy2(db_path, backup_file)
            print(f"Backed up {db_name} to {backup_file}")

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
            # Remove legacy/stale files (e.g. .jpg, .JPG)
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

def delete_artel_vacuum_cleaners(conn):
    cur = conn.cursor()
    cur.execute("SELECT id FROM products WHERE brand_id = 'artel' AND category_id = 'vacuum_cleaner';")
    product_ids = [r[0] for r in cur.fetchall()]
    print(f"Found {len(product_ids)} existing ARTEL vacuum cleaner products to delete.")

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
              AND url LIKE '%ARTEL/ARTEL_TOZSORAN%'
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

    # Step 1: Clean out all existing ARTEL vacuum cleaner products and old cache
    delete_artel_vacuum_cleaners(conn)

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

        files = sorted(os.listdir(folder))
        light_files = sorted([f for f in files if f.endswith('_light.webp')], key=sort_key)
        dark_files = sorted([f for f in files if f.endswith('_dark.webp')], key=sort_key)
        trans_files = sorted([f for f in files if not f.endswith('_light.webp') and not f.endswith('_dark.webp') and f.endswith('.webp')], key=sort_key)

        if not light_files or not dark_files:
            raise RuntimeError(f"Missing light or dark files for {model_name}")

        primary_light = f"/media/products/ARTEL/ARTEL_TOZSORAN/{model_name}/{light_files[0]}"
        primary_dark = f"/media/products/ARTEL/ARTEL_TOZSORAN/{model_name}/{dark_files[0]}"

        # 1. Insert Product
        prod_row = {
            'id': prod_id,
            'code': code,
            'title': title,
            'brand_id': 'artel',
            'category_id': 'vacuum_cleaner',
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
            'manufacturing_country': p.get('manufacturing_country') or 'Özbəkistan',
            'status': 'published',
            'created_at': p.get('created_at') or now,
            'updated_at': now,
            'image_position': p.get('image_position') or 'center',
            'image_fit': p.get('image_fit') or 'contain',
            'version': 1,
            'publication_status': 'published',
            'completeness_score': 85
        }

        cur.execute("PRAGMA table_info(products);")
        valid_cols = [c[1] for c in cur.fetchall()]
        insert_dict = {k: v for k, v in prod_row.items() if k in valid_cols}

        col_names = ', '.join(insert_dict.keys())
        val_placeholders = ', '.join('?' for _ in insert_dict)
        cur.execute(f"INSERT INTO products ({col_names}) VALUES ({val_placeholders})", list(insert_dict.values()))
        inserted_products += 1

        # 2. Site-specific: product_variants
        var_id = f"var_{prod_id}_def"
        if 'product_variants' in tables:
            cur.execute("""
                INSERT OR REPLACE INTO product_variants (
                    id, product_id, model_code, sku, price, is_default, status, sort_order, created_at
                ) VALUES (?, ?, ?, ?, ?, 1, 'active', 0, ?)
            """, (var_id, prod_id, code, code, p.get('price'), now))

        # 3. Insert Media items and Site media tables
        for idx, (lf, df) in enumerate(zip(light_files, dark_files)):
            media_id = f"media-{prod_id}-{idx + 1}"
            light_url = f"/media/products/ARTEL/ARTEL_TOZSORAN/{model_name}/{lf}"
            dark_url = f"/media/products/ARTEL/ARTEL_TOZSORAN/{model_name}/{df}"
            orig_name = trans_files[idx] if idx < len(trans_files) else lf

            pm_row = {
                'id': media_id,
                'product_id': prod_id,
                'media_type': 'image',
                'url': light_url,
                'dark_url': dark_url,
                'alt_text': f"{title} - {idx + 1}",
                'original_name': orig_name,
                'sort_order': idx,
                'object_position': 'center',
                'fit_mode': 'contain'
            }

            cur.execute("PRAGMA table_info(product_media);")
            valid_pm_cols = [c[1] for c in cur.fetchall()]
            pm_dict = {k: v for k, v in pm_row.items() if k in valid_pm_cols}

            pm_col_names = ', '.join(pm_dict.keys())
            pm_val_placeholders = ', '.join('?' for _ in pm_dict)
            cur.execute(f"INSERT INTO product_media ({pm_col_names}) VALUES ({pm_val_placeholders})", list(pm_dict.values()))
            inserted_media += 1

            if 'media_assets' in tables and 'product_media_variants' in tables:
                asset_hash = hashlib.sha256(f"{prod_id}_{orig_name}".encode('utf-8')).hexdigest()[:12]
                asset_id = f"asset_{asset_hash}"
                cur.execute("""
                    INSERT OR REPLACE INTO media_assets (id, type, url, original_name, mime_type, byte_size, verification_status, created_at)
                    VALUES (?, 'image', ?, ?, 'image/webp', 0, 'legacy_unverified', ?)
                """, (asset_id, light_url, orig_name, now))

                pmv_id = f"pmv_{prod_id}_{media_id}"
                cur.execute("""
                    INSERT OR REPLACE INTO product_media_variants (
                        id, product_id, variant_id, media_id, legacy_media_id, is_primary, sort_order, object_position, fit_mode, alt_text
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'center', 'contain', ?)
                """, (pmv_id, prod_id, var_id, asset_id, media_id, 1 if idx == 0 else 0, idx, f"{title} - {idx + 1}"))

        # 4. Insert Product Specs
        specs = p.get('specs') or []
        for s_idx, spec in enumerate(specs):
            spec_id = spec.get('id') or f"spec-{prod_id}-{s_idx + 1}"
            spec_name = spec.get('name') or ''
            spec_val = spec.get('value') or ''
            spec_grp = spec.get('spec_group') or spec.get('group') or 'Əsas'

            cur.execute("""
                INSERT INTO product_specs (id, product_id, name, value, sort_order, spec_group)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (spec_id, prod_id, spec_name, spec_val, s_idx, spec_grp))
            inserted_specs += 1

            if 'spec_definitions' in tables and 'product_spec_values' in tables:
                spec_clean = spec_name.strip()
                def_key = re.sub(r'[^a-z0-9_]+', '_', spec_clean.lower()).strip('_')
                cur.execute("SELECT id FROM spec_definitions WHERE name_az = ? OR key = ?", (spec_clean, def_key))
                existing_def = cur.fetchone()
                if existing_def:
                    sdef_id = existing_def[0]
                else:
                    sdef_id = f"sdef_{hashlib.sha256(def_key.encode('utf-8')).hexdigest()[:12]}"
                    cur.execute("""
                        INSERT OR IGNORE INTO spec_definitions (id, key, name_az, data_type, unit_family, filterable, comparable, required, sort_order)
                        VALUES (?, ?, ?, 'text', '', 0, 1, 0, ?)
                    """, (sdef_id, def_key, spec_clean, s_idx))

                psv_id = f"psv_{prod_id}_{spec_id}"
                cur.execute("""
                    INSERT OR REPLACE INTO product_spec_values (
                        id, product_id, variant_id, spec_definition_id, legacy_spec_id, raw_name, raw_value,
                        normalized_value_text, normalization_status, is_override, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'valid', 0, ?)
                """, (psv_id, prod_id, var_id, sdef_id, spec_id, spec_clean, spec_val, spec_val, now))

        # 5. Site-specific: product_translations
        if 'product_translations' in tables:
            cur.execute("""
                INSERT OR REPLACE INTO product_translations (product_id, locale, title, short_description, description)
                VALUES (?, 'az', ?, ?, ?)
            """, (prod_id, title, p.get('short_description') or '', p.get('description') or ''))

        # 6. Site-specific: product_revisions
        if 'product_revisions' in tables:
            rev_id = f"rev_{prod_id}_v1"
            cur.execute("""
                INSERT OR REPLACE INTO product_revisions (id, product_id, version, action, payload_json, diff_json, actor, actor_id, created_at)
                VALUES (?, ?, 1, 'update', '{}', '{}', 'admin', 'admin', ?)
            """, (rev_id, prod_id, now))

    # Update catalog_meta timestamp
    if 'catalog_meta' in tables:
        cur.execute("INSERT OR REPLACE INTO catalog_meta (key, value) VALUES ('updated_at', ?)", (now,))

    conn.commit()
    conn.execute("VACUUM;")
    conn.close()

    print(f"Results for {os.path.basename(db_path)}:")
    print(f"  Products inserted: {inserted_products}")
    print(f"  Media inserted   : {inserted_media}")
    print(f"  Specs inserted   : {inserted_specs}")

def main():
    # 1. Create safety backups of databases
    create_db_backups()

    # 2. Deploy media files to public and site/public
    deploy_media_assets()

    # 3. Read products data from backup
    with open(BACKUP_JSON, 'r', encoding='utf-8') as f:
        products_data = json.load(f)

    # 4. Reconcile all 4 databases
    for db_path in DATABASES:
        reconcile_database(db_path, products_data)

    print("\nAll 4 databases and media files reconciled successfully with zero stale cache!")

if __name__ == '__main__':
    main()
