import os
import sys
import sqlite3
import shutil
import re
import datetime

CATEGORY_MAP = {
    "ARDO_BISIRME_PANELI": "cooktop",
    "ARDO_HAVACEKEN": "hood",
    "ARDO_KONDISONER": "air_conditioner",
    "ARDO_MIKRODALGALI_SOBA": "microwave",
    "ARDO_SOBALAR": "oven",
    "ARDO_SOYUDUCULAR": "refrigerator",
    "ARDO_AKSESUAR": "cooktop",
    "LOTUS_HAVACEKEN": "hood",
    "LOTUS_SOBALAR": "oven",
    "LOTUS_KONDISONER": "air_conditioner",
    "ALVEUS_SOBALAR": "oven",
}

SPECS_TEMPLATE = {
    "cooktop": [
        ("Növ", ""),
        ("Ocaq sayı", ""),
        ("Ölçülər (H × E × D)", ""),
        ("Quraşdırılma ölçüləri (E × D)", ""),
        ("WOK ocaq gözü", ""),
        ("Qaz-kontrol", ""),
        ("Elektrik alışdırma", ""),
        ("Səthin örtüyü", ""),
        ("Qəfəslərin materialı", ""),
        ("İdarəetmə növü", ""),
        ("İdarəetmə panelinin yerləşməsi", ""),
        ("Rəng", ""),
    ],
    "hood": [
        ("Növ", ""),
        ("İş rejmi", ""),
        ("Məhsuldarlıq", ""),
        ("İdarəetmə növü", ""),
        ("Sürət sayı", ""),
        ("Korpusun materialı", ""),
        ("En", ""),
        ("Hava kanalının diametri", ""),
        ("Səs səviyyəsi", ""),
        ("Ölçülər (H × E × D)", ""),
        ("Rəng", ""),
    ],
    "air_conditioner": [
        ("Növ", ""),
        ("Tövsiyə olunan otaq sahəsi", ""),
        ("Əsas rejimlər", ""),
        ("İnverter", ""),
        ("Enerjiistifadə sinfi", ""),
        ("Soyutma qabiliyyəti", ""),
        ("İsitmə qabiliyyəti", ""),
        ("Səs səviyyəsi", ""),
        ("Freon", ""),
        ("Rəng", ""),
    ],
    "microwave": [
        ("Növ", ""),
        ("Həcm", ""),
        ("Mikrodalğaların gücü", ""),
        ("Qril", ""),
        ("İdarəetmə növü", ""),
        ("Ekran", ""),
        ("Qapının açılması düyməsi", ""),
        ("Daxili örtük", ""),
        ("Ölçülər (H × E × D)", ""),
        ("Rəng", ""),
    ],
    "oven": [
        ("Növ", ""),
        ("Həcm", ""),
        ("Enerjiistifadə sinfi", ""),
        ("Qril", ""),
        ("Konveksiya", ""),
        ("İdarəetmə növü", ""),
        ("Proqram sayı", ""),
        ("Qapının şüşə sayı", ""),
        ("Ölçülər (H × E × D)", ""),
        ("Quraşdırılma ölçüləri (H × E × D)", ""),
        ("Rəng", ""),
    ],
    "refrigerator": [
        ("Növ", ""),
        ("Ümumi həcm", ""),
        ("Soyuducu kameranın həcmi", ""),
        ("Dondurucu kameranın həcmi", ""),
        ("Əritmə sistemi", ""),
        ("Kompressor tipi", ""),
        ("Enerjiistifadə sinfi", ""),
        ("Səs səviyyəsi", ""),
        ("Ölçülər (H × E × D)", ""),
        ("Rəng", ""),
    ],
}

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

            # Ignore raw work folders like islenme
            if model_folder.lower() in ("islenme", "işlənmə", "digər", "diger"):
                continue

            images = [f for f in files if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif"))]
            if not images:
                empty_folders.append((brand_folder, cat_folder, model_folder))
                continue

            # Only process ARDO, LOTUS, and ALVEUS as requested
            if brand_folder.upper() not in ("ARDO", "LOTUS", "ALVEUS"):
                continue

            brand_id = "ardo" if brand_folder.upper() == "ARDO" else "lotus"
            cat_id = CATEGORY_MAP.get(cat_folder, "cooktop")
            sorted_images = sorted(images, key=sort_key)

            title = model_folder
            code = model_folder
            for prefix in ["Aspirator Ardo ", "Plite Ardo ", "Plitə Ardo ", "Piltə Ardo ", "PLite Ardo ", "Kondisioner Ardo ", "Mikrodalga Ardo ", "Soba Ardo ", "Soyuducu Ardo ", "Soba Alveus ", "Aspirator Lotus "]:
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

    print(f"Valid products found: {len(valid_products)}")
    print(f"Empty folders skipped: {len(empty_folders)}")

    # Copy files
    for p in valid_products:
        brand = p["brand_id"]
        pid = p["id"]
        media_records = []

        for idx, img in enumerate(p["images"], 1):
            src_path = os.path.join(p["folder_path"], img)
            ext = os.path.splitext(img)[1].lower()

            if idx == 1:
                clean_filename = f"{pid}{ext}"
            else:
                clean_filename = f"{pid}_{idx:02d}{ext}"

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

    print("Copied images successfully.")

    # Target databases
    target_dbs = [
        "data/catalog.sqlite",
        "data/catalog-draft.sqlite",
        "site/data/catalog.sqlite",
        "site/data/catalog-draft.sqlite",
    ]

    for db_path in target_dbs:
        if not os.path.exists(db_path):
            continue
        con = sqlite3.connect(db_path)
        cur = con.cursor()

        # Delete old ardo and lotus
        cur.execute("DELETE FROM product_media WHERE product_id IN (SELECT id FROM products WHERE brand_id IN ('ardo', 'lotus'))")
        cur.execute("DELETE FROM product_specs WHERE product_id IN (SELECT id FROM products WHERE brand_id IN ('ardo', 'lotus'))")
        cur.execute("DELETE FROM product_highlights WHERE product_id IN (SELECT id FROM products WHERE brand_id IN ('ardo', 'lotus'))")
        cur.execute("DELETE FROM products WHERE brand_id IN ('ardo', 'lotus')")

        # Insert new valid products
        for p in valid_products:
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
