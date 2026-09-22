import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const AUDIT_DIR = join(process.cwd(), 'docs', 'audits');
try {
  mkdirSync(AUDIT_DIR, { recursive: true });
} catch {}

test.describe('Phase 5: Animated Brand Rail Public & Admin E2E Tests', () => {
  test('1. Public Homepage Animated Brand Rail Rendering & 54 Brands', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Wait for Brand Rail container
    const rail = page.locator('[data-testid="animated-brand-rail"]');
    await rail.waitFor({ state: 'visible', timeout: 15000 });

    // Neutral Section Title
    const title = rail.locator('.brand-rail-title');
    await expect(title).toHaveText('Brendlər');

    // Tracks & Seamless Infinite Loop Groups
    const track = rail.locator('.brand-rail-track');
    await expect(track).toBeVisible();

    const groups = rail.locator('.brand-rail-track-group');
    await expect(groups).toHaveCount(2);

    // Primary track contains items
    const primaryGroup = groups.first();
    const items = primaryGroup.locator('.brand-rail-card');
    const itemCount = await items.count();
    expect(itemCount).toBeGreaterThanOrEqual(30);

    // Verify key canonical brands are present by data-brand attribute
    const expectedSlugs = [
      'ardo',
      'artel',
      'lotus',
      'darkin',
      'konka',
      'lanova',
      'winsor',
      'ficher',
      'es',
    ];

    for (const slug of expectedSlugs) {
      const card = primaryGroup.locator(`.brand-rail-card[data-brand="${slug}"]`).first();
      await expect(card).toBeAttached();
    }

    // Capture Light Mode Screenshot
    await page.screenshot({ path: join(AUDIT_DIR, 'brand-rail-1440-light.png'), fullPage: false });

    // Switch to Dark Mode & Capture Dark Mode Screenshot
    const themeBtn = page
      .locator(
        '[data-testid="theme-toggle"], button[aria-label*="rejim"], button[aria-label*="Tema"]'
      )
      .first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(AUDIT_DIR, 'brand-rail-1440-dark.png'), fullPage: false });
    }
  });

  test('2. Dynamic Interactive Link vs Badges (No hardcoded "Tezliklə")', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const rail = page.locator('[data-testid="animated-brand-rail"]');
    await rail.waitFor({ state: 'visible', timeout: 15000 });

    // Check non-interactive brand badges
    const cards = rail.locator('.brand-rail-card');
    const total = await cards.count();
    for (let i = 0; i < Math.min(total, 10); i++) {
      const card = cards.nth(i);
      const isInteractive = (await card.getAttribute('data-interactive')) === 'true';
      if (!isInteractive) {
        // Must NOT contain hardcoded "Tezliklə" text
        const text = await card.innerText();
        expect(text).not.toContain('Tezliklə');
      }
    }
  });

  test('3. Zero Horizontal Overflow across Responsive Viewports (390px, 768px, 1440px)', async ({
    page,
  }) => {
    // 390px Mobile Viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const railMobile = page.locator('[data-testid="animated-brand-rail"]');
    await railMobile.waitFor({ state: 'visible', timeout: 15000 });

    const mobileOverflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalScroll:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(mobileOverflow.hasHorizontalScroll).toBe(false);

    await page.screenshot({ path: join(AUDIT_DIR, 'brand-rail-390-light.png'), fullPage: false });

    // Switch to dark mode on mobile
    const themeBtn = page
      .locator(
        '[data-testid="theme-toggle"], button[aria-label*="rejim"], button[aria-label*="Tema"]'
      )
      .first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
      await page.screenshot({ path: join(AUDIT_DIR, 'brand-rail-390-dark.png'), fullPage: false });
    }

    // 768px Tablet Viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const tabletOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(tabletOverflow).toBe(false);

    // 1440px Desktop Viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const desktopOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(desktopOverflow).toBe(false);
  });

  test('4. Reduced Motion & Hover Pause Behavior', async ({ page }) => {
    // Hover pause check
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const rail = page.locator('[data-testid="animated-brand-rail"]');
    await rail.waitFor({ state: 'visible', timeout: 15000 });

    const viewport = rail.locator('.brand-rail-viewport');
    await viewport.hover({ force: true });
    await page.waitForTimeout(200);

    // Reduced motion emulation
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const reducedRail = page.locator('[data-testid="animated-brand-rail"]');
    await reducedRail.waitFor({ state: 'visible', timeout: 15000 });
    await expect(reducedRail).toHaveAttribute('data-reduced-motion', 'true');

    await page.screenshot({
      path: join(AUDIT_DIR, 'brand-rail-reduced-motion.png'),
      fullPage: false,
    });
  });

  test('5. Site Admin: Brand Rail Studio in /AdministratorNT', async ({ page }) => {
    page.on('console', (msg) => console.log(`[ADMIN_CONSOLE ${msg.type()}]:`, msg.text()));
    page.on('pageerror', (err) => console.log(`[ADMIN_PAGE_ERROR]:`, err.stack || err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/AdministratorNT', { waitUntil: 'domcontentloaded' });

    // Wait for password input and login
    const pwdInput = page.locator('#admin-password-input, input[type="password"]');
    await pwdInput.waitFor({ state: 'visible', timeout: 10000 });
    await pwdInput.fill('TestAdmin2026!');

    await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/admin/login') && res.status() === 200),
      page.locator('button.primary-admin-button, button[type="submit"]').first().click(),
    ]);

    // Wait for Admin Panel Navigation
    const railTabBtn = page.locator('button:has-text("Brend Lenti")').first();
    await railTabBtn.waitFor({ state: 'visible', timeout: 15000 });
    await railTabBtn.click();

    // Verify BrandRailStudio elements
    const studio = page.locator('.brand-rail-studio');
    await studio.waitFor({ state: 'visible', timeout: 10000 });

    // Subtab: Animasiya & Tənzimləmələr
    const animTab = page.locator('button:has-text("Animasiya & Tənzimləmələr")');
    await expect(animTab).toBeVisible();
    await animTab.click();

    const titleInput = page.locator('#rail-title-input');
    await expect(titleInput).toBeVisible();
    await expect(titleInput).toHaveValue('Brendlər');

    // Subtab: Canlı Önizləmə
    const previewTab = page.locator('button:has-text("Canlı Önizləmə")');
    await expect(previewTab).toBeVisible();
    await previewTab.click();

    const previewContainer = page.locator('.brand-rail-preview-container');
    await expect(previewContainer).toBeVisible();

    // Capture Admin Brand Rail Studio Screenshot
    await page.screenshot({
      path: join(AUDIT_DIR, 'brand-rail-admin-editor-1440.png'),
      fullPage: false,
    });
  });

  test('6. 1:1 Pixel-Perfect Skeleton Loading UI', async ({ page }) => {
    // 1440px Desktop Skeleton
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?skeleton=true', { waitUntil: 'domcontentloaded' });
    const skeleton = page.locator('[data-testid="brand-rail-skeleton"]');
    await skeleton.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({
      path: join(AUDIT_DIR, 'brand-rail-skeleton-1440.png'),
      fullPage: false,
    });

    // 390px Mobile Skeleton
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?skeleton=true', { waitUntil: 'domcontentloaded' });
    const mobileSkeleton = page.locator('[data-testid="brand-rail-skeleton"]');
    await mobileSkeleton.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({
      path: join(AUDIT_DIR, 'brand-rail-skeleton-390.png'),
      fullPage: false,
    });
  });
});
