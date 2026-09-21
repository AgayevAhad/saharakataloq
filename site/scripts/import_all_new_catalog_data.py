#!/usr/bin/env python3
"""Audit and safely merge the private Foto/output catalog into Sahara SQLite.

Audit-only by default. Use ``--apply`` to write. Existing products are never
blindly replaced; exact duplicate source rows are collapsed by brand + title.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import sqlite3
import subprocess
import sys
import unicodedata
from collections import defaultdict
from datetime import datetime
from pathlib import Path

SITE_DIR = Path(__file__).resolve().parents[1]
ROOT_DIR = SITE_DIR.parent
FOTO_DIR = ROOT_DIR / "Foto"
OUTPUT_DIR = FOTO_DIR / "output"
DB_PATHS = [SITE_DIR / "data/catalog.sqlite", SITE_DIR / "data/catalog-draft.sqlite"]
MEDIA_ROOT = SITE_DIR / "public/media/products"

CATEGORY_MAP = {
    "soyuducu": "refrigerator",
    "paltaryuyan maşın": "washer",
    "paltaryuyan + qurudan maşın": "washer",
    "paltaryuyan və qurudan maşın": "washer",
    "quruducu maşın": "dryer",
    "qabyuyan maşın": "dishwasher",
    "aspirator": "hood",
    "quraşdırılan soba": "oven",
    "bişirmə paneli": "cooktop",
    "induksiyalı bişirmə paneli": "cooktop",
    "mikrodalğalı soba": "microwave",
    "quraşdırılan mikrodalğalı soba": "microwave",
    "televizor": "tv",
    "soundbar": "audio",
    "saundbar": "audio",
    "kondisioner": "air_conditioner",
    "fritöz & airfryer": "airfryer",
    "airfryer": "airfryer",
    "tozsoran": "vacuum_cleaner",
    "ütü": "iron",
    "ətçəkən": "meat_grinder",
    "termopot": "thermopot",
}

GENERIC_MODELS = {
    "series", "plus", "fresh", "cube", "mini", "smart", "hqled", "unavailable", ""
}
INVALID_TITLES = {"503 service unavailable", "service unavailable", "not found"}

RAW_FOLDER_MAP = {
    "ardo havaçəkən": ("ardo", "hood"),
    "ardo kondisoner": ("ardo", "air_conditioner"),
    "ardo piltə": ("ardo", "cooktop"),
    "ardo mikrodalğalı soba": ("ardo", "microwave"),
    "lotus airfryer": ("lotus", "airfryer"),
    "lotus ətçəkən": ("lotus", "meat_grinder"),
    "Lotus kondisoner": ("lotus", "air_conditioner"),
    "lotus piltə": ("lotus", "cooktop"),
    "lotus sobalar": ("lotus", "oven"),
    "lotus televizor": ("lotus", "tv"),
    "lotus termopot": ("lotus", "thermopot"),
    "lotus tozsoran": ("lotus", "vacuum_cleaner"),
    "ütü lotus": ("lotus", "iron"),
    "artel kondisoner": ("artel", "air_conditioner"),
    "artel televizor": ("artel", "tv"),
    "artel tozsoran": ("artel", "vacuum_cleaner"),
}
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".avif"}


def normalized(value: object) -> str:
    return " ".join(str(value or "").strip().casefold().split())


def slugify(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    clean = re.sub(r"[^A-Za-z0-9\s.-]", "", ascii_value)
    return re.sub(r"[-\s]+", "-", clean).strip("-").lower()


def normalized_code(value: str) -> str:
    return "".join(char for char in value.casefold() if char.isalnum())


def raw_media_model(path: Path) -> str:
    value = re.sub(r"\s*\(\d+\)$", "", path.stem).strip()
    value = re.sub(r"\s+(hissə|ümumi|on|arxa)$", "", value, flags=re.IGNORECASE).strip()
    return value


def file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def brand_id_for(name: str) -> str:
    compact = slugify(name).replace("-", "")
    return {"mitsubishielectric": "mitsubishi-electric", "mitsubishiheavy": "mitsubishi-heavy"}.get(
        compact, compact
    )


def title_model(title: str, brand_name: str) -> str | None:
    """Extract a model only when the visible title contains an exact identifier."""
    after_brand = re.split(re.escape(brand_name), title, maxsplit=1, flags=re.IGNORECASE)
    searchable = after_brand[-1] if len(after_brand) > 1 else title
    searchable = searchable.split(",", 1)[0].strip(" ()-")
    tokens = re.findall(r"[A-Za-z0-9][A-Za-z0-9./-]*", searchable)
    if tokens and tokens[0].isdigit():
        return "-".join(tokens)
    coded = [token for token in tokens if any(c.isdigit() for c in token) and any(c.isalpha() for c in token)]
    if coded:
        return coded[0].strip(".,()")
    if tokens and any(c.isdigit() for c in "".join(tokens)):
        return "-".join(tokens)
    return None


def resolve_model(item: dict, brand_name: str) -> str | None:
    raw_model = str(item.get("model") or "").strip()
    if normalized(raw_model) not in GENERIC_MODELS:
        return raw_model
    return title_model(str(item.get("name") or ""), brand_name)


def parse_price(value: object) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(str(value).replace("AZN", "").replace("₼", "").replace(" ", "").replace(",", "."))
    except ValueError:
        return None


def catalog_prices(item: dict) -> tuple[float | None, float | None]:
    """Read the product's own price block, avoiding model/price concatenation."""
    title = str(item.get("name") or "").strip()
    text = str(item.get("catalog_text") or "")
    title_at = normalized(text).find(normalized(title))
    if title_at < 0:
        return parse_price(item.get("sale_price")), None
    # Normalization keeps the character count for the source data's spacing in
    # practice, but use the original exact title when possible for a safer cut.
    exact_at = text.casefold().find(title.casefold())
    tail = text[exact_at + len(title):] if exact_at >= 0 else text
    tail = tail.split("Səbətə əlavə et", 1)[0]
    matches = list(re.finditer(r"(?<!\d)(\d{1,7}(?:[.,]\d{1,2})?)\s*₼", tail))
    if not matches:
        return parse_price(item.get("sale_price")), None
    first = parse_price(matches[0].group(1))
    if len(matches) == 1:
        return first, None
    between = tail[matches[0].end():matches[1].start()]
    if re.search(r"\bay\b", between, flags=re.IGNORECASE):
        return first, None
    second = parse_price(matches[1].group(1))
    return second, first


def load_source():
    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    unassigned: list[str] = []
    source_rows = 0

    for json_path in sorted(OUTPUT_DIR.glob("*/*_ALL.json")):
        brand_name = json_path.parent.name
        brand_id = brand_id_for(brand_name)
        with json_path.open(encoding="utf-8") as stream:
            items = json.load(stream)
        for item in items:
            source_rows += 1
            title = str(item.get("name") or "").strip()
            category = CATEGORY_MAP.get(normalized(item.get("product_type")))
            model = resolve_model(item, brand_name)
            if normalized(title) in INVALID_TITLES or not title:
                unassigned.append(f"{json_path.relative_to(FOTO_DIR)} :: {title or '<boş ad>'}")
                continue
            if not category:
                unassigned.append(f"{json_path.relative_to(FOTO_DIR)} :: {title} [naməlum kateqoriya]")
                continue
            if not model:
                unassigned.append(f"{json_path.relative_to(FOTO_DIR)} :: {title} [dəqiq model yoxdur]")
                continue
            prepared = dict(item)
            prepared.update(_brand_name=brand_name, _brand_id=brand_id, _title=title, _category=category, _model=model)
            groups[(brand_id, normalized(title))].append(prepared)

    products: list[dict] = []
    price_conflicts: list[str] = []
    code_owners: dict[tuple[str, str], str] = {}
    for (brand_id, _), duplicates in groups.items():
        first = duplicates[0]
        price_pairs = {catalog_prices(row) for row in duplicates}
        valid_pairs = sorted(pair for pair in price_pairs if pair[0] is not None)
        if len(valid_pairs) > 1:
            formatted = ", ".join(f"{price} (köhnə: {old})" for price, old in valid_pairs)
            price_conflicts.append(f"{first['_brand_name']} / {first['_title']}: {formatted}")

        model = first["_model"]
        owner_key = (brand_id, normalized(model))
        if owner_key in code_owners and code_owners[owner_key] != normalized(first["_title"]):
            fallback = title_model(first["_title"], first["_brand_name"])
            if not fallback or normalized(fallback) == normalized(model):
                unassigned.append(f"output/{first['_brand_name']} :: {first['_title']} [model toqquşması: {model}]")
                continue
            model = fallback
            owner_key = (brand_id, normalized(model))
        code_owners[owner_key] = normalized(first["_title"])

        media: list[Path] = []
        specs: dict[str, str] = {}
        for row in duplicates:
            for relative in row.get("downloaded_media") or []:
                source = FOTO_DIR / Path(relative)
                if source.is_file() and source not in media:
                    media.append(source)
            for key, value in (row.get("specifications") or {}).items():
                if str(key).strip() and str(value).strip():
                    specs.setdefault(str(key).strip(), str(value).strip())
        if not media:
            excel_image = str(first.get("excel_main_image") or "")
            source = FOTO_DIR / Path(excel_image) if excel_image else None
            if source and source.is_file():
                media.append(source)

        products.append({
            "brand_id": brand_id,
            "brand_name": first["_brand_name"],
            "title": first["_title"],
            "code": model,
            "category_id": first["_category"],
            "price": valid_pairs[0][0] if len(valid_pairs) == 1 else None,
            "old_price": valid_pairs[0][1] if len(valid_pairs) == 1 else None,
            "description": str(first.get("catalog_text") or "").strip(),
            "specs": specs,
            "media": media,
        })

    return products, unassigned, price_conflicts, source_rows


def custom_score(row: sqlite3.Row) -> int:
    score = 10 if row["updated_at"] != row["created_at"] else 0
    score += 3 if row["is_featured"] else 0
    score += 2 if row["image_position"] not in ("center", "center center") else 0
    score += 2 if row["image_fit"] != "contain" else 0
    return score


def merge_children(cur: sqlite3.Cursor, keep_id: str, remove_id: str):
    specs = cur.execute(
        "SELECT name,value,description,icon,spec_group,sort_order FROM product_specs WHERE product_id=?",
        (remove_id,),
    ).fetchall()
    for spec in specs:
        exists = cur.execute(
            "SELECT 1 FROM product_specs WHERE product_id=? AND name=? AND value=?", (keep_id, spec[0], spec[1])
        ).fetchone()
        if not exists:
            order = cur.execute("SELECT COALESCE(MAX(sort_order),0)+1 FROM product_specs WHERE product_id=?", (keep_id,)).fetchone()[0]
            cur.execute(
                "INSERT INTO product_specs VALUES (?,?,?,?,?,?,?,?)",
                (f"spec-{order}", keep_id, spec[0], spec[1], spec[2], spec[3], spec[4], order),
            )

    # Exact-title source duplicates point at copies of the same gallery. Keep the
    # canonical gallery intact; only rescue media when that gallery is empty.
    if cur.execute("SELECT 1 FROM product_media WHERE product_id=? LIMIT 1", (keep_id,)).fetchone():
        return
    media = cur.execute(
        "SELECT media_type,url,alt_text,poster,sort_order,object_position,fit_mode,original_name FROM product_media WHERE product_id=?",
        (remove_id,),
    ).fetchall()
    for item in media:
        exists = cur.execute("SELECT 1 FROM product_media WHERE product_id=? AND url=?", (keep_id, item[1])).fetchone()
        if not exists:
            count = cur.execute("SELECT COUNT(*)+1 FROM product_media WHERE product_id=?", (keep_id,)).fetchone()[0]
            cur.execute("INSERT INTO product_media VALUES (?,?,?,?,?,?,?,?,?,?)", (f"media-{keep_id}-{count}", keep_id, *item))


def copy_media(product: dict, product_id: str) -> list[tuple[str, str]]:
    copied = []
    target_dir = MEDIA_ROOT / product["brand_id"]
    target_dir.mkdir(parents=True, exist_ok=True)
    for index, source in enumerate(product["media"], 1):
        filename = f"{product_id}_{index:02d}{source.suffix.lower()}"
        target = target_dir / filename
        if not target.exists() or target.stat().st_size != source.stat().st_size:
            shutil.copy2(source, target)
        copied.append((f"/media/products/{product['brand_id']}/{filename}", source.name))
    return copied


def create_consistent_backup(source_path: Path, target_path: Path):
    """Capture main DB plus any committed WAL pages as one recoverable SQLite file."""
    source = sqlite3.connect(f"file:{source_path}?mode=ro", uri=True)
    target = sqlite3.connect(target_path)
    try:
        source.backup(target)
    finally:
        target.close()
        source.close()


def sync_raw_media(cur: sqlite3.Cursor, apply: bool) -> tuple[dict, list[str]]:
    """Attach only filename-to-code exact matches from Foto/, never fuzzy matches."""
    product_index: dict[tuple[str, str, str], list[sqlite3.Row]] = defaultdict(list)
    for row in cur.execute("SELECT id,brand_id,category_id,code,title,primary_image FROM products"):
        product_index[(row["brand_id"], row["category_id"], normalized_code(row["code"]))].append(row)

    existing_urls = {row[0] for row in cur.execute("SELECT url FROM product_media")}
    referenced_hashes = set()
    for url in existing_urls:
        media_path = SITE_DIR / "public" / str(url).lstrip("/")
        if media_path.is_file():
            referenced_hashes.add(file_hash(media_path))

    stats = {"already_assigned": 0, "attached": 0, "unassigned": 0}
    unassigned = []
    for source in sorted(FOTO_DIR.rglob("*")):
        if not source.is_file() or OUTPUT_DIR in source.parents or source.suffix.lower() not in IMAGE_SUFFIXES:
            continue
        relative = source.relative_to(FOTO_DIR)
        folder = relative.parts[0]
        mapping = RAW_FOLDER_MAP.get(folder)
        source_hash = file_hash(source)
        if source_hash in referenced_hashes:
            stats["already_assigned"] += 1
            continue
        if not mapping:
            unassigned.append(str(relative))
            continue

        brand_id, category_id = mapping
        model = raw_media_model(source)
        candidates = product_index.get((brand_id, category_id, normalized_code(model)), [])
        if len(candidates) != 1:
            unassigned.append(str(relative))
            continue

        product = candidates[0]
        media_slug = slugify(model) or "image"
        filename = f"{product['id']}_raw_{media_slug}_{source_hash[:10]}.webp"
        url = f"/media/products/{brand_id}/{filename}"
        if url in existing_urls:
            stats["already_assigned"] += 1
            continue

        if apply:
            target = MEDIA_ROOT / brand_id / filename
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                subprocess.run(
                    [
                        "magick", str(source), "-auto-orient", "-resize", "1800x1800>",
                        "-strip", "-quality", "86", str(target),
                    ],
                    check=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.PIPE,
                )
            order = cur.execute(
                "SELECT COALESCE(MAX(sort_order),0)+1 FROM product_media WHERE product_id=?",
                (product["id"],),
            ).fetchone()[0]
            media_id = f"media-{product['id']}-raw-{source_hash[:12]}"
            cur.execute(
                "INSERT INTO product_media VALUES (?,?,?,?,?,'',?,'center center','contain',?)",
                (media_id, product["id"], "image", url, product["title"], order, source.name),
            )
            if not product["primary_image"]:
                cur.execute("UPDATE products SET primary_image=? WHERE id=?", (url, product["id"]))
        existing_urls.add(url)
        stats["attached"] += 1

    stats["unassigned"] = len(unassigned)
    return stats, unassigned


def sync_database(db_path: Path, products: list[dict], apply: bool) -> tuple[dict, list[str]]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    cur = conn.cursor()
    stats = {"inserted": 0, "deduplicated": 0, "invalid_removed": 0, "preserved": 0}
    known_brands = {row[0] for row in cur.execute("SELECT id FROM brands")}
    known_categories = {row[0] for row in cur.execute("SELECT id FROM categories")}

    for row in cur.execute("SELECT * FROM products WHERE lower(title) IN ('503 service unavailable','service unavailable')").fetchall():
        if row["updated_at"] == row["created_at"]:
            if apply:
                cur.execute("DELETE FROM products WHERE id=?", (row["id"],))
            stats["invalid_removed"] += 1

    for product in products:
        if product["brand_id"] not in known_brands or product["category_id"] not in known_categories:
            continue
        rows = cur.execute(
            "SELECT * FROM products WHERE brand_id=? AND lower(trim(title))=lower(trim(?))",
            (product["brand_id"], product["title"]),
        ).fetchall()
        if rows:
            keep = max(rows, key=lambda row: (custom_score(row), -len(row["id"])))
            stats["preserved"] += 1
            for duplicate in rows:
                if duplicate["id"] == keep["id"] or duplicate["updated_at"] != duplicate["created_at"]:
                    continue
                if apply:
                    merge_children(cur, keep["id"], duplicate["id"])
                    cur.execute("DELETE FROM products WHERE id=?", (duplicate["id"],))
                stats["deduplicated"] += 1
            conflict = cur.execute("SELECT id FROM products WHERE lower(code)=lower(?) AND id<>?", (product["code"], keep["id"])).fetchone()
            if apply and keep["updated_at"] == keep["created_at"]:
                if not conflict:
                    cur.execute("UPDATE products SET code=?,category_id=? WHERE id=?", (product["code"], product["category_id"], keep["id"]))
                if product["price"] is not None:
                    cur.execute(
                        "UPDATE products SET price=?,old_price=? WHERE id=?",
                        (product["price"], product["old_price"], keep["id"]),
                    )
            continue

        product_id = slugify(f"{product['brand_id']}-{product['code']}")
        exists = cur.execute("SELECT 1 FROM products WHERE id=? OR lower(code)=lower(?)", (product_id, product["code"])).fetchone()
        if not product_id or exists:
            continue
        if apply:
            media = copy_media(product, product_id)
            now = datetime.now().isoformat()
            cur.execute(
                """INSERT INTO products
                (id,code,title,brand_id,category_id,primary_image,is_featured,is_new,badge_text,
                 short_description,manufacturing_country,status,created_at,updated_at,badge_color,
                 price,old_price,currency,stock_status,image_position,image_fit)
                VALUES (?,?,?,?,?,?,0,1,'Yeni',?,'','published',?,?,'#3b82f6',?,?,'₼','in_stock','center center','contain')""",
                (product_id, product["code"], product["title"], product["brand_id"], product["category_id"],
                 media[0][0] if media else "", product["description"], now, now, product["price"], product["old_price"]),
            )
            for order, (name, value) in enumerate(product["specs"].items(), 1):
                cur.execute("INSERT INTO product_specs VALUES (?,?,?,?,?,'Check','Əsas',?)", (f"spec-{order}", product_id, name, value, "", order))
            for order, (url, original_name) in enumerate(media, 1):
                cur.execute(
                    "INSERT INTO product_media VALUES (?,?,?,?,?,'',?,'center center','contain',?)",
                    (f"media-{product_id}-{order}", product_id, "image", url, product["title"], order, original_name),
                )
        stats["inserted"] += 1

    raw_stats, raw_unassigned = sync_raw_media(cur, apply)
    stats["raw_media"] = raw_stats

    if apply:
        conn.commit()
    else:
        conn.rollback()
    conn.close()
    return stats, raw_unassigned


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write the audited merge to both databases")
    parser.add_argument("--database", action="append", help="limit audit/apply to an explicit SQLite path")
    args = parser.parse_args()
    products, unassigned, price_conflicts, source_rows = load_source()
    print(f"Source rows: {source_rows}")
    print(f"Unique valid products: {len(products)}")
    print(f"Ambiguous prices preserved/not auto-filled: {len(price_conflicts)}")
    print(f"Unassigned source records: {len(set(unassigned))}")

    if args.apply:
        backup_dir = Path("/tmp") / f"sahara-catalog-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        backup_dir.mkdir(parents=True)
        selected_databases = [Path(path).resolve() for path in args.database] if args.database else DB_PATHS
        for db_path in selected_databases:
            create_consistent_backup(db_path, backup_dir / db_path.name)
        print(f"Backups: {backup_dir}")

    selected_databases = [Path(path).resolve() for path in args.database] if args.database else DB_PATHS
    raw_unassigned: list[str] = []
    for db_path in selected_databases:
        stats, db_raw_unassigned = sync_database(db_path, products, args.apply)
        raw_unassigned = db_raw_unassigned
        print(f"{db_path.name}: {stats}")
    if price_conflicts:
        print("\nPRICE CONFLICTS (existing values preserved):")
        for entry in price_conflicts:
            print(f"  - {entry}")
    if unassigned:
        print("\nUNASSIGNED (no exact model/source match):")
        for entry in sorted(set(unassigned)):
            print(f"  - {entry}")
    if raw_unassigned:
        print("\nUNASSIGNED RAW MEDIA (filename does not exactly match one product code/category):")
        for entry in raw_unassigned:
            print(f"  - {entry}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
