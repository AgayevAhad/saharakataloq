"""Tests for the website-only product image processor."""

from __future__ import annotations

import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import process_product_images as processor  # noqa: E402
import review_rollout  # noqa: E402
from tone_analysis import analyze_product_tone  # noqa: E402


class ProductImageProcessorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.public = self.root / "public"
        self.uploads = self.root / "data" / "media"
        self.public.mkdir(parents=True)
        self.uploads.mkdir(parents=True)
        self.original_public = processor.PUBLIC_ROOT
        self.original_upload = processor.UPLOAD_ROOT
        processor.PUBLIC_ROOT = self.public
        processor.UPLOAD_ROOT = self.uploads

    def tearDown(self):
        processor.PUBLIC_ROOT = self.original_public
        processor.UPLOAD_ROOT = self.original_upload
        self.temp.cleanup()

    def _write_image(self, name: str, image: Image.Image) -> tuple[str, Path]:
        relative = Path("media") / "products" / name
        path = self.public / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path)
        return f"/{relative.as_posix()}", path

    def _manifest(self, items):
        path = self.root / "manifest.json"
        path.write_text(json.dumps({"items": items}), encoding="utf-8")
        return path

    def test_original_is_preserved_and_output_has_alpha(self):
        source_url, source_path = self._write_image(
            "MODEL-100.png", Image.new("RGB", (80, 80), "white")
        )
        before = hashlib.sha256(source_path.read_bytes()).hexdigest()

        def fake_segmenter(image):
            result = Image.new("RGBA", image.size, (0, 0, 0, 0))
            for x in range(20, 60):
                for y in range(15, 65):
                    result.putpixel((x, y), (30, 40, 50, 255))
            return result

        report = processor.process_manifest(
            self._manifest(
                [
                    {
                        "productId": "model-100",
                        "modelCode": "MODEL-100",
                        "sourceImage": source_url,
                    }
                ]
            ),
            self.public / "media-test" / "product-image-enhancement",
            segmenter_factory=lambda: fake_segmenter,
        )

        self.assertEqual(report["successCount"], 1)
        self.assertEqual(before, hashlib.sha256(source_path.read_bytes()).hexdigest())
        metadata = report["entries"][0]
        self.assertTrue(metadata["originalPreserved"])
        self.assertEqual(metadata["reviewStatus"], "needs_review")
        output = self.public / metadata["transparentImage"].lstrip("/")
        with Image.open(output) as image:
            self.assertIn("A", image.getbands())
            self.assertLess(image.getchannel("A").getextrema()[0], 255)

        comparison = self.public / metadata["comparisonImage"].lstrip("/")
        with Image.open(comparison) as image:
            self.assertEqual(image.size, processor.COMPARISON_SIZE)
        review_rollout.validate_successful_entry(
            metadata, self.public / "media-test" / "product-image-enhancement"
        )

        Image.new("RGB", (40, 40), "white").save(comparison, format="WEBP")
        with self.assertRaisesRegex(ValueError, "unexpected dimensions"):
            review_rollout.validate_successful_entry(
                metadata, self.public / "media-test" / "product-image-enhancement"
            )

    def test_already_transparent_image_skips_segmentation(self):
        transparent = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
        for x in range(8, 32):
            for y in range(8, 32):
                transparent.putpixel((x, y), (245, 245, 245, 255))
        source_url, _ = self._write_image("ALPHA-1.png", transparent)

        def must_not_run():
            raise AssertionError("segmenter must not be constructed")

        report = processor.process_manifest(
            self._manifest(
                [
                    {
                        "productId": "alpha-1",
                        "modelCode": "ALPHA-1",
                        "sourceImage": source_url,
                    }
                ]
            ),
            self.public / "media-test" / "alpha",
            segmenter_factory=must_not_run,
        )
        self.assertEqual(report["successCount"], 1)
        self.assertTrue(report["entries"][0]["alreadyTransparent"])
        self.assertFalse(report["entries"][0]["backgroundRemoved"])

    def test_failure_does_not_interrupt_remaining_items(self):
        first_url, _ = self._write_image("FAIL-1.png", Image.new("RGB", (30, 30), "white"))
        second_url, _ = self._write_image("GOOD-2.png", Image.new("RGB", (30, 30), "white"))
        calls = 0

        def segmenter(image):
            nonlocal calls
            calls += 1
            if calls == 1:
                raise RuntimeError("expected segmentation failure")
            result = Image.new("RGBA", image.size, (0, 0, 0, 0))
            for x in range(5, 25):
                for y in range(5, 25):
                    result.putpixel((x, y), (120, 120, 120, 255))
            return result

        report = processor.process_manifest(
            self._manifest(
                [
                    {"productId": "fail-1", "modelCode": "FAIL-1", "sourceImage": first_url},
                    {"productId": "good-2", "modelCode": "GOOD-2", "sourceImage": second_url},
                ]
            ),
            self.public / "media-test" / "failure",
            segmenter_factory=lambda: segmenter,
        )
        self.assertEqual(report["failureCount"], 1)
        self.assertEqual(report["successCount"], 1)
        self.assertEqual(report["entries"][0]["reviewStatus"], "failed")
        self.assertTrue(report["entries"][1]["processingSucceeded"])

    def test_invalid_image_and_non_exact_filename_are_reported(self):
        invalid = self.public / "media" / "products" / "MODEL-X.png"
        invalid.parent.mkdir(parents=True, exist_ok=True)
        invalid.write_text("not an image", encoding="utf-8")
        good_url, _ = self._write_image("OTHER.png", Image.new("RGBA", (20, 20), (1, 2, 3, 255)))
        report = processor.process_manifest(
            self._manifest(
                [
                    {
                        "productId": "model-x",
                        "modelCode": "MODEL-X",
                        "sourceImage": "/media/products/MODEL-X.png",
                    },
                    {
                        "productId": "model-y",
                        "modelCode": "MODEL-Y",
                        "sourceImage": good_url,
                    },
                ]
            ),
            self.public / "media-test" / "invalid",
            segmenter_factory=lambda: lambda image: image.convert("RGBA"),
        )
        self.assertEqual(report["failureCount"], 2)
        self.assertIn("image", report["entries"][0]["error"].lower())
        self.assertIn("exact model key", report["entries"][1]["error"].lower())

    def test_tone_analysis_uses_only_visible_foreground(self):
        cases = {
            "dark": (12, 18, 25, 255),
            "medium": (125, 125, 125, 255),
            "light": (245, 245, 245, 255),
        }
        for expected, color in cases.items():
            with self.subTest(expected=expected):
                image = Image.new("RGBA", (60, 60), (255, 255, 255, 0))
                for x in range(20, 40):
                    for y in range(10, 50):
                        image.putpixel((x, y), color)
                self.assertEqual(analyze_product_tone(image)["productTone"], expected)

    def test_test_mode_rejects_more_than_ten_items(self):
        items = [
            {"productId": f"p-{index}", "modelCode": f"M-{index}", "sourceImage": f"/media/{index}.png"}
            for index in range(11)
        ]
        with self.assertRaisesRegex(ValueError, "at most 10"):
            processor.validate_manifest(items, test_mode=True)

    def test_production_manifest_allows_multiple_assets_for_one_product(self):
        processor.validate_manifest(
            [
                {
                    "assetId": "asset-1",
                    "productId": "product-1",
                    "modelCode": "MODEL-1",
                    "sourceImage": "/media/MODEL-1.jpg",
                },
                {
                    "assetId": "asset-2",
                    "productId": "product-1",
                    "modelCode": "MODEL-1",
                    "sourceImage": "/media/MODEL-1-2.jpg",
                },
            ],
            test_mode=False,
        )

    def test_resume_reuses_a_verified_output_without_running_segmentation(self):
        source_url, _ = self._write_image(
            "RESUME-1.png", Image.new("RGB", (36, 36), "white")
        )

        def segmenter(image):
            result = Image.new("RGBA", image.size, (0, 0, 0, 0))
            for x in range(8, 28):
                for y in range(8, 28):
                    result.putpixel((x, y), (20, 20, 20, 255))
            return result

        manifest = self._manifest(
            [
                {
                    "assetId": "resume-asset",
                    "productId": "resume-product",
                    "modelCode": "RESUME-1",
                    "sourceImage": source_url,
                }
            ]
        )
        output = self.public / "media-test" / "resume"
        processor.process_manifest(
            manifest,
            output,
            segmenter_factory=lambda: segmenter,
        )

        def must_not_run():
            raise AssertionError("resume must not construct the segmenter")

        resumed = processor.process_manifest(
            manifest,
            output,
            segmenter_factory=must_not_run,
            resume=True,
        )
        self.assertEqual(resumed["successCount"], 1)
        self.assertEqual(resumed["resumedCount"], 1)

    def test_shard_processes_only_its_deterministic_slice(self):
        items = []
        for index in range(4):
            image = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
            for x in range(6, 18):
                for y in range(6, 18):
                    image.putpixel((x, y), (80, 80, 80, 255))
            source_url, _ = self._write_image(f"SHARD-{index}.png", image)
            items.append(
                {
                    "assetId": f"asset-{index}",
                    "productId": f"product-{index}",
                    "modelCode": f"SHARD-{index}",
                    "sourceImage": source_url,
                }
            )

        report = processor.process_manifest(
            self._manifest(items),
            self.public / "media-test" / "shard",
            shard_index=1,
            shard_count=2,
            report_name="manifest.shard-1-of-2.json",
        )
        self.assertEqual(report["sourceEntryCount"], 4)
        self.assertEqual(report["entryCount"], 2)
        self.assertEqual([item["assetId"] for item in report["entries"]], ["asset-1", "asset-3"])


if __name__ == "__main__":
    unittest.main()
