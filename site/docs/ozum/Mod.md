PROJECT TASK: Website-only product image enhancement pipeline for Light/Dark mode

IMPORTANT SCOPE RULE
This project contains both:
1. a wholesale catalog system
2. a public customer-facing website

For this task, work ONLY on the public website.

DO NOT modify:
- wholesale catalog UI
- wholesale catalog backend
- wholesale catalog database logic
- wholesale catalog media logic
- wholesale catalog image rendering
- wholesale catalog routes
- wholesale catalog deployment
- any shared component if changing it could affect the wholesale catalog

If a component, utility, style, hook, service or backend endpoint is shared between catalog and website, DO NOT modify it directly.
Instead create a website-specific version or wrapper.

The wholesale catalog will be released first, so it must remain completely stable and unchanged.

GOAL

Improve product images on the public website for both Light Mode and Dark Mode.

Current problem:
Many product images have a white or very light background baked into the image.
They look acceptable in Light Mode, but poor in Dark Mode.
We want a professional scalable image-processing and rendering system.

We want to store TWO image variants:

1. original
2. transparent / background-removed version

Example:

product/
  original.jpg
  transparent.webp
  image-meta.json

The website should primarily use the transparent version for enhanced display.

Never overwrite or destroy the original image.

IMAGE PROCESSING PIPELINE

Create a website-only image processor.

Pipeline:

original image
    ↓
product/background segmentation
    ↓
background removal
    ↓
edge cleanup
    ↓
white halo cleanup
    ↓
transparent WebP output
    ↓
product tone analysis
    ↓
metadata
    ↓
website rendering

Do NOT use a naive rule like:
"all white pixels become transparent"

This is forbidden because white products such as:
- air conditioners
- refrigerators
- washing machines
- kitchen appliances

could be damaged.

Use object segmentation / foreground extraction logic instead.

The product itself must remain unchanged.

CRITICAL PRODUCT ACCURACY RULE

This is an e-commerce product catalog.

DO NOT use generative AI to recreate or redraw products.

The processing system must NOT:
- change the product shape
- change buttons
- change knobs
- change logo
- change model number
- invent reflections
- alter color
- change product proportions
- add/remove physical features

Only:
- isolate the product
- clean the background
- improve presentation around the isolated product

OUTPUT FORMAT

Prefer:

transparent.webp

Use alpha transparency.

Keep the original file separately.

Do not convert everything blindly if transparency quality becomes worse.

IMAGE METADATA

After segmentation, analyze the visible product only.

Store metadata similar to:

{
  "backgroundRemoved": true,
  "productTone": "dark",
  "processingVersion": 1,
  "sourceImage": "...",
  "transparentImage": "..."
}

productTone values:

- light
- medium
- dark

Determine tone using the segmented foreground only.
Do not calculate brightness from the original white background.

Avoid classifying purely with one average-brightness threshold if a better approach is practical.

Use:
- foreground luminance
- dominant colors
- percentage of dark/light pixels

Keep the logic understandable and deterministic.

WEBSITE RENDERING

Use the transparent product image inside a reusable website-only component.

Example concept:

<ProductMedia />

or equivalent based on the existing project architecture.

The component must support:

- Light Mode
- Dark Mode
- light product
- medium product
- dark product
- fallback to original image
- loading state
- image error fallback

Do not break existing product cards.

LIGHT MODE DESIGN

Do NOT use a completely flat white background for every product.

Use a premium soft studio appearance.

Base idea:

background:
radial-gradient(
  circle at 50% 40%,
  #ffffff 0%,
  #f7f8f9 45%,
  #edf0f2 100%
);

Use very subtle shadow under/around the product.

Example starting point:

filter:
drop-shadow(0 16px 24px rgba(0,0,0,0.12));

For dark products in Light Mode:
slightly increase visual separation.

For light/white products in Light Mode:
use a slightly darker neutral outer gradient so white products do not disappear into the background.

Avoid:
- gray boxes that look cheap
- strong borders
- strong shadows
- artificial glow
- excessive gradients

The result should look like professional studio product photography.

DARK MODE DESIGN

Use a dark charcoal background, not pure black everywhere.

Base idea:

background:
radial-gradient(
  circle at 50% 42%,
  rgba(255,255,255,0.10) 0%,
  rgba(255,255,255,0.035) 50%,
  rgba(255,255,255,0.00) 75%
);

For black/dark products:
provide enough halo/separation so the product does not disappear into the background.

For white/light products:
keep the background more restrained because contrast already exists.

Use subtle drop shadows only.

Avoid:
- neon glow
- strong outline
- obvious Photoshop effect
- fake reflections
- excessive contrast

PRODUCT IMAGE FITTING

Preserve aspect ratio.

Do not crop product edges.

Use a consistent safe area around products.

The system should work for:
- TVs
- refrigerators
- air conditioners
- washing machines
- ovens
- kitchen appliances
- small appliances
- other electronics/appliances

Do not assume every image has the same dimensions.

RESPONSIVE BEHAVIOR

Ensure correct rendering on:

- mobile
- tablet
- desktop
- large desktop

The product must remain centered and properly scaled.

No layout shift.

Use correct object-fit behavior.

PERFORMANCE

This website may contain thousands of products.

The system must scale.

Do NOT process images on every page request.

Processing should be done:
- during import
- during media synchronization
- or via a dedicated processing job

Processed files should be reused.

Use caching where appropriate.

Do not run segmentation in the browser.

Do not send huge original images unnecessarily.

Prefer optimized WebP delivery.

Lazy-load product images where appropriate.

Do not reduce visible image quality excessively.

FAIL-SAFE RULES

This task must be safe to test.

If transparent image generation fails:
- keep the original untouched
- website must fall back to the original image

If metadata is missing:
- website must still render the product

If processing throws an error:
- do not interrupt the rest of the product import

No destructive operations.

Do not delete existing images automatically.

TEST MODE FIRST

Implement a TEST MODE.

Do not immediately process the full product library.

Create a test workflow for a small sample set first.

Use examples such as:

1. black oven on white background
2. white air conditioner on white background
3. silver refrigerator
4. black TV
5. white washing machine
6. product with shadows already present
7. product with off-white background
8. product with complex edges
9. image that already has transparency
10. image with poor background contrast

Save processed test output separately.

Example:

media-test/
  original/
  transparent/
  comparison/

Do not replace production website images during the first implementation.

WEBSITE-ONLY FEATURE FLAG

Add a website-specific feature flag, for example:

ENABLE_PRODUCT_IMAGE_ENHANCEMENT=false

or use the project's existing configuration style.

When disabled:
existing website behavior must remain unchanged.

When enabled:
new ProductMedia rendering can be tested.

The wholesale catalog must not read this flag and must not be affected.

CODE QUALITY

Follow the existing project architecture.

Before writing code:
1. inspect the repository
2. identify website and catalog boundaries
3. identify shared modules
4. identify media/image flow
5. identify theme implementation
6. identify product card/product detail components

Do not create unnecessary duplicate architecture.

But when there is a risk of affecting the wholesale catalog, prefer isolation over modifying shared code.

Keep files small and focused.

Avoid very large components.

Create clear modules such as, if compatible with the current project:

website/
  components/
    product-media/

media/
  image-processing/

or the project's equivalent structure.

Use clear naming.

Do not perform a large unrelated refactor.

DO NOT modify the design system globally unless absolutely necessary.

TESTS

Add tests for:

- image fallback
- transparent image selection
- Light Mode rendering
- Dark Mode rendering
- light/medium/dark tone class selection
- original image preserved
- processing failure
- already-transparent image
- invalid image

If the project already has visual/component tests, use them.

FIRST RESPONSE / FIRST STEP

Do NOT start modifying many files immediately.

First analyze the repository and report:

1. Where the public website lives
2. Where the wholesale catalog lives
3. Which components/modules are shared
4. Current product image flow
5. Current theme/light-dark implementation
6. Which files you propose to modify
7. Which NEW files you propose to create
8. Why these changes cannot affect the wholesale catalog
9. Recommended image-processing library/model for this project
10. A small test plan

Then wait for approval before implementing.

ABSOLUTE RULE

The first release target is the wholesale catalog.

Protect it.

This experiment is for the PUBLIC WEBSITE ONLY.