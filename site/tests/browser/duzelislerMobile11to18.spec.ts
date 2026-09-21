import { expect, test } from '@playwright/test';

test.describe('Duzelisler mobile 11–18', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('catalog actions remain while centered, then move to the next card', async ({ page }) => {
    await page.goto('/catalog');
    const cards = page.locator('.catalog-products-container.is-grid-view .product-card');
    await expect(cards.nth(1)).toBeVisible();
    await cards.first().evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect(cards.first()).toHaveClass(/mobile-focused/);
    await expect(cards.first().locator('.card-hover-actions-cluster')).toHaveCSS('opacity', '1');
    await page.waitForTimeout(2800);
    await expect(cards.first().locator('.card-hover-actions-cluster')).toHaveCSS('opacity', '1');

    await cards.nth(1).evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect(cards.nth(1)).toHaveClass(/mobile-focused/);
    await expect(cards.first()).not.toHaveClass(/mobile-focused/);
    await expect(cards.nth(1).locator('.card-hover-actions-cluster')).toHaveCSS('opacity', '1');
  });

  test('home product focus reveals WhatsApp, call, cart, favorite and compare', async ({
    page,
  }) => {
    await page.goto('/');
    const card = page.locator('.featured-products-grid .featured-product-card').first();
    await expect(card).toBeVisible();
    await card.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await expect(card).toHaveClass(/mobile-focused/);
    await expect(card.locator('.card-hover-actions-cluster')).toHaveCSS('opacity', '1');
    await expect(card.locator('.product-card-top-actions')).toHaveCSS('opacity', '1');
    await expect(card.getByRole('button', { name: 'WhatsApp' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Zəng et' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Səbətə əlavə et' })).toBeVisible();
    await expect(
      card.getByRole('button', { name: /Sevimlilərə əlavə et|Sevimlilərdən çıxar/ })
    ).toBeVisible();
    await expect(card.getByRole('button', { name: 'Müqayisə et' })).toBeVisible();
    const cardBox = await card.boundingBox();
    const gridBox = await page.locator('.featured-products-grid').boundingBox();
    expect(cardBox && gridBox).toBeTruthy();
    expect(Math.abs(cardBox!.x - gridBox!.x - (gridBox!.width - cardBox!.width) / 2)).toBeLessThan(
      3
    );
  });

  test('mobile drawer uses the shared category glyphs and readable brand marks', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Əsas menyunu aç' }).click();
    const drawer = page.getByRole('dialog', { name: /Mobil Kateqoriya və Naviqasiya Menyu/i });
    await expect(drawer.locator('.mobile-drawer-cat-item').first()).toBeVisible();
    const count = await drawer.locator('.mobile-drawer-cat-item').count();
    expect(await drawer.locator('.mobile-drawer-cat-item .category-glyph').count()).toBe(count);
    await expect(drawer.locator('.mobile-drawer-brand-logo').first()).toBeVisible();
  });

  test('mobile search hides internal red scrollbars and Back closes without leaving the page', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('header-search-input-mobile').click();
    const panel = page.locator('.mobile-header-search-expand-wrap');
    await expect(panel).toBeVisible();
    expect(await panel.evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe(
      'none'
    );
    await page.goBack();
    await expect(panel).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/');

    await page.getByTestId('header-search-input-mobile').click();
    await expect(panel).toBeVisible();
    await expect(page.getByRole('button', { name: 'Axtarışı bağla' })).toBeVisible();
    await page.locator('.header-search-clickaway').click({ position: { x: 10, y: 730 } });
    await expect(panel).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('category controls, discount and trust cards align without page overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    const positions = await page.evaluate(() => {
      const section = document.querySelector('.visual-categories-section')!.getBoundingClientRect();
      const tabs = document.querySelector('.collage-slide-indicators')!.getBoundingClientRect();
      const discount = document.querySelector('.special-discount-card')!.getBoundingClientRect();
      const trust = document.querySelector('.trust-highlights-grid')!.getBoundingClientRect();
      return {
        sectionLeft: section.left,
        sectionRight: section.right,
        tabsLeft: tabs.left,
        tabsRight: tabs.right,
        discountLeft: discount.left,
        discountRight: discount.right,
        trustLeft: trust.left,
        trustRight: trust.right,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(positions.tabsLeft).toBeGreaterThanOrEqual(positions.sectionLeft - 2);
    expect(positions.tabsRight).toBeLessThanOrEqual(positions.sectionRight + 2);
    expect(positions.discountLeft).toBeGreaterThanOrEqual(0);
    expect(positions.discountRight).toBeLessThanOrEqual(320);
    expect(positions.trustLeft).toBeGreaterThanOrEqual(0);
    expect(positions.trustRight).toBeLessThanOrEqual(320);
    expect(positions.overflow).toBe(false);
  });

  test('product detail media and controls fit a 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/catalog');
    const card = page.locator('.catalog-products-container .product-card').first();
    await expect(card).toBeVisible();
    await card.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await card.click({ position: { x: 160, y: 145 } });
    const detail = page.locator('.product-detail-page-container');
    await expect(detail).toBeVisible();
    const geometry = await page.evaluate(() => {
      const stage = document.querySelector('.product-detail-main-stage')!.getBoundingClientRect();
      const grid = document.querySelector('.product-detail-hero-grid')!.getBoundingClientRect();
      return {
        stageLeft: stage.left,
        stageRight: stage.right,
        gridRight: grid.right,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(geometry.stageLeft).toBeGreaterThanOrEqual(0);
    expect(geometry.stageRight).toBeLessThanOrEqual(320);
    expect(geometry.gridRight).toBeLessThanOrEqual(320);
    expect(geometry.overflow).toBe(false);
  });
});
