import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("extractor", ROOT / "scripts/extract_ardo_catalog.py")
extractor = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(extractor)

SAMPLE_EXCEL_EXISTS = (ROOT / "File/Mal və kontragent.xlsx").exists()


@unittest.skipUnless(SAMPLE_EXCEL_EXISTS, "Private source sample File/ directory not present in production repository")
class WorkbookExtractionTests(unittest.TestCase):
    def test_inventory_reader_never_reads_price_columns(self):
        rows = extractor.first_sheet_rows(ROOT / "File/Mal və kontragent.xlsx", {"A"})
        self.assertTrue(rows)
        self.assertTrue(all(set(row) == {"A"} for row in rows))

    def test_authoritative_inventory_has_130_unique_ardo_models(self):
        rows = extractor.first_sheet_rows(ROOT / "File/Mal və kontragent.xlsx", {"A"})[1:]
        names = [row["A"].strip() for row in rows if "ardo" in row["A"].casefold()]
        self.assertEqual(len({extractor.model_key(name) for name in names}), 130)

    def test_all_ardo_products_map_to_six_real_categories(self):
        rows = extractor.first_sheet_rows(ROOT / "File/Mal və kontragent.xlsx", {"A"})[1:]
        categories = {extractor.category_for(row["A"]) for row in rows if "ardo" in row["A"].casefold()}
        self.assertEqual(categories, set(extractor.CATEGORY_INFO))

    def test_catalog_uses_authoritative_names_and_contains_no_commercial_fields(self):
        inventory_rows = extractor.first_sheet_rows(ROOT / "File/Mal və kontragent.xlsx", {"A"})[1:]
        expected_names = {
            " ".join(row["A"].strip().split())
            for row in inventory_rows
            if "ardo" in row["A"].casefold()
        }
        catalog = extractor.build_catalog(
            ROOT / "File/Ardo xüsusiyyətlər.xlsx",
            ROOT / "File/Mal və kontragent.xlsx",
        )
        products = catalog["products"]
        self.assertEqual({product["title"] for product in products}, expected_names)
        self.assertTrue(all("price" not in product and "oldPrice" not in product for product in products))


if __name__ == "__main__":
    unittest.main()
