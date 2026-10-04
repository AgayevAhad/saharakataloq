import { expect, test, type Page } from '@playwright/test';

async function selectTheme(page: Page, theme: string) {
  await page.evaluate((nextTheme) => {
    window.dispatchEvent(new CustomEvent('sahara-theme-change', { detail: nextTheme }));
  }, theme);
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    theme === 'dark' ? 'dark' : theme
  );
}

const computedColors = (selector: string) =>
  document.querySelector(selector)
    ? (() => {
        const styles = getComputedStyle(document.querySelector(selector) as HTMLElement);
        return {
          background: styles.backgroundColor,
          backgroundImage: styles.backgroundImage,
          color: styles.color,
        };
      })()
    : null;

test.describe('public product card dark surfaces', () => {
  test('themes the complete catalog card in every dark variant and preserves light mode', async ({
    page,
  }) => {
    await page.goto('/catalog');
    const card = page.locator('.product-card:not(.featured-product-card)').first();
    await expect(card).toBeVisible();

    for (const theme of ['dark', 'dark-slate', 'dark-glass', 'dark-oled']) {
      await selectTheme(page, theme);
      const colors = await page.evaluate(
        computedColors,
        '.product-card:not(.featured-product-card)'
      );
      const media = await page.evaluate(computedColors, '.product-card-img-wrap');
      const title = await page.evaluate(computedColors, '.product-card-full-title');
      const category = await page.evaluate(computedColors, '.product-card-category-top');
      const share = await page.evaluate(computedColors, '.product-card .card-action-btn-share');

      expect(colors?.background).not.toBe('rgb(255, 255, 255)');
      expect(media?.background).toBe('rgb(23, 27, 34)');
      expect(media?.backgroundImage).toContain('radial-gradient');
      expect(title?.color).toBe('rgb(248, 250, 252)');
      expect(category?.background).not.toBe('rgb(241, 245, 249)');
      expect(share?.background).not.toBe('rgb(248, 250, 252)');
    }

    await selectTheme(page, 'light');
    const lightCard = await page.evaluate(
      computedColors,
      '.product-card:not(.featured-product-card)'
    );
    expect(lightCard?.background).toBe('rgb(255, 255, 255)');
  });

  test('themes featured and category cards without horizontal overflow on mobile', async ({
    page,
  }) => {
    await page.goto('/');
    await selectTheme(page, 'dark');

    const categoryCard = page.locator('.visual-category-card').first();
    await categoryCard.scrollIntoViewIfNeeded();
    await expect(categoryCard).toBeVisible();
    const category = await page.evaluate(computedColors, '.visual-category-card');
    const categoryTitle = await page.evaluate(computedColors, '.visual-category-title');
    const featured = await page.evaluate(computedColors, '.featured-product-card');
    const featuredTitle = await page.evaluate(computedColors, '.featured-product-title');

    expect(category?.background).not.toBe('rgb(255, 255, 255)');
    expect(categoryTitle?.color).toBe('rgb(248, 250, 252)');
    expect(featured?.background).not.toBe('rgb(255, 255, 255)');
    expect(featuredTitle?.color).toBe('rgb(248, 250, 252)');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/catalog');
    await selectTheme(page, 'dark');
    const share = page.locator('.product-card .card-action-btn-share').first();
    await expect(share).toBeVisible();
    expect(await share.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgb(248, 250, 252)'
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      )
    ).toBe(false);
  });

  test('keeps the website-only card overrides out of wholesale catalog mode', async ({ page }) => {
    await page.goto('/?mode=catalog');
    await selectTheme(page, 'dark');
    await expect(page.locator('.catalog-shell')).toBeVisible();
    await expect(page.locator('.app-shell')).toHaveCount(0);
  });
});
