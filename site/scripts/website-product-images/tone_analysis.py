"""Deterministic foreground-only tone analysis for website product cutouts."""

from __future__ import annotations

from collections import defaultdict
from math import sqrt
from typing import Any

from PIL import Image


def _srgb_channel_to_linear(value: int) -> float:
    channel = value / 255.0
    if channel <= 0.04045:
        return channel / 12.92
    return ((channel + 0.055) / 1.055) ** 2.4


def _relative_luminance(red: int, green: int, blue: int) -> float:
    return (
        0.2126 * _srgb_channel_to_linear(red)
        + 0.7152 * _srgb_channel_to_linear(green)
        + 0.0722 * _srgb_channel_to_linear(blue)
    )


def _weighted_percentile(values: list[tuple[float, float]], percentile: float) -> float:
    ordered = sorted(values, key=lambda item: item[0])
    total_weight = sum(weight for _, weight in ordered)
    target = total_weight * percentile
    cumulative = 0.0
    for value, weight in ordered:
        cumulative += weight
        if cumulative >= target:
            return value
    return ordered[-1][0]


def analyze_product_tone(image: Image.Image, max_samples: int = 120_000) -> dict[str, Any]:
    """Classify visible foreground as light, medium or dark.

    Transparent pixels never contribute. Semi-transparent pixels contribute in
    proportion to alpha, preventing a large transparent canvas from skewing the
    result. The calculation is deterministic and intentionally easy to audit.
    """

    rgba = image.convert("RGBA")
    width, height = rgba.size
    total_pixels = max(1, width * height)
    stride = max(1, int(sqrt(total_pixels / max_samples)))

    luminances: list[tuple[float, float]] = []
    color_bins: dict[tuple[int, int, int], float] = defaultdict(float)
    dark_weight = 0.0
    light_weight = 0.0
    visible_weight = 0.0

    pixels = rgba.load()
    for y in range(0, height, stride):
        for x in range(0, width, stride):
            red, green, blue, alpha = pixels[x, y]
            if alpha < 24:
                continue
            weight = alpha / 255.0
            luminance = _relative_luminance(red, green, blue)
            luminances.append((luminance, weight))
            visible_weight += weight
            if luminance <= 0.18:
                dark_weight += weight
            if luminance >= 0.72:
                light_weight += weight

            quantized = (
                min(255, (red // 32) * 32 + 16),
                min(255, (green // 32) * 32 + 16),
                min(255, (blue // 32) * 32 + 16),
            )
            color_bins[quantized] += weight

    if not luminances or visible_weight <= 0:
        raise ValueError("Visible foreground pixels were not found")

    mean_luminance = sum(value * weight for value, weight in luminances) / visible_weight
    median_luminance = _weighted_percentile(luminances, 0.5)
    dark_percent = dark_weight / visible_weight
    light_percent = light_weight / visible_weight

    if (median_luminance <= 0.22 and dark_percent >= 0.48) or dark_percent >= 0.7:
        tone = "dark"
    elif (median_luminance >= 0.66 and light_percent >= 0.46) or light_percent >= 0.7:
        tone = "light"
    else:
        tone = "medium"

    dominant_colors = []
    for (red, green, blue), weight in sorted(
        color_bins.items(), key=lambda item: (-item[1], item[0])
    )[:3]:
        dominant_colors.append(
            {
                "hex": f"#{red:02x}{green:02x}{blue:02x}",
                "share": round(weight / visible_weight, 4),
            }
        )

    return {
        "productTone": tone,
        "foregroundMeanLuminance": round(mean_luminance, 4),
        "foregroundMedianLuminance": round(median_luminance, 4),
        "darkPixelPercent": round(dark_percent, 4),
        "lightPixelPercent": round(light_percent, 4),
        "dominantColors": dominant_colors,
        "sampleStride": stride,
        "sampleCount": len(luminances),
    }
