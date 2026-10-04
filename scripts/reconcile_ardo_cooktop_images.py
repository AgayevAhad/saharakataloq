#!/usr/bin/env python3
"""
Reconciles ARDO cooktop products with new Light & Dark mode WebP media assets.
Cleans all legacy records/cache, and re-inserts fresh products, media, and specs
across both Topdan Kataloq (data/) and Site (site/data/).
"""

import os
import re
import json
import sqlite3
import hashlib
from datetime import datetime, timezone

SCRIPTPATH = os.path.abspath(__file__)
ROOT = os.path.dirname(os.path.dirname(SCRIPTPATH))
MEDIA_DIR = os.path.join(ROOT, 'public/media/products/ARDO/ARDO_BISIRME_PANELI')
BACKUP_JSON = os.path.join(ROOT, 'scratch/ardo_cooktops_backup.json')

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

def ensure_columns(conn):
    cur = conn.cursor()
    # Check products table
    cur.execute("PRAGMA table_info(products);")
    prod_cols = [c[1] for c in cur.fetchall()]
    if 'dark_image' not in prod_cols:
        conn.execute("ALTER TABLE products ADD COLUMN dark_image TEXT DEFAULT NULL;")
    if 'crop_rect' not in prod_cols:
        conn.execute("ALTER TABLE products ADD COLUMN crop_rect TEXT DEFAULT NULL;")
    if 'original_image' not in prod_cols:
        conn.execute("ALTER TABLE products ADD COLUMN original_image TEXT DEFAULT NULL;")

    # Check product_media table
    cur.execute("PRAGMA table_info(product_media);")
    pm_cols = [c[1] for c in cur.fetchall()]
    if 'dark_url' not in pm_cols:
        conn.execute("ALTER TABLE product_media ADD COLUMN dark_url TEXT DEFAULT NULL;")
    if 'crop_rect' not in pm_cols:
        conn.execute("ALTER TABLE product_media ADD COLUMN crop_rect TEXT DEFAULT NULL;")
    if 'original_url' not in pm_cols:
        conn.execute("ALTER TABLE product_media ADD COLUMN original_url TEXT DEFAULT NULL;")
    conn.commit()

def delete_ardo_cooktops(conn):
    cur = conn.cursor()
    cur.execute("SELECT id FROM products WHERE brand_id = 'ardo' AND category_id = 'cooktop';")
    product_ids = [r[0] for r in cur.fetchall()]
    print(f"Found {len(product_ids)} existing ARDO cooktop products to delete.")

    if not product_ids:
        return product_ids

    placeholders = ','.join('?' for _ in product_ids)
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]

    # Explicit child cleanups
    child_tables_with_prod_id = [
        'product_media_variants', 'product_spec_values', 'product_revisions',
        'publication_jobs', 'product_translations', 'product_variants',
        'product_media', 'product_highlights', 'product_specs',
        'product_view_stats', 'contact_action_stats', 'analytics_events'
    ]

    for t in child_tables_with_prod_id:
        if t in tables:
            cur.execute(f"DELETE FROM {t} WHERE product_id IN ({placeholders});", product_ids)

    # Clean orphaned media_assets in site DB if table exists
    if 'media_assets' in tables and 'product_media_variants' in tables:
        cur.execute("""
            DELETE FROM media_assets
            WHERE id NOT IN (SELECT media_id FROM product_media_variants)
              AND url LIKE '%ARDO_BISIRME_PANELI%'
        """)

    # Finally delete from products
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

    # Step 1: Clean out all existing ARDO cooktop products and old cache
    delete_ardo_cooktops(conn)

    cur = conn.cursor()
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]

    # Step 2: Insert fresh products and media
    now = utc_now()
    inserted_products = 0
    inserted_media = 0
    inserted_specs = 0

    for p in products_data:
        prod_id = p['id']
        code = p['code']
        title = p['title']
        model_name = title

        folder = os.path.join(MEDIA_DIR, model_name)
        if not os.path.isdir(folder):
            raise RuntimeError(f"Media folder not found for {model_name} at {folder}")

        files = sorted(os.listdir(folder))
        light_files = sorted([f for f in files if f.endswith('_light.webp')], key=sort_key)
        dark_files = sorted([f for f in files if f.endswith('_dark.webp')], key=sort_key)
        trans_files = sorted([f for f in files if not f.endswith('_light.webp') and not f.endswith('_dark.webp') and f.endswith('.webp')], key=sort_key)

        if not light_files or not dark_files:
            raise RuntimeError(f"Missing light or dark files for {model_name}")

        primary_light = f"/media/products/ARDO/ARDO_BISIRME_PANELI/{model_name}/{light_files[0]}"
        primary_dark = f"/media/products/ARDO/ARDO_BISIRME_PANELI/{model_name}/{dark_files[0]}"

        # 1. Insert Product
        prod_row = {
            'id': prod_id,
            'code': code,
            'title': title,
            'brand_id': 'ardo',
            'category_id': 'cooktop',
            'primary_image': primary_light,
            'dark_image': primary_dark,
            'is_featured': 0,
            'is_new': 0,
            'badge_text': '',
            'badge_color': 'red',
            'price': None,
            'old_price': None,
            'currency': '₼',
            'stock_status': 'in_stock',
            'short_description': p.get('short_description') or '',
            'description': p.get('description') or '',
            'manufacturing_country': p.get('manufacturing_country') or 'İtaliya',
            'status': 'published',
            'created_at': p.get('created_at') or now,
            'updated_at': now,
            'image_position': 'center',
            'image_fit': 'contain',
            'version': 1,
            'publication_status': 'published',
            'completeness_score': 85
        }

        # Adapt columns to table schema
        cur.execute("PRAGMA table_info(products);")
        valid_cols = [c[1] for c in cur.fetchall()]
        insert_dict = {k: v for k, v in prod_row.items() if k in valid_cols}

        col_names = ', '.join(insert_dict.keys())
        val_placeholders = ', '.join('?' for _ in insert_dict)
        cur.execute(f"INSERT INTO products ({col_names}) VALUES ({val_placeholders})", list(insert_dict.values()))
        inserted_products += 1

        # 2. Site-specific: product_variants (Must be before product_media_variants and product_spec_values)
        var_id = f"var_{prod_id}_def"
        if 'product_variants' in tables:
            cur.execute("""
                INSERT OR REPLACE INTO product_variants (
                    id, product_id, model_code, sku, price, is_default, status, sort_order, created_at
                ) VALUES (?, ?, ?, ?, NULL, 1, 'active', 0, ?)
            """, (var_id, prod_id, code, code, now))

        # 3. Insert Media items and Site media tables
        for idx, (lf, df) in enumerate(zip(light_files, dark_files)):
            media_id = f"media-{prod_id}-{idx + 1}"
            light_url = f"/media/products/ARDO/ARDO_BISIRME_PANELI/{model_name}/{lf}"
            dark_url = f"/media/products/ARDO/ARDO_BISIRME_PANELI/{model_name}/{df}"
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

            # Site-specific tables (media_assets, product_media_variants)
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

            # Site-specific: spec_definitions and product_spec_values
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

    # VACUUM to ensure zero leftover residue or cache
    conn.execute("VACUUM;")
    conn.close()

    print(f"Results for {os.path.basename(db_path)}:")
    print(f"  Products inserted: {inserted_products}")
    print(f"  Media inserted   : {inserted_media}")
    print(f"  Specs inserted   : {inserted_specs}")

def main():
    with open(BACKUP_JSON, 'r', encoding='utf-8') as f:
        products_data = json.load(f)

    for db_path in DATABASES:
        reconcile_database(db_path, products_data)

    print("\nAll 4 databases reconciled successfully!")

if __name__ == '__main__':
    main()
