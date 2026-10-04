#!/usr/bin/env python3
"""Website-only, non-destructive product background-removal test pipeline."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

from PIL import Image, ImageDraw, ImageFont, ImageOps

from tone_analysis import analyze_product_tone


SCRIPT_DIR = Path(__file__).resolve().parent
SITE_ROOT = SCRIPT_DIR.parents[1]
PUBLIC_ROOT = SITE_ROOT / "public"
UPLOAD_ROOT = SITE_ROOT / "data" / "media"
DEFAULT_MANIFEST = SCRIPT_DIR / "sample-set.json"
DEFAULT_OUTPUT = PUBLIC_ROOT / "media-test" / "product-image-enhancement"
PROCESSING_VERSION = 1
DEFAULT_MODEL = "birefnet-general"
COMPARISON_SIZE = (1560, 592)
MAX_TEST_ITEMS = 10


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalize_match_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.casefold())


def ensure_exact_filename_match(source_path: Path, match_key: str) -> None:
    normalized_key = normalize_match_key(match_key)
    normalized_name = normalize_match_key(source_path.stem)
    if not normalized_key or normalized_key not in normalized_name:
        raise ValueError(
            f"Exact model key '{match_key}' is not present in filename '{source_path.name}'"
        )


def _inside(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


def resolve_source_path(source_image: str) -> Path:
    if source_image.startswith("/media/"):
        candidate = (PUBLIC_ROOT / source_image.lstrip("/")).resolve()
        allowed_root = PUBLIC_ROOT.resolve()
    elif source_image.startswith("/uploads/"):
        relative_name = source_image.removeprefix("/uploads/")
        if Path(relative_name).name != relative_name:
            raise ValueError("Upload source must be a single safe filename")
        candidate = (UPLOAD_ROOT / relative_name).resolve()
        allowed_root = UPLOAD_ROOT.resolve()
    else:
        raise ValueError("Source image must use an existing /media/ or /uploads/ URL")

    if not _inside(candidate, allowed_root):
        raise ValueError("Source image resolves outside the allowed media root")
    if not candidate.is_file():
        raise FileNotFoundError(f"Source image does not exist: {source_image}")
    return candidate


def has_meaningful_transparency(image: Image.Image) -> bool:
    if "A" not in image.getbands():
        return False
    alpha = image.getchannel("A")
    extrema = alpha.getextrema()
    if extrema is None or extrema[0] >= 250:
        return False
    histogram = alpha.histogram()
    non_opaque = sum(histogram[:250])
    return non_opaque / max(1, image.width * image.height) >= 0.005


def inspect_alpha_quality(image: Image.Image) -> dict[str, Any]:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.getbbox()
    histogram = alpha.histogram()
    total = max(1, rgba.width * rgba.height)
    visible = sum(histogram[8:])
    solid = sum(histogram[245:])
    coverage = visible / total

    border = []
    pixels = alpha.load()
    if rgba.width and rgba.height:
        for x in range(rgba.width):
            border.append(pixels[x, 0])
            border.append(pixels[x, rgba.height - 1])
        for y in range(1, max(1, rgba.height - 1)):
            border.append(pixels[0, y])
            border.append(pixels[rgba.width - 1, y])
    edge_contact = sum(1 for value in border if value >= 32) / max(1, len(border))

    warnings = []
    if bbox is None or coverage < 0.01:
        warnings.append("foreground-too-small")
    if coverage > 0.92:
        warnings.append("background-may-remain")
    if edge_contact > 0.2:
        warnings.append("foreground-touches-frame")

    return {
        "foregroundCoverage": round(coverage, 4),
        "solidForegroundCoverage": round(solid / total, 4),
        "edgeContactRatio": round(edge_contact, 4),
        "foregroundBounds": list(bbox) if bbox else None,
        "autoQualityPass": not warnings,
        "qualityWarnings": warnings,
    }


def _radial_background(size: tuple[int, int], center: tuple[float, float], inner, outer):
    width, height = size
    background = Image.new("RGB", size)
    pixels = background.load()
    cx, cy = width * center[0], height * center[1]
    max_distance = max(width, height) * 0.72
    for y in range(height):
        for x in range(width):
            distance = min(1.0, (((x - cx) ** 2 + (y - cy) ** 2) ** 0.5) / max_distance)
            eased = distance * distance * (3 - 2 * distance)
            pixels[x, y] = tuple(
                round(inner[index] * (1 - eased) + outer[index] * eased) for index in range(3)
            )
    return background.convert("RGBA")


def _fit_preview(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    preview = image.copy().convert("RGBA")
    preview.thumbnail((int(size[0] * 0.84), int(size[1] * 0.82)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    left = (size[0] - preview.width) // 2
    top = (size[1] - preview.height) // 2
    canvas.alpha_composite(preview, (left, top))
    return canvas


def create_comparison(original: Image.Image, transparent: Image.Image, output_path: Path, label: str):
    panel_size = (520, 520)
    light = _radial_background(panel_size, (0.5, 0.4), (255, 255, 255), (237, 240, 242))
    dark = _radial_background(panel_size, (0.5, 0.42), (55, 62, 70), (18, 22, 28))
    original_bg = Image.new("RGBA", panel_size, (246, 247, 249, 255))
    original_bg.alpha_composite(_fit_preview(original, panel_size))
    light.alpha_composite(_fit_preview(transparent, panel_size))
    dark.alpha_composite(_fit_preview(transparent, panel_size))

    title_height = 72
    result = Image.new("RGB", COMPARISON_SIZE, "white")
    result.paste(original_bg.convert("RGB"), (0, title_height))
    result.paste(light.convert("RGB"), (panel_size[0], title_height))
    result.paste(dark.convert("RGB"), (panel_size[0] * 2, title_height))
    draw = ImageDraw.Draw(result)
    font = ImageFont.load_default(size=18)
    captions = [f"Original - {label}", "Transparent / Light", "Transparent / Dark"]
    for index, caption in enumerate(captions):
        draw.text((index * panel_size[0] + 18, 22), caption, fill=(25, 30, 38), font=font)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.save(output_path, format="WEBP", quality=88, method=6)


class RembgSegmenter:
    def __init__(self, model_name: str = DEFAULT_MODEL):
        try:
            from rembg import new_session, remove
        except ImportError as error:
            raise RuntimeError(
                "rembg is not installed. Install scripts/website-product-images/requirements.txt"
            ) from error
        self._remove = remove
        self._session = new_session(model_name)

    def __call__(self, image: Image.Image) -> Image.Image:
        result = self._remove(image, session=self._session, decontaminate=True)
        if not isinstance(result, Image.Image):
            raise RuntimeError("Segmentation did not return a Pillow image")
        return result.convert("RGBA")


@dataclass
class OutputLayout:
    root: Path

    @property
    def transparent(self) -> Path:
        return self.root / "transparent"

    @property
    def metadata(self) -> Path:
        return self.root / "metadata"

    @property
    def comparison(self) -> Path:
        return self.root / "comparison"

    def create(self) -> None:
        for directory in (self.transparent, self.metadata, self.comparison):
            directory.mkdir(parents=True, exist_ok=True)


def web_url_for(path: Path) -> str | None:
    resolved = path.resolve()
    if not _inside(resolved, PUBLIC_ROOT.resolve()):
        return None
    return "/" + resolved.relative_to(PUBLIC_ROOT.resolve()).as_posix()


def process_entry(
    entry: dict[str, Any],
    layout: OutputLayout,
    segmenter: Callable[[Image.Image], Image.Image] | None = None,
    model_name: str = DEFAULT_MODEL,
) -> dict[str, Any]:
    product_id = str(entry["productId"])
    asset_id = str(entry.get("assetId") or product_id)
    model_code = str(entry["modelCode"])
    source_image = str(entry["sourceImage"])
    match_key = str(entry.get("matchKey") or model_code)
    safe_id = re.sub(r"[^a-z0-9_-]+", "-", asset_id.casefold()).strip("-")
    if not safe_id:
        raise ValueError("assetId does not produce a safe output name")

    source_path = resolve_source_path(source_image)
    ensure_exact_filename_match(source_path, match_key)
    source_hash_before = sha256_file(source_path)

    with Image.open(source_path) as opened:
        original = ImageOps.exif_transpose(opened).convert("RGBA")
        already_transparent = has_meaningful_transparency(original)
        if already_transparent:
            transparent = original.copy()
        else:
            if segmenter is None:
                raise RuntimeError("A segmentation session is required for an opaque source image")
            transparent = segmenter(original.convert("RGB")).convert("RGBA")

    if transparent.size != original.size:
        raise ValueError(
            f"Segmentation changed dimensions from {original.size} to {transparent.size}"
        )

    alpha_quality = inspect_alpha_quality(transparent)
    tone = analyze_product_tone(transparent)
    transparent_path = layout.transparent / tone["productTone"] / f"{safe_id}.webp"
    metadata_path = layout.metadata / f"{safe_id}.image-meta.json"
    comparison_path = layout.comparison / f"{safe_id}.webp"
    transparent_path.parent.mkdir(parents=True, exist_ok=True)
    transparent.save(transparent_path, format="WEBP", lossless=False, quality=94, method=6)
    create_comparison(original, transparent, comparison_path, model_code)

    source_hash_after = sha256_file(source_path)
    if source_hash_before != source_hash_after:
        raise RuntimeError("Original image hash changed during processing")

    metadata = {
        "assetId": asset_id,
        "productId": product_id,
        "brand": entry.get("brand"),
        "modelCode": model_code,
        "label": entry.get("label") or product_id,
        "backgroundRemoved": not already_transparent,
        "alreadyTransparent": already_transparent,
        "productTone": tone["productTone"],
        "processingVersion": PROCESSING_VERSION,
        "model": "existing-alpha" if already_transparent else model_name,
        "sourceImage": source_image,
        "transparentImage": web_url_for(transparent_path),
        "comparisonImage": web_url_for(comparison_path),
        "sourceSha256": source_hash_before,
        "originalPreserved": True,
        "processingSucceeded": True,
        "reviewStatus": "needs_review",
        "processedAt": utc_now(),
        "width": original.width,
        "height": original.height,
        "isPrimary": bool(entry.get("isPrimary")),
        "mediaSortOrder": entry.get("mediaSortOrder"),
        "toneAnalysis": tone,
        "quality": alpha_quality,
    }
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return metadata


def validate_manifest(entries: list[dict[str, Any]], test_mode: bool) -> None:
    if test_mode and len(entries) > MAX_TEST_ITEMS:
        raise ValueError(f"Test mode accepts at most {MAX_TEST_ITEMS} explicitly listed images")
    if not entries:
        raise ValueError("Manifest must contain at least one image")
    seen_asset_ids: set[str] = set()
    seen_sources: set[str] = set()
    for entry in entries:
        for required in ("productId", "modelCode", "sourceImage"):
            if not entry.get(required):
                raise ValueError(f"Manifest entry is missing '{required}'")
        asset_id = str(entry.get("assetId") or entry["productId"])
        source = str(entry["sourceImage"])
        if asset_id in seen_asset_ids or source in seen_sources:
            raise ValueError("Manifest asset IDs and source images must be unique")
        seen_asset_ids.add(asset_id)
        seen_sources.add(source)


def load_resumable_result(entry: dict[str, Any], layout: OutputLayout) -> dict[str, Any] | None:
    asset_id = str(entry.get("assetId") or entry["productId"])
    safe_id = re.sub(r"[^a-z0-9_-]+", "-", asset_id.casefold()).strip("-")
    metadata_path = layout.metadata / f"{safe_id}.image-meta.json"
    if not metadata_path.is_file():
        return None
    try:
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        source_path = resolve_source_path(str(entry["sourceImage"]))
        transparent_url = metadata.get("transparentImage")
        transparent_path = (
            (PUBLIC_ROOT / str(transparent_url).lstrip("/")).resolve()
            if transparent_url
            else None
        )
        if (
            metadata.get("processingSucceeded")
            and metadata.get("sourceImage") == entry["sourceImage"]
            and metadata.get("sourceSha256") == sha256_file(source_path)
            and transparent_path
            and transparent_path.is_file()
        ):
            metadata["resumed"] = True
            return metadata
    except (OSError, ValueError, json.JSONDecodeError):
        return None
    return None


def process_manifest(
    manifest_path: Path,
    output_root: Path,
    test_mode: bool = True,
    segmenter_factory: Callable[[], Callable[[Image.Image], Image.Image]] | None = None,
    model_name: str = DEFAULT_MODEL,
    resume: bool = False,
    shard_index: int = 0,
    shard_count: int = 1,
    report_name: str = "manifest.json",
) -> dict[str, Any]:
    manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
    entries = manifest_data.get("items") if isinstance(manifest_data, dict) else manifest_data
    if not isinstance(entries, list):
        raise ValueError("Manifest must be a list or an object with an 'items' list")
    validate_manifest(entries, test_mode)
    source_entry_count = len(entries)
    if shard_count < 1 or shard_index < 0 or shard_index >= shard_count:
        raise ValueError("Shard index must be within the configured shard count")
    entries = [entry for index, entry in enumerate(entries) if index % shard_count == shard_index]

    resolved_output = output_root.resolve()
    protected_roots = [
        (PUBLIC_ROOT / "media" / "products").resolve(),
        UPLOAD_ROOT.resolve(),
    ]
    if any(_inside(resolved_output, protected) or resolved_output == protected for protected in protected_roots):
        raise ValueError("Output directory cannot be inside a production media directory")

    layout = OutputLayout(resolved_output)
    layout.create()
    results: list[dict[str, Any]] = []
    shared_segmenter: Callable[[Image.Image], Image.Image] | None = None

    for index, entry in enumerate(entries, start=1):
        try:
            if resume:
                resumed = load_resumable_result(entry, layout)
                if resumed is not None:
                    results.append(resumed)
                    print(
                        f"[{index}/{len(entries)}] resumed {entry.get('brand', '')} {entry.get('modelCode', '')}",
                        file=sys.stderr,
                        flush=True,
                    )
                    continue
            source_path = resolve_source_path(str(entry["sourceImage"]))
            with Image.open(source_path) as candidate:
                needs_segmentation = not has_meaningful_transparency(candidate.convert("RGBA"))
            if needs_segmentation and shared_segmenter is None:
                factory = segmenter_factory or (lambda: RembgSegmenter(model_name))
                shared_segmenter = factory()
            result = process_entry(
                entry,
                layout,
                segmenter=shared_segmenter,
                model_name=model_name,
            )
            results.append(result)
            print(
                f"[{index}/{len(entries)}] processed {entry.get('brand', '')} {entry.get('modelCode', '')}",
                file=sys.stderr,
                flush=True,
            )
        except Exception as error:  # continue the remaining import by design
            results.append(
                {
                    "assetId": entry.get("assetId") or entry.get("productId"),
                    "productId": entry.get("productId"),
                    "brand": entry.get("brand"),
                    "modelCode": entry.get("modelCode"),
                    "label": entry.get("label") or entry.get("productId"),
                    "sourceImage": entry.get("sourceImage"),
                    "transparentImage": None,
                    "backgroundRemoved": False,
                    "productTone": "medium",
                    "processingVersion": PROCESSING_VERSION,
                    "model": model_name,
                    "processingSucceeded": False,
                    "originalPreserved": True,
                    "reviewStatus": "failed",
                    "error": str(error),
                    "processedAt": utc_now(),
                }
            )
            print(
                f"[{index}/{len(entries)}] failed {entry.get('brand', '')} {entry.get('modelCode', '')}: {error}",
                file=sys.stderr,
                flush=True,
            )

    aggregate = {
        "schemaVersion": 1,
        "processingVersion": PROCESSING_VERSION,
        "testMode": test_mode,
        "sourceEntryCount": source_entry_count,
        "shardIndex": shard_index,
        "shardCount": shard_count,
        "model": model_name,
        "generatedAt": utc_now(),
        "entryCount": len(results),
        "successCount": sum(1 for item in results if item.get("processingSucceeded")),
        "failureCount": sum(1 for item in results if not item.get("processingSucceeded")),
        "resumedCount": sum(1 for item in results if item.get("resumed")),
        "entries": results,
    }
    (layout.root / report_name).write_text(
        json.dumps(aggregate, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return aggregate


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--model", default=DEFAULT_MODEL)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--test-mode", dest="test_mode", action="store_true")
    mode.add_argument("--production", dest="test_mode", action="store_false")
    parser.set_defaults(test_mode=True)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--shard-index", type=int, default=0)
    parser.add_argument("--shard-count", type=int, default=1)
    parser.add_argument("--report-name", default="manifest.json")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    manifest = args.manifest if args.manifest.is_absolute() else (SITE_ROOT / args.manifest)
    output = args.output if args.output.is_absolute() else (SITE_ROOT / args.output)
    report = process_manifest(
        manifest,
        output,
        test_mode=args.test_mode,
        model_name=args.model,
        resume=args.resume,
        shard_index=args.shard_index,
        shard_count=args.shard_count,
        report_name=args.report_name,
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if report["failureCount"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
