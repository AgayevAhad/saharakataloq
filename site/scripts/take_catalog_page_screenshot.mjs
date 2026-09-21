import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const ARTIFACTS_DIR =
  '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 960 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  console.log('Navigating to Catalog page...');
  await page.goto('http://localhost:5174/catalog', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  // Check if horizontal scroll exists on window or container
  const scrollInfo = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalOverflow:
        document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  console.log('Scroll info:', scrollInfo);

  console.log('Taking screenshot of Catalog Page (Light Mode 1600px viewport)...');
  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'catalog_page_desktop_1600_light.png'),
    clip: { x: 0, y: 0, width: 1600, height: 960 },
  });

  // Dark Mode
  console.log('Switching to Dark Mode...');
  await page.evaluate(() => {
    localStorage.setItem('sahara_theme_mode', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  console.log('Taking screenshot of Catalog Page (Dark Mode 1600px viewport)...');
  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'catalog_page_desktop_1600_dark.png'),
    clip: { x: 0, y: 0, width: 1600, height: 960 },
  });

  await browser.close();
  console.log('Catalog screenshots captured successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
