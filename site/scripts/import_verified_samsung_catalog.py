#!/usr/bin/env python3
"""Insert only unambiguous Samsung products from private Foto/output.

Dry run by default. Existing product rows and their customizations are never
updated. Use --apply only after inspecting the printed unassigned file list.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import subprocess
import tempfile
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

from import_all_new_catalog_data import CATEGORY_MAP, catalog_prices, normalized, normalized_code, slugify

SITE = Path(__file__).resolve().parents[1]
FOTO = SITE.parent / "Foto"
SOURCE = FOTO / "output/Samsung/Samsung_ALL.json"
DATABASES = (SITE / "data/catalog.sqlite", SITE / "data/catalog-draft.sqlite")
MEDIA = SITE / "public/media/products/samsung"
MODEL_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9./-]{3,}$")


def exact_model(title: str, model: str) -> bool:
    """Require a real alphanumeric model token explicitly present in the title."""
    return bool(
        MODEL_RE.fullmatch(model)
        and re.search(r"[A-Za-z]", model)
        and re.search(r"\d", model)
        and re.search(rf"(?<![\w]){re.escape(model)}(?![\w])", title, re.IGNORECASE)
    )


def exact_media_name(path: Path, model: str) -> bool:
    stem = re.sub(r"_\d{2,}$", "", path.stem)
    return normalized_code(stem) == normalized_code(model)


def source_link_agrees(row: dict, model: str) -> bool:
    """A descriptive source URL must not contradict the supplied model code."""
    slug = urlparse(str(row.get("source_url") or "")).path.rsplit("/", 1)[-1]
    if not slug or slug.isdigit():
        return True
    return normalized_code(model) in normalized_code(slug)


def clean_specs(rows: list[dict]) -> list[tuple[str, str]]:
    """Remove duplicate punctuation variants and malformed scrape headings."""
    selected: dict[str, tuple[str, str]] = {}
    for row in rows:
        for raw_name, raw_value in (row.get("specifications") or {}).items():
            name = str(raw_name).strip().rstrip(":： ")
            value = str(raw_value).strip()
            if not name or not value or name.startswith("Xüsusiyyətlər"):
                continue
            key = normalized(name).replace("ә", "ə")
            if key not in selected:
                selected[key] = (name, value)
    return list(selected.values())


def prepare() -> tuple[list[dict], list[str]]:
    source_rows = json.loads(SOURCE.read_text(encoding="utf-8"))
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in source_rows:
        grouped[str(row.get("name") or "").strip()].append(row)

    prepared: list[dict] = []
    unassigned: list[str] = []
    media_owners: dict[Path, str] = {}
    codes: set[str] = set()
    for title, rows in grouped.items():
        model = str(rows[0].get("model") or "").strip()
        category = CATEGORY_MAP.get(normalized(rows[0].get("product_type")))
        relative_files = {str(p) for row in rows for p in (row.get("downloaded_media") or [])}
        if (not exact_model(title, model) or not category or normalized_code(model) in codes
                or not all(source_link_agrees(row, model) for row in rows)):
            unassigned.extend(sorted(relative_files))
            continue

        paths: list[Path] = []
        for relative in sorted(relative_files):
            path = (FOTO / relative).resolve()
            if not path.is_relative_to(FOTO.resolve()) or not path.is_file() or not exact_media_name(path, model):
                unassigned.append(relative)
                continue
            previous_owner = media_owners.get(path)
            if previous_owner and previous_owner != model:
                unassigned.append(relative)
                continue
            media_owners[path] = model
            paths.append(path)
        if not paths:
            continue
        prices = {catalog_prices(row) for row in rows}
        valid_prices = {pair for pair in prices if pair[0] is not None}
        price, old_price = next(iter(valid_prices)) if len(valid_prices) == 1 else (None, None)
        code = normalized_code(model)
        codes.add(code)
        prepared.append({
            "title": title, "model": model, "category": category,
            "media": paths, "specs": clean_specs(rows), "price": price, "old_price": old_price,
        })
    return prepared, sorted(set(unassigned))


def backup_database(source: Path, target: Path) -> None:
    with sqlite3.connect(f"file:{source}?mode=ro", uri=True) as original:
        with sqlite3.connect(target) as backup:
            original.backup(backup)


def optimized_media(product: dict) -> list[tuple[str, str]]:
    MEDIA.mkdir(parents=True, exist_ok=True)
    product_id = slugify(f"samsung-{product['model']}")
    output: list[tuple[str, str]] = []
    for order, source in enumerate(product["media"], 1):
        filename = f"{product_id}_{order:02d}.webp"
        target = MEDIA / filename
        if not target.exists():
            with tempfile.NamedTemporaryFile(suffix=".webp", dir=MEDIA, delete=False) as temp:
                staged = Path(temp.name)
            try:
                subprocess.run(
                    ["magick", str(source), "-auto-orient", "-resize", "1800x1800>", "-strip", "-quality", "86", str(staged)],
                    check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
                )
                staged.replace(target)
            finally:
                staged.unlink(missing_ok=True)
        output.append((f"/media/products/samsung/{filename}", source.name))
    return output


def insert_database(database: Path, products: list[dict], apply: bool) -> tuple[int, int]:
    connection = sqlite3.connect(database)
    connection.execute("PRAGMA foreign_keys=ON")
    inserted = skipped = 0
    try:
        brands = {row[0] for row in connection.execute("SELECT id FROM brands")}
        categories = {row[0] for row in connection.execute("SELECT id FROM categories")}
        if "samsung" not in brands:
            raise RuntimeError(f"Samsung brand not configured: {database}")
        for product in products:
            identifier = slugify(f"samsung-{product['model']}")
            exists = connection.execute(
                "SELECT 1 FROM products WHERE id=? OR lower(code)=lower(?)", (identifier, product["model"])
            ).fetchone()
            if product["category"] not in categories or exists:
                skipped += 1
                continue
            if apply:
                media = optimized_media(product)
                now = datetime.now().isoformat()
                connection.execute(
                    """INSERT INTO products
                    (id,code,title,brand_id,category_id,primary_image,is_featured,is_new,badge_text,
                     short_description,manufacturing_country,status,created_at,updated_at,badge_color,
                     price,old_price,currency,stock_status,image_position,image_fit)
                    VALUES (?,?,?,?,?,?,0,0,'','','','published',?,?,'red',?,?,'₼','in_stock','center center','contain')""",
                    (identifier, product["model"], product["title"], "samsung", product["category"], media[0][0],
                     now, now, product["price"], product["old_price"]),
                )
                for index, (name, value) in enumerate(product["specs"], 1):
                    connection.execute(
                        "INSERT INTO product_specs VALUES (?,?,?,?,?,'Check','Əsas',?)",
                        (f"spec-{identifier}-{index}", identifier, name, value, "", index),
                    )
                for index, (url, original_name) in enumerate(media, 1):
                    connection.execute(
                        "INSERT INTO product_media VALUES (?,?,?,?,?,'',?,'center center','contain',?)",
                        (f"media-{identifier}-{index}", identifier, "image", url, product["title"], index, original_name),
                    )
            inserted += 1
        if apply:
            if connection.execute("PRAGMA foreign_key_check").fetchall():
                raise RuntimeError(f"Foreign key check failed: {database}")
            connection.commit()
        else:
            connection.rollback()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
    return inserted, skipped


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--database", action="append", type=Path)
    arguments = parser.parse_args()
    products, unassigned = prepare()
    print(f"Exact new Samsung product candidates: {len(products)}")
    print(f"Exact candidate media: {sum(len(row['media']) for row in products)}")
    print("Bu faylları dəqiq model adında tapmadığım üçün heç bir modelə bağlamadım:")
    for name in unassigned:
        print(f"  {name}")
    databases = tuple(arguments.database) if arguments.database else DATABASES
    if arguments.apply:
        backup_dir = Path(tempfile.mkdtemp(prefix="sahara-verified-samsung-backup-"))
        for database in databases:
            backup_database(database, backup_dir / database.name)
        print(f"Backups: {backup_dir}")
    for database in databases:
        inserted, skipped = insert_database(database, products, arguments.apply)
        print(f"{database}: {'inserted' if arguments.apply else 'would insert'} {inserted}, skipped {skipped}")


if __name__ == "__main__":
    main()
