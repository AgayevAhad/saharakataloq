#!/usr/bin/env python3
"""Apply an explicit visual-review decision to a completed website image rollout."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

import process_product_images as processor


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def validate_successful_entry(entry: dict, output_root: Path) -> None:
    if not entry.get("processingSucceeded") or not entry.get("originalPreserved"):
        raise ValueError("processing/original preservation check failed")
    source_path = processor.resolve_source_path(str(entry["sourceImage"]))
    if processor.sha256_file(source_path) != entry.get("sourceSha256"):
        raise ValueError("source image hash changed")

    transparent_url = str(entry.get("transparentImage") or "")
    comparison_url = str(entry.get("comparisonImage") or "")
    transparent_path = processor.PUBLIC_ROOT / transparent_url.lstrip("/")
    comparison_path = processor.PUBLIC_ROOT / comparison_url.lstrip("/")
    if not transparent_path.is_file() or not comparison_path.is_file():
        raise ValueError("transparent or comparison output is missing")
    if not transparent_path.resolve().is_relative_to(output_root.resolve()):
        raise ValueError("transparent output is outside the rollout directory")
    with Image.open(transparent_path) as image:
        if "A" not in image.getbands() or image.getchannel("A").getextrema()[0] >= 250:
            raise ValueError("transparent output does not contain meaningful alpha")
    with Image.open(comparison_path) as image:
        if image.size != processor.COMPARISON_SIZE:
            raise ValueError(
                f"comparison output has unexpected dimensions: {image.size}, "
                f"expected {processor.COMPARISON_SIZE}"
            )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--reviewed-by", required=True)
    parser.add_argument("--reject", action="append", default=[])
    parser.add_argument("--visual-review-confirmed", action="store_true", required=True)
    args = parser.parse_args()

    data = json.loads(args.manifest.read_text(encoding="utf-8"))
    rejected = set(args.reject)
    known_ids = {str(entry.get("assetId")) for entry in data["entries"]}
    unknown_rejections = rejected - known_ids
    if unknown_rejections:
        raise ValueError(f"Unknown rejected asset IDs: {sorted(unknown_rejections)}")

    reviewed_at = utc_now()
    approved_count = 0
    rejected_count = 0
    invalid_count = 0
    for entry in data["entries"]:
        asset_id = str(entry.get("assetId"))
        if asset_id in rejected:
            entry["reviewStatus"] = "rejected"
            entry["reviewedAt"] = reviewed_at
            entry["reviewedBy"] = args.reviewed_by
            entry["reviewNote"] = "Rejected during explicit visual comparison review"
            rejected_count += 1
            continue
        try:
            validate_successful_entry(entry, args.manifest.parent)
        except (OSError, ValueError) as error:
            entry["reviewStatus"] = "failed"
            entry["reviewNote"] = f"Approval validation failed: {error}"
            invalid_count += 1
            continue
        entry["reviewStatus"] = "approved"
        entry["reviewedAt"] = reviewed_at
        entry["reviewedBy"] = args.reviewed_by
        warnings = entry.get("quality", {}).get("qualityWarnings") or []
        entry["reviewNote"] = (
            "Approved after output validation and explicit visual comparison review"
            + (f"; visual reviewer accepted warnings: {', '.join(warnings)}" if warnings else "")
        )
        approved_count += 1

    data["reviewedAt"] = reviewed_at
    data["reviewedBy"] = args.reviewed_by
    data["approvedCount"] = approved_count
    data["rejectedCount"] = rejected_count
    data["reviewValidationFailureCount"] = invalid_count
    args.manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Review recorded: approved={approved_count}, rejected={rejected_count}, "
        f"validation_failed={invalid_count}"
    )
    return 1 if invalid_count else 0


if __name__ == "__main__":
    raise SystemExit(main())
