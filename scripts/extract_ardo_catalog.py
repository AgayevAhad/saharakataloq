#!/usr/bin/env python3
"""Extracts only product names and feature headings. Prices and counterparties are never read."""
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from zipfile import ZipFile
from xml.etree import ElementTree as ET

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def first_sheet_rows(path, allowed_columns):
    with ZipFile(path) as archive:
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = ["".join(node.text or "" for node in item.iter(f"{{{MAIN}}}t")) for item in root]
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {item.attrib["Id"]: item.attrib["Target"].lstrip("/") for item in relationships}
        sheet = list(workbook.find(f"{{{MAIN}}}sheets"))[0]
        target = targets[sheet.attrib[f"{{{REL}}}id"]]
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        root = ET.fromstring(archive.read(target))
        result = []
        for row in root.findall(f".//{{{MAIN}}}sheetData/{{{MAIN}}}row"):
            values = {column: "" for column in allowed_columns}
            for cell in row.findall(f"{{{MAIN}}}c"):
                column = re.match(r"[A-Z]+", cell.attrib["r"]).group()
                if column not in values:
                    continue
                value_node = cell.find(f"{{{MAIN}}}v")
                if value_node is None:
                    continue
                values[column] = shared[int(value_node.text)] if cell.attrib.get("t") == "s" else (value_node.text or "")
            result.append(values)
        return result


def normalized(value):
    value = unicodedata.normalize("NFKC", value).casefold()
    return re.sub(r"[^a-z0-9əğıöşüç]+", "", value)


def model_code(name):
    match = re.search(r"ardo\s+(.+)$", name, re.I)
    return re.sub(r"\s+", " ", (match.group(1) if match else name).strip())


def model_key(name):
    return normalized(model_code(name))


def slug(value):
    replacements = str.maketrans("əğıöşüç", "egiosuc")
    value = unicodedata.normalize("NFKD", value.casefold().translate(replacements)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")[:65]


def category_for(name):
    value = name.casefold()
    if "aspirator" in value:
        return "hood"
    if "kondisioner" in value:
        return "air_conditioner"
    if "mikro" in value:
        return "microwave"
    if any(word in value for word in ("plite", "piltə", "plitə")):
        return "cooktop"
    if value.startswith("soba"):
        return "oven"
    if "soyuducu" in value:
        return "refrigerator"
    raise ValueError(f"Kateqoriyası müəyyən edilməyən ARDO məhsulu: {name}")


CATEGORY_INFO = {
    "hood": ("Aspiratorlar", "aspiratorlar", "Wind", "Aspirator"),
    "air_conditioner": ("Kondisionerlər", "kondisionerler", "Snowflake", "Kondisioner"),
    "microwave": ("Mikrodalğalı sobalar", "mikrodalgali-sobalar", "Box", "Mikrodalğalı soba"),
    "cooktop": ("Bişirmə panelləri", "bisirme-panelleri", "Flame", "Bişirmə paneli"),
    "oven": ("Sobalar", "sobalar", "Layers", "Soba"),
    "refrigerator": ("Soyuducular", "soyuducular", "Refrigerator", "Soyuducu"),
}


def feature_names(value):
    names = []
    for line in value.splitlines():
        line = line.strip()
        if not line:
            continue
        name = re.split(r"\s[-–:]\s?", line, maxsplit=1)[0].strip(" -–:")
        if name and name not in names:
            names.append(name)
    return names


def build_catalog(feature_path, inventory_path):
    feature_rows = first_sheet_rows(feature_path, {"C", "D"})[1:]
    # Only column A of the Mallar sheet is read; price/count and the counterparty sheet are ignored.
    inventory_rows = first_sheet_rows(inventory_path, {"A"})[1:]
    source_by_model = defaultdict(list)
    category_templates = defaultdict(Counter)
    for row in feature_rows:
        name = row["C"].strip()
        if "ardo" not in name.casefold():
            continue
        features = feature_names(row["D"])
        source_by_model[model_key(name)].append(features)
        category_templates[category_for(name)].update(features)

    names = []
    seen = set()
    for row in inventory_rows:
        name = re.sub(r"\s+", " ", row["A"].strip())
        if "ardo" not in name.casefold():
            continue
        key = model_key(name)
        if key in seen:
            continue
        seen.add(key)
        names.append(name)

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    products = []
    used_ids = set()
    for name in names:
        category = category_for(name)
        code = model_code(name)
        product_id = f"ardo-{slug(code)}"
        suffix = 2
        while product_id in used_ids:
            product_id = f"ardo-{slug(code)}-{suffix}"
            suffix += 1
        used_ids.add(product_id)
        matched = source_by_model.get(model_key(name), [])
        features = matched[0] if matched else [item for item, _ in category_templates[category].most_common()]
        category_name, _, _, _ = CATEGORY_INFO[category]
        products.append({
            "id": product_id,
            "code": code,
            "title": name,
            "brandId": "ardo",
            "category": category,
            "categoryName": category_name,
            "image": "",
            "gallery": [],
            "media": [],
            "shortDesc": "",
            "specs": [{"id": f"spec-{index + 1}", "name": feature, "value": "", "group": "Əsas"} for index, feature in enumerate(features)],
            "highlights": [],
            "manufacturingCountry": "",
            "status": "published",
            "createdAt": now,
            "updatedAt": now,
        })

    brands = [
        {"id": "ardo", "name": "ARDO", "slug": "ardo", "originCountry": "İtaliya", "manufacturingCountries": ["Türkiyə", "Çin"], "description": "İtalyan brendi. İstehsal ölkəsi hər məhsul modeli üzrə ayrıca qeyd olunur.", "logo": "/media/brands/ardo-logo.png", "active": True, "comingSoon": False},
        {"id": "lotus", "name": "LOTUS", "slug": "lotus", "originCountry": "", "manufacturingCountries": [], "description": "", "logo": "/media/brands/lotus-mark.svg", "active": True, "comingSoon": True},
        {"id": "artel", "name": "ARTEL", "slug": "artel", "originCountry": "", "manufacturingCountries": [], "description": "", "logo": "/media/brands/artel-logo.svg", "active": True, "comingSoon": True},
    ]
    categories = [{"id": key, "name": info[0], "slug": info[1], "icon": info[2], "active": True, "sortOrder": index} for index, (key, info) in enumerate(CATEGORY_INFO.items())]
    return {"brands": brands, "categories": categories, "products": products, "settings": {"whatsappNumber": "", "phoneNumber": ""}, "updatedAt": now}


def main():
    if len(sys.argv) != 3:
        raise SystemExit("İstifadə: extract_ardo_catalog.py xüsusiyyətlər.xlsx mallar.xlsx")
    print(json.dumps(build_catalog(sys.argv[1], sys.argv[2]), ensure_ascii=False))


if __name__ == "__main__":
    main()
