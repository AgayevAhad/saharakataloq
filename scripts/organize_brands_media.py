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
STAGING_DIR = os.path.join(WORKSPACE_DIR, 'Media/_STAGING_ORGANIZE')

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

def clean_alnum(s):
    return re.sub(r'[^A-Z0-9]', '', s.upper())

def match_image_to_model(brand, original_filename, products_for_brand):
    stem = original_filename
    # Clean extensions
    stem = re.sub(r'\.[a-zA-Z0-9]+$', '', stem)
    stem = re.sub(r'\.[a-zA-Z0-9]+$', '', stem) # double ext if any
    # Clean trailing copy indices like (2), (3), -1, -2, ..
    stem = re.sub(r'\s*\(\d+\)$', '', stem).strip()
    stem = re.sub(r'-\d+$', '', stem).strip()
    stem = re.sub(r'\.+$', '', stem).strip()
    
    # Strip camera RAW indices like 406A...
    if re.match(r'^[0-9]{3,4}[A-Z][0-9]{4,}$', stem):
        return None
    if stem.lower() in ['islenme', 'işlənmə', 'r410a', 'artel', 'lotus kondisoner', 'komur', 'qaz ruckasi']:
        return None

    # Strip modifier words
    stem_clean = re.sub(r'\s+(ön|on|arxa|hissə|hisse|hissesi|hissəsi|ümumi|umumi)$', '', stem, flags=re.IGNORECASE).strip()

    # Exact name matches
    for p in products_for_brand:
        if stem.upper() == p.upper() or stem_clean.upper() == p.upper():
            return p

    clean_stem = clean_alnum(stem_clean)

    if brand == 'ARTEL':
        # Specific Artel models
        # e.g. ARTSID1AW12BE, ARTSID1AW12HE, ARTSID3AW12BE, ARTSIJ1AW09HE, ARTSIJ1AW12BE, ARTSIJ1AW24BE, ARTSIM2AW12BE, ARTSIM2AW12HE, ARTSIM3BW12HE
        # A43PUCH010, VCC 0220
        for p in products_for_brand:
            p_clean = clean_alnum(p)
            for code in ['ARTSID1AW12BE', 'ARTSID1AW12HE', 'ARTSID3AW12BE', 'ARTSIJ1AW09HE', 'ARTSIJ1AW12BE', 'ARTSIJ1AW24BE', 'ARTSIM2AW12BE', 'ARTSIM2AW12HE', 'ARTSIM3BW12HE', 'A43PUCH010']:
                if code in clean_stem and code in p_clean:
                    return p
            if '0220' in clean_stem and '0220' in p_clean and 'VCC' in p_clean:
                return p

    elif brand == 'LOTUS':
        # Exact product code checks
        # Airfryer 5.5
        if 'AIRFRYER' in clean_stem:
            for color in ['BLACKWHITE', 'GRAYBLACK', 'BLACK']:
                if color in clean_stem:
                    for p in products_for_brand:
                        if 'AIRFRYER' in p.upper() and color in clean_alnum(p):
                            return p
        # Cooktops / Plite
        for code in ['631BB', '631TK', '6455', '3160S', '3160', '4190CREAM', '4190B', '4316FV', '5316FV', '6016', '6040', '6041', '6454', '6550', '941CMW', '941INOX', 'S631S']:
            if code in clean_stem:
                for p in products_for_brand:
                    p_clean = clean_alnum(p)
                    if code == '941CMW' and 'FTB941CMW' in p_clean:
                        return p
                    elif code == '941INOX' and 'LT941INOX' in p_clean:
                        return p
                    elif code == '4190B' and 'LT4190BLACK' in p_clean:
                        return p
                    elif code in p_clean:
                        return p
        # Meat grinder (Etceken)
        for code in ['01001', '02003', '1800W', '0101']:
            if code in clean_stem:
                for p in products_for_brand:
                    p_clean = clean_alnum(p)
                    if code == '0101' and '01010' in p_clean:
                        return p
                    elif code in p_clean:
                        return p
        # Air conditioners (Kondisioner)
        for code in ['LT09BL', 'LT09BS', 'LT09W', 'LT12R410B', 'LT18BS']:
            if code in clean_stem:
                for p in products_for_brand:
                    if code in clean_alnum(p):
                        return p
        # Ovens (Sobalar)
        for code in ['4545BLBP', '4545BL', '4545INOX', '4545AIRFRY', '615FULLBLACK', '645O', '645V', '647E', '647O', '6470', '828FULLSCREEN', '829FULLTOUCH', '8001S102', '46EOBK', '46DGMATT', '46EO', '627']:
            if code in clean_stem:
                for p in products_for_brand:
                    p_clean = clean_alnum(p)
                    if (code == '647O' or code == '6470') and '6470' in p_clean:
                        return p
                    elif code == '46EO' and 'LT46EOINOX' in p_clean:
                        return p
                    elif code == '627' and 'LT627BLACK' in p_clean:
                        return p
                    elif code in p_clean:
                        return p
        # TV
        if '43LT2025' in clean_stem:
            for p in products_for_brand:
                if '43LT2025' in clean_alnum(p):
                    return p
        # Termopot
        for code in ['1313BLACK', '1313GREY', '1313GRAY', '1212GREY', '1111BLACK']:
            if code in clean_stem:
                for p in products_for_brand:
                    p_clean = clean_alnum(p)
                    if '1313' in code and '1313' in p_clean:
                        if ('BLACK' in code and 'BLACK' in p_clean) or (('GREY' in code or 'GRAY' in code) and 'GREY' in p_clean):
                            return p
                    elif '1212' in code and '1212' in p_clean:
                        return p
                    elif '1111' in code and '1111' in p_clean:
                        return p
        # Tozsoran
        if 'LT18ORANGE' in clean_stem:
            for p in products_for_brand:
                if 'LT18ORANGE' in clean_alnum(p):
                    return p
        if 'LT20BLUE' in clean_stem:
            for p in products_for_brand:
                if 'LT20BLUE' in clean_alnum(p):
                    return p
        # Utu
        for code in ['8800', '8801', '8802', '8803']:
            if code in clean_stem:
                for p in products_for_brand:
                    if code in clean_alnum(p):
                        return p

    return None

def main():
    print('Starting brand media processing...')
    unique_items = read_excel_products(EXCEL_PATH)
    print(f'Total unique products in ProductName.xlsx: {len(unique_items)}')

    # 1. Structure products by Brand and Category
    categories_by_brand = defaultdict(lambda: defaultdict(list))
    brand_products = defaultdict(list)
    for item in unique_items:
        b, c = get_brand_and_category(item)
        if b:
            safe_name = item.replace('/', '-').replace(':', '-')
            brand_products[b].append(item)
            categories_by_brand[b][c].append((item, safe_name))

    # 2. Gather all image files from staging (or Media/BRENDS)
    all_staging_files = []
    if os.path.exists(STAGING_DIR):
        for f in os.listdir(STAGING_DIR):
            all_staging_files.append(os.path.join(STAGING_DIR, f))

    # Group staging files by brand
    brand_staging = {'ARTEL': [], 'LOTUS': []}
    for fpath in all_staging_files:
        fname = os.path.basename(fpath)
        if fname.startswith('ARTEL_') or 'ARTEL' in fname:
            brand_staging['ARTEL'].append(fpath)
        elif fname.startswith('LOTUS_') or 'LOTUS' in fname:
            brand_staging['LOTUS'].append(fpath)

    # 3. Create clean category and model directories for ARTEL, LOTUS, and MIDEA
    for brand in ['ARTEL', 'LOTUS', 'MIDEA']:
        for cat, prods in categories_by_brand[brand].items():
            cat_dir = os.path.join(MEDIA_BRENDS_DIR, brand, cat)
            os.makedirs(cat_dir, exist_ok=True)
            for orig_name, safe_name in prods:
                model_dir = os.path.join(cat_dir, safe_name)
                os.makedirs(model_dir, exist_ok=True)

    # 4. Perform Matching and placement
    matched_models = defaultdict(lambda: defaultdict(list)) # brand -> safe_model -> list of src_paths
    unmatched_files = defaultdict(list) # brand -> list of (src_path, orig_name)

    for brand in ['ARTEL', 'LOTUS']:
        for fpath in brand_staging[brand]:
            fname = os.path.basename(fpath)
            
            # Extract real original name
            orig_name = fname
            if orig_name.startswith('unassigned_ARTEL_') or orig_name.startswith('unassigned_LOTUS_'):
                orig_name = orig_name.split('unassigned_' + brand + '_')[1]
            elif orig_name.startswith(brand + '_'):
                orig_name = orig_name.split(brand + '_')[1]
                # Strip _0.jpg, _1.jpg if added by previous staging
                orig_name = re.sub(r'_\d+\.[a-zA-Z0-9]+$', '', orig_name)

            matched_product = match_image_to_model(brand, orig_name, brand_products[brand])
            if matched_product:
                safe_model = matched_product.replace('/', '-').replace(':', '-')
                matched_models[brand][safe_model].append(fpath)
            else:
                unmatched_files[brand].append((fpath, orig_name))

    # 5. Place matched files into model directories
    for brand in ['ARTEL', 'LOTUS']:
        model_to_cat = {}
        for cat, prods in categories_by_brand[brand].items():
            for orig_name, safe_name in prods:
                model_to_cat[safe_name] = cat

        for safe_model, file_list in matched_models[brand].items():
            cat = model_to_cat.get(safe_model)
            if not cat:
                continue
            model_dir = os.path.join(MEDIA_BRENDS_DIR, brand, cat, safe_model)
            os.makedirs(model_dir, exist_ok=True)

            for idx, src_path in enumerate(file_list):
                ext = os.path.splitext(src_path)[1].lower()
                if ext == '.jpeg':
                    ext = '.jpg'
                if idx == 0:
                    dest_name = f'{safe_model}{ext}'
                else:
                    dest_name = f'{safe_model} ({idx + 1}){ext}'
                dest_path = os.path.join(model_dir, dest_name)
                shutil.copy2(src_path, dest_path)

    # 6. Place unmatched files into _UNASSIGNED_MEDIA
    for brand in ['ARTEL', 'LOTUS']:
        unassigned_dir = os.path.join(MEDIA_BRENDS_DIR, brand, '_UNASSIGNED_MEDIA')
        os.makedirs(unassigned_dir, exist_ok=True)
        for src_path, orig_name in unmatched_files[brand]:
            clean_dest_name = orig_name
            dest_path = os.path.join(unassigned_dir, clean_dest_name)
            shutil.copy2(src_path, dest_path)

    # 7. Clean staging directory
    if os.path.exists(STAGING_DIR):
        shutil.rmtree(STAGING_DIR)

    # 8. Generate Summary Report
    report = {}
    for brand in ['ARTEL', 'LOTUS', 'MIDEA']:
        total_models = len(brand_products[brand])
        models_with_media = len(matched_models[brand])
        models_without_media = [p for p in brand_products[brand] if p.replace('/', '-').replace(':', '-') not in matched_models[brand]]
        unassigned = [orig_name for _, orig_name in unmatched_files[brand]]

        report[brand] = {
            'total_models': total_models,
            'models_with_media_count': models_with_media,
            'models_with_media': list(matched_models[brand].keys()),
            'models_without_media_count': len(models_without_media),
            'models_without_media': models_without_media,
            'unassigned_files_count': len(unassigned),
            'unassigned_files': unassigned
        }

    report_path = os.path.join(WORKSPACE_DIR, 'Media/ProductInfo/organization_report.json')
    with open(report_path, 'w', encoding='utf-8') as rf:
        json.dump(report, rf, ensure_ascii=False, indent=2)

    print('Organization report written to', report_path)
    print('Done!')

if __name__ == '__main__':
    main()
