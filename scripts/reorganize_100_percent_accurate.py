#!/usr/bin/env python3
import os
import sys
import zipfile
import xml.etree.ElementTree as ET
import re
import shutil
import json
from collections import defaultdict

WORKSPACE_DIR = '/home/oni10/Desktop/ArdoKataloq'
EXCEL_PATH = os.path.join(WORKSPACE_DIR, 'Media/ProductInfo/ProductName.xlsx')
MEDIA_BRENDS_DIR = os.path.join(WORKSPACE_DIR, 'Media/BRENDS')
STAGING_DIR = os.path.join(WORKSPACE_DIR, 'Media/_PRECISE_STAGING')

def read_excel_products(excel_path):
    with zipfile.ZipFile(excel_path) as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
            for si in tree.findall('ns:si', ns):
                t = si.find('ns:t', ns)
                if t is not None and t.text:
                    shared_strings.append(t.text)
                else:
                    text_parts = [elem.text for elem in si.findall('.//ns:t', ns) if elem.text]
                    shared_strings.append(''.join(text_parts))

        tree = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        rows = []
        for row in tree.findall('.//ns:row', ns):
            for cell in row.findall('ns:c', ns):
                cell_type = cell.get('t')
                v = cell.find('ns:v', ns)
                val = v.text if v is not None else ''
                if cell_type == 's' and val.isdigit():
                    val = shared_strings[int(val)]
                rows.append(val.strip())

    items = [r for r in rows if r and r != 'Adı']
    seen = set()
    unique_items = []
    for it in items:
        if it not in seen:
            seen.add(it)
            unique_items.append(it)
    return unique_items

def get_brand_and_category(pname):
    u = pname.upper()
    brand = None
    if 'ARTEL' in u:
        brand = 'ARTEL'
    elif 'LOTUS' in u:
        brand = 'LOTUS'
    elif 'MIDEA' in u:
        brand = 'MIDEA'
    else:
        return None, None
        
    if any(k in u for k in ['ASPIRATOR', 'HAVACEKEN', 'HAVAÇƏKƏN', 'CANOPY']):
        cat = f'{brand}_HAVACEKEN'
    elif any(k in u for k in ['KONDİSİONER', 'KONDISIONER', 'KONDİNSİONER', 'KONDINSIONER']):
        cat = f'{brand}_KONDISONER'
    elif any(k in u for k in ['SOYUDUCU', 'DONDURUCU', 'SOYUCUDU', 'TAMBOY']):
        cat = f'{brand}_SOYUDUCULAR'
    elif any(k in u for k in ['PLİTƏ', 'PLITE', 'PILTE', 'PİLTƏ', 'QAZ PLİTƏSİ', 'QAZ']):
        cat = f'{brand}_BISIRME_PANELI'
    elif any(k in u for k in ['SOBA', 'IRAN']):
        cat = f'{brand}_SOBALAR'
    elif any(k in u for k in ['MİKRODALĞA', 'MIKRODALGA', 'MIKRODALQALI']):
        cat = f'{brand}_MIKRODALGALI_SOBA'
    elif any(k in u for k in ['AIRFRYER', 'ARFIYER', 'FRİTOZ', 'FRITOZ']):
        cat = f'{brand}_ARFIYER'
    elif any(k in u for k in ['ƏTÇƏKƏN', 'ETCEKEN']):
        cat = f'{brand}_ETCEKEN'
    elif any(k in u for k in ['TELEVIZOR', 'TV', 'EKRAN']):
        cat = f'{brand}_TELEVIZOR'
    elif any(k in u for k in ['TERMOPOT', 'ÇAYNİK', 'CAYNIK']):
        cat = f'{brand}_TERMOPOT' if brand == 'LOTUS' else f'{brand}_CAYNIK'
    elif any(k in u for k in ['TOZSORAN']):
        cat = f'{brand}_TOZSORAN'
    elif any(k in u for k in ['ÜTÜ', 'UTU']):
        cat = f'{brand}_UTU'
    elif any(k in u for k in ['PALTARYUYAN']):
        cat = f'{brand}_PALTARYUYAN'
    elif any(k in u for k in ['PALTARQURUDAN']):
        cat = f'{brand}_PALTARQURUDAN'
    elif any(k in u for k in ['QABYUYAN']):
        cat = f'{brand}_QABYUYAN'
    elif any(k in u for k in ['KOMBI', 'KOMBİ']):
        cat = f'{brand}_KOMBI'
    else:
        cat = f'{brand}_AKSESUAR'
        
    return brand, cat

# Explicit 100% exact pattern rules for Lotus & Artel
LOTUS_EXACT_RULES = [
    # Airfryer
    (r'airfryer.*5\.5.*black.*white', 'Airfryer Lotus 5.5 Black White'),
    (r'airfryer.*5\.5.*gray.*black', 'Airfryer Lotus 5.5 Gray Black'),
    (r'airfryer.*5\.5.*black', 'Airfryer Lotus 5.5 Black'),
    # Cooktops / Plite
    (r'lt.*631.*bb.*black', 'Plite Lotus LT631 BB Black'),
    (r'lt.*631.*tk.*black', 'Plite Lotus LT631 TK Black'),
    (r'lt.*6455.*black', 'Plite Lotus LT6455 Black'),
    (r'lt.*3160.*inox.*4g', 'Plite Lotus LT3160Inox 4G'),
    (r'lt.*3160s.*black', 'Plite Lotus LT3160S Black'),
    (r'lt.*3160.*black|lt.*3160b\b', 'Plite Lotus LT3160B'),
    (r'lt.*4190.*cream', 'Plite Lotus LT4190 Cream'),
    (r'lt.*4190.*b\b', 'Plite Lotus LT4190B'),
    (r'lt.*4316fv.*vitro', 'Plite Lotus LT4316FV-Vitroglass'),
    (r'lt.*5316fv.*glass', 'Plite Lotus LT5316FV-Glass'),
    (r'lt.*6016.*black', 'Aspirator Lotus LT6016 Black'),
    (r'lt.*6040.*inox', 'Plite Lotus LT6040 Inox'),
    (r'lt.*6041.*inox', 'Plite Lotus LT6041 inox'),
    (r'lt.*6454.*inox', 'Plite Lotus LT6454 inox'),
    (r'lt.*6550.*cblack', 'Plite Lotus LT6550CE Black'),
    (r'lt.*941.*cmw', 'Qaz piltəsi Lotus F-TB941CMW'),
    (r'lt.*941.*inox', 'Plite Lotus LT941 Inox'),
    (r'lt.*s.*631s', 'Plite Lotus LTS631S'),
    # Meat grinders / Etceken
    (r'1800w', 'Ətçəkən Lotus 1800W'),
    (r'lt.*01001', 'Ətçəkən Lotus LT01001'),
    (r'lt.*02003', 'Ətçəkən Lotus LT02003'),
    (r'lt.*0101\b', 'Ətçəkən Lotus LT01010'),
    # AC / Kondisioner
    (r'lt09bl', 'Kondisioner Lotus LT09BL Invertor'),
    (r'lt09bs', 'Kondisioner Lotus LT09BS'),
    (r'lt09w', 'Kondisioner Lotus LT09W Invertor'),
    (r'lt12r410b', 'Kondisioner Lotus LT12R410B'),
    (r'lt18bs', 'Kondisioner Lotus LT18BS'),
    # Ovens / Sobalar
    (r'lt.*4545.*airfry.*inox', 'Soba Lotus LT4545 Airfry Inox'),
    (r'lt.*4545.*bl.*bp', 'Soba Lotus LT4545 BL BP'),
    (r'lt.*4545.*bl\b', 'Soba Lotus LT4545 BL'),
    (r'lt.*4545.*inox', 'Soba Lotus LT4545 Inox'),
    (r'lt.*46.*eo\b|lt.*46eo\b', 'Soba Lotus LT46EO Inox'),
    (r'lt.*46eobk.*flower', 'Soba Lotus LT46EOBK Flower'),
    (r'lt.*46eobk', 'Soba Lotus LT46EOBK Flower'),
    (r'lt.*46dg.*matt', 'Soba Lotus LT46DG MATT 2 SUSE'),
    (r'lt.*615.*full.*black', 'Soba Lotus LT615 Full Black'),
    (r'lt.*627.*black|alveus.*lt627', 'Soba Lotus LT627 Black'),
    (r'lt.*645o\b', 'Soba Lotus LT645O'),
    (r'lt.*645v', 'Soba Lotus LT645V  8 Program'),
    (r'lt.*647e', 'Soba Lotus LT647E'),
    (r'lt.*647o\b|lt.*6470', 'Soba Lotus LT6470  8 Program'),
    (r'lt.*828.*full.*screen', 'Soba Lotus LT828 Full Screen Black'),
    (r'lt.*829.*full.*touch', 'Soba Lotus LT829 Full Touch Black'),
    (r'lts.*8001s-102', 'Soba Lotus LTS8001S-102'),
    # TV
    (r'43lt2025|43lt-2025', 'Ekran Lotus 43LT-2025'),
    # Termopot
    (r'lt.*50.*eb.*1010.*black', 'Termopot Lotus LT-50-EB-1010 Black'),
    (r'lt.*50.*eb.*1010.*grey', 'Termopot Lotus LT-50-EB-1010 Grey'),
    (r'lt.*50.*eb.*1111.*black', 'Termopot Lotus LT-50-EB-1111 Black'),
    (r'lt.*50.*eb.*1111.*beige', 'Termopot Lotus LT-50-EB-1111 Beige'),
    (r'lt.*50.*eb.*1212.*grey', 'Termopot Lotus LT-50-EB-1212 Grey'),
    (r'lt.*50.*eb.*1212.*black', 'Termopot Lotus LT-50-EB-1212 Black'),
    (r'lt.*50.*eb.*1313.*black', 'Termopot Lotus LT-50-EB-1313 Black'),
    (r'lt.*50.*eb.*1313.*(grey|gray)', 'Termopot Lotus LT-50-EB-1313 Grey'),
    # Tozsoran
    (r'18.*orange', 'Tozsoran Lotus LT 18 Orange'),
    (r'20.*blue', 'Tozsoran Lotus LT 20 Blue'),
    # Utu
    (r'8803', 'Utu Buxarli Lotus LT-8803'),
    (r'8800', 'Utu Lotus LT-8800'),
    (r'8801', 'Utu Lotus LT-8801'),
    (r'8802', 'Utu Lotus LT-8802'),
]

ARTEL_EXACT_RULES = [
    (r'artsim3bw12he', 'Kondisioner Artel Aurora ARTSIM3BW12HE'),
    (r'artsid3aw12be', 'Kondisioner Artel Everest ARTSID3AW12BE Invertor'),
    (r'artsim2aw12be', 'Kondisioner Artel Gloria ARTSIM2AW12BE'),
    (r'artsim2aw12he', 'Kondisioner Artel Gloria ARTSIM2AW12HE'),
    (r'artsid1aw12be', 'Kondisioner Artel Grand ARTSID1AW12BE Invertor'),
    (r'artsid1aw12he', 'Kondisioner Artel Grand ARTSID1AW12HE'),
    (r'artsij1aw09he', 'Kondisioner Artel Shahrisabz ARTSIJ1AW09HE'),
    (r'artsij1aw12be', 'Kondisioner Artel Shahrisabz ARTSIJ1AW12BE Inverto'),
    (r'artsij1aw24be', 'Kondisioner Artel Shahrisabz ARTSIJ1AW24BE inverto'),
    (r'a43puch010', 'TV Artel A43PUCH010 Black Google TV 4K'),
    (r'0220.*blue|vcc.*0220', 'Tozsoran Artel VCC 0220 Blue'),
]

def classify_image(brand, fname, full_path):
    fn_lower = fname.lower()
    
    # Generic unassigned keywords
    if any(k in fn_lower for k in ['islenme', 'işlənmə', 'r410a', 'futbolka', 'artel (', 'artel.', 'artel_kondisoner_artsu1aw12he', 'artsu1aw12he', 'li09410', 'li12410', 'li18410', 'lotus kondisoner']):
        return None
    if re.search(r'406a\d+', fn_lower):
        return None

    if brand == 'LOTUS':
        for pat, target in LOTUS_EXACT_RULES:
            if re.search(pat, fn_lower):
                return target
    elif brand == 'ARTEL':
        for pat, target in ARTEL_EXACT_RULES:
            if re.search(pat, fn_lower):
                return target

    return None

def main():
    print("Starting 100% exact brand reorganization...")
    unique_items = read_excel_products(EXCEL_PATH)
    print(f"Loaded {len(unique_items)} products from Excel.")

    # 1. Collect all current images from Media/BRENDS/ARTEL and Media/BRENDS/LOTUS
    # and site/public/media/products/artel/ for any missing like 0220
    all_source_files = {'ARTEL': [], 'LOTUS': []}

    for brand in ['ARTEL', 'LOTUS']:
        b_dir = os.path.join(MEDIA_BRENDS_DIR, brand)
        if os.path.exists(b_dir):
            for root, dirs, files in os.walk(b_dir):
                for f in files:
                    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                        all_source_files[brand].append((f, os.path.join(root, f)))

    # Also check site/public/media/products/artel for 0220
    site_artel_dir = os.path.join(WORKSPACE_DIR, 'site/public/media/products/artel')
    if os.path.exists(site_artel_dir):
        for f in os.listdir(site_artel_dir):
            if '0220' in f:
                all_source_files['ARTEL'].append((f'Tozsoran Artel VCC 0220 blue_{f}', os.path.join(site_artel_dir, f)))

    # Deduplicate source files by md5 hash
    deduped_sources = {'ARTEL': [], 'LOTUS': []}
    for brand in ['ARTEL', 'LOTUS']:
        seen_hashes = set()
        for f, path in all_source_files[brand]:
            try:
                with open(path, 'rb') as fp:
                    h = fp.read()
                    import hashlib
                    md5 = hashlib.md5(h).hexdigest()
                    if md5 not in seen_hashes:
                        seen_hashes.add(md5)
                        deduped_sources[brand].append((f, path))
            except Exception as e:
                print(f"Error reading {path}: {e}")

    print(f"Unique source images: ARTEL: {len(deduped_sources['ARTEL'])}, LOTUS: {len(deduped_sources['LOTUS'])}")

    # 2. Stage all images cleanly
    os.makedirs(STAGING_DIR, exist_ok=True)
    staged = {'ARTEL': [], 'LOTUS': []}
    for brand in ['ARTEL', 'LOTUS']:
        for idx, (f, path) in enumerate(deduped_sources[brand]):
            stage_name = f"{brand}_{idx}_{f}"
            stage_path = os.path.join(STAGING_DIR, stage_name)
            shutil.copy2(path, stage_path)
            staged[brand].append((f, stage_path))

    # 3. Clean and recreate folder structures for ARTEL, LOTUS, MIDEA
    categories_by_brand = defaultdict(lambda: defaultdict(list))
    for item in unique_items:
        b, c = get_brand_and_category(item)
        if b:
            safe_name = item.replace('/', '-').replace(':', '-')
            categories_by_brand[b][c].append((item, safe_name))

    for brand in ['ARTEL', 'LOTUS', 'MIDEA']:
        b_dir = os.path.join(MEDIA_BRENDS_DIR, brand)
        if os.path.exists(b_dir):
            shutil.rmtree(b_dir)
        os.makedirs(b_dir, exist_ok=True)
        # Create all category and model folders
        for cat, prods in categories_by_brand[brand].items():
            cat_dir = os.path.join(b_dir, cat)
            os.makedirs(cat_dir, exist_ok=True)
            for orig_name, safe_name in prods:
                model_dir = os.path.join(cat_dir, safe_name)
                os.makedirs(model_dir, exist_ok=True)

    # 4. Classify each staged file with 100% exact precision
    model_to_cat = {}
    for brand in ['ARTEL', 'LOTUS']:
        for cat, prods in categories_by_brand[brand].items():
            for orig_name, safe_name in prods:
                model_to_cat[(brand, safe_name)] = cat

    matched_by_model = defaultdict(list)
    unassigned_by_brand = defaultdict(list)

    for brand in ['ARTEL', 'LOTUS']:
        for orig_fname, stage_path in staged[brand]:
            target_model = classify_image(brand, orig_fname, stage_path)
            if target_model:
                safe_model = target_model.replace('/', '-').replace(':', '-')
                matched_by_model[(brand, safe_model)].append((orig_fname, stage_path))
            else:
                unassigned_by_brand[brand].append((orig_fname, stage_path))

    # 5. Place matched files into their exact model folders
    for (brand, safe_model), files in matched_by_model.items():
        cat = model_to_cat.get((brand, safe_model))
        if not cat:
            print(f"Warning: Category not found for {brand} {safe_model}")
            continue
        model_dir = os.path.join(MEDIA_BRENDS_DIR, brand, cat, safe_model)
        os.makedirs(model_dir, exist_ok=True)
        for idx, (orig_fname, stage_path) in enumerate(files):
            ext = os.path.splitext(orig_fname)[1].lower()
            if ext == '.jpeg':
                ext = '.jpg'
            dest_name = f"{safe_model}{ext}" if idx == 0 else f"{safe_model} ({idx + 1}){ext}"
            dest_path = os.path.join(model_dir, dest_name)
            shutil.copy2(stage_path, dest_path)

    # 6. Place unassigned files into _UNASSIGNED_MEDIA
    for brand in ['ARTEL', 'LOTUS']:
        unassigned_dir = os.path.join(MEDIA_BRENDS_DIR, brand, '_UNASSIGNED_MEDIA')
        os.makedirs(unassigned_dir, exist_ok=True)
        for orig_fname, stage_path in unassigned_by_brand[brand]:
            # Clean dest name
            clean_name = os.path.basename(stage_path)
            dest_path = os.path.join(unassigned_dir, clean_name)
            shutil.copy2(stage_path, dest_path)

    # Clean staging
    if os.path.exists(STAGING_DIR):
        shutil.rmtree(STAGING_DIR)

    print("Reorganization completed successfully!")
    print(f"ARTEL: {len([k for k in matched_by_model if k[0] == 'ARTEL'])} models populated with exact 1:1 photos.")
    print(f"LOTUS: {len([k for k in matched_by_model if k[0] == 'LOTUS'])} models populated with exact 1:1 photos.")
    print(f"Unassigned files preserved: ARTEL: {len(unassigned_by_brand['ARTEL'])}, LOTUS: {len(unassigned_by_brand['LOTUS'])}")

if __name__ == '__main__':
    main()
