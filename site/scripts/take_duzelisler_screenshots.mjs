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

  const setDarkMode = async () => {
    await page.evaluate(() => {
      localStorage.setItem('sahara_theme_mode', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
  };

  // 1. ITEM 40: SiteHeader permanent elevated dark glassmorphism
  console.log('📸 1. Item 40: SiteHeader elevated glassmorphism ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await setDarkMode();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const header = page.locator('.site-header-sticky');
  await header.screenshot({
    path: resolve(ARTIFACTS_DIR, 'item40_header_dark_glass.png'),
  });

  // 2. ITEM 35: High contrast section title in dark mode
  console.log('📸 2. Item 35: Typography Contrast ...');
  const catSection = page.locator('.visual-categories-section');
  await catSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await catSection.screenshot({
    path: resolve(ARTIFACTS_DIR, 'item35_typography_contrast.png'),
  });

  // 3. ITEM 41: BannerHero breathing room and minHeight
  console.log('📸 3. Item 41: BannerHero ...');
  const bannerHero = page.locator('.banner-hero-wrapper, .banner-hero-card').first();
  await bannerHero.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await bannerHero.screenshot({
    path: resolve(ARTIFACTS_DIR, 'item41_banner_hero.png'),
  });

  // 4. ITEM 42: Favorites Heart button in Red
  console.log('📸 4. Item 42: Favorites Heart ...');
  await page.goto('http://localhost:5174/favorites', { waitUntil: 'domcontentloaded' });
  await setDarkMode();
  await page.waitForTimeout(800);
  const favHeaderRow = page.locator('.site-header-desktop-row');
  await favHeaderRow.screenshot({
    path: resolve(ARTIFACTS_DIR, 'item42_favorites_heart_red.png'),
  });

  // 5. ITEM 43: TrustHighlights 4 interactive cards
  console.log('📸 5. Item 43: TrustHighlights ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await setDarkMode();
  await page.waitForTimeout(600);
  const trustSection = page.locator('.trust-highlights-section');
  await trustSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await trustSection.screenshot({
    path: resolve(ARTIFACTS_DIR, 'item43_trust_highlights.png'),
  });

  // 6. ITEM 44: Customer Care & Support Page Symmetrical 46px WhatsApp (green) & Call (red)
  console.log('📸 6. Item 44: Support Page Buttons ...');
  await page.goto('http://localhost:5174/destek', { waitUntil: 'domcontentloaded' });
  await setDarkMode();
  await page.waitForTimeout(800);
  const supportGrid = page.locator('.support-contact-grid');
  await supportGrid.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await supportGrid.screenshot({
    path: resolve(ARTIFACTS_DIR, 'item44_support_buttons_symmetrical.png'),
  });

  // 7. ITEM 36: Brands Page Pure White Logo Containers in Dark Mode
  console.log('📸 7. Item 36: Brands Page Logos ...');
  await page.goto('http://localhost:5174/brendler', { waitUntil: 'domcontentloaded' });
  await setDarkMode();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'item36_brands_page_logos.png'),
    fullPage: false,
  });

  // 8. ITEM 38: MegaMenu Category & Brand Hover (Border-free)
  console.log('📸 8. Item 38: MegaMenu ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await setDarkMode();
  await page.waitForTimeout(600);
  const megaMenuTrigger = page.locator('button:has-text("Kataloq")').first();
  await megaMenuTrigger.click();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'item38_megamenu_clean_hover.png'),
    fullPage: false,
  });

  // 9. ITEM 39: Attention live pulse chat button & soft red buttons
  console.log('📸 9. Item 39: Soft Red Buttons & Live Chat ...');
  await page.goto('http://localhost:5174/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: resolve(ARTIFACTS_DIR, 'item39_chat_live_pulse.png'),
    fullPage: false,
  });

  // 10. ITEM 45: Product Detail Modal / Page Soft Tinted Buttons
  console.log('📸 10. Item 45: Product Detail Buttons ...');
  await page.goto('http://localhost:5174/kataloq', { waitUntil: 'domcontentloaded' });
  await setDarkMode();
  await page.waitForTimeout(1000);
  const firstCard = page.locator('.product-card').first();
  if (await firstCard.isVisible()) {
    await firstCard.click();
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: resolve(ARTIFACTS_DIR, 'item45_product_modal_soft_buttons.png'),
      fullPage: false,
    });
  }

  await browser.close();
  console.log('🎉 ALL SCREENSHOTS CAPTURED PERFECTLY!');
}

main().catch((err) => {
  console.error('❌ Error capturing screenshots:', err);
  process.exit(1);
});
