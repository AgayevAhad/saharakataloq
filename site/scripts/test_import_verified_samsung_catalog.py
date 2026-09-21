"""Regression checks for private Foto model matching and additive imports."""

from __future__ import annotations

import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from import_verified_samsung_catalog import exact_media_name, exact_model, source_link_agrees, prepare, insert_database  # noqa: E402


class VerifiedSamsungImportTests(unittest.TestCase):
    def test_model_and_filename_must_both_be_exact(self):
        self.assertTrue(exact_model("Soyuducu Samsung RB31FERNDSA/WT", "RB31FERNDSA/WT"))
        self.assertFalse(exact_model("Soyuducu Samsung RB31FERNDSA/WT All-around Cooling", "Cooling"))
        self.assertFalse(exact_model("Samsung WD18DB8995BZLD (18+11 kq)", "18+11 kq"))
        self.assertFalse(exact_model("Samsung ABC1234BLACK", "ABC1234"))
        self.assertTrue(exact_media_name(Path("RB31FERNDSA-WT_02.webp"), "RB31FERNDSA/WT"))
        self.assertFalse(exact_media_name(Path("ABC1234WHITE_02.jpg"), "ABC1234BLACK"))

    def test_source_rejects_ambiguous_twelve_images(self):
        products, unassigned = prepare()
        self.assertEqual(len(products), 70)
        self.assertEqual(sum(len(item["media"]) for item in products), 365)
        self.assertEqual(len(unassigned), 18)
        self.assertFalse(any("18+11 kq" == row["model"] or row["model"] == "Cooling" for row in products))

    def test_descriptive_source_link_cannot_disagree_with_model(self):
        self.assertFalse(source_link_agrees({"source_url": "https://example.test/mehsul/samsung-rt53dg7a10b1wt-215599"}, "IRT53DG7A10B1WT"))
        self.assertTrue(source_link_agrees({"source_url": "https://example.test/mehsul/182525"}, "NZ64T3516QK/WT"))

    def test_existing_product_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as temp:
            database = Path(temp) / "catalog.sqlite"
            connection = sqlite3.connect(database)
            connection.executescript("""
                CREATE TABLE brands (id TEXT PRIMARY KEY);
                CREATE TABLE categories (id TEXT PRIMARY KEY);
                CREATE TABLE products (id TEXT PRIMARY KEY, code TEXT, title TEXT, brand_id TEXT,
                    category_id TEXT, primary_image TEXT, is_featured INTEGER, is_new INTEGER,
                    badge_text TEXT, short_description TEXT, manufacturing_country TEXT,
                    status TEXT, created_at TEXT, updated_at TEXT, badge_color TEXT, price REAL,
                    old_price REAL, currency TEXT, stock_status TEXT, image_position TEXT, image_fit TEXT);
            """)
            connection.execute("INSERT INTO brands VALUES ('samsung')")
            connection.execute("INSERT INTO categories VALUES ('tv')")
            connection.execute("""INSERT INTO products VALUES
                ('samsung-abc1234','ABC1234','Adminin xüsusi adı','samsung','tv','admin.webp',1,0,
                 'Admin nişanı','Xüsusi təsvir','','published','2020','2021','red',99,NULL,'₼',
                 'in_stock','right','cover')""")
            connection.commit()
            connection.close()
            product = {"model": "ABC1234", "title": "Samsung ABC1234", "category": "tv"}
            inserted, skipped = insert_database(database, [product], apply=True)
            self.assertEqual((inserted, skipped), (0, 1))
            connection = sqlite3.connect(database)
            self.assertEqual(connection.execute("SELECT title,price,image_position,image_fit FROM products").fetchone(),
                             ("Adminin xüsusi adı", 99, "right", "cover"))
            connection.close()


if __name__ == "__main__":
    unittest.main()
