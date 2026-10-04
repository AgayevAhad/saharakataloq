import { expect, test } from '@playwright/test';

test.describe('website-only product image enhancement preview', () => {
  test('renders reviewed test output responsively in light and dark mode', async ({ page }) => {
    await page.goto('/?image-enhancement-preview=1');
    const preview = page.locator('[data-website-image-enhancement-preview]');
    await expect(preview).toBeVisible();
    await expect(preview.locator('.site-product-media-preview__card').first()).toBeVisible();

    const firstStage = preview.locator('.site-product-media').first();
    const lightBox = await firstStage.boundingBox();
    expect(lightBox).not.toBeNull();
    expect(Math.abs((lightBox?.width || 0) - (lightBox?.height || 0))).toBeLessThan(2);

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('sahara-theme-change', { detail: 'dark' }));
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', /dark/);
    await expect(firstStage).toHaveClass(/site-product-media--theme-dark/);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasOverflow).toBe(false);
  });

  test('never mounts the website preview in wholesale catalog mode', async ({ page }) => {
    await page.goto('/?mode=catalog&image-enhancement-preview=1');
    await expect(page.locator('[data-website-image-enhancement-preview]')).toHaveCount(0);
  });
});
