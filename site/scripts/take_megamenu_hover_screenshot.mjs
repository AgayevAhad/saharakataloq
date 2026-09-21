import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const ARTIFACTS_DIR =
  '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  console.log('Navigating to storefront...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 1. Hover over "Kataloq" trigger
  console.log('Hovering over Kataloq button...');
  const trigger = page.locator('.mega-menu-trigger-btn');
  await trigger.hover();
  await page.waitForTimeout(500);

  // Wait for mega menu overlay
  await page.waitForSelector('#mega-menu-overlay', { state: 'visible', timeout: 5000 });
  console.log('MegaMenu overlay is visible!');

  console.log('Taking screenshot of MegaMenu Kataloq (Light Mode)...');
  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'megamenu_kataloq_light.png'),
    clip: { x: 0, y: 0, width: 1440, height: 800 },
  });

  // 2. Hover over "Brendlər" nav item to compare with Brendlər panel
  console.log('Hovering over Brendlər button...');
  const brandsBtn = page.locator('button').filter({ hasText: 'Brendlər' }).first();
  await brandsBtn.hover();
  await page.waitForTimeout(600);

  console.log('Taking screenshot of Brendlər preview panel (Light Mode)...');
  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'preview_brendler_light.png'),
    clip: { x: 0, y: 0, width: 1440, height: 800 },
  });

  // 3. Dark Mode
  console.log('Switching to Dark Mode...');
  await page.evaluate(() => {
    localStorage.setItem('sahara_theme_mode', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const darkTrigger = page.locator('.mega-menu-trigger-btn');
  await darkTrigger.hover();
  await page.waitForTimeout(500);

  console.log('Taking screenshot of MegaMenu Kataloq (Dark Mode)...');
  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'megamenu_kataloq_dark.png'),
    clip: { x: 0, y: 0, width: 1440, height: 800 },
  });

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
