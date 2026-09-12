import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE_DIR = resolve(__dirname, '..');
const OUTPUT_DIR = resolve(SITE_DIR, 'docs', 'audits', 'storefront-after');

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

async function capture() {
  const browser = await chromium.launch();

  for (const vp of VIEWPORTS) {
    console.log(`\n📸 Capturing ${vp.name} (${vp.width}x${vp.height})...`);

    // Light Mode
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5188/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      // Check overflow
      const overflow = await page.evaluate(() => {
        return {
          docWidth: document.documentElement.clientWidth,
          docScrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
        };
      });
      console.log(
        `  [Light] Overflow check: clientWidth=${overflow.docWidth}, scrollWidth=${overflow.docScrollWidth}`
      );

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

      await context.close();
    }

    // Dark Mode
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5188/', { waitUntil: 'networkidle' });

      // Ensure dark theme attribute
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('theme-dark');
      });
      await page.waitForTimeout(600);

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

      await context.close();
    }
  }

  await browser.close();
  console.log(`\n✅ All screenshots saved in: ${OUTPUT_DIR}`);
}

capture().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
