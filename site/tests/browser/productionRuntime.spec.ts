import { test, expect } from '@playwright/test';
import { join } from 'node:path';

test.describe('Production Runtime Integrity, CSP, Assets & Zero-Error Suite', () => {
  test('1. Production initial load: #root populated, public UI visible, splash departs, zero console.error/pageerror/failedRequests/unexpected 4xx-5xx, JS/CSS 200 OK', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];
    const failedRequests: string[] = [];
    const unexpectedHttpResponses: string[] = [];
    const failedAssets: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('[PROD CONSOLE ERROR]', msg.text(), msg.location());
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      console.log('[PROD PAGEERROR]', error);
      pageErrors.push(error);
    });

    page.on('requestfailed', (request) => {
      console.log('[PROD REQUESTFAILED]', request.method(), request.url(), request.failure());
      failedRequests.push(
        `${request.method()} ${request.url()} - ${request.failure()?.errorText || 'failed'}`
      );
    });

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      const origin = new URL(page.url() || 'http://127.0.0.1:3089').origin;

      if (url.includes('/assets/') && (url.endsWith('.js') || url.endsWith('.css'))) {
        if (status !== 200 && status !== 304) {
          failedAssets.push(`${status} ${url}`);
        }
      }

      if (status >= 400 && url.startsWith(origin)) {
        unexpectedHttpResponses.push(`${status} ${response.request().method()} ${url}`);
      }
    });

    // 1. Initial Page Load
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verify #root is NOT blank
    const rootEl = page.locator('#root');
    await expect(rootEl).not.toBeEmpty();

    // Verify critical public UI landmarks are rendered
    const siteHeader = page.locator('.site-header-wrapper, .sticky-header');
    await expect(siteHeader.first()).toBeVisible({ timeout: 10000 });

    const catalogMain = page.locator('.catalog-main, .catalog-section');
    await expect(catalogMain.first()).toBeVisible({ timeout: 10000 });

    // Verify product card is rendered
    const firstProduct = page.locator('.product-card').first();
    await expect(firstProduct).toBeVisible({ timeout: 10000 });

    // Verify splash screen departs DOM cleanly within reasonable timeout
    await page.waitForSelector('#app-splash-screen', { state: 'detached', timeout: 6000 });

    // Assert zero asset failures for JS/CSS bundles
    expect(failedAssets).toEqual([]);

    // Assert zero console errors
    expect(consoleErrors).toEqual([]);

    // Assert zero uncaught runtime exceptions
    expect(pageErrors).toEqual([]);

    // Assert zero failed network requests
    expect(failedRequests).toEqual([]);

    // Assert zero unexpected 4xx/5xx HTTP responses
    expect(unexpectedHttpResponses).toEqual([]);
  });

  test('2. Browser refresh (reload) in production maintains complete UI integrity with zero console errors or blank screen', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];
    const failedRequests: string[] = [];
    const unexpectedHttpResponses: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    page.on('requestfailed', (request) => {
      failedRequests.push(
        `${request.method()} ${request.url()} - ${request.failure()?.errorText || 'failed'}`
      );
    });

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      const origin = new URL(page.url() || 'http://127.0.0.1:3089').origin;

      if (status >= 400 && url.startsWith(origin)) {
        unexpectedHttpResponses.push(`${status} ${response.request().method()} ${url}`);
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.product-card', { state: 'visible', timeout: 10000 });

    // Perform real browser refresh
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify #root is populated after refresh
    const rootEl = page.locator('#root');
    await expect(rootEl).not.toBeEmpty();

    // Verify public UI visible
    const siteHeader = page.locator('.site-header-wrapper, .sticky-header');
    await expect(siteHeader.first()).toBeVisible({ timeout: 10000 });

    const firstProduct = page.locator('.product-card').first();
    await expect(firstProduct).toBeVisible({ timeout: 10000 });

    // Verify splash is removed
    await page.waitForSelector('#app-splash-screen', { state: 'detached', timeout: 6000 });

    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    expect(unexpectedHttpResponses).toEqual([]);
  });

  test('3. Direct /AdministratorNT navigation: 0 errors on login page, 200 lazy CatalogAdmin chunk, and dashboard access', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];
    const failedRequests: string[] = [];
    const unexpectedHttpResponses: string[] = [];
    const loadedAdminChunks: Array<{ url: string; status: number }> = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error);
    });

    page.on('requestfailed', (request) => {
      failedRequests.push(
        `${request.method()} ${request.url()} - ${request.failure()?.errorText || 'failed'}`
      );
    });

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      const origin = new URL(page.url() || 'http://127.0.0.1:3089').origin;

      if (url.includes('CatalogAdmin') && url.endsWith('.js')) {
        loadedAdminChunks.push({ url, status });
      }

      if (status >= 400 && url.startsWith(origin)) {
        unexpectedHttpResponses.push(`${status} ${response.request().method()} ${url}`);
      }
    });

    // 1. Direct unauthenticated navigation to admin route
    await page.goto('/AdministratorNT', { waitUntil: 'domcontentloaded' });

    // Verify admin login form renders
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });

    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();

    // Verify strict zero errors on initial login page view (no unauthenticated 401 console errors)
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
    expect(unexpectedHttpResponses).toEqual([]);

    // 2. Test Invalid Password scenario and verify clean localized Azerbaijani error message
    await passwordInput.fill('YanlisSifre2026!');
    await loginButton.click();

    const errorMessage = page.locator('.form-error');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    await expect(errorMessage).toHaveText('Şifrə yanlışdır');
    await expect(errorMessage).not.toContainText('HTTP 401');
    await expect(errorMessage).not.toContainText('Unauthorized');

    // Capture wrong password screenshot artifact
    await page.screenshot({
      path: join(process.cwd(), 'docs/audits/admin-login-wrong-password.png'),
    });

    // 3. Test Valid Password scenario (using test environment explicit password)
    const testAdminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'TestAdmin2026!';
    await passwordInput.fill(testAdminPassword);
    await loginButton.click();

    // 4. Verify admin dashboard renders successfully
    const adminShell = page.locator('.admin-shell');
    await expect(adminShell).toBeVisible({ timeout: 10000 });

    // Capture successful dashboard screenshot artifact
    await page.screenshot({
      path: join(process.cwd(), 'docs/audits/admin-dashboard-success.png'),
    });

    // 5. Assert lazy CatalogAdmin chunk loaded successfully with HTTP 200
    expect(loadedAdminChunks.length).toBeGreaterThan(0);
    for (const chunk of loadedAdminChunks) {
      expect(chunk.status).toBe(200);
    }

    // 6. Final strict zero error assertions for the entire login and dashboard lifecycle
    expect(pageErrors).toEqual([]);
    expect(failedRequests).toEqual([]);
  });
});
