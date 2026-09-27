import { chromium } from '@playwright/test';

const artifactDir =
  '/home/oni10/.gemini/antigravity-ide/brain/66e5e38d-e45f-4fad-b468-3e810a6c014d';

async function capture() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  try {
    // 1. Admin Panel
    console.log('Navigating to Admin Panel...');
    await page.goto('http://localhost:3004/administratornt', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('1234567');
      const submitBtn = page.locator('button[type="submit"], button:has-text("Daxil ol")').first();
      await submitBtn.click();
      await page.waitForTimeout(2000);
    }

    // Switch to Products
    const productsNavBtn = page
      .locator('button:has-text("Məhsullar"), .admin-tab-btn:has-text("Məhsullar")')
      .first();
    if (await productsNavBtn.isVisible()) {
      await productsNavBtn.click();
      await page.waitForTimeout(1200);
    }

    // Click Edit on first product
    const editBtn = page.locator('.admin-card-edit-btn, button:has-text("Redaktə")').first();
    await editBtn.waitFor({ state: 'visible', timeout: 10000 });
    await editBtn.click();
    await page.waitForTimeout(1200);

    // Open Visual Crop Studio
    const cropStudioBtn = page
      .locator('.crop-open-studio-btn, button:has-text("Vizual Düzənlə")')
      .first();
    await cropStudioBtn.waitFor({ state: 'visible', timeout: 10000 });
    await cropStudioBtn.click();
    await page.waitForTimeout(1500);

    // 1. Screenshot of Visual Crop Studio
    const cropModal = page.locator('.crop-studio-modal');
    await cropModal.waitFor({ state: 'visible', timeout: 10000 });
    await cropModal.screenshot({
      path: `${artifactDir}/1_studiyada_mavi_cerchive_secimi.png`,
    });
    console.log('Saved 1_studiyada_mavi_cerchive_secimi.png');

    // Save in Studio
    const saveCropBtn = page
      .locator('.crop-save-btn, button:has-text("Düzənləməni Saxla")')
      .first();
    if (await saveCropBtn.isVisible()) {
      await saveCropBtn.click();
      await page.waitForTimeout(1200);
    }

    // Save in Product Editor
    const saveProdBtn = page
      .locator('footer.product-modal-footer button:has-text("Yadda saxla")')
      .first();
    if (await saveProdBtn.isVisible()) {
      await saveProdBtn.click();
      await page.waitForTimeout(1500);
    }

    // 2. Screenshot of Admin Product Card Grid
    const firstAdminCard = page.locator('.admin-product-card').first();
    await firstAdminCard.waitFor({ state: 'visible', timeout: 10000 });
    await firstAdminCard.screenshot({
      path: `${artifactDir}/2_admin_siyahida_duzenlenmis_kart.png`,
    });
    console.log('Saved 2_admin_siyahida_duzenlenmis_kart.png');

    // Publish / Canlıya burax
    const publishBtn = page
      .locator('button:has-text("Canlıya Burax"), button:has-text("Yayınla")')
      .first();
    if (await publishBtn.isVisible()) {
      await publishBtn.click();
      await page.waitForTimeout(2000);
      const confirmBtn = page.locator('button:has-text("Bəli"), button:has-text("Təsdiq")').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // 3. Navigate to Catalog
    console.log('Navigating to Catalog...');
    await page.goto('http://localhost:3004/kataloq', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const catalogGridCard = page.locator('.product-card, .catalog-product-card').first();
    await catalogGridCard.waitFor({ state: 'visible', timeout: 15000 });
    await catalogGridCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    await catalogGridCard.screenshot({
      path: `${artifactDir}/3_kataloqda_canli_mehsul_karti.png`,
    });
    console.log('Saved 3_kataloqda_canli_mehsul_karti.png');

    // 4. Open Product Detail Modal
    await catalogGridCard.click();
    await page.waitForTimeout(1500);

    const modalDialog = page
      .locator('.product-detail-modal-container, .product-detail-modal')
      .first();
    if (await modalDialog.isVisible()) {
      await modalDialog.screenshot({
        path: `${artifactDir}/4_kataloq_detal_modalinda_yaxinlasmis_gorunus.png`,
      });
      console.log('Saved 4_kataloq_detal_modalinda_yaxinlasmis_gorunus.png');
    } else {
      await page.screenshot({
        path: `${artifactDir}/4_kataloq_detal_modalinda_yaxinlasmis_gorunus.png`,
      });
      console.log('Saved 4_kataloq_detal_modalinda_yaxinlasmis_gorunus.png (fallback)');
    }

    console.log('ALL screenshots completed successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
