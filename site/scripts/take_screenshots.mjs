import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  try {
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const section = page.locator('.visual-categories-section');
    await section.waitFor({ state: 'visible', timeout: 15000 });

    // Scroll to the visual categories section with header offset
    await page.evaluate(() => {
      const sec = document.querySelector('.visual-categories-section');
      if (sec) {
        const top = sec.getBoundingClientRect().top + window.pageYOffset - 120;
        window.scrollTo({ top, behavior: 'instant' });
      }
    });
    await page.waitForTimeout(800);

    // Slide 1
    await section.screenshot({
      path: '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9/slide1_bento.png',
    });
    console.log('Saved slide1_bento.png');

    // Slide 2
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.collage-slide-tab');
      if (tabs[1]) tabs[1].click();
    });
    await page.waitForTimeout(600);
    await section.screenshot({
      path: '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9/slide2_facet.png',
    });
    console.log('Saved slide2_facet.png');

    // Slide 3
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.collage-slide-tab');
      if (tabs[2]) tabs[2].click();
    });
    await page.waitForTimeout(600);
    await section.screenshot({
      path: '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9/slide3_frames.png',
    });
    console.log('Saved slide3_frames.png');

    // Slide 4
    await page.evaluate(() => {
      const tabs = document.querySelectorAll('.collage-slide-tab');
      if (tabs[3]) tabs[3].click();
    });
    await page.waitForTimeout(600);
    await section.screenshot({
      path: '/home/oni10/.gemini/antigravity-ide/brain/304d682b-4a52-41bb-a80a-169ab5889eb9/slide4_cluster.png',
    });
    console.log('Saved slide4_cluster.png');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
