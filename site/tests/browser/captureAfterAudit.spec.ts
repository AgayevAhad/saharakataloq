import { test } from '@playwright/test';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const OUTPUT_DIR = resolve(process.cwd(), 'docs', 'audits', 'storefront-after');

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { width: 390, height: 844, name: '390x844-mobile' },
  { width: 768, height: 1024, name: '768x1024-tablet' },
  { width: 1024, height: 768, name: '1024x768-laptop' },
  { width: 1440, height: 900, name: '1440x900-desktop' },
  { width: 1920, height: 1080, name: '1920x1080-large' },
];

for (const vp of VIEWPORTS) {
  test(`Capture ${vp.name} (${vp.width}x${vp.height}) screenshots`, async ({ page }) => {
    // 1. Light Mode
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page
      .waitForSelector('.product-card', { state: 'visible', timeout: 8000 })
      .catch(() => {});
    await page.waitForTimeout(400);

    // Viewport screenshot
    await page.screenshot({
      path: resolve(OUTPUT_DIR, `${vp.name}-light.png`),
      fullPage: false,
    });

    // Full page screenshot
    await page.screenshot({
      path: resolve(OUTPUT_DIR, `${vp.name}-light-full.png`),
      fullPage: true,
    });

    // 2. Dark Mode
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('theme-dark');
    });
    await page.waitForTimeout(400);

    // Viewport screenshot
    await page.screenshot({
      path: resolve(OUTPUT_DIR, `${vp.name}-dark.png`),
      fullPage: false,
    });

    // Full page screenshot
    await page.screenshot({
      path: resolve(OUTPUT_DIR, `${vp.name}-dark-full.png`),
      fullPage: true,
    });
  });
}
