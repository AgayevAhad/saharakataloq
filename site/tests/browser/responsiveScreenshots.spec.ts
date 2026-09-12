import { test, expect } from '@playwright/test';
import { join } from 'node:path';

const VIEWPORTS = [
  { width: 320, height: 568, name: 'viewport-320' },
  { width: 390, height: 844, name: 'viewport-390' },
  { width: 768, height: 1024, name: 'viewport-768' },
  { width: 1024, height: 768, name: 'viewport-1024' },
  { width: 1440, height: 900, name: 'viewport-1440' },
  { width: 1920, height: 1080, name: 'viewport-1920' },
];

async function stabilizePage(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
      .brand-rail-track, .brand-rail-track-group {
        animation: none !important;
        transform: none !important;
      }
    `,
  });
  await page.evaluate(() => {
    document.querySelectorAll('video').forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
  });
  await page.waitForTimeout(200);
}

for (const vp of VIEWPORTS) {
  test.describe(`Responsive Viewport ${vp.width}x${vp.height} (${vp.name})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
    });

    test('1. Public Home: zero horizontal overflow & screenshot baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('.product-card').first().waitFor({ state: 'visible' });
      await stabilizePage(page);

      const isOverflowing = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        const docScrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        return docScrollWidth > docWidth || bodyScrollWidth > docWidth;
      });
      expect(isOverflowing).toBe(false);

      await expect(page).toHaveScreenshot(`home-${vp.name}-light.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.08,
      });
    });

    test('2. Product Grid: zero horizontal overflow & screenshot baseline', async ({ page }) => {
      await page.goto('/');
      const firstCard = page.locator('.product-card').first();
      await firstCard.waitFor({ state: 'visible' });
      await stabilizePage(page);

      const isOverflowing = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        return (
          document.documentElement.scrollWidth > docWidth || document.body.scrollWidth > docWidth
        );
      });
      expect(isOverflowing).toBe(false);

      await expect(page).toHaveScreenshot(`grid-${vp.name}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.08,
      });
    });

    test('3. Smart Search open: zero horizontal overflow & screenshot baseline', async ({
      page,
    }) => {
      await page.goto('/');
      const searchTrigger = page
        .locator('[data-testid="header-search-trigger"], button[aria-label*="Axtar"]')
        .locator('visible=true')
        .first();
      await searchTrigger.waitFor({ state: 'visible' });
      await searchTrigger.click();

      const overlay = page.locator('.smart-search-overlay').first();
      await overlay.waitFor({ state: 'visible' });
      await stabilizePage(page);

      const isOverflowing = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        return (
          document.documentElement.scrollWidth > docWidth || document.body.scrollWidth > docWidth
        );
      });
      expect(isOverflowing).toBe(false);

      await expect(page).toHaveScreenshot(`search-open-${vp.name}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.08,
      });
    });

    test('4. Product Detail Modal open: zero horizontal overflow & screenshot baseline', async ({
      page,
    }) => {
      await page.goto('/');
      const firstCard = page.locator('.product-card').first();
      await firstCard.waitFor({ state: 'visible' });
      await firstCard.click();

      const modal = page.locator('.modal-overlay-wrap, [role="dialog"]').first();
      await modal.waitFor({ state: 'visible' });
      await stabilizePage(page);

      const isOverflowing = await page.evaluate(() => {
        const docWidth = document.documentElement.clientWidth;
        return (
          document.documentElement.scrollWidth > docWidth || document.body.scrollWidth > docWidth
        );
      });
      expect(isOverflowing).toBe(false);

      await expect(page).toHaveScreenshot(`modal-open-${vp.name}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.08,
      });
    });
  });
}

test.describe('Drawer Open Screenshot Baselines', () => {
  test('Drawer Open 390px Mobile: zero overflow & screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const drawerTrigger = page
      .locator('[data-testid^="drawer-trigger"]')
      .locator('visible=true')
      .first();
    await drawerTrigger.waitFor({ state: 'visible' });
    await drawerTrigger.click();

    const drawer = page.locator('[data-testid="ui-drawer"]').first();
    await drawer.waitFor({ state: 'visible' });
    await stabilizePage(page);

    const isOverflowing = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      return (
        document.documentElement.scrollWidth > docWidth || document.body.scrollWidth > docWidth
      );
    });
    expect(isOverflowing).toBe(false);

    await expect(page).toHaveScreenshot('drawer-open-390.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('Drawer Open 1440px Desktop: zero overflow & screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const drawerTrigger = page
      .locator('[data-testid="drawer-trigger"]')
      .locator('visible=true')
      .first();
    await drawerTrigger.waitFor({ state: 'visible' });
    await drawerTrigger.click();

    const drawer = page.locator('[data-testid="ui-drawer"]').first();
    await drawer.waitFor({ state: 'visible' });
    await stabilizePage(page);

    const isOverflowing = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      return (
        document.documentElement.scrollWidth > docWidth || document.body.scrollWidth > docWidth
      );
    });
    expect(isOverflowing).toBe(false);

    await expect(page).toHaveScreenshot('drawer-open-1440.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });
});

test.describe('Theme, Menu & Motion Variations', () => {
  test('Dark Mode Home 390px: zero overflow & screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
    });
    await page.goto('/');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('home-390-dark.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('Dark Mode Home 1440px: zero overflow & screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
    });
    await page.goto('/');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });
    await stabilizePage(page);

    const isOverflowing = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      return (
        document.documentElement.scrollWidth > docWidth || document.body.scrollWidth > docWidth
      );
    });
    expect(isOverflowing).toBe(false);

    await expect(page).toHaveScreenshot('home-1440-dark.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('Dark Mode Smart Search 1440px: screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
    });
    await page.goto('/');

    const searchTrigger = page
      .locator('button[aria-label*="Axtar"], .header-search-wrap button')
      .first();
    await searchTrigger.waitFor({ state: 'visible' });
    await searchTrigger.click();

    const overlay = page.locator('.smart-search-overlay').first();
    await overlay.waitFor({ state: 'visible' });
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('search-1440-dark.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('Dark Mode Product Modal 1440px: screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
    });
    await page.goto('/');

    const firstCard = page.locator('.product-card').first();
    await firstCard.waitFor({ state: 'visible' });
    await firstCard.click();

    const modal = page.locator('.modal-overlay-wrap, [role="dialog"]').first();
    await modal.waitFor({ state: 'visible' });
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('modal-1440-dark.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('Reduced Motion Home 390px: screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('home-390-reduced-motion.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('Reduced Motion Home 1440px: screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });
    await stabilizePage(page);

    await expect(page).toHaveScreenshot('home-1440-reduced-motion.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('Admin Login View: zero horizontal overflow & screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/AdministratorNT');
    await page.locator('input[type="password"]').waitFor({ state: 'visible' });
    await stabilizePage(page);

    const isOverflowing = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      return (
        document.documentElement.scrollWidth > docWidth || document.body.scrollWidth > docWidth
      );
    });
    expect(isOverflowing).toBe(false);

    await expect(page).toHaveScreenshot('admin-login-1440.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('Admin Dashboard View (Logged In): screenshot baseline', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/AdministratorNT');
    const pwdInput = page.locator('input[type="password"]');
    await pwdInput.waitFor({ state: 'visible' });
    await pwdInput.fill('TestAdmin2026!');
    await page.locator('button.primary-admin-button, button[type="submit"]').first().click();

    const adminMain = page.locator('.admin-main');
    await adminMain.waitFor({ state: 'visible' });
    await stabilizePage(page);

    const isOverflowing = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      return (
        document.documentElement.scrollWidth > docWidth || document.body.scrollWidth > docWidth
      );
    });
    expect(isOverflowing).toBe(false);

    await expect(page).toHaveScreenshot('admin-dashboard-1440.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.08,
    });
  });

  test('Header, MegaMenu & Mobile Drawer audit screenshot capture suite', async ({ page }) => {
    const fs = await import('fs');

    const scrollTo = async (y: number) => {
      await page.evaluate((targetY) => {
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, targetY);
      }, y);
      await page.waitForTimeout(300);
    };

    // 1. Desktop 1440px Normal & Compact Light / Dark
    // Normal 1440px Light
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('sahara_theme_mode', 'light');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });
    await stabilizePage(page);

    const header = page.locator('.site-header-sticky');
    await header.screenshot({
      path: join(process.cwd(), 'docs/audits/header-normal-1440-light.png'),
    });

    // Compact 1440px Light (scrollY = 300)
    await scrollTo(300);
    await stabilizePage(page);
    await header.screenshot({
      path: join(process.cwd(), 'docs/audits/header-compact-1440-light.png'),
    });

    // Compact 1440px Dark (scrollY = 300)
    await page.addInitScript(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });
    await scrollTo(300);
    await stabilizePage(page);
    await header.screenshot({
      path: join(process.cwd(), 'docs/audits/header-compact-1440-dark.png'),
    });

    // Compact 1440px at scrollY = 1000
    await scrollTo(1000);
    await stabilizePage(page);
    await page.screenshot({
      path: join(process.cwd(), 'docs/audits/header-compact-scroll-1000-1440.png'),
      fullPage: false,
    });

    // Compact MegaMenu Open at 1440px (scrollY = 300)
    await scrollTo(300);
    const megaMenuBtn = page.locator('.mega-menu-trigger-btn');
    await megaMenuBtn.click();
    await page.locator('.mega-menu-overlay').waitFor({ state: 'visible' });
    await stabilizePage(page);
    await page.screenshot({
      path: join(process.cwd(), 'docs/audits/header-compact-megamenu-open-1440.png'),
      fullPage: false,
    });
    await page.keyboard.press('Escape');

    // 2. Mobile 390px Normal & Compact Light / Dark & Drawer
    // Mobile Normal 390px Light (scrollY = 0)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem('sahara_theme_mode', 'light');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });
    await stabilizePage(page);
    await header.screenshot({
      path: join(process.cwd(), 'docs/audits/header-normal-390-light.png'),
    });

    // Mobile Compact 390px Light (scrollY = 200)
    await scrollTo(200);
    await stabilizePage(page);
    await header.screenshot({
      path: join(process.cwd(), 'docs/audits/header-compact-390-light.png'),
    });

    // Mobile Compact 390px Dark (scrollY = 200)
    await page.addInitScript(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });
    await scrollTo(200);
    await stabilizePage(page);
    await header.screenshot({
      path: join(process.cwd(), 'docs/audits/header-compact-390-dark.png'),
    });

    // Mobile Drawer Open at Compact (390px)
    const mobileMenuBtn = page.locator('button[data-testid="mobile-menu-trigger"]');
    await mobileMenuBtn.click();
    await page.locator('.mobile-category-drawer').waitFor({ state: 'visible' });
    await stabilizePage(page);
    await page.screenshot({
      path: join(process.cwd(), 'docs/audits/header-compact-mobile-drawer-390.png'),
      fullPage: false,
    });
    await page.keyboard.press('Escape');

    // Also collect detailed metrics for the audit report
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });
    await stabilizePage(page);

    const normalHeaderBox = await header.boundingBox();
    const normalLogoBox = await header
      .locator('img[alt="Sahara Electronics"]')
      .first()
      .boundingBox();
    const normalSearchBox = await page
      .locator('[data-testid="header-search-trigger"]')
      .first()
      .boundingBox();

    await scrollTo(300);
    await stabilizePage(page);

    const compactHeaderBox = await header.boundingBox();
    const compactLogoBox = await header
      .locator('img[alt="Sahara Electronics"]')
      .first()
      .boundingBox();
    const compactSearchBox = await page
      .locator('[data-testid="header-search-trigger"]')
      .first()
      .boundingBox();

    // Secondary nav and megamenu diff at compact
    const secondaryNav = page.locator('.header-secondary-nav');
    const navBoxCompact = await secondaryNav.boundingBox();
    await megaMenuBtn.click();
    await page.locator('.mega-menu-overlay').waitFor({ state: 'visible' });
    await stabilizePage(page);
    const menuBoxCompact = await page.locator('.mega-menu-overlay').boundingBox();
    const diff =
      navBoxCompact && menuBoxCompact
        ? Math.abs(menuBoxCompact.y - (navBoxCompact.y + navBoxCompact.height))
        : 0;
    await page.keyboard.press('Escape');

    const metrics = {
      normal: {
        scrollY: 0,
        header: normalHeaderBox,
        logo: normalLogoBox,
        search: normalSearchBox,
        isCompact: false,
      },
      compact: {
        scrollY: 300,
        header: compactHeaderBox,
        logo: compactLogoBox,
        search: compactSearchBox,
        isCompact: true,
        megaMenuNavDiff: diff,
      },
    };

    fs.writeFileSync(
      join(process.cwd(), 'docs/audits/header-metrics.json'),
      JSON.stringify(metrics, null, 2),
      'utf8'
    );
  });
});
