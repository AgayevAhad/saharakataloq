import { expect, test } from '@playwright/test';

test('35–37: dark category text, brand surfaces and catalog remain readable', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Qaranlıq rejim' }).first().click();
  await expect(page.locator('html')).toHaveClass(/theme-dark/);
  await expect(page.locator('.visual-categories-title')).toHaveCSS('color', 'rgb(248, 250, 252)');

  await page.goto('/brands');
  await expect(page.locator('.brand-card-logo-box').first()).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)'
  );
  expect(await page.locator('.brand-logo-text-fallback').count()).toBeGreaterThan(0);
  await expect(page.locator('.brand-card-logo-box img[src="/media/placeholder.png"]')).toHaveCount(
    0
  );

  await page.goto('/catalog');
  await expect(page.locator('.catalog-page-header h1')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
  ).toBe(false);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight }));
  await expect(page.locator('footer')).toBeInViewport();
});

test('39: public red calls to action use the soft red token', async ({ page }) => {
  await page.goto('/');
  const subscribe = page.getByRole('button', { name: 'Abunə ol' });
  await expect(subscribe).toHaveCSS('color', 'rgb(185, 28, 28)');
  await expect(subscribe).not.toHaveCSS('background-color', 'rgb(227, 30, 36)');
  await page.goto('/account');
  const addressAction = page.getByRole('button', { name: 'Yeni Ünvan Əlavə Et' });
  if (await addressAction.count()) {
    await expect(addressAction).toHaveCSS('color', 'rgb(185, 28, 28)');
  }
});

test('39: selected product-card actions use tinted brand colors instead of solid fills', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/catalog');
  const card = page.locator('.catalog-products-container .product-card').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  const favorite = card.locator('.card-action-btn-heart');
  await favorite.click();
  await expect(favorite).toHaveClass(/sahara-soft-red-action/);
  await expect(favorite).toHaveCSS('color', 'rgb(185, 28, 28)');
  const compare = card.locator('.card-action-btn-compare');
  await compare.click();
  await expect(compare).toHaveClass(/sahara-soft-blue-action/);
  await expect(compare).toHaveCSS('color', 'rgb(29, 78, 216)');
});

test('52: three reference-inspired category collages have distinct media geometry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  const tabs = page.locator('.collage-slide-tab');
  await expect(tabs).toHaveCount(5);

  await tabs.nth(1).click();
  const facet = page.locator('.visual-category-card-style-facet .category-cover-collage').first();
  await expect(facet).toBeVisible();
  await expect(facet.locator('.category-cover-tile-1')).not.toHaveCSS('clip-path', 'none');

  await tabs.nth(2).click();
  const frames = page.locator('.visual-category-card-style-frames .category-cover-collage').first();
  await expect(frames).toBeVisible();
  await expect(frames.locator('.category-cover-tile-1')).toHaveCSS('border-top-width', '4px');
  const frameTrack = page.locator('.collage-track-frames');
  if ((await frameTrack.getAttribute('data-category-count')) === '1') {
    const trackBox = await frameTrack.boundingBox();
    const cardBox = await frameTrack.locator('.visual-category-card-1').boundingBox();
    expect(trackBox && cardBox).toBeTruthy();
    expect(
      Math.abs(cardBox!.x - trackBox!.x - (trackBox!.width - cardBox!.width) / 2)
    ).toBeLessThan(3);
    expect(cardBox!.height).toBeLessThan(400);
  }

  await tabs.nth(3).click();
  const cluster = page
    .locator('.visual-category-card-style-cluster .category-cover-collage')
    .first();
  await expect(cluster).toBeVisible();
  expect(
    (await cluster.evaluate((element) => getComputedStyle(element).gridTemplateColumns)).split(' ')
      .length
  ).toBe(3);
});

test('53: hero slide rotation keeps video-frame width and height stable', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  const card = page.locator('.banner-hero-card');
  await expect(card).toHaveClass(/is-video/);
  const first = await card.boundingBox();
  await page.getByRole('button', { name: /Slayd 2:/ }).click();
  await expect(card).not.toHaveClass(/is-video/);
  const second = await card.boundingBox();
  expect(first && second).toBeTruthy();
  expect(Math.abs(first!.width - second!.width)).toBeLessThan(1);
  expect(Math.abs(first!.height - second!.height)).toBeLessThan(1);
});
