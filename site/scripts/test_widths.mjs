import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const ARTIFACTS_DIR =
  '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9';

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1920px Wide Screen
  const page1920 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page1920.goto('http://localhost:5174/catalog', { waitUntil: 'domcontentloaded' });
  await page1920.waitForTimeout(1000);
  await page1920.screenshot({
    path: resolve(ARTIFACTS_DIR, 'catalog_1920_wide.png'),
    fullPage: false,
  });

  // 1280px Laptop Screen
  const page1280 = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page1280.goto('http://localhost:5174/catalog', { waitUntil: 'domcontentloaded' });
  await page1280.waitForTimeout(1000);
  await page1280.screenshot({
    path: resolve(ARTIFACTS_DIR, 'catalog_1280_laptop.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('Screenshots captured successfully for 1920px and 1280px!');
}

main().catch(console.error);
