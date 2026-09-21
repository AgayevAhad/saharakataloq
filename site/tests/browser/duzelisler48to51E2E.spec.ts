import { expect, test } from '@playwright/test';

test('49: category selector uses the five real catalog groups', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const selector = page.locator('.collage-slide-indicators');
  for (const name of [
    'Böyük Məişət Texnikası',
    'Quraşdırılan Texnika',
    'Kiçik Məişət Texnikası',
    'İqlim Texnikası',
    'Bütün Kateqoriyalar',
  ]) {
    await expect(selector.locator('button').filter({ hasText: name })).toHaveCount(1);
  }
  await selector.getByRole('tab', { name: /Quraşdırılan Texnika/ }).click();
  await expect(page.locator('.visual-category-scroll-track')).toHaveAttribute(
    'data-category-count',
    /[1-9]/
  );
  await expect(
    page.locator('.visual-category-scroll-track .visual-category-card').first()
  ).toBeVisible();
  await expect(
    page.locator('.visual-category-scroll-track .visual-category-card').first()
  ).not.toHaveCSS('opacity', '0');
  await selector.scrollIntoViewIfNeeded();
  await selector.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  await selector.getByRole('tab', { name: /Bütün Kateqoriyalar/ }).click();
  await expect(page.locator('.visual-category-scroll-track')).toHaveAttribute(
    'data-category-count',
    /[1-9]/
  );
  await page.locator('.visual-category-view-all-btn').click();
  await expect(page).toHaveURL(/catalog/);
});

test('51: catalog reveals eight more rows, not all products at once', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/catalog');
  const headerCount = Number(
    (await page.locator('.catalog-page-header').innerText()).match(/(\d+) model/)?.[1]
  );
  const allPillCount = Number(
    (await page.locator('.catalog-quick-pill.active').innerText()).match(/\((\d+)\)/)?.[1]
  );
  expect(headerCount).toBe(allPillCount);
  await expect(page.locator('.catalog-products-container .product-card')).toHaveCount(24);
  await page.locator('.catalog-load-more').click();
  await expect(page.locator('.catalog-products-container .product-card')).toHaveCount(48);
});

test('48: cards omit the generic Yeni badge but retain category and admin-defined badges', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/catalog');
  const card = page.locator('.catalog-products-container .product-card').first();
  await expect(card.locator('.product-card-category-top')).toBeVisible();
  await expect(card.getByText('Yeni', { exact: true })).toHaveCount(0);
  const flaggedCard = page
    .locator('.catalog-products-container .product-card')
    .filter({ has: page.locator('.product-card-country-flag') })
    .first();
  // The live catalog may have no model-verified manufacture-country specs.
  // Do not manufacture a flag from the brand's country merely to satisfy this test.
  if (await flaggedCard.count()) {
    const cardBox = await flaggedCard.boundingBox();
    const flagBox = await flaggedCard.locator('.product-card-country-flag').boundingBox();
    expect(cardBox && flagBox).toBeTruthy();
    expect(flagBox!.x).toBeLessThan(cardBox!.x + cardBox!.width);
    expect(flagBox!.x + flagBox!.width).toBeGreaterThan(cardBox!.x + cardBox!.width);
  } else {
    await expect(page.locator('.product-card-country-flag')).toHaveCount(0);
  }
});

test('53: homepage video keeps its complete 16:9 frame visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const card = page.locator('.banner-hero-card.is-video');
  const video = card.locator('video');
  await expect(video).toBeVisible();
  const frame = await video.boundingBox();
  expect(frame).toBeTruthy();
  expect(frame!.width / frame!.height).toBeCloseTo(16 / 9, 1);
  expect(frame!.y + frame!.height).toBeLessThanOrEqual(844);
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.reload();
  const desktopCard = await page.locator('.banner-hero-card.is-video').boundingBox();
  expect(desktopCard).toBeTruthy();
  expect(desktopCard!.y + desktopCard!.height).toBeLessThanOrEqual(900);
  // Hydration and the entrance motion can briefly report pre-layout coordinates.
  await expect
    .poll(async () => {
      const videoCard = await page.locator('.banner-hero-card.is-video').boundingBox();
      const heading = await page
        .locator('.banner-hero-card.is-video .banner-hero-title')
        .boundingBox();
      const script = await page
        .locator('.banner-hero-card.is-video .banner-hero-script-tag')
        .boundingBox();
      return Boolean(
        videoCard &&
        heading &&
        script &&
        heading.x < videoCard.x &&
        script.x + script.width > videoCard.x + videoCard.width
      );
    })
    .toBe(true);
});

test('52: every populated collage slide stays visible after switching', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  const selector = page.locator('.collage-slide-indicators');
  await selector.scrollIntoViewIfNeeded();
  const section = page.locator('.visual-categories-section');
  await expect(section).toHaveCSS('opacity', '1');
  const firstCollage = page
    .locator('.visual-category-scroll-track .category-cover-collage')
    .first();
  await expect(firstCollage).toBeVisible();
  expect(await firstCollage.locator('img').count()).toBeGreaterThanOrEqual(2);
  for (const tab of await selector.getByRole('tab').all()) {
    await tab.click();
    expect(await section.evaluate((element) => getComputedStyle(element).opacity)).toBe('1');
    const track = page.locator('.visual-category-scroll-track');
    await expect(track.locator('.visual-category-card').first()).toBeVisible();
    await expect(track).not.toHaveCSS('opacity', '0');
    const images = track.locator('.visual-category-card img');
    if (await images.count()) {
      await expect
        .poll(() => images.first().evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);
    }
  }
});

test('50: detail cart and favorite both launch a thumbnail toward the header', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/catalog');
  await page.locator('.catalog-products-container .product-card').first().click();
  const detail = page.locator('.product-detail-page-container');
  await expect(detail).toBeVisible();
  await detail.getByRole('button', { name: 'Səbətə əlavə et' }).first().click();
  await expect(page.locator('.cart-flight-item img')).toBeVisible();
  await expect(page.locator('.cart-flight-item')).toHaveCount(0);
  await detail.getByRole('button', { name: 'Seçilmişlərə at' }).click();
  await expect(page.locator('.cart-flight-item img')).toBeVisible();
});
