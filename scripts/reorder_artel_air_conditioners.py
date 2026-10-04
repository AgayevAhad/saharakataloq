#!/usr/bin/env python3
"""
Reorders images for specific ARTEL Air Conditioner models according to user specifications:
1. Kondisioner Artel Everest ARTSID3AW12BE Invertor: Old 2 -> 1, Old 3 -> 2, Old 1 -> 3
2. Kondisioner Artel Gloria ARTSIM2AW12BE: Old 3 -> 1, Old 1 -> 3 (2 unchanged)
3. Kondisioner Artel Aurora ARTSIM3BW12HE: Old 3 -> 1, Old 1 -> 3 (2 unchanged)
4. Kondisioner Artel Gloria ARTSIM2AW12HE: Old 3 -> 1, Old 1 -> 3 (2 unchanged)
5. Kondisioner Artel Grand ARTSID1AW12HE: Old 2 -> 1, Old 3 -> 2, Old 1 -> 3
6. Kondisioner Artel Shahrisabz ARTSIJ1AW09HE: Old 3 -> 1, Old 1 -> 3 (2 unchanged)
7. Kondisioner Artel Shahrisabz ARTSIJ1AW12BE Inverto: Old 3 -> 1, Old 1 -> 3 (2 unchanged)

Updates:
- Media/BRENDS/ARTEL/ARTEL_KONDISONER/{Model}/ (original folder)
- Media/BRENDS/ARTEL/ARTEL_KONDISONER/{Model}_output/ (all 6 subdirectories)
- public/media/products/ARTEL/ARTEL_KONDISONER/{Model}/
- site/public/media/products/ARTEL/ARTEL_KONDISONER/{Model}/
- data/catalog.sqlite & data/catalog-draft.sqlite
- site/data/catalog.sqlite & site/data/catalog-draft.sqlite
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
BASE_MEDIA = os.path.join(ROOT, 'Media/BRENDS/ARTEL/ARTEL_KONDISONER')
DEST_PUBLIC = os.path.join(ROOT, 'public/media/products/ARTEL/ARTEL_KONDISONER')
DEST_SITE_PUBLIC = os.path.join(ROOT, 'site/public/media/products/ARTEL/ARTEL_KONDISONER')
BACKUP_JSON = os.path.join(ROOT, 'scratch/artel_air_conditioners_backup.json')

DATABASES = [
    os.path.join(ROOT, 'data/catalog.sqlite'),
    os.path.join(ROOT, 'data/catalog-draft.sqlite'),
    os.path.join(ROOT, 'site/data/catalog.sqlite'),
    os.path.join(ROOT, 'site/data/catalog-draft.sqlite'),
]

TARGETS = {
    'Kondisioner Artel Everest ARTSID3AW12BE Invertor': {
        # Old 2 -> 1, Old 3 -> 2, Old 1 -> 3
        'mapping': {1: 3, 2: 1, 3: 2},
        # User already renamed orig
        'orig_already_renamed': True,
    },
    'Kondisioner Artel Gloria ARTSIM2AW12BE': {
        # Old 3 -> 1, Old 1 -> 3, Old 2 stays 2
        'mapping': {1: 3, 2: 2, 3: 1},
        'orig_already_renamed': False,
    },
    'Kondisioner Artel Aurora ARTSIM3BW12HE': {
        # Old 3 -> 1, Old 1 -> 3, Old 2 stays 2
        'mapping': {1: 3, 2: 2, 3: 1},
        'orig_already_renamed': False,
    },
    'Kondisioner Artel Gloria ARTSIM2AW12HE': {
        # Old 3 -> 1, Old 1 -> 3, Old 2 stays 2
        'mapping': {1: 3, 2: 2, 3: 1},
        'orig_already_renamed': False,
    },
    'Kondisioner Artel Grand ARTSID1AW12HE': {
        # Old 2 -> 1, Old 3 -> 2, Old 1 -> 3
        'mapping': {1: 3, 2: 1, 3: 2},
        'orig_already_renamed': False,
    },
    'Kondisioner Artel Shahrisabz ARTSIJ1AW09HE': {
        # Old 3 -> 1, Old 1 -> 3, Old 2 stays 2
        'mapping': {1: 3, 2: 2, 3: 1},
        'orig_already_renamed': False,
    },
    'Kondisioner Artel Shahrisabz ARTSIJ1AW12BE Inverto': {
        # Old 3 -> 1, Old 1 -> 3, Old 2 stays 2
        'mapping': {1: 3, 2: 2, 3: 1},
        'orig_already_renamed': False,
    },
}

def utc_now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def sort_key(name):
    m = re.search(r'\((\d+)\)', name)
    return int(m.group(1)) if m else 0

def create_backups():
    print("--- Creating backups ---")
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    for db_path in DATABASES:
        if os.path.exists(db_path):
            backup_dir = os.path.join(os.path.dirname(db_path), 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            db_name = os.path.basename(db_path)
            backup_file = os.path.join(backup_dir, f"{db_name}.{ts}.before_artel_reorder.sqlite")
            shutil.copy2(db_path, backup_file)
            print(f"Backed up DB {db_name} to {backup_file}")

    # Backup media folders of the targets
    media_backup_dir = os.path.join(ROOT, f"scratch/media_artel_ac_backup_{ts}")
    os.makedirs(media_backup_dir, exist_ok=True)
    for model_name in TARGETS:
        orig = os.path.join(BASE_MEDIA, model_name)
        out = os.path.join(BASE_MEDIA, model_name + '_output')
        if os.path.exists(orig):
            shutil.copytree(orig, os.path.join(media_backup_dir, model_name))
        if os.path.exists(out):
            shutil.copytree(out, os.path.join(media_backup_dir, model_name + '_output'))
    print(f"Backed up media to {media_backup_dir}")

def rename_subdir_files(directory, model_name, extension, mapping):
    """
    Safely renames files in directory according to mapping: {old_idx: new_idx}
    Example extensions: '.jpg', '.webp', '_mask.png', '_light.webp', '_dark.webp', '_comparison.jpg'
    """
    if not os.path.exists(directory):
        return

    # Phase 1: Rename old files to unique temporary names
    temp_files = {}
    for old_idx, new_idx in mapping.items():
        if old_idx == new_idx:
            continue
        old_suffix = '' if old_idx == 1 else f' ({old_idx})'
        old_filename = f"{model_name}{old_suffix}{extension}"
        old_path = os.path.join(directory, old_filename)
        if not os.path.exists(old_path):
            raise FileNotFoundError(f"Expected file not found: {old_path}")
        
        temp_filename = f"{model_name}__TEMP_RENAME_{old_idx}__{extension}"
        temp_path = os.path.join(directory, temp_filename)
        os.rename(old_path, temp_path)
        temp_files[new_idx] = temp_path

    # Phase 2: Rename temporary files to final new names
    for new_idx, temp_path in temp_files.items():
        new_suffix = '' if new_idx == 1 else f' ({new_idx})'
        new_filename = f"{model_name}{new_suffix}{extension}"
        new_path = os.path.join(directory, new_filename)
        if os.path.exists(new_path):
            raise FileExistsError(f"Target file already exists: {new_path}")
        os.rename(temp_path, new_path)

def reorder_output_folders():
    print("\n--- Reordering files in _output directories ---")
    subdirs_config = [
        ('01_original', '.jpg'),
        ('02_transparent', '.webp'),
        ('03_mask', '_mask.png'),
        ('04_light_preview', '_light.webp'),
        ('05_dark_preview', '_dark.webp'),
        ('06_comparison', '_comparison.jpg')
    ]

    for model_name, info in TARGETS.items():
        mapping = info['mapping']
        out_dir = os.path.join(BASE_MEDIA, model_name + '_output')
        print(f"Reordering output for: {model_name} with mapping {mapping}")
        for sub, ext in subdirs_config:
            p = os.path.join(out_dir, sub)
            rename_subdir_files(p, model_name, ext, mapping)

def sync_original_folders():
    print("\n--- Synchronizing original folders with reordered 01_original ---")
    for model_name, info in TARGETS.items():
        orig_dir = os.path.join(BASE_MEDIA, model_name)
        out_orig_dir = os.path.join(BASE_MEDIA, model_name + '_output', '01_original')
        
        # Verify and copy exact matching files from 01_original into orig_dir
        print(f"Syncing orig folder for: {model_name}")
        # Clear out files in orig_dir and copy from out_orig_dir to be 100% identical
        for f in os.listdir(orig_dir):
            os.remove(os.path.join(orig_dir, f))
        for f in os.listdir(out_orig_dir):
            shutil.copy2(os.path.join(out_orig_dir, f), os.path.join(orig_dir, f))

def deploy_to_public():
    print("\n--- Deploying Media Assets from _output folders to public/ and site/public/ ---")
    subdirs = sorted(os.listdir(BASE_MEDIA))
    output_dirs = [d for d in subdirs if d.endswith('_output')]
    print(f"Found {len(output_dirs)} model output directories.")

    total_deployed = 0
    for od in output_dirs:
        model_name = od.replace('_output', '')
        src_model_dir = os.path.join(BASE_MEDIA, od)

        light_src = os.path.join(src_model_dir, '04_light_preview')
        dark_src = os.path.join(src_model_dir, '05_dark_preview')
        trans_src = os.path.join(src_model_dir, '02_transparent')

        target_dirs = [
            os.path.join(DEST_PUBLIC, model_name),
            os.path.join(DEST_SITE_PUBLIC, model_name)
        ]

        for td in target_dirs:
            os.makedirs(td, exist_ok=True)
            # Remove existing files
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

def reconcile_databases():
    print("\n--- Reconciling databases ---")
    if not os.path.exists(BACKUP_JSON):
        raise FileNotFoundError(f"Backup JSON not found at {BACKUP_JSON}")
    with open(BACKUP_JSON, 'r', encoding='utf-8') as f:
        products_data = json.load(f)

    for db_path in DATABASES:
        print(f"Reconciling: {db_path}")
        conn = sqlite3.connect(db_path)
        conn.execute("PRAGMA foreign_keys = ON;")
        cur = conn.cursor()

        # Step 1: Clean out existing ARTEL air conditioners
        cur.execute("SELECT id FROM products WHERE (brand_id = 'artel' OR brand_id = 'ARTEL') AND (category_id = 'air_conditioner' OR category_id = 'artel-air-conditioner');")
        product_ids = [r[0] for r in cur.fetchall()]
        print(f"  Found {len(product_ids)} existing ARTEL air conditioner products to delete.")
        if product_ids:
            placeholders = ','.join('?' for _ in product_ids)
            tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
            child_tables = [
                'product_media_variants', 'product_spec_values', 'product_revisions',
                'publication_jobs', 'product_translations', 'product_variants',
                'product_media', 'product_highlights', 'product_specs',
                'product_view_stats', 'contact_action_stats', 'analytics_events'
            ]
            for t in child_tables:
                if t in tables:
                    cur.execute(f"DELETE FROM {t} WHERE product_id IN ({placeholders});", product_ids)
            if 'media_assets' in tables and 'product_media_variants' in tables:
                cur.execute("""
                    DELETE FROM media_assets
                    WHERE id NOT IN (SELECT media_id FROM product_media_variants)
                      AND url LIKE '%ARTEL/ARTEL_KONDISONER%'
                """)
            cur.execute(f"DELETE FROM products WHERE id IN ({placeholders});", product_ids)
            conn.commit()

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

            primary_light = f"/media/products/ARTEL/ARTEL_KONDISONER/{model_name}/{light_files[0]}"
            primary_dark = f"/media/products/ARTEL/ARTEL_KONDISONER/{model_name}/{dark_files[0]}"

            # 1. Insert Product
            prod_row = {
                'id': prod_id,
                'code': code,
                'title': title,
                'brand_id': 'artel',
                'category_id': 'air_conditioner',
                'primary_image': primary_light,
                'dark_image': primary_dark,
                'is_featured': p.get('is_featured') or 0,
                'is_new': p.get('is_new') or 0,
                'badge_text': p.get('badge_text') or '',
                'badge_color': p.get('badge_color') or 'red',
                'price': p.get('price'),
                'view_count': p.get('view_count') or 0,
                'display_order': p.get('display_order') or 0,
                'is_active': 1,
                'description': p.get('description') or '',
                'created_at': p.get('created_at') or now,
                'updated_at': now,
            }

            cur.execute("PRAGMA table_info(products);")
            valid_p_cols = set(c[1] for c in cur.fetchall())
            filtered_p = {k: v for k, v in prod_row.items() if k in valid_p_cols}
            cols_p = ', '.join(filtered_p.keys())
            vals_p = ', '.join('?' for _ in filtered_p)
            cur.execute(f"INSERT INTO products ({cols_p}) VALUES ({vals_p});", list(filtered_p.values()))
            inserted_products += 1

            # 2. Insert Media
            for idx, lf in enumerate(light_files):
                df = dark_files[idx] if idx < len(dark_files) else dark_files[0]
                url_light = f"/media/products/ARTEL/ARTEL_KONDISONER/{model_name}/{lf}"
                url_dark = f"/media/products/ARTEL/ARTEL_KONDISONER/{model_name}/{df}"
                media_id = f"media-{prod_id}-{idx + 1}"

                # Original unedited name
                orig_name = lf.replace('_light.webp', '.jpg')
                if orig_name.endswith('.jpg.jpg'):
                    orig_name = orig_name.replace('.jpg.jpg', '.jpg')

                media_row = {
                    'id': media_id,
                    'product_id': prod_id,
                    'media_type': 'image',
                    'url': url_light,
                    'dark_url': url_dark,
                    'original_name': orig_name,
                    'alt_text': f"{title} - {idx + 1}",
                    'display_order': idx + 1,
                    'is_primary': 1 if idx == 0 else 0,
                    'created_at': now,
                }

                cur.execute("PRAGMA table_info(product_media);")
                valid_m_cols = set(c[1] for c in cur.fetchall())
                filtered_m = {k: v for k, v in media_row.items() if k in valid_m_cols}
                cols_m = ', '.join(filtered_m.keys())
                vals_m = ', '.join('?' for _ in filtered_m)
                cur.execute(f"INSERT INTO product_media ({cols_m}) VALUES ({vals_m});", list(filtered_m.values()))
                inserted_media += 1

                # If media_assets exists
                if 'media_assets' in tables:
                    asset_id = f"asset-{prod_id}-{idx + 1}"
                    cur.execute("""
                        INSERT OR REPLACE INTO media_assets (
                            id, file_name, file_path, file_size, mime_type,
                            media_type, width, height, is_optimized, url, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """, (
                        asset_id, lf, url_light, 100000, 'image/webp',
                        'image', 1200, 1200, 1, url_light, now, now
                    ))
                    if 'product_media_variants' in tables:
                        cur.execute("""
                            INSERT OR REPLACE INTO product_media_variants (
                                id, product_id, media_id, variant_type, is_active, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?);
                        """, (
                            f"pmv-{prod_id}-{idx + 1}", prod_id, asset_id, 'gallery', 1, now
                        ))

            # 3. Insert Specs
            for s_idx, spec in enumerate(p.get('specs', [])):
                spec_id = f"spec-{prod_id}-{s_idx + 1}"
                spec_row = {
                    'id': spec_id,
                    'product_id': prod_id,
                    'group_name': spec.get('group_name') or 'Əsas xüsusiyyətlər',
                    'spec_name': spec.get('name') or spec.get('spec_name') or '',
                    'spec_value': spec.get('value') or spec.get('spec_value') or '',
                    'display_order': spec.get('display_order') or (s_idx + 1),
                    'created_at': now,
                }
                cur.execute("PRAGMA table_info(product_specs);")
                valid_s_cols = set(c[1] for c in cur.fetchall())
                filtered_s = {k: v for k, v in spec_row.items() if k in valid_s_cols}
                cols_s = ', '.join(filtered_s.keys())
                vals_s = ', '.join('?' for _ in filtered_s)
                cur.execute(f"INSERT INTO product_specs ({cols_s}) VALUES ({vals_s});", list(filtered_s.values()))
                inserted_specs += 1

            # 4. Insert default variant if product_variants exists
            if 'product_variants' in tables:
                var_id = f"var-{prod_id}-default"
                cur.execute("""
                    INSERT OR REPLACE INTO product_variants (
                        id, product_id, sku, title, price, is_active, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    var_id, prod_id, code, title, prod_row.get('price'), 1, now, now
                ))

            # 5. Insert revision if product_revisions exists
            if 'product_revisions' in tables:
                rev_id = f"rev-{prod_id}-{int(datetime.now().timestamp())}"
                snapshot_data = json.dumps({'product': prod_row, 'specs': p.get('specs', [])})
                cur.execute("""
                    INSERT OR REPLACE INTO product_revisions (
                        id, product_id, revision_number, change_summary, snapshot_data, created_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?);
                """, (
                    rev_id, prod_id, 1, 'Reordered Light & Dark WebP media', 'system', snapshot_data, now
                ))

        conn.commit()
        conn.execute("VACUUM;")
        conn.close()
        print(f"  Inserted: {inserted_products} products, {inserted_media} media items, {inserted_specs} specs.")

def verify_all():
    print("\n--- Final Verification ---")
    conn = sqlite3.connect('data/catalog.sqlite')
    cur = conn.cursor()
    cur.execute("SELECT id, title, primary_image, dark_image FROM products WHERE brand_id = 'artel' AND category_id = 'air_conditioner';")
    rows = cur.fetchall()
    print(f"Total Artel ACs in DB: {len(rows)}")
    for r in rows:
        print(f"  {r[0]}:")
        print(f"    title: {r[1]}")
        print(f"    primary: {r[2]}")
        print(f"    dark: {r[3]}")
        # check that primary file exists
        p_light = os.path.join(ROOT, r[2].lstrip('/'))
        p_dark = os.path.join(ROOT, r[3].lstrip('/'))
        assert os.path.exists(p_light), f"Missing {p_light}"
        assert os.path.exists(p_dark), f"Missing {p_dark}"
    conn.close()
    print("Verification passed completely!")

if __name__ == '__main__':
    create_backups()
    reorder_output_folders()
    sync_original_folders()
    deploy_to_public()
    reconcile_databases()
    verify_all()
