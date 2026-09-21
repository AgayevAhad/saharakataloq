import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const ARTIFACTS_DIR =
  '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  console.log('1. Loading HomePage...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'homepage_featured_1440.png'),
    fullPage: false,
  });

  console.log('2. Loading CatalogPage...');
  await page.goto('http://localhost:5174/catalog', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const scrollInfo = await page.evaluate(() => {
    return {
      windowScrollWidth: document.documentElement.scrollWidth,
      windowClientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      catalogContainer: document.querySelector('.catalog-container')?.getBoundingClientRect(),
      catalogBodyLayout: document.querySelector('.catalog-body-layout')?.getBoundingClientRect(),
      gridContainer: document.querySelector('.catalog-products-container')?.getBoundingClientRect(),
      firstCard: document.querySelector('.product-card')?.getBoundingClientRect(),
    };
  });
  console.log('Scroll Info & Bounding Boxes:', JSON.stringify(scrollInfo, null, 2));

  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'catalog_current_1440.png'),
    fullPage: false,
  });

  await browser.close();
}

main().catch(console.error);
