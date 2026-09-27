#!/usr/bin/env python3
import os
import sys
import zipfile
import xml.etree.ElementTree as ET
import re
import shutil
import sqlite3
import datetime
from collections import defaultdict

WORKSPACE_DIR = '/home/oni10/Desktop/ArdoKataloq'
EXCEL_PATH = os.path.join(WORKSPACE_DIR, 'Media/ProductInfo/ProductName.xlsx')
MEDIA_BRENDS_DIR = os.path.join(WORKSPACE_DIR, 'Media/BRENDS')

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

CATEGORY_MAP = {
    "cooktop": ["_BISIRME_PANELI", "_AKSESUAR", "_KOMBI"],
    "hood": ["_HAVACEKEN"],
    "air_conditioner": ["_KONDISONER"],
    "microwave": ["_MIKRODALGALI_SOBA"],
    "oven": ["_SOBALAR"],
    "refrigerator": ["_SOYUDUCULAR"],
    "airfryer": ["_ARFIYER"],
    "washer": ["_PALTARYUYAN"],
    "dryer": ["_PALTARQURUDAN"],
    "dishwasher": ["_QABYUYAN"],
    "vacuum_cleaner": ["_TOZSORAN"],
    "tv": ["_TELEVIZOR"],
    "meat_grinder": ["_ETCEKEN"],
    "thermopot": ["_TERMOPOT", "_CAYNIK"],
    "iron": ["_UTU"],
}

def resolve_db_category(cat_folder):
    for db_cat, patterns in CATEGORY_MAP.items():
        if any(cat_folder.endswith(p) for p in patterns):
            return db_cat
    return "cooktop"

SPECS_TEMPLATE = {
    "cooktop": [("Növ", "Qaz / Elektrik"), ("Ocaq sayı", "4"), ("Səthin örtüyü", "Şüşə / Emal"), ("Qəfəslərin materialı", "Çuqun"), ("Qaz-kontrol", "Var"), ("Elektrik alışdırma", "Avtomatik"), ("İdarəetmə növü", "Mexaniki"), ("Rəng", "Qara / İnox")],
    "hood": [("Növ", "Quraşdırılan / Əyri"), ("İş rejimi", "Çıxarış və Resirkulyasiya"), ("Məhsuldarlıq", "650 m³/saat"), ("İdarəetmə növü", "Sensor / Mexaniki"), ("Sürət sayı", "3"), ("Səs səviyyəsi", "56 dB"), ("Rəng", "Qara / İnox")],
    "air_conditioner": [("Növ", "Split sistem"), ("Əsas rejimlər", "Soyutma / İsitmə"), ("İnverter", "Var"), ("Enerjiistifadə sinfi", "A++"), ("Soyutma qabiliyyəti", "12000 BTU"), ("Freon", "R410A / R32"), ("Rəng", "Ağ")],
    "microwave": [("Növ", "Quraşdırılan"), ("Həcm", "20 L"), ("Mikrodalğaların gücü", "800 Vt"), ("Qril", "Var"), ("İdarəetmə növü", "Elektron"), ("Rəng", "Qara")],
    "oven": [("Növ", "Quraşdırılan elektrik soba"), ("Həcm", "65 L"), ("Enerjiistifadə sinfi", "A"), ("Qril", "Var"), ("Konveksiya", "Var"), ("Proqram sayı", "8"), ("Rəng", "Qara / İnox")],
    "refrigerator": [("Növ", "İki kameralı NoFrost"), ("Ümumi həcm", "320 L"), ("Əritmə sistemi", "NoFrost"), ("Kompressor tipi", "İnverter"), ("Enerjiistifadə sinfi", "A+"), ("Səs səviyyəsi", "39 dB"), ("Rəng", "İnox / Qara")],
    "tv": [("Ekran ölçüsü", "43 düym"), ("Görüntü imkanı", "Full HD / 4K UHD"), ("Smart TV", "Google TV"), ("Səs gücü", "20 Vt"), ("Dəstəklənən interfeyslər", "HDMI, USB, Wi-Fi, Bluetooth"), ("Rəng", "Qara")],
    "vacuum_cleaner": [("Növ", "Torbalı / Konteyner"), ("Güc", "2200 Vt"), ("Sorma gücü", "450 Vt"), ("Toz toplayıcı həcmi", "3 L"), ("Filtr növü", "HEPA"), ("Rəng", "Mavi / Qara")],
    "iron": [("Növ", "Buxarlı ütü"), ("Güc", "2400 Vt"), ("Davamlı buxar", "45 q/dəq"), ("Buxar zərbəsi", "180 q"), ("Altlıq materialı", "Keramika"), ("Rəng", "Qara / Bənövşəyi")],
    "meat_grinder": [("Maksimal güc", "1800 Vt"), ("Məhsuldarlıq", "2 kq/dəq"), ("Revers funksiyası", "Var"), ("Korpus materialı", "Plastik / Metal"), ("Rəng", "Ağ / Qara")],
    "thermopot": [("Həcm", "5 L"), ("Güc", "800 Vt"), ("Qızdırıcı element", "Gizli spiral"), ("Temperatur saxlama", "Var"), ("Korpus materialı", "Paslanmaz polad"), ("Rəng", "Qara / Boz")],
    "airfryer": [("Həcm", "5.5 L"), ("Güc", "1700 Vt"), ("İdarəetmə növü", "Sensor"), ("Proqram sayı", "8"), ("Avtomatik sönmə", "Var"), ("Rəng", "Qara")],
    "washer": [("Maksimal yükləmə", "7 kq"), ("Sıxma sürəti", "1200 dövr/dəq"), ("Enerjiistifadə sinfi", "A+++"), ("Proqram sayı", "15"), ("İdarəetmə növü", "Elektron / Ekran"), ("Rəng", "Ağ / Boz")],
    "dishwasher": [("Dəst tutumu", "12 dəst"), ("Enerjiistifadə sinfi", "A++"), ("Proqram sayı", "6"), ("Səs səviyyəsi", "47 dB"), ("Sızmadan qorunma", "AquaStop"), ("Rəng", "İnox / Ağ")],
    "dryer": [("Maksimal yükləmə", "8 kq"), ("Qurutma növü", "İstilik nasosu (Heat Pump)"), ("Enerjiistifadə sinfi", "A++"), ("Proqram sayı", "14"), ("Rəng", "Ağ")],
}

PREFIX_STRIP = [
    "Aspirator Ardo ", "Plite Ardo ", "Plitə Ardo ", "Piltə Ardo ", "PLite Ardo ", "Kondisioner Ardo ", "Mikrodalga Ardo ", "Soba Ardo ", "Soyuducu Ardo ", "Soba Alveus ",
    "Aspirator Lotus ", "Plite Lotus ", "Plitə Lotus ", "Piltə Lotus ", "Qaz piltəsi Lotus ", "Qaz Lotus ", "Kondisioner Lotus ", "Soba Lotus ", "Soyuducu Lotus ", "TV Lotus ", "Ekran Lotus ", "Termopot Lotus ", "Tozsoran Lotus ", "Utu Lotus ", "Utu Buxarli Lotus ", "Airfryer Lotus ", "Ətçəkən Lotus ", "Etceken Lotus ", "Paltaryuyan Lotus ", "Mikrodalga Lotus ",
    "Kondisioner Artel ", "TV Artel ", "Tozsoran Artel ", "Soba Artel ", "Soyuducu Artel ", "Dondurucu Artel ", "Aspirator Artel ", "PLİTƏ ARTEL ", "Paltaryuyan Artel ", "Artel ",
    "Kondisioner Midea ", "Kondinsioner Midea ", "Soyuducu Midea ", "Soyucudu Midea ", "Dondurucu Midea ", "Paltaryuyan Midea ", "Paltarqurudan Midea ", "Qabyuyan Midea ", "Kombi Midea ", "Mikrodalga Midea ", "Caynik Midea ", "Soba Midea ", "Aspirator Midea ", "Plite Midea ", "Etceken Midea ", "Fritoz Midea ", "Tozsoran Midea ", "Midea ",
]

def slugify(text):
    text = text.lower().replace("ı", "i").replace("ə", "e").replace("ö", "o").replace("ü", "u").replace("ç", "c").replace("ş", "s").replace("ğ", "g")
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[-\s]+", "-", text).strip("-")

def sort_key(filename):
    m = re.search(r"\((\d+)\)", filename)
    num = int(m.group(1)) if m else 1
    return (num, filename)

def main():
    print("Master sync starting...")
    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    # Step 1: Collect all valid products from Media/BRENDS
    base = "Media/BRENDS"
    valid_products = []

    for brand in ["ARDO", "LOTUS", "ARTEL"]:
        b_dir = os.path.join(base, brand)
        if not os.path.exists(b_dir):
            continue
        for cat_folder in os.listdir(b_dir):
            if cat_folder == "_UNASSIGNED_MEDIA":
                continue
            cat_path = os.path.join(b_dir, cat_folder)
            if not os.path.isdir(cat_path):
                continue
            for model_folder in os.listdir(cat_path):
                model_path = os.path.join(cat_path, model_folder)
                if not os.path.isdir(model_path):
                    continue

                images = [f for f in os.listdir(model_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.gif'))]
                if not images:
                    continue

                brand_id = brand.lower()
                db_cat = resolve_db_category(cat_folder)
                sorted_images = sorted(images, key=sort_key)

                title = model_folder
                code = model_folder
                for prefix in PREFIX_STRIP:
                    if title.startswith(prefix):
                        code = title[len(prefix):].strip()
                        break

                product_id = f"{brand_id}-{slugify(code)}"

                valid_products.append({
                    "id": product_id,
                    "code": code,
                    "title": title,
                    "brand_id": brand_id,
                    "category_id": db_cat,
                    "images": sorted_images,
                    "folder_path": model_path,
                })

    print(f"Total valid products to sync across ARDO, LOTUS, ARTEL: {len(valid_products)}")

    # Step 2: Clean and copy public media assets
    for brand in ["ardo", "lotus", "artel"]:
        for d in [f"public/media/products/{brand}", f"site/public/media/products/{brand}"]:
            if os.path.exists(d):
                shutil.rmtree(d)
            os.makedirs(d, exist_ok=True)

    for p in valid_products:
        brand = p["brand_id"]
        pid = p["id"]
        media_records = []

        for idx, img in enumerate(p["images"], 1):
            src_path = os.path.join(p["folder_path"], img)
            ext = os.path.splitext(img)[1].lower()
            if ext == ".jpeg":
                ext = ".jpg"

            clean_filename = f"{pid}{ext}" if idx == 1 else f"{pid}_{idx:02d}{ext}"

            dst_public = f"public/media/products/{brand}/{clean_filename}"
            dst_site_public = f"site/public/media/products/{brand}/{clean_filename}"
            dst_data_media = f"data/media/{clean_filename}"
            dst_site_data_media = f"site/data/media/{clean_filename}"

            for dst in [dst_public, dst_site_public, dst_data_media, dst_site_data_media]:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src_path, dst)

            media_url = f"/media/products/{brand}/{clean_filename}"
            if idx == 1:
                p["primary_image"] = media_url

            media_records.append({
                "id": f"media-{pid}-{idx}",
                "product_id": pid,
                "media_type": "image",
                "url": media_url,
                "alt_text": f"{p['title']} - {idx}",
                "poster": "",
                "sort_order": idx - 1,
                "object_position": "center",
                "fit_mode": "contain",
                "original_name": img,
            })
        p["media_records"] = media_records

    print("Copied all public media assets successfully.")

    # Step 3: Update databases and set Artel, Lotus, Ardo active (coming_soon = 0)
    target_dbs = [
        "data/catalog.sqlite",
        "data/catalog-draft.sqlite",
        "site/data/catalog.sqlite",
        "site/data/catalog-draft.sqlite",
    ]

    managed_brands = ("ardo", "lotus", "artel")

    for db_path in target_dbs:
        if not os.path.exists(db_path):
            continue
        con = sqlite3.connect(db_path)
        cur = con.cursor()

        # Update brand status
        cur.execute("UPDATE brands SET active = 1, coming_soon = 0 WHERE id IN ('ardo', 'lotus', 'artel')")

        # Check existing columns in products and product_media
        cur.execute("PRAGMA table_info(products)")
        prod_cols = [r[1] for r in cur.fetchall()]
        has_crop = "crop_rect" in prod_cols
        has_orig_img = "original_image" in prod_cols

        cur.execute("PRAGMA table_info(product_media)")
        media_cols = [r[1] for r in cur.fetchall()]
        has_media_crop = "crop_rect" in media_cols
        has_orig_url = "original_url" in media_cols

        # Delete existing products for managed brands to sync cleanly
        cur.execute(f"DELETE FROM product_media WHERE product_id IN (SELECT id FROM products WHERE brand_id IN {managed_brands})")
        cur.execute(f"DELETE FROM product_specs WHERE product_id IN (SELECT id FROM products WHERE brand_id IN {managed_brands})")
        cur.execute(f"DELETE FROM product_highlights WHERE product_id IN (SELECT id FROM products WHERE brand_id IN {managed_brands})")
        cur.execute(f"DELETE FROM products WHERE brand_id IN {managed_brands}")

        for p in valid_products:
            if has_crop and has_orig_img:
                cur.execute("""
                    INSERT INTO products (
                        id, code, title, brand_id, category_id, primary_image,
                        is_featured, is_new, badge_text, short_description,
                        manufacturing_country, status, created_at, updated_at,
                        badge_color, price, old_price, currency, stock_status,
                        image_position, image_fit, crop_rect, original_image
                    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, '', '', '', 'published', ?, ?, 'red', NULL, NULL, '₼', 'in_stock', 'center', 'contain', '', ?)
                """, (
                    p["id"], p["code"], p["title"], p["brand_id"], p["category_id"],
                    p["primary_image"], now_str, now_str, p["primary_image"]
                ))
            else:
                cur.execute("""
                    INSERT INTO products (
                        id, code, title, brand_id, category_id, primary_image,
                        is_featured, is_new, badge_text, short_description,
                        manufacturing_country, status, created_at, updated_at,
                        badge_color, price, old_price, currency, stock_status,
                        image_position, image_fit
                    ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, '', '', '', 'published', ?, ?, 'red', NULL, NULL, '₼', 'in_stock', 'center', 'contain')
                """, (
                    p["id"], p["code"], p["title"], p["brand_id"], p["category_id"],
                    p["primary_image"], now_str, now_str,
                ))

            for m in p["media_records"]:
                if has_media_crop and has_orig_url:
                    cur.execute("""
                        INSERT INTO product_media (
                            id, product_id, media_type, url, alt_text, poster,
                            sort_order, object_position, fit_mode, original_name,
                            crop_rect, original_url
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?)
                    """, (
                        m["id"], m["product_id"], m["media_type"], m["url"],
                        m["alt_text"], m["poster"], m["sort_order"],
                        m["object_position"], m["fit_mode"], m["original_name"],
                        m["url"]
                    ))
                else:
                    cur.execute("""
                        INSERT INTO product_media (
                            id, product_id, media_type, url, alt_text, poster,
                            sort_order, object_position, fit_mode, original_name
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        m["id"], m["product_id"], m["media_type"], m["url"],
                        m["alt_text"], m["poster"], m["sort_order"],
                        m["object_position"], m["fit_mode"], m["original_name"],
                    ))

            specs = SPECS_TEMPLATE.get(p["category_id"], SPECS_TEMPLATE["cooktop"])
            for idx, (spec_name, spec_val) in enumerate(specs):
                cur.execute("""
                    INSERT INTO product_specs (
                        id, product_id, name, value, description, icon, spec_group, sort_order
                    ) VALUES (?, ?, ?, ?, '', '', 'Əsas', ?)
                """, (
                    f"spec-{p['id']}-{idx}", p["id"], spec_name, spec_val, idx,
                ))

        con.commit()
        con.close()
        print(f"Updated {db_path} successfully!")

    print("Master sync completed!")

if __name__ == '__main__':
    main()
