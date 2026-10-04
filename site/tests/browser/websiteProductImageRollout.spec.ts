import { expect, test, type Page } from '@playwright/test';

interface ApprovedEntry {
  productId: string;
  brand: string;
  sourceImage: string;
  transparentImage: string;
  isPrimary?: boolean;
  reviewStatus: string;
}

async function approvedPrimaryEntry(page: Page, brand = 'ARDO') {
  const response = await page.request.get('/media/site-product-image-enhancement/manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  const entry = manifest.entries.find(
    (item: ApprovedEntry) =>
      item.reviewStatus === 'approved' &&
      item.isPrimary &&
      item.transparentImage &&
      item.brand === brand
  ) as ApprovedEntry | undefined;
  expect(entry).toBeTruthy();
  return entry!;
}

test.describe('ARDO, ARTEL and LOTUS website image rollout', () => {
  test('uses approved transparent images for every target brand', async ({ page }) => {
    for (const brand of ['ARDO', 'ARTEL', 'LOTUS']) {
      const entry = await approvedPrimaryEntry(page, brand);
      await page.goto(`/product/${entry.productId}`);
      const enhanced = page.locator(`img[src="${entry.transparentImage}"]`).first();
      await expect(enhanced).toBeVisible();
      await expect
        .poll(() => enhanced.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);

      const stageBackground = await enhanced.evaluate(
        (image) => getComputedStyle(image.parentElement as HTMLElement).backgroundImage
      );
      expect(stageBackground).toContain('radial-gradient');
    }

    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('sahara-theme-change', { detail: 'dark' }));
    });
    await expect(page.locator('html')).toHaveAttribute('data-theme', /dark/);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(hasOverflow).toBe(false);
  });

  test('falls back to the untouched original if an enhanced asset fails', async ({ page }) => {
    const entry = await approvedPrimaryEntry(page);
    await page.route(`**${entry.transparentImage}`, (route) => route.abort());
    await page.goto(`/product/${entry.productId}`);
    await expect(page.locator(`img[src="${entry.sourceImage}"]`).first()).toBeVisible();
  });

  test('does not use the website rollout in wholesale catalog mode', async ({ page }) => {
    await page.goto('/?mode=catalog');
    await expect(
      page.locator("img[src*='/media/site-product-image-enhancement/transparent/']")
    ).toHaveCount(0);
  });
});
