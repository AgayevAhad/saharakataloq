import { test, expect } from '@playwright/test';

test.describe('Duzelisler Items 35 to 45 Comprehensive Real Browser E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  // Item 40: Dark mode sticky header elevated glassmorphism background
  test('Item 40: Header in dark mode has elevated glassmorphism background rgba(15, 23, 42, 0.88)', async ({
    page,
  }) => {
    await page.goto('/');
    // Set theme in localStorage
    await page.evaluate(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
    });
    await page.reload();
    await page.waitForTimeout(400);

    const header = page.locator('header.site-header, header');
    await expect(header).toBeVisible();
    const bg = await header.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // rgba(15, 23, 42, 0.88)
    expect(bg).toContain('rgba(15, 23, 42');
  });

  // Item 35: Dark mode contrast on section titles and headings
  test('Item 35: Headings and section titles have high contrast in dark mode', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
    });
    await page.reload();
    await page.waitForTimeout(400);

    const categoryTitle = page.locator('.visual-categories-title');
    await expect(categoryTitle).toBeVisible();
    const color = await categoryTitle.evaluate((el) => window.getComputedStyle(el).color);
    // #f8fafc -> rgb(248, 250, 252)
    expect(color).toBe('rgb(248, 250, 252)');
  });

  test('Item 37: dark catalog keeps text legible and product cards sharp on hover', async ({
    page,
  }) => {
    await page.goto('/catalog');
    await page.evaluate(() => localStorage.setItem('sahara_theme_mode', 'dark'));
    await page.reload();
    const title = page.locator('.catalog-page-header h1');
    const card = page.locator('.catalog-products-container .product-card').first();
    await expect(title).toBeVisible();
    await expect(card).toBeVisible();
    await expect(title).toHaveCSS('color', /rgb\((24[0-9]|25[0-5]),/);
    // The catalog toolbar may be transparent after the user-customized
    // catalog styling; contrast and hover legibility are the behavior to keep.
    await expect(page.locator('.catalog-sticky-toolbar')).toBeVisible();
    await card.hover();
    await expect(card).toHaveCSS('filter', 'none');
    await expect(card).toHaveCSS('opacity', '1');
    const box = await card.boundingBox();
    expect(box?.width).toBeGreaterThan(150);
    await expect(page.locator('.catalog-sticky-toolbar')).toBeVisible();
  });

  // Items 41/53: The full video should fit in the desktop viewport without cropping.
  test('Items 41/53: BannerHero video is complete and fits below the sticky header', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/');
    const hero = page.locator('.banner-hero-card, .banner-hero-section');
    await expect(hero.first()).toBeVisible();
    const bounds = await hero.first().boundingBox();
    expect(bounds).toBeTruthy();
    expect(bounds!.height).toBeGreaterThan(440);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(900);
    await expect(hero.first().locator('video')).toHaveCSS('object-fit', 'contain');
  });

  // Item 42: Favorites icon red highlight
  test('Item 42: Favorites heart icon highlights in red on favorites page or when favoritesCount > 0', async ({
    page,
  }) => {
    await page.goto('/favorites');
    await page.waitForTimeout(300);
    const favBtn = page.locator('.header-favorites-btn');
    await expect(favBtn.first()).toBeVisible();
    const heartSvg = favBtn.first().locator('svg');
    const strokeOrFill = await heartSvg.evaluate((el) => {
      return (
        el.getAttribute('stroke') || el.getAttribute('fill') || window.getComputedStyle(el).color
      );
    });
    expect(strokeOrFill).toContain('#ef4444');
  });

  // Item 43: TrustHighlights all 4 cards clickable interactive navigation
  test('Item 43: TrustHighlights cards are interactive and navigate to correct pages', async ({
    page,
  }) => {
    await page.goto('/');
    const trustSection = page.locator('.trust-highlights-section');
    await trustSection.scrollIntoViewIfNeeded();
    await expect(trustSection).toBeVisible();

    const warrantyCard = page
      .locator('[data-trust-id="warranty"], .trust-highlight-card')
      .filter({ hasText: 'Rəsmi zəmanət' });
    await expect(warrantyCard.first()).toBeVisible();
    await warrantyCard.first().click();
    await page.waitForTimeout(400);
    // Navigates to clean URL /zemanet or /warranty
    expect(page.url()).toMatch(/\/(zemanet|warranty)/);
  });

  // Item 44: CustomerCare / Support page WhatsApp & Call buttons symmetry and soft colors
  test('Item 44: Customer care WhatsApp (soft green) and Call (soft red) buttons are symmetrical', async ({
    page,
  }) => {
    await page.goto('/support');
    await page.waitForTimeout(300);

    const waBtn = page.getByRole('button', { name: /WhatsApp/i });
    const callBtn = page.getByRole('button', { name: /Zəng/i });

    await expect(waBtn.first()).toBeVisible();
    await expect(callBtn.first()).toBeVisible();
    const waBg = await waBtn.first().evaluate((el) => window.getComputedStyle(el).backgroundColor);
    const callBg = await callBtn
      .first()
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(waBg).toContain('rgba(34, 197, 94');
    expect(callBg).toContain('rgba(220, 38, 38');
    const waBox = await waBtn.first().boundingBox();
    const callBox = await callBtn.first().boundingBox();
    expect(Math.abs((waBox?.y ?? 0) - (callBox?.y ?? 0))).toBeLessThanOrEqual(2);
    expect(Math.abs((waBox?.height ?? 0) - (callBox?.height ?? 0))).toBeLessThanOrEqual(2);
  });

  // Item 36: Brand logo cards on BrandsPage have pure white backgrounds in dark mode
  test('Item 36: BrandsPage brand logo cards have pure white containers in dark mode', async ({
    page,
  }) => {
    await page.goto('/brands');
    await page.evaluate(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
    });
    await page.reload();
    await page.waitForTimeout(400);

    const logoBoxes = page.locator('.brand-card-logo-box');
    await expect(logoBoxes.first()).toBeVisible();
    const bg = await logoBoxes
      .first()
      .evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(255, 255, 255)');
  });

  // Item 38: MegaMenu no thin red borders
  test('Item 38: MegaMenu category/brand links have no red borders', async ({ page }) => {
    await page.goto('/');
    const catalogTrigger = page
      .locator('.nav-catalog-pill-btn, button:has-text("Kataloq")')
      .first();
    if (await catalogTrigger.isVisible()) {
      await catalogTrigger.click();
      await page.waitForTimeout(300);

      const megaLinks = page.locator('.mega-menu-link');
      if ((await megaLinks.count()) > 0) {
        const border = await megaLinks
          .first()
          .evaluate((el) => window.getComputedStyle(el).borderColor);
        expect(border).not.toBe('rgb(227, 30, 36)');
      }
    }
  });

  // Item 39: Floating chat button has attention pulse animation
  test('Item 39: Floating chat button has attention pulse animation', async ({ page }) => {
    await page.goto('/');
    const chatBtn = page.locator('.customer-chat-trigger');
    await expect(chatBtn).toBeVisible();
    const anim = await chatBtn.evaluate((el) => window.getComputedStyle(el).animationName);
    expect(anim).toContain('chatPulseAnim');
    await expect(chatBtn).toHaveCSS('color', 'rgb(185, 28, 28)');
  });

  // Item 45: Product detail page has soft green WhatsApp and soft red Call/Cart buttons
  test('Item 45: Product detail page buttons use soft tinted backgrounds', async ({ page }) => {
    await page.goto('/catalog');
    await page.waitForTimeout(500);

    const productCard = page.locator('.product-card').first();
    if ((await productCard.count()) > 0) {
      await productCard.click();
      await page.waitForTimeout(500);

      const waBtn = page.getByRole('button', { name: /WhatsApp ilə/i });
      if ((await waBtn.count()) > 0) {
        const waBg = await waBtn
          .first()
          .evaluate((el) => window.getComputedStyle(el).backgroundColor);
        expect(waBg).toContain('rgba(34, 197, 94');
      }

      const callBtn = page.getByRole('button', { name: /Zəng et/i });
      if ((await callBtn.count()) > 0) {
        const callBg = await callBtn
          .first()
          .evaluate((el) => window.getComputedStyle(el).backgroundColor);
        expect(callBg).toContain('rgba(220, 38, 38');
      }
    }
  });
});
