#!/usr/bin/env python3
"""Build an exact, read-only ARDO/ARTEL/LOTUS website media rollout manifest."""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
SITE_ROOT = SCRIPT_DIR.parents[1]
DEFAULT_DATABASE = SITE_ROOT / "data" / "catalog.sqlite"
DEFAULT_OUTPUT = SCRIPT_DIR / "brand-rollout.json"
TARGET_BRANDS = ("ARDO", "ARTEL", "LOTUS")


def normalize(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.casefold())


def source_path_for(url: str) -> Path:
    if url.startswith("/media/"):
        return SITE_ROOT / "public" / url.lstrip("/")
    if url.startswith("/uploads/"):
        return SITE_ROOT / "data" / "media" / url.removeprefix("/uploads/")
    raise ValueError(f"Unsupported media URL: {url}")


def build_manifest(database: Path) -> dict:
    uri = f"file:{database.resolve()}?mode=ro"
    with sqlite3.connect(uri, uri=True) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT
              pm.id AS asset_id,
              pm.product_id,
              pm.url,
              pm.sort_order,
              p.code,
              p.title,
              p.primary_image,
              b.name AS brand
            FROM product_media pm
            JOIN products p ON p.id = pm.product_id
            JOIN brands b ON b.id = p.brand_id
            WHERE upper(b.name) IN ('ARDO', 'ARTEL', 'LOTUS')
              AND pm.media_type = 'image'
            ORDER BY b.name, p.code, pm.sort_order, pm.id
            """
        ).fetchall()

    items = []
    seen_urls: set[str] = set()
    for row in rows:
        url = str(row["url"])
        code = str(row["code"])
        source_path = source_path_for(url)
        if not source_path.is_file():
            raise FileNotFoundError(f"Database media is missing: {url}")
        if normalize(code) not in normalize(source_path.stem):
            raise ValueError(f"Model code '{code}' is not an exact filename match: {url}")
        if url in seen_urls:
            raise ValueError(f"Duplicate source URL: {url}")
        seen_urls.add(url)
        items.append(
            {
                "assetId": str(row["asset_id"]),
                "productId": str(row["product_id"]),
                "modelCode": code,
                "matchKey": code,
                "brand": str(row["brand"]),
                "label": str(row["title"]),
                "sourceImage": url,
                "isPrimary": url == str(row["primary_image"]),
                "mediaSortOrder": int(row["sort_order"]),
            }
        )

    brand_counts = {
        brand: sum(1 for item in items if item["brand"] == brand) for brand in TARGET_BRANDS
    }
    product_count = len({item["productId"] for item in items})
    return {
        "schemaVersion": 1,
        "scope": "public-website-only",
        "brands": list(TARGET_BRANDS),
        "productCount": product_count,
        "assetCount": len(items),
        "brandAssetCounts": brand_counts,
        "items": items,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    manifest = build_manifest(args.database)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {manifest['assetCount']} exact images for {manifest['productCount']} products to {args.output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
