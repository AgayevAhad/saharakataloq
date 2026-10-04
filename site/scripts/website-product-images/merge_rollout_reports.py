#!/usr/bin/env python3
"""Merge completed image-processing shard reports in source-manifest order."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--shard-count", type=int, required=True)
    args = parser.parse_args()

    source = json.loads(args.source.read_text(encoding="utf-8"))
    source_items = source["items"]
    results_by_asset: dict[str, dict] = {}
    reports = []
    for index in range(args.shard_count):
        path = args.output_root / f"manifest.shard-{index}-of-{args.shard_count}.json"
        report = json.loads(path.read_text(encoding="utf-8"))
        reports.append(report)
        for entry in report["entries"]:
            asset_id = str(entry.get("assetId") or "")
            if not asset_id or asset_id in results_by_asset:
                raise ValueError(f"Missing or duplicate shard asset ID: {asset_id}")
            results_by_asset[asset_id] = entry

    expected_ids = [str(item["assetId"]) for item in source_items]
    missing = [asset_id for asset_id in expected_ids if asset_id not in results_by_asset]
    extra = sorted(set(results_by_asset) - set(expected_ids))
    if missing or extra:
        raise ValueError(f"Shard coverage mismatch: missing={len(missing)} extra={len(extra)}")

    entries = [results_by_asset[asset_id] for asset_id in expected_ids]
    merged = {
        "schemaVersion": 1,
        "processingVersion": reports[0]["processingVersion"],
        "testMode": False,
        "model": reports[0]["model"],
        "generatedAt": utc_now(),
        "entryCount": len(entries),
        "successCount": sum(1 for item in entries if item.get("processingSucceeded")),
        "failureCount": sum(1 for item in entries if not item.get("processingSucceeded")),
        "resumedCount": sum(int(report.get("resumedCount", 0)) for report in reports),
        "entries": entries,
    }
    output = args.output_root / "manifest.json"
    output.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Merged {merged['entryCount']} entries: {merged['successCount']} success, "
        f"{merged['failureCount']} failed -> {output}"
    )
    return 1 if merged["failureCount"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
