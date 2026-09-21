import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const ARTIFACTS_DIR =
  '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Loading /catalog...');
  await page.goto('http://localhost:5174/catalog', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Take screenshot right after load/refresh to verify NO black border on Məhsul Kataloqu
  console.log('Taking screenshot after refresh (header check)...');
  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'catalog_refresh_no_border.png'),
    fullPage: false,
  });

  // Scroll down 600px
  console.log('Scrolling down 600px...');
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
  await page.waitForTimeout(600);

  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'catalog_scrolled_600.png'),
    fullPage: false,
  });

  // Scroll to bottom
  console.log('Scrolling to bottom...');
  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }));
  await page.waitForTimeout(600);

  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'catalog_scrolled_bottom.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('Verification screenshots captured successfully!');
}

main().catch(console.error);
