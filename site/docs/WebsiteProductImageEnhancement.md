# Website Product Image Enhancement Pipeline

This experiment is isolated to `SiteApp`. It does not update the catalog databases, uploaded
media, wholesale routes, or the shared `ProductCard` and `ShimmerImage` implementations.

## Safety contract

- Sources are explicitly listed in `scripts/website-product-images/sample-set.json`.
- A normalized model key must be present in the source filename. There is no fuzzy matching.
- Test mode accepts at most 10 sources.
- Original files are opened read-only and their SHA-256 hash is checked before and after work.
- Generated files only go to `public/media-test/product-image-enhancement/`, which is ignored by
  Git and is separate from production product media.
- Every successful result starts as `reviewStatus: needs_review`. Normal website rendering only
  accepts `approved`; the preview alone can render pending results.
- One failed image is recorded in the manifest without stopping later images.

## Local setup and run

Use an isolated virtual environment. The model is downloaded by `rembg` on first use.

```bash
python3 -m venv .venv-product-media
.venv-product-media/bin/pip install -r scripts/website-product-images/requirements.txt
.venv-product-media/bin/python scripts/website-product-images/process_product_images.py --test-mode
```

Or, after activating that environment:

```bash
npm run media:enhance:test
```

The approved public-site rollout is enabled by default. It can be disabled immediately without
touching wholesale mode:

```dotenv
VITE_ENABLE_SITE_PRODUCT_IMAGE_ENHANCEMENT=true
```

For the local public-site comparison page only, set the flag to `true` and open:

```text
/?image-enhancement-preview=1
```

The output includes transparent WebP files, per-image JSON metadata, light/dark comparison sheets,
and one aggregate manifest. Do not move any result into production media until its comparison has
been manually approved.

## ARDO, ARTEL and LOTUS rollout

### Reviewed rollout snapshot (2026-09-29)

- 109 public-site products and 285 exactly matched image assets were processed.
- Brand totals: ARDO 111, ARTEL 58, LOTUS 116 image assets.
- 280 variants passed source-hash, alpha-output, comparison, and explicit visual review.
- 5 gallery variants were rejected because foreground segmentation removed meaningful product
  context. `SiteApp` keeps their untouched originals automatically.
- No catalog database row, source image, admin crop value, or wholesale catalog rendering was
  changed.

Rejected asset IDs are intentionally retained in the manifest as an auditable fallback decision:

```text
media-ardo-ar09ws-5
media-ardo-ar12ws-5
media-ardo-ar18ws-5
media-ardo-ar24ws-5
media-lotus-lt941s-black-3
```

The production job is still non-destructive. It reads exact media assignments from the catalog
database, requires the product model code in every filename, and writes a separate website-only
variant tree.

```bash
npm run media:enhance:brands:manifest
REMBG_HOME=scripts/website-product-images/.model-cache npm run media:enhance:brands
```

The rollout command is deliberately constrained on Linux: one low-priority process, two CPU cores,
two ONNX threads, idle I/O priority, and resumable per-image metadata. Do not run parallel rollout
jobs on a development workstation.

The production manifest is served from
`/media/site-product-image-enhancement/manifest.json`. Only entries explicitly marked
`reviewStatus: approved` are selected by `SiteApp`; every other entry continues to use its original
image. Set `VITE_ENABLE_SITE_PRODUCT_IMAGE_ENHANCEMENT=false` as an immediate website-only kill
switch. Wholesale mode never imports or reads this resolver.

## Model choice

The test pipeline uses `birefnet-general` through `rembg` and enables foreground color
decontamination for soft-edge white-halo cleanup. It does not generate or redraw product pixels.
Tone classification uses only pixels with visible alpha and combines relative luminance, median
luminance, dark/light pixel proportions, and dominant foreground colors.
