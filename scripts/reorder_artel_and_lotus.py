#!/usr/bin/env python3
"""
Executes:
1. Reorders Artel Shahrisabz ARTSIJ1AW24BE inverto (6 -> 1, 1 -> 3, 3 -> 6)
   - Media output, orig, public, and all 4 databases.
2. Renames Plite Lotus LT941S Black -> Qaz piltəsi Lotus F-TB941CMW in output, public, backup JSON, and databases.
3. Reorders 10 Lotus Cooktop models in output, orig, public, and databases:
   - Plite Lotus LT3160B (1 <-> 3)
   - Plite Lotus LT3160S Black (1 <-> 3)
   - Plite Lotus LT4190 Cream (1 <-> 2)
   - Plite Lotus LT4190B (1 <-> 2)
   - Plite Lotus LT4316FV-Vitroglass (1 <-> 3)
   - Plite Lotus LT6040 Inox (1 <-> 2)
   - Plite Lotus LT631 TK Black (1 <-> 2)
   - Plite Lotus LT6455 Black (1 <-> 2)
   - Plite Lotus LT6550CE Black (1 <-> 2)
   - Plite Lotus LT941 Inox (1 <-> 2)
4. Deploys WebP assets to public/ and site/public/ and reconciles databases.
"""

import os
import re
import json
import sqlite3
import shutil
import hashlib
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ARTEL_MEDIA_BASE = os.path.join(ROOT, 'Media/BRENDS/ARTEL/ARTEL_KONDISONER')
LOTUS_MEDIA_BASE = os.path.join(ROOT, 'Media/BRENDS/LOTUS/LOTUS_BISIRME_PANELI')

ARTEL_PUBLIC = os.path.join(ROOT, 'public/media/products/ARTEL/ARTEL_KONDISONER')
ARTEL_SITE_PUBLIC = os.path.join(ROOT, 'site/public/media/products/ARTEL/ARTEL_KONDISONER')

LOTUS_PUBLIC = os.path.join(ROOT, 'public/media/products/LOTUS/LOTUS_BISIRME_PANELI')
LOTUS_SITE_PUBLIC = os.path.join(ROOT, 'site/public/media/products/LOTUS/LOTUS_BISIRME_PANELI')

ARTEL_BACKUP_JSON = os.path.join(ROOT, 'scratch/artel_air_conditioners_backup.json')
LOTUS_BACKUP_JSON = os.path.join(ROOT, 'scratch/lotus_cooktops_backup.json')

DATABASES = [
    os.path.join(ROOT, 'data/catalog.sqlite'),
    os.path.join(ROOT, 'data/catalog-draft.sqlite'),
    os.path.join(ROOT, 'site/data/catalog.sqlite'),
    os.path.join(ROOT, 'site/data/catalog-draft.sqlite'),
]

SUBDIRS_CONFIG = [
    ('01_original', '.jpg'),
    ('02_transparent', '.webp'),
    ('03_mask', '_mask.png'),
    ('04_light_preview', '_light.webp'),
    ('05_dark_preview', '_dark.webp'),
    ('06_comparison', '_comparison.jpg')
]

def utc_now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def sort_key(name):
    m = re.search(r'\((\d+)\)', name)
    return int(m.group(1)) if m else 0

def create_db_backups(tag):
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    for db_path in DATABASES:
        if os.path.exists(db_path):
            backup_dir = os.path.join(os.path.dirname(db_path), 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            db_name = os.path.basename(db_path)
            backup_file = os.path.join(backup_dir, f"{db_name}.{ts}.before_{tag}.sqlite")
            shutil.copy2(db_path, backup_file)
            print(f"Backed up {db_name} to {backup_file}")

def rename_subdir_files(directory, model_name, extension, mapping):
    """
    Safely renames files in directory according to mapping: {old_idx: new_idx}
    """
    if not os.path.exists(directory):
        return

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

    for new_idx, temp_path in temp_files.items():
        new_suffix = '' if new_idx == 1 else f' ({new_idx})'
        new_filename = f"{model_name}{new_suffix}{extension}"
        new_path = os.path.join(directory, new_filename)
        if os.path.exists(new_path):
            raise FileExistsError(f"Target file already exists: {new_path}")
        os.rename(temp_path, new_path)

def reorder_artel_24be():
    print("\n--- Part 1: Reordering Artel Shahrisabz ARTSIJ1AW24BE inverto ---")
    model_name = 'Kondisioner Artel Shahrisabz ARTSIJ1AW24BE inverto'
    out_dir = os.path.join(ARTEL_MEDIA_BASE, model_name + '_output')
    mapping = {1: 3, 6: 1, 3: 6}

    for sub, ext in SUBDIRS_CONFIG:
        p = os.path.join(out_dir, sub)
        rename_subdir_files(p, model_name, ext, mapping)
    print(f"Reordered {model_name}_output with {mapping}")

    # Sync orig
    orig_dir = os.path.join(ARTEL_MEDIA_BASE, model_name)
    out_orig_dir = os.path.join(out_dir, '01_original')
    for f in os.listdir(orig_dir):
        os.remove(os.path.join(orig_dir, f))
    for f in os.listdir(out_orig_dir):
        shutil.copy2(os.path.join(out_orig_dir, f), os.path.join(orig_dir, f))
    print(f"Synced orig folder for {model_name}")

def handle_lotus_ftb941cmw_rename():
    print("\n--- Part 2: Renaming Plite Lotus LT941S Black -> Qaz piltəsi Lotus F-TB941CMW ---")
    old_name = 'Plite Lotus LT941S Black'
    new_name = 'Qaz piltəsi Lotus F-TB941CMW'
    out_dir = os.path.join(LOTUS_MEDIA_BASE, new_name + '_output')

    for sub, ext in SUBDIRS_CONFIG:
        p = os.path.join(out_dir, sub)
        if not os.path.exists(p):
            continue
        for f in os.listdir(p):
            if f.startswith(old_name):
                new_f = f.replace(old_name, new_name)
                os.rename(os.path.join(p, f), os.path.join(p, new_f))
    print(f"Renamed all files in {new_name}_output")

    # Sync orig folder with 01_original
    orig_dir = os.path.join(LOTUS_MEDIA_BASE, new_name)
    out_orig_dir = os.path.join(out_dir, '01_original')
    if os.path.exists(orig_dir):
        for f in os.listdir(orig_dir):
            os.remove(os.path.join(orig_dir, f))
    else:
        os.makedirs(orig_dir, exist_ok=True)
    for f in os.listdir(out_orig_dir):
        shutil.copy2(os.path.join(out_orig_dir, f), os.path.join(orig_dir, f))
    print(f"Synced orig folder for {new_name}")

    # Remove empty old folder if exists
    old_orig = os.path.join(LOTUS_MEDIA_BASE, old_name)
    if os.path.exists(old_orig):
        shutil.rmtree(old_orig)
        print(f"Removed empty directory: {old_orig}")

    # Update scratch/lotus_cooktops_backup.json
    with open(LOTUS_BACKUP_JSON, 'r', encoding='utf-8') as f:
        lotus_data = json.load(f)

    for item in lotus_data:
        if item['id'] == 'lotus-lt941s-black' or item['code'] == 'LT941S Black':
            item['id'] = 'lotus-f-tb941cmw'
            item['code'] = 'F-TB941CMW'
            item['title'] = 'Qaz piltəsi Lotus F-TB941CMW'
            print("Updated backup JSON entry to Qaz piltəsi Lotus F-TB941CMW")

    with open(LOTUS_BACKUP_JSON, 'w', encoding='utf-8') as f:
        json.dump(lotus_data, f, ensure_ascii=False, indent=2)

def reorder_lotus_cooktops():
    print("\n--- Part 3: Reordering 10 Lotus Cooktop models ---")
    lotus_reorders = {
        'Plite Lotus LT3160B': {1: 3, 3: 1},
        'Plite Lotus LT3160S Black': {1: 3, 3: 1},
        'Plite Lotus LT4190 Cream': {1: 2, 2: 1},
        'Plite Lotus LT4190B': {1: 2, 2: 1},
        'Plite Lotus LT4316FV-Vitroglass': {1: 3, 3: 1},
        'Plite Lotus LT6040 Inox': {1: 2, 2: 1},
        'Plite Lotus LT631 TK Black': {1: 2, 2: 1},
        'Plite Lotus LT6455 Black': {1: 2, 2: 1},
        'Plite Lotus LT6550CE Black': {1: 2, 2: 1},
        'Plite Lotus LT941 Inox': {1: 2, 2: 1},
    }

    for model_name, mapping in lotus_reorders.items():
        out_dir = os.path.join(LOTUS_MEDIA_BASE, model_name + '_output')
        print(f"Reordering Lotus: {model_name} with {mapping}")
        for sub, ext in SUBDIRS_CONFIG:
            p = os.path.join(out_dir, sub)
            rename_subdir_files(p, model_name, ext, mapping)

        # Sync orig
        orig_dir = os.path.join(LOTUS_MEDIA_BASE, model_name)
        out_orig_dir = os.path.join(out_dir, '01_original')
        if os.path.exists(orig_dir):
            for f in os.listdir(orig_dir):
                os.remove(os.path.join(orig_dir, f))
        else:
            os.makedirs(orig_dir, exist_ok=True)
        for f in os.listdir(out_orig_dir):
            shutil.copy2(os.path.join(out_orig_dir, f), os.path.join(orig_dir, f))

def deploy_all_media():
    print("\n--- Part 4: Deploying Media Assets to public/ and site/public/ ---")
    # 1. Artel ACs
    artel_subdirs = sorted(os.listdir(ARTEL_MEDIA_BASE))
    artel_outputs = [d for d in artel_subdirs if d.endswith('_output')]
    for od in artel_outputs:
        model_name = od.replace('_output', '')
        src_dir = os.path.join(ARTEL_MEDIA_BASE, od)
        for dest_base in [ARTEL_PUBLIC, ARTEL_SITE_PUBLIC]:
            target_dir = os.path.join(dest_base, model_name)
            os.makedirs(target_dir, exist_ok=True)
            for f in os.listdir(target_dir):
                os.remove(os.path.join(target_dir, f))
            for f in sorted(os.listdir(os.path.join(src_dir, '04_light_preview'))):
                shutil.copy2(os.path.join(src_dir, '04_light_preview', f), os.path.join(target_dir, f))
            for f in sorted(os.listdir(os.path.join(src_dir, '05_dark_preview'))):
                shutil.copy2(os.path.join(src_dir, '05_dark_preview', f), os.path.join(target_dir, f))
            for f in sorted(os.listdir(os.path.join(src_dir, '02_transparent'))):
                shutil.copy2(os.path.join(src_dir, '02_transparent', f), os.path.join(target_dir, f))

    # 2. Lotus Cooktops
    # Remove obsolete old model directory from public
    for dest_base in [LOTUS_PUBLIC, LOTUS_SITE_PUBLIC]:
        obsolete_p = os.path.join(dest_base, 'Plite Lotus LT941S Black')
        if os.path.exists(obsolete_p):
            shutil.rmtree(obsolete_p)
            print(f"Removed obsolete public folder: {obsolete_p}")

    lotus_subdirs = sorted(os.listdir(LOTUS_MEDIA_BASE))
    lotus_outputs = [d for d in lotus_subdirs if d.endswith('_output')]
    print(f"Found {len(lotus_outputs)} Lotus output folders.")
    for od in lotus_outputs:
        model_name = od.replace('_output', '')
        src_dir = os.path.join(LOTUS_MEDIA_BASE, od)
        for dest_base in [LOTUS_PUBLIC, LOTUS_SITE_PUBLIC]:
            target_dir = os.path.join(dest_base, model_name)
            os.makedirs(target_dir, exist_ok=True)
            for f in os.listdir(target_dir):
                os.remove(os.path.join(target_dir, f))
            for f in sorted(os.listdir(os.path.join(src_dir, '04_light_preview'))):
                shutil.copy2(os.path.join(src_dir, '04_light_preview', f), os.path.join(target_dir, f))
            for f in sorted(os.listdir(os.path.join(src_dir, '05_dark_preview'))):
                shutil.copy2(os.path.join(src_dir, '05_dark_preview', f), os.path.join(target_dir, f))
            for f in sorted(os.listdir(os.path.join(src_dir, '02_transparent'))):
                shutil.copy2(os.path.join(src_dir, '02_transparent', f), os.path.join(target_dir, f))

    print("Media deployment complete.")

def reconcile_all_databases():
    print("\n--- Part 5: Reconciling all 4 databases ---")
    import importlib.util
    
    # Import Artel reconcile
    artel_spec = importlib.util.spec_from_file_location("reconcile_artel", os.path.join(ROOT, "scripts/reconcile_artel_air_conditioner_images.py"))
    artel_mod = importlib.util.module_from_spec(artel_spec)
    artel_spec.loader.exec_module(artel_mod)

    # Import Lotus reconcile
    lotus_spec = importlib.util.spec_from_file_location("reconcile_lotus", os.path.join(ROOT, "scripts/reconcile_lotus_cooktop_images.py"))
    lotus_mod = importlib.util.module_from_spec(lotus_spec)
    lotus_spec.loader.exec_module(lotus_mod)

    with open(ARTEL_BACKUP_JSON, 'r', encoding='utf-8') as f:
        artel_data = json.load(f)

    with open(LOTUS_BACKUP_JSON, 'r', encoding='utf-8') as f:
        lotus_data = json.load(f)

    for db_path in DATABASES:
        print(f"Reconciling Artel ACs in: {db_path}")
        artel_mod.reconcile_database(db_path, artel_data)
        print(f"Reconciling Lotus Cooktops in: {db_path}")
        lotus_mod.reconcile_database(db_path, lotus_data)

        # Run VACUUM
        conn = sqlite3.connect(db_path)
        conn.execute("VACUUM;")
        conn.close()

    print("Database reconciliation complete.")

def verify():
    print("\n--- Verification ---")
    conn = sqlite3.connect('data/catalog.sqlite')
    cur = conn.cursor()

    cur.execute("SELECT id, title, primary_image FROM products WHERE brand_id = 'artel' AND category_id = 'air_conditioner';")
    artel_rows = cur.fetchall()
    print(f"Artel AC count: {len(artel_rows)}")
    for r in artel_rows:
        assert os.path.exists(os.path.join(ROOT, 'public' + r[2])), f"Missing Artel file: {r[2]}"
        assert os.path.exists(os.path.join(ROOT, 'site/public' + r[2])), f"Missing Artel site file: {r[2]}"

    cur.execute("SELECT id, title, primary_image FROM products WHERE brand_id = 'lotus' AND category_id = 'cooktop';")
    lotus_rows = cur.fetchall()
    print(f"Lotus Cooktop count: {len(lotus_rows)}")
    for r in lotus_rows:
        print(f"  {r[0]}: {r[1]} -> {r[2]}")
        assert os.path.exists(os.path.join(ROOT, 'public' + r[2])), f"Missing Lotus file: {r[2]}"
        assert os.path.exists(os.path.join(ROOT, 'site/public' + r[2])), f"Missing Lotus site file: {r[2]}"

    conn.close()
    print("Verification passed 100%!")

if __name__ == '__main__':
    create_db_backups('artel_lotus_reorder')
    reorder_artel_24be()
    handle_lotus_ftb941cmw_rename()
    reorder_lotus_cooktops()
    deploy_all_media()
    reconcile_all_databases()
    verify()
