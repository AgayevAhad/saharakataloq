import { chromium } from '@playwright/test';
import { resolve } from 'node:path';

const ARTIFACTS_DIR =
  '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  await page.goto('http://localhost:5174/catalog', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.product-card', { timeout: 10000 });

  const metrics = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    const firstCard = cards[0];
    const rect = firstCard ? firstCard.getBoundingClientRect() : null;
    const grid = document.querySelector('.catalog-grid');
    const gridRect = grid ? grid.getBoundingClientRect() : null;
    const aside = document.querySelector('.catalog-desktop-sidebar');
    const asideRect = aside ? aside.getBoundingClientRect() : null;
    const main = document.querySelector('.catalog-main-content');
    const mainRect = main ? main.getBoundingClientRect() : null;
    const compareBox = document.querySelector('.catalog-compare-box');
    const compareRect = compareBox ? compareBox.getBoundingClientRect() : null;

    let firstRowCount = 0;
    if (cards.length > 0) {
      const firstTop = cards[0].getBoundingClientRect().top;
      firstRowCount = cards.filter(
        (c) => Math.abs(c.getBoundingClientRect().top - firstTop) < 5
      ).length;
    }

    return {
      cardCount: cards.length,
      firstCardDimensions: rect ? { width: rect.width, height: rect.height } : null,
      gridWidth: gridRect ? gridRect.width : null,
      asideTop: asideRect ? asideRect.top : null,
      mainTop: mainRect ? mainRect.top : null,
      compareTop: compareRect ? compareRect.top : null,
      firstRowCount,
    };
  });

  console.log('METRICS:', JSON.stringify(metrics, null, 2));

  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'catalog_1920_verified.png'),
    fullPage: false,
  });

  await browser.close();
}

main().catch(console.error);
