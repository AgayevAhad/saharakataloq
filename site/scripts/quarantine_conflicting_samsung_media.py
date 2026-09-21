"""Detach one source-conflicted Samsung model's media without deleting source files.

This is deliberately one-shot and guarded: every expected row/file must match
before either database or the public media directory is changed.
"""

from pathlib import Path
import shutil
import sqlite3
import tempfile


SITE = Path(__file__).resolve().parents[1]
PRODUCT_ID = "samsung-irt53dg7a10b1wt"
DB_PATHS = [SITE / "data/catalog.sqlite", SITE / "data/catalog-draft.sqlite"]
PUBLIC = SITE / "public/media/products/samsung"
QUARANTINE = SITE / "data/quarantine-media/samsung"
FILES = [f"{PRODUCT_ID}_{index:02}.webp" for index in range(1, 7)]
URLS = [f"/media/products/samsung/{name}" for name in FILES]


def main() -> None:
    for path in DB_PATHS:
        with sqlite3.connect(path) as db:
            product = db.execute(
                "SELECT status, primary_image FROM products WHERE id = ?", (PRODUCT_ID,)
            ).fetchone()
            media = db.execute(
                "SELECT url FROM product_media WHERE product_id = ? ORDER BY sort_order",
                (PRODUCT_ID,),
            ).fetchall()
            if product != ("draft", URLS[0]) or [row[0] for row in media] != URLS:
                raise RuntimeError(f"Unexpected product/media state in {path}")

    for name in FILES:
        if not (PUBLIC / name).is_file() or (QUARANTINE / name).exists():
            raise RuntimeError(f"Unexpected source/quarantine media state: {name}")

    backup_dir = Path(tempfile.mkdtemp(prefix="sahara-samsung-media-backup-"))
    for path in DB_PATHS:
        with sqlite3.connect(path) as source, sqlite3.connect(backup_dir / path.name) as target:
            source.backup(target)

    for path in DB_PATHS:
        with sqlite3.connect(path) as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("DELETE FROM product_media WHERE product_id = ?", (PRODUCT_ID,))
            db.execute("UPDATE products SET primary_image = '' WHERE id = ?", (PRODUCT_ID,))
            if db.execute("PRAGMA foreign_key_check").fetchall():
                raise RuntimeError(f"Foreign-key failure in {path}")
            db.commit()

    QUARANTINE.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        shutil.move(str(PUBLIC / name), str(QUARANTINE / name))

    print(f"Detached 6 images in each site DB; recoverable backup: {backup_dir}")
    print(f"Quarantined 6 public files: {QUARANTINE}")


if __name__ == "__main__":
    main()
