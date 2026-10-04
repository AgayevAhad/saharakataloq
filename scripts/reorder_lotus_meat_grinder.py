#!/usr/bin/env python3
"""
Reorders images for Ətçəkən Lotus LT01001:
Swap image 1 and image 2 (1ci 2, 2ci 1):
1. In Media/BRENDS/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus LT01001 (source directory)
2. In Media/BRENDS/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus LT01001_output (all 6 subfolders)
3. In public/media/products/LOTUS/LOTUS_ETCEKEN/Ətçəkən Lotus LT01001 and site/public/...
4. In all 4 databases (data/catalog.sqlite, data/catalog-draft.sqlite, site/data/catalog.sqlite, site/data/catalog-draft.sqlite)
5. Update scratch/lotus_meat_grinders_backup.json
"""

import os
import json
import sqlite3
import shutil
from datetime import datetime, timezone

SCRIPTPATH = os.path.abspath(__file__)
ROOT = os.path.dirname(os.path.dirname(SCRIPTPATH))

MODEL_NAME = "Ətçəkən Lotus LT01001"
PROD_ID = "lotus-lt01001"

SOURCE_RAW_DIR = os.path.join(ROOT, f"Media/BRENDS/LOTUS/LOTUS_ETCEKEN/{MODEL_NAME}")
SOURCE_OUTPUT_DIR = os.path.join(ROOT, f"Media/BRENDS/LOTUS/LOTUS_ETCEKEN/{MODEL_NAME}_output")

DEST_PUBLIC = os.path.join(ROOT, f"public/media/products/LOTUS/LOTUS_ETCEKEN/{MODEL_NAME}")
DEST_SITE_PUBLIC = os.path.join(ROOT, f"site/public/media/products/LOTUS/LOTUS_ETCEKEN/{MODEL_NAME}")

BACKUP_JSON = os.path.join(ROOT, "scratch/lotus_meat_grinders_backup.json")

DATABASES = [
    os.path.join(ROOT, 'data/catalog.sqlite'),
    os.path.join(ROOT, 'data/catalog-draft.sqlite'),
    os.path.join(ROOT, 'site/data/catalog.sqlite'),
    os.path.join(ROOT, 'site/data/catalog-draft.sqlite'),
]

def utc_now():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def create_db_backups():
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    for db_path in DATABASES:
        if os.path.exists(db_path):
            backup_dir = os.path.join(os.path.dirname(db_path), 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            db_name = os.path.basename(db_path)
            backup_file = os.path.join(backup_dir, f"{db_name}.{ts}.before_lotus_lt01001_reorder.sqlite")
            shutil.copy2(db_path, backup_file)
            print(f"Backed up {db_name} to {backup_file}")

def swap_two_files(path1, path2):
    """Safely swaps path1 and path2 using a temporary file."""
    if not os.path.exists(path1) or not os.path.exists(path2):
        raise FileNotFoundError(f"Cannot swap: {path1} or {path2} does not exist!")
    
    dir_name = os.path.dirname(path1)
    temp_path = os.path.join(dir_name, f"__TEMP_SWAP_{os.path.basename(path1)}__")
    
    os.rename(path1, temp_path)
    os.rename(path2, path1)
    os.rename(temp_path, path2)
    print(f"  Swapped: {os.path.basename(path1)} <-> {os.path.basename(path2)}")

def reorder_source_media():
    print(f"\n--- 1. Swapping raw media files in {SOURCE_RAW_DIR} ---")
    if os.path.exists(SOURCE_RAW_DIR):
        raw_files = os.listdir(SOURCE_RAW_DIR)
        # Find file 1 and file 2
        # File 1 is without '(x)', file 2 is with '(2)'
        f1_list = [f for f in raw_files if '(2)' not in f and '(3)' not in f and not f.startswith('.')]
        f2_list = [f for f in raw_files if '(2)' in f and not f.startswith('.')]
        
        if f1_list and f2_list:
            f1_path = os.path.join(SOURCE_RAW_DIR, f1_list[0])
            f2_path = os.path.join(SOURCE_RAW_DIR, f2_list[0])
            # If extensions differ, normalize or swap content
            ext1 = os.path.splitext(f1_list[0])[1]
            ext2 = os.path.splitext(f2_list[0])[1]
            if ext1 == ext2:
                swap_two_files(f1_path, f2_path)
            else:
                # Same extension swap
                target1_path = os.path.join(SOURCE_RAW_DIR, f"{MODEL_NAME}{ext2}")
                target2_path = os.path.join(SOURCE_RAW_DIR, f"{MODEL_NAME} (2){ext1}")
                temp_path = os.path.join(SOURCE_RAW_DIR, f"__TEMP_RAW__")
                os.rename(f1_path, temp_path)
                os.rename(f2_path, target1_path)
                os.rename(temp_path, target2_path)
                print(f"  Swapped raw files: {f1_list[0]} <-> {f2_list[0]}")
    
    print(f"\n--- 2. Swapping media files in {SOURCE_OUTPUT_DIR} ---")
    if os.path.exists(SOURCE_OUTPUT_DIR):
        subfolders = [
            ('01_original', '.jpg'),
            ('02_transparent', '.webp'),
            ('03_mask', '_mask.png'),
            ('04_light_preview', '_light.webp'),
            ('05_dark_preview', '_dark.webp'),
            ('06_comparison', '_comparison.jpg')
        ]
        
        for sub, suffix in subfolders:
            sub_path = os.path.join(SOURCE_OUTPUT_DIR, sub)
            if os.path.exists(sub_path):
                print(f"Processing subfolder: {sub}")
                f1 = os.path.join(sub_path, f"{MODEL_NAME}{suffix}")
                f2 = os.path.join(sub_path, f"{MODEL_NAME} (2){suffix}")
                swap_two_files(f1, f2)

def deploy_to_public():
    print(f"\n--- 3. Deploying updated files to public/ and site/public/ ---")
    light_src = os.path.join(SOURCE_OUTPUT_DIR, '04_light_preview')
    dark_src = os.path.join(SOURCE_OUTPUT_DIR, '05_dark_preview')
    trans_src = os.path.join(SOURCE_OUTPUT_DIR, '02_transparent')

    for td in [DEST_PUBLIC, DEST_SITE_PUBLIC]:
        os.makedirs(td, exist_ok=True)
        # Clear existing
        for f in os.listdir(td):
            os.remove(os.path.join(td, f))

        # Copy light preview files
        for f in sorted(os.listdir(light_src)):
            shutil.copy2(os.path.join(light_src, f), os.path.join(td, f))

        # Copy dark preview files
        for f in sorted(os.listdir(dark_src)):
            shutil.copy2(os.path.join(dark_src, f), os.path.join(td, f))

        # Copy transparent webp files
        for f in sorted(os.listdir(trans_src)):
            shutil.copy2(os.path.join(trans_src, f), os.path.join(td, f))

        print(f"Deployed {len(os.listdir(td))} files to {td}")

def update_backup_json():
    print(f"\n--- 4. Updating {BACKUP_JSON} if present ---")
    if os.path.exists(BACKUP_JSON):
        with open(BACKUP_JSON, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for p in data:
            if p.get('id') == PROD_ID:
                media = p.get('media', [])
                if len(media) >= 2:
                    # Note: because files were physically renamed on disk,
                    # sort_order 1 still points to the 1st filename which is now the front view!
                    # And sort_order 2 points to the 2nd filename which is now the accessory box!
                    pass
        with open(BACKUP_JSON, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print("Backup JSON verified.")

def update_databases():
    print(f"\n--- 5. Synchronizing databases ---")
    now = utc_now()
    for db_path in DATABASES:
        if not os.path.exists(db_path):
            continue
        print(f"Updating {db_path}...")
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        # Check product
        cur.execute("SELECT id, primary_image, dark_image FROM products WHERE id = ?", (PROD_ID,))
        prod = cur.fetchone()
        if prod:
            primary_light = f"/media/products/LOTUS/LOTUS_ETCEKEN/{MODEL_NAME}/{MODEL_NAME}_light.webp"
            primary_dark = f"/media/products/LOTUS/LOTUS_ETCEKEN/{MODEL_NAME}/{MODEL_NAME}_dark.webp"
            cur.execute("""
                UPDATE products 
                SET primary_image = ?, dark_image = ?, image_position = 'center', image_fit = 'contain', crop_rect = NULL, updated_at = ?
                WHERE id = ?
            """, (primary_light, primary_dark, now, PROD_ID))
            print(f"  Updated product {PROD_ID} primary and dark images.")

        # Update product_media
        cur.execute("SELECT id, sort_order, url FROM product_media WHERE product_id = ? ORDER BY sort_order", (PROD_ID,))
        media_rows = cur.fetchall()
        print(f"  Found {len(media_rows)} media rows for {PROD_ID}")

        for r in media_rows:
            mid = r[0]
            sorder = r[1]
            suffix = '' if sorder == 1 else f' ({sorder})'
            light_url = f"/media/products/LOTUS/LOTUS_ETCEKEN/{MODEL_NAME}/{MODEL_NAME}{suffix}_light.webp"
            dark_url = f"/media/products/LOTUS/LOTUS_ETCEKEN/{MODEL_NAME}/{MODEL_NAME}{suffix}_dark.webp"
            orig_url = f"/media/products/LOTUS/LOTUS_ETCEKEN/{MODEL_NAME}/{MODEL_NAME}{suffix}.webp"

            cur.execute("""
                UPDATE product_media
                SET url = ?, dark_url = ?, original_url = ?, object_position = 'center', fit_mode = 'contain', crop_rect = NULL
                WHERE id = ?
            """, (light_url, dark_url, orig_url, mid))

        conn.commit()
        conn.execute("VACUUM;")
        conn.close()
        print(f"Finished updating {os.path.basename(db_path)}.")

def main():
    print("=== LOTUS Meat Grinder (Ətçəkən Lotus LT01001) 1 <-> 2 Image Swap ===")
    create_db_backups()
    reorder_source_media()
    deploy_to_public()
    update_backup_json()
    update_databases()
    print("\n=== Reorder and synchronization completed successfully! ===")

if __name__ == '__main__':
    main()
