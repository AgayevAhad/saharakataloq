#!/usr/bin/env python3
import os
import sys
import sqlite3
import shutil
import re
import datetime

CATEGORY_MAP = {
    # ARDO
    "ARDO_BISIRME_PANELI": "cooktop",
    "ARDO_HAVACEKEN": "hood",
    "ARDO_KONDISONER": "air_conditioner",
    "ARDO_MIKRODALGALI_SOBA": "microwave",
    "ARDO_SOBALAR": "oven",
    "ARDO_SOYUDUCULAR": "refrigerator",
    "ARDO_AKSESUAR": "cooktop",
    # LOTUS
    "LOTUS_ARFIYER": "airfryer",
    "LOTUS_BISIRME_PANELI": "cooktop",
    "LOTUS_ETCEKEN": "meat_grinder",
    "LOTUS_HAVACEKEN": "hood",
    "LOTUS_KONDISONER": "air_conditioner",
    "LOTUS_SOBALAR": "oven",
    "LOTUS_TELEVIZOR": "tv",
    "LOTUS_TERMOPOT": "thermopot",
    "LOTUS_TOZSORAN": "vacuum_cleaner",
    "LOTUS_UTU": "iron",
    "LOTUS_PALTARYUYAN": "washer",
    "LOTUS_MIKRODALGALI_SOBA": "microwave",
    "LOTUS_SOYUDUCULAR": "refrigerator",
    # ARTEL
    "ARTEL_KONDISONER": "air_conditioner",
    "ARTEL_TELEVIZOR": "tv",
    "ARTEL_TOZSORAN": "vacuum_cleaner",
    "ARTEL_SOBALAR": "oven",
    "ARTEL_SOYUDUCULAR": "refrigerator",
    "ARTEL_HAVACEKEN": "hood",
    "ARTEL_BISIRME_PANELI": "cooktop",
    "ARTEL_PALTARYUYAN": "washer",
    "ARTEL_AKSESUAR": "cooktop",
    # MIDEA
    "MIDEA_ARFIYER": "airfryer",
    "MIDEA_BISIRME_PANELI": "cooktop",
    "MIDEA_CAYNIK": "thermopot",
    "MIDEA_ETCEKEN": "meat_grinder",
    "MIDEA_HAVACEKEN": "hood",
    "MIDEA_KOMBI": "cooktop",
    "MIDEA_KONDISONER": "air_conditioner",
    "MIDEA_MIKRODALGALI_SOBA": "microwave",
    "MIDEA_PALTARQURUDAN": "dryer",
    "MIDEA_PALTARYUYAN": "washer",
    "MIDEA_QABYUYAN": "dishwasher",
    "MIDEA_SOBALAR": "oven",
    "MIDEA_SOYUDUCULAR": "refrigerator",
    "MIDEA_TOZSORAN": "vacuum_cleaner",
    "MIDEA_AKSESUAR": "cooktop",
    # ALVEUS
    "ALVEUS_SOBALAR": "oven",
}

SPECS_TEMPLATE = {
    "cooktop": [
        ("Növ", "Qaz / Elektrik"),
        ("Ocaq sayı", "4"),
        ("Səthin örtüyü", "Şüşə / Emal"),
        ("Qəfəslərin materialı", "Çuqun"),
        ("Qaz-kontrol", "Var"),
        ("Elektrik alışdırma", "Avtomatik"),
        ("İdarəetmə növü", "Mexaniki"),
        ("Rəng", "Qara / İnox"),
    ],
    "hood": [
        ("Növ", "Quraşdırılan / Əyri"),
        ("İş rejimi", "Çıxarış və Resirkulyasiya"),
        ("Məhsuldarlıq", "650 m³/saat"),
        ("İdarəetmə növü", "Sensor / Mexaniki"),
        ("Sürət sayı", "3"),
        ("Səs səviyyəsi", "56 dB"),
        ("Rəng", "Qara / İnox"),
    ],
    "air_conditioner": [
        ("Növ", "Split sistem"),
        ("Əsas rejimlər", "Soyutma / İsitmə"),
        ("İnverter", "Var"),
        ("Enerjiistifadə sinfi", "A++"),
        ("Soyutma qabiliyyəti", "12000 BTU"),
        ("Freon", "R410A / R32"),
        ("Rəng", "Ağ"),
    ],
    "microwave": [
        ("Növ", "Quraşdırılan"),
        ("Həcm", "20 L"),
        ("Mikrodalğaların gücü", "800 Vt"),
        ("Qril", "Var"),
        ("İdarəetmə növü", "Elektron"),
        ("Rəng", "Qara"),
    ],
    "oven": [
        ("Növ", "Quraşdırılan elektrik soba"),
        ("Həcm", "65 L"),
        ("Enerjiistifadə sinfi", "A"),
        ("Qril", "Var"),
        ("Konveksiya", "Var"),
        ("Proqram sayı", "8"),
        ("Rəng", "Qara / İnox"),
    ],
    "refrigerator": [
        ("Növ", "İki kameralı NoFrost"),
        ("Ümumi həcm", "320 L"),
        ("Əritmə sistemi", "NoFrost"),
        ("Kompressor tipi", "İnverter"),
        ("Enerjiistifadə sinfi", "A+"),
        ("Səs səviyyəsi", "39 dB"),
        ("Rəng", "İnox / Qara"),
    ],
    "tv": [
        ("Ekran ölçüsü", "43 düym"),
        ("Görüntü imkanı", "Full HD / 4K UHD"),
        ("Smart TV", "Android TV / Google TV"),
        ("Səs gücü", "20 Vt"),
        ("Dəstəklənən interfeyslər", "HDMI, USB, Wi-Fi, Bluetooth"),
        ("Rəng", "Qara"),
    ],
    "vacuum_cleaner": [
        ("Növ", "Torbalı / Konteyner"),
        ("Güc", "2200 Vt"),
        ("Sorma gücü", "450 Vt"),
        ("Toz toplayıcı həcmi", "3 L"),
        ("Filtr növü", "HEPA"),
        ("Rəng", "Mavi / Qara"),
    ],
    "iron": [
        ("Növ", "Buxarlı ütü"),
        ("Güc", "2400 Vt"),
        ("Davamlı buxar", "45 q/dəq"),
        ("Buxar zərbəsi", "180 q"),
        ("Altlıq materialı", "Keramika"),
        ("Rəng", "Qara / Bənövşəyi"),
    ],
    "meat_grinder": [
        ("Maksimal güc", "1800 Vt"),
        ("Məhsuldarlıq", "2 kq/dəq"),
        ("Revers funksiyası", "Var"),
        ("Korpus materialı", "Plastik / Metal"),
        ("Rəng", "Ağ / Qara"),
    ],
    "thermopot": [
        ("Həcm", "5 L"),
        ("Güc", "800 Vt"),
        ("Qızdırıcı element", "Gizli spiral"),
        ("Temperatur saxlama", "Var"),
        ("Korpus materialı", "Paslanmaz polad"),
        ("Rəng", "Qara / Boz"),
    ],
    "airfryer": [
        ("Həcm", "5.5 L"),
        ("Güc", "1700 Vt"),
        ("İdarəetmə növü", "Sensor"),
        ("Proqram sayı", "8"),
        ("Avtomatik sönmə", "Var"),
        ("Rəng", "Qara"),
    ],
    "washer": [
        ("Maksimal yükləmə", "7 kq"),
        ("Sıxma sürəti", "1200 dövr/dəq"),
        ("Enerjiistifadə sinfi", "A+++"),
        ("Proqram sayı", "15"),
        ("İdarəetmə növü", "Elektron / Ekran"),
        ("Rəng", "Ağ / Boz"),
    ],
    "dishwasher": [
        ("Dəst tutumu", "12 dəst"),
        ("Enerjiistifadə sinfi", "A++"),
        ("Proqram sayı", "6"),
        ("Səs səviyyəsi", "47 dB"),
        ("Sızmadan qorunma", "AquaStop"),
        ("Rəng", "İnox / Ağ"),
    ],
    "dryer": [
        ("Maksimal yükləmə", "8 kq"),
        ("Qurutma növü", "İstilik nasosu (Heat Pump)"),
        ("Enerjiistifadə sinfi", "A++"),
        ("Proqram sayı", "14"),
        ("Rəng", "Ağ"),
    ],
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
    base = "Media/BRENDS"
    valid_products = []
    empty_folders = []
    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")

    for root, dirs, files in os.walk(base):
        rel = os.path.relpath(root, base)
        parts = rel.split(os.sep)
        if len(parts) == 3:
            brand_folder, cat_folder, model_folder = parts

            # Ignore raw / unassigned folders
            if model_folder.lower() in ("islenme", "işlənmə", "digər", "diger", "_unassigned_media"):
                continue
            if cat_folder.lower() == "_unassigned_media":
                continue

            images = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif"))]
            if not images:
                empty_folders.append((brand_folder, cat_folder, model_folder))
                continue

            brand_folder_upper = brand_folder.upper()
            if brand_folder_upper not in ("ARDO", "LOTUS", "ARTEL", "MIDEA", "ALVEUS"):
                continue

            brand_id = brand_folder_upper.lower()
            if brand_id == "alveus":
                brand_id = "lotus" # Alveus is mapped under lotus

            cat_id = CATEGORY_MAP.get(cat_folder, "cooktop")
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
                "category_id": cat_id,
                "images": sorted_images,
                "folder_path": root,
                "brand_folder": brand_folder,
                "cat_folder": cat_folder,
            })

    print(f"Total valid products with images: {len(valid_products)}")
    print(f"Empty/unimaged folders: {len(empty_folders)}")

    # Copy files
    for p in valid_products:
        brand = p["brand_id"]
        pid = p["id"]
        media_records = []

        for idx, img in enumerate(p["images"], 1):
            src_path = os.path.join(p["folder_path"], img)
            original_rel_path = os.path.relpath(src_path, base)
            
            dst_public = f"public/media/products/{original_rel_path}"
            dst_site_public = f"site/public/media/products/{original_rel_path}"
            dst_data_media = f"data/media/{original_rel_path}"
            dst_site_data_media = f"site/data/media/{original_rel_path}"

            for dst in [dst_public, dst_site_public, dst_data_media, dst_site_data_media]:
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src_path, dst)

            media_url = f"/media/products/{original_rel_path}"
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

    print("Copied images successfully.")

    # Target databases
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

        # Insert new valid products
        for p in valid_products:
            if p["brand_id"] not in managed_brands:
                continue

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

if __name__ == "__main__":
    main()
