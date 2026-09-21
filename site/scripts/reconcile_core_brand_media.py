#!/usr/bin/env python3
"""Safely reconcile ARDO/ARTEL/LOTUS visibility and exact media.

Dry-run is the default. ``--apply`` creates consistent SQLite backups before
changing only status, primary_image, exact ARDO AC media links, and the two
verified brand visibility flags. Existing prices, specs, crops and copy remain
untouched.
"""

from __future__ import annotations

import argparse
import json
import re
import sqlite3
import unicodedata
import uuid
from datetime import datetime
from pathlib import Path

SITE_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = SITE_DIR.parent
DEFAULT_DATABASES = [SITE_DIR / "data/catalog.sqlite", SITE_DIR / "data/catalog-draft.sqlite"]
APPROVAL_DATABASE = REPO_DIR / "data/catalog.sqlite"
PUBLIC_DIR = SITE_DIR / "public"

ARDO_AC_FILES = {
    "ar09ws": ["/media/products/ardo-ar09ws.jpg", "/media/products/ardo-ar09ws-2.jpg"],
    "ar12ws": ["/media/products/ardo-ar12ws.jpg", "/media/products/ardo-ar12ws-2.jpg"],
    "ar18ws": [
        "/media/products/ardo-ar18ws.jpg",
        "/media/products/ardo-ar18ws-2.jpg",
        "/media/products/ardo-ar18ws-3.jpg",
    ],
    "ar24ws": ["/media/products/ardo-ar24ws.jpg", "/media/products/ardo-ar24ws-2.jpg"],
}


def normalized_code(value: object) -> str:
    decomposed = unicodedata.normalize("NFKD", str(value or "")).casefold()
    return "".join(char for char in decomposed if char.isalnum())


def public_file(url: str) -> Path:
    return PUBLIC_DIR / url.lstrip("/")


def exact_media_rows(connection: sqlite3.Connection, product: sqlite3.Row) -> list[sqlite3.Row]:
    code = normalized_code(product["code"])
    if len(code) < 5:
        return []
    rows = connection.execute(
        "SELECT * FROM product_media WHERE product_id=? ORDER BY sort_order,id", (product["id"],)
    ).fetchall()
    exact = []
    for media in rows:
        evidence = normalized_code(f"{media['original_name']} {Path(media['url']).stem}")
        if code in evidence and public_file(media["url"]).is_file():
            exact.append(media)
    return exact


def preferred_media(rows: list[sqlite3.Row], current_primary: str) -> sqlite3.Row | None:
    if not rows:
        return None
    for row in rows:
        if row["url"] == current_primary:
            return row
    return sorted(rows, key=lambda row: (row["media_type"] != "image", row["sort_order"], row["id"]))[0]


def approved_lotus_codes() -> set[str]:
    connection = sqlite3.connect(f"file:{APPROVAL_DATABASE}?mode=ro", uri=True)
    try:
        return {
            normalized_code(row[0])
            for row in connection.execute(
                "SELECT code FROM products WHERE brand_id='lotus' AND status='published'"
            )
        }
    finally:
        connection.close()


def create_backup(database: Path, backup: Path) -> None:
    source = sqlite3.connect(f"file:{database}?mode=ro", uri=True)
    target = sqlite3.connect(backup)
    try:
        source.backup(target)
    finally:
        target.close()
        source.close()


def reconcile_database(database: Path, apply: bool, approved_codes: set[str]) -> dict:
    connection = sqlite3.connect(database)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    report: dict[str, object] = {
        "database": str(database),
        "lotus_promoted": [],
        "lotus_withheld": [],
        "ardo_primary_repaired": [],
        "ardo_ac_opaque_detached": [],
        "ardo_published_without_exact_media": [],
        "artel_verified": [],
    }

    try:
        connection.execute("BEGIN IMMEDIATE" if apply else "BEGIN")

        # Register only the explicit model-coded production files for ARDO air conditioners.
        for code, urls in ARDO_AC_FILES.items():
            product = connection.execute(
                "SELECT * FROM products WHERE brand_id='ardo' AND lower(replace(code,' ',''))=?",
                (code,),
            ).fetchone()
            if not product:
                continue
            for order, url in enumerate(urls, 1):
                if not public_file(url).is_file():
                    raise FileNotFoundError(f"Missing exact ARDO media: {url}")
                exists = connection.execute(
                    "SELECT 1 FROM product_media WHERE product_id=? AND url=?", (product["id"], url)
                ).fetchone()
                if not exists and apply:
                    connection.execute(
                        """INSERT INTO product_media
                        (id,product_id,media_type,url,alt_text,poster,sort_order,object_position,fit_mode,original_name)
                        VALUES (?,?,?,?,?,'',?,'center','contain',?)""",
                        (
                            f"media-{product['id']}-exact-{uuid.uuid4().hex[:10]}",
                            product["id"],
                            "image",
                            url,
                            product["title"],
                            order,
                            Path(url).name,
                        ),
                    )

            opaque = connection.execute(
                "SELECT url FROM product_media WHERE product_id=? AND url LIKE '/uploads/%'",
                (product["id"],),
            ).fetchall()
            report["ardo_ac_opaque_detached"].extend(row["url"] for row in opaque)
            if apply:
                connection.execute(
                    "DELETE FROM product_media WHERE product_id=? AND url LIKE '/uploads/%'", (product["id"],)
                )
                connection.execute(
                    "UPDATE products SET primary_image=?,updated_at=? WHERE id=?",
                    (urls[0], datetime.now().isoformat(), product["id"]),
                )

        # Prefer an exact, existing media filename for every currently published ARDO card.
        for product in connection.execute(
            "SELECT * FROM products WHERE brand_id='ardo' AND status='published' ORDER BY code"
        ).fetchall():
            exact = exact_media_rows(connection, product)
            chosen = preferred_media(exact, product["primary_image"])
            if not chosen:
                report["ardo_published_without_exact_media"].append(product["code"])
                continue
            if chosen["url"] != product["primary_image"]:
                report["ardo_primary_repaired"].append(
                    {"code": product["code"], "from": product["primary_image"], "to": chosen["url"]}
                )
                if apply:
                    connection.execute(
                        "UPDATE products SET primary_image=?,updated_at=? WHERE id=?",
                        (chosen["url"], datetime.now().isoformat(), product["id"]),
                    )

        # Promote only products that were previously approved AND retain exact current media evidence.
        for product in connection.execute(
            "SELECT * FROM products WHERE brand_id='lotus' ORDER BY code"
        ).fetchall():
            code = normalized_code(product["code"])
            exact = exact_media_rows(connection, product)
            chosen = preferred_media(exact, product["primary_image"])
            if code in approved_codes and chosen:
                report["lotus_promoted"].append(product["code"])
                if apply:
                    connection.execute(
                        "UPDATE products SET status='published',primary_image=?,updated_at=? WHERE id=?",
                        (chosen["url"], datetime.now().isoformat(), product["id"]),
                    )
            elif code in approved_codes:
                report["lotus_withheld"].append(product["code"])

        # ARTEL is already published and every visible product must have exact model-coded media.
        artel_products = connection.execute(
            "SELECT * FROM products WHERE brand_id='artel' AND status='published' ORDER BY code"
        ).fetchall()
        for product in artel_products:
            if exact_media_rows(connection, product):
                report["artel_verified"].append(product["code"])
            else:
                raise RuntimeError(f"ARTEL exact media missing: {product['code']}")

        if report["lotus_promoted"] and apply:
            connection.execute("UPDATE brands SET coming_soon=0 WHERE id='lotus'")
        if artel_products and len(report["artel_verified"]) == len(artel_products) and apply:
            connection.execute("UPDATE brands SET coming_soon=0 WHERE id='artel'")

        foreign_keys = connection.execute("PRAGMA foreign_key_check").fetchall()
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        if foreign_keys or integrity != "ok":
            raise RuntimeError(f"Database validation failed: integrity={integrity}, fk={len(foreign_keys)}")
        report["integrity"] = integrity
        report["foreign_key_violations"] = len(foreign_keys)
        if apply:
            connection.commit()
        else:
            connection.rollback()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--database", action="append", help="Explicit SQLite path; repeatable")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable output")
    args = parser.parse_args()

    databases = [Path(value).resolve() for value in args.database] if args.database else DEFAULT_DATABASES
    approved = approved_lotus_codes()
    backup_dir = None
    if args.apply:
        backup_dir = SITE_DIR / "data/backups" / f"core-brand-reconcile-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        backup_dir.mkdir(parents=True, exist_ok=False)
        for database in databases:
            create_backup(database, backup_dir / database.name)

    reports = [reconcile_database(database, args.apply, approved) for database in databases]
    payload = {"mode": "apply" if args.apply else "dry-run", "backup_dir": str(backup_dir) if backup_dir else None, "reports": reports}
    if args.json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(f"Mode: {payload['mode']}")
        if backup_dir:
            print(f"Backups: {backup_dir}")
        for report in reports:
            print(f"{Path(report['database']).name}: LOTUS publish={len(report['lotus_promoted'])}, withheld={len(report['lotus_withheld'])}; ARTEL verified={len(report['artel_verified'])}; ARDO primary repairs={len(report['ardo_primary_repaired'])}; ARDO unresolved={len(report['ardo_published_without_exact_media'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
