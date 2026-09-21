import { expect, test } from '@playwright/test';

test('46: chat invitation enters at center, settles at bottom-right and clears after interaction', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  // Observe the short entrance state before the page's images finish loading.
  await page.goto('/', { waitUntil: 'commit' });
  const widget = page.locator('.customer-chat-widget');
  await expect(widget).toHaveClass(/is-intro/);
  const helper = page.locator('.customer-chat-helper');
  await expect(helper).toBeVisible();
  await expect(helper).toContainText('Sualınız var? Burada yazın.');
  await expect(helper).not.toContainText('Sahara köməkçisi');
  await expect(widget).not.toHaveClass(/is-intro/, { timeout: 5000 });
  await expect(page.locator('.customer-chat-trigger')).toHaveCSS('animation-name', 'chatPulseAnim');
  await page.locator('.customer-chat-trigger').click();
  await expect(helper).toHaveCount(0);
});

test('47: homepage and catalog cards put category between brand and actions', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  for (const [route, selector] of [
    ['/', '.featured-product-card'],
    ['/catalog', '.catalog-products-container .product-card'],
  ] as const) {
    await page.goto(route);
    const card = page.locator(selector).first();
    await expect(card).toBeVisible();
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    const brand = card.locator('.product-brand-badge');
    const category = card.locator('.product-card-category-top');
    const actions = card.locator('.product-card-top-actions');
    await expect(brand).toBeVisible();
    await expect(category).toBeVisible();
    await expect(actions).toBeVisible();
    expect(await card.locator('.product-card-category-top').count()).toBe(1);
    const [brandBox, categoryBox, actionsBox] = await Promise.all([
      brand.boundingBox(),
      category.boundingBox(),
      actions.boundingBox(),
    ]);
    expect(brandBox && categoryBox && actionsBox).toBeTruthy();
    expect(categoryBox!.x).toBeGreaterThanOrEqual(brandBox!.x + brandBox!.width - 1);
    expect(categoryBox!.x + categoryBox!.width).toBeLessThanOrEqual(actionsBox!.x + 1);
    expect(Math.abs(categoryBox!.y - brandBox!.y)).toBeLessThanOrEqual(2);
  }
});
