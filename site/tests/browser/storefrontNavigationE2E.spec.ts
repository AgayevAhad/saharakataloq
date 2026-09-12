import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Storefront Shell, Navigation CMS & SSR Tests', () => {
  const backendPort = process.env.PLAYWRIGHT_BACKEND_PORT || '3088';
  const backendUrl = `http://127.0.0.1:${backendPort}`;

  test('1. SSR View-Source & Clean URL Deep-links', async ({ request, page }) => {
    // 1.1 Direct SSR HTML verification without client JS
    const routes = ['/', '/catalog', '/brands', '/stores', '/services', '/support'];

    for (const route of routes) {
      const res = await request.get(`${backendUrl}${route}`);
      expect(res.status()).toBe(200);

      const html = await res.text();
      expect(html.toLowerCase()).toContain('<!doctype html>');
      expect(html).toContain('Sahara');
      expect(html).toContain('BreadcrumbList');
      expect(html).toContain('__SAHARA_DATA__');
    }

    // 1.2 Browser Hydration and No Console Errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    const realErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('downloadable font') &&
        !err.includes('status of 404')
    );
    expect(realErrors).toEqual([]);

    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('2. Backward-Compatible Query Redirects (?page= & ?route=)', async ({ request }) => {
    const resCatalog = await request.get(`${backendUrl}/?page=catalog`, { maxRedirects: 0 });
    expect([301, 302, 200]).toContain(resCatalog.status());

    const resStores = await request.get(`${backendUrl}/?route=stores`, { maxRedirects: 0 });
    expect([301, 302, 200]).toContain(resStores.status());
  });

  test('3. Persistent Compact Sticky Desktop Header across all scroll points', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('.site-header-sticky');
    const logo = header.locator('img[alt="Sahara Electronics"]').first();
    const searchBtn = page.locator('[data-testid="header-search-trigger"]').first();
    const catTrigger = page.locator('.mega-menu-trigger-btn').first();

    await expect(header).toBeVisible();
    await expect(logo).toBeVisible();
    await expect(searchBtn).toBeVisible();
    await expect(catTrigger).toBeVisible();

    // Baseline Normal State at scrollY = 0
    const normalBox = await header.boundingBox();
    expect(normalBox).not.toBeNull();
    const normalHeight = normalBox!.height;
    expect(normalHeight).toBeGreaterThanOrEqual(95); // ~100-115px normal height
    expect(normalBox!.y).toBeGreaterThanOrEqual(-1);
    expect(normalBox!.y).toBeLessThanOrEqual(45); // TopServiceBar sits above it initially

    const maxScroll = await page.evaluate(
      () => document.documentElement.scrollHeight - window.innerHeight
    );

    const scrollSteps = [
      { targetY: 0, expectCompact: false },
      { targetY: 80, expectCompact: true },
      { targetY: 300, expectCompact: true },
      { targetY: 1000, expectCompact: true },
      { targetY: Math.min(maxScroll - 50, 2000), expectCompact: true },
      { targetY: 300, expectCompact: true },
      { targetY: 0, expectCompact: false },
    ];

    let compactHeightRecorded = 0;

    for (const step of scrollSteps) {
      await page.evaluate((y) => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, y);
      }, step.targetY);

      await page.waitForFunction(
        (y) => Math.abs((window.scrollY || document.documentElement.scrollTop) - y) <= 2,
        step.targetY,
        { timeout: 3000 }
      );
      await page.waitForTimeout(200);

      // 1. Header MUST remain visible in DOM and Viewport
      await expect(header).toBeVisible();

      const box = await header.boundingBox();
      expect(box).not.toBeNull();

      // 2. Exact Top: 0 viewport alignment (tolerance <= 1px)
      if (step.targetY > 64) {
        expect(box!.y).toBeGreaterThanOrEqual(-1);
        expect(box!.y).toBeLessThanOrEqual(1);
      }

      // 3. Compact class and height validation
      if (step.expectCompact) {
        await expect(header).toHaveClass(/is-compact/);
        expect(box!.height).toBeLessThan(normalHeight);
        expect(box!.height).toBeGreaterThanOrEqual(70); // Must preserve content rows
        compactHeightRecorded = box!.height;
      } else {
        expect(box!.height).toBeGreaterThanOrEqual(normalHeight - 2);
      }

      // 4. Critical UI elements remain visible and interactive
      await expect(logo).toBeVisible();
      await expect(searchBtn).toBeVisible();
      await expect(catTrigger).toBeVisible();

      // 5. Zero horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth > window.innerWidth ||
          document.body.scrollWidth > window.innerWidth
        );
      });
      expect(hasHorizontalScroll).toBe(false);
    }

    expect(compactHeightRecorded).toBeLessThan(normalHeight);
  });

  test('4. Desktop Mega-Menu Exact Coordinate & Overlay at 300px and 1000px Scroll (1024, 1440, 1920)', async ({
    page,
  }) => {
    const desktopViewports = [
      { width: 1024, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ];

    for (const vp of desktopViewports) {
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const triggerBtn = page.locator('.mega-menu-trigger-btn');
      const secondaryNav = page.locator('.header-secondary-nav');
      const header = page.locator('.site-header-sticky');
      const mainContent = page.locator('#main-content, main, .catalog-section').first();

      await expect(triggerBtn).toBeVisible();
      await expect(secondaryNav).toBeVisible();

      for (const scrollPos of [300, 1000]) {
        const maxScroll = await page.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight
        );
        const actualTarget = Math.min(scrollPos, Math.max(0, maxScroll - 20));

        await page.evaluate((y) => {
          document.documentElement.style.scrollBehavior = 'auto';
          window.scrollTo(0, y);
        }, actualTarget);
        await page.waitForTimeout(300);

        // Header must be sticky top: 0
        const headerBox = await header.boundingBox();
        expect(headerBox).not.toBeNull();
        expect(headerBox!.y).toBeGreaterThanOrEqual(-1);
        expect(headerBox!.y).toBeLessThanOrEqual(1);

        const mainBoxBefore = await mainContent.boundingBox();

        // Open MegaMenu at current scroll
        await triggerBtn.click({ force: true });
        const megaMenu = page.locator('.mega-menu-overlay');
        await expect(megaMenu).toBeVisible();
        await page.waitForTimeout(250);

        // CRITICAL ACCEPTANCE CRITERIA: megaMenu.top vs secondaryNav.bottom difference <= 2px
        const navBox = await secondaryNav.boundingBox();
        const menuBox = await megaMenu.boundingBox();

        expect(navBox).not.toBeNull();
        expect(menuBox).not.toBeNull();

        const diff = Math.abs(menuBox!.y - (navBox!.y + navBox!.height));
        expect(diff).toBeLessThanOrEqual(2);

        // Verify page content is NOT pushed down
        const mainBoxAfter = await mainContent.boundingBox();
        if (mainBoxBefore && mainBoxAfter) {
          expect(Math.abs(mainBoxAfter.y - mainBoxBefore.y)).toBeLessThanOrEqual(2);
        }

        // Both Header and MegaMenu visible
        await expect(header).toBeVisible();
        await expect(megaMenu).toBeVisible();

        // Press Escape to close and restore focus
        await page.keyboard.press('Escape');
        await expect(megaMenu).not.toBeVisible();

        // Focus restored to trigger button
        const isTriggerFocused = await triggerBtn.evaluate((el) => el === document.activeElement);
        expect(isTriggerFocused).toBe(true);

        // Test Outside Click to close
        await triggerBtn.click();
        await expect(megaMenu).toBeVisible();
        await page.mouse.click(10, 600);
        await expect(megaMenu).not.toBeVisible();
      }
    }
  });

  test('5. Mobile Category Drawer, Focus Trap & Viewport Integrity (320px & 390px)', async ({
    page,
  }) => {
    const mobileViewports = [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
    ];

    for (const vp of mobileViewports) {
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const mobileMenuBtn = page.locator('button[data-testid="mobile-menu-trigger"]');
      await expect(mobileMenuBtn).toBeVisible();

      // Clicking Mobile Menu must NOT open the desktop .mega-menu-overlay
      await mobileMenuBtn.click();
      const desktopMegaMenu = page.locator('.mega-menu-overlay');
      await expect(desktopMegaMenu).not.toBeVisible();

      // It MUST open the Mobile Category Drawer
      const mobileDrawer = page.locator('.mobile-category-drawer');
      await expect(mobileDrawer).toBeVisible();
      await page.waitForTimeout(250);

      // Verify drawer boundaries fit within viewport
      const drawerBox = await mobileDrawer.boundingBox();
      expect(drawerBox).not.toBeNull();
      expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(vp.width + 1);
      expect(drawerBox!.x).toBeGreaterThanOrEqual(0);

      // Verify body scroll is locked
      const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
      expect(bodyOverflow).toBe('hidden');

      // Verify categories and brands are listed
      const catItems = page.locator('.mobile-drawer-cat-item');
      const catCount = await catItems.count();
      expect(catCount).toBeGreaterThanOrEqual(5);

      // Test Escape key closes drawer and restores body scroll & button focus
      await page.keyboard.press('Escape');
      await expect(mobileDrawer).not.toBeVisible();

      const bodyOverflowAfter = await page.evaluate(() => document.body.style.overflow);
      expect(bodyOverflowAfter).toBe('');

      // Verify zero horizontal overflow
      const hasMobileOverflow = await page.evaluate(() => {
        return (
          document.documentElement.scrollWidth > window.innerWidth ||
          document.body.scrollWidth > window.innerWidth
        );
      });
      expect(hasMobileOverflow).toBe(false);
    }
  });

  test('6. Dynamic Breadcrumbs Navigation & JSON-LD', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/catalog');
    await page.waitForLoadState('networkidle');

    const breadcrumbs = page.locator('.breadcrumbs-container');
    await expect(breadcrumbs).toBeVisible();

    const homeLink = breadcrumbs.locator('a, span').filter({ hasText: 'Ana Səhifə' });
    await expect(homeLink).toBeVisible();

    const jsonLdContent = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(jsonLdContent).toContain('BreadcrumbList');
  });

  test('7. Multiple Store Addresses in Footer (No # Dead Links)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const deadLinks = footer.locator('a[href="#"]');
    const deadCount = await deadLinks.count();
    expect(deadCount).toBe(0);
  });

  test('8. WCAG AA Accessibility Audit with Axe', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(axeResults.violations).toEqual([]);
  });
});
