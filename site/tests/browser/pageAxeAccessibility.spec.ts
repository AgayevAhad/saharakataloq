import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Real Page axe-core Full WCAG AA Accessibility Suite (0 Critical / Serious)', () => {
  test('1. Public Home accessibility scan', async ({ page }) => {
    await page.goto('/');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });

    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const violations = scan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(violations).toEqual([]);
  });

  test('2. Smart Search open accessibility scan', async ({ page }) => {
    await page.goto('/');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });

    const searchBtn = page
      .locator(
        'button[aria-label*="axtar"], .header-search-wrap button, .mobile-nav-item:has-text("Axtarış")'
      )
      .first();
    await searchBtn.waitFor({ state: 'visible' });
    await searchBtn.click();
    await page.waitForSelector('.smart-search-overlay', { state: 'visible' });

    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const violations = scan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(violations).toEqual([]);
  });

  test('3. Product Detail Modal open accessibility scan', async ({ page }) => {
    await page.goto('/');
    await page.locator('.product-card').first().waitFor({ state: 'visible' });

    const firstProduct = page.locator('.product-card').first();
    await firstProduct.click();
    await page.waitForSelector('.modal-overlay-wrap, [role="dialog"]', { state: 'visible' });

    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const violations = scan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(violations).toEqual([]);
  });

  test('4. Admin Login view accessibility scan', async ({ page }) => {
    await page.goto('/AdministratorNT');
    await page.locator('input[type="password"]').waitFor({ state: 'visible' });

    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const violations = scan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(violations).toEqual([]);
  });

  test('5. Admin Dashboard main view accessibility scan', async ({ page }) => {
    await page.goto('/AdministratorNT');
    const pwdInput = page.locator('input[type="password"]');
    await pwdInput.waitFor({ state: 'visible' });
    await pwdInput.fill('TestAdmin2026!');
    await page.locator('button[type="submit"], form button').first().click();

    // Wait for admin dashboard content
    await page
      .locator('.admin-dashboard-container, .catalog-admin-wrapper, button:has-text("Çıxış")')
      .first()
      .waitFor({ state: 'visible' });

    const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const violations = scan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(violations).toEqual([]);
  });
});
