import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR =
  '/home/oni10/.gemini/antigravity-ide/brain/66e5e38d-e45f-4fad-b468-3e810a6c014d';
const BASE_URL = 'http://localhost:3004';

async function runDemo() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  try {
    console.log('--- Step 1: Navigating to Admin Panel ---');
    await page.goto(`${BASE_URL}/AdministratorNT`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    const pwdInput = page.locator('input[type="password"]');
    if (await pwdInput.isVisible()) {
      await pwdInput.fill('1234567');
      await page.locator('button[type="submit"], button:has-text("Daxil ol")').first().click();
      await page.waitForTimeout(1500);
    }

    // Products Tab
    const productsTab = page.locator('button:has-text("Məhsullar")').first();
    if (await productsTab.isVisible()) {
      await productsTab.click();
      await page.waitForTimeout(800);
    }

    // Search 201GC in Admin
    const searchAdmin = page.locator('input[placeholder*="Axtar" i], input[type="search"]').first();
    if (await searchAdmin.isVisible()) {
      await searchAdmin.fill('201GC');
      await page.waitForTimeout(800);
    }

    // Open Edit modal for 201GC
    const editBtn = page.locator('.admin-card-action-btn.edit, button[title*="Redaktə" i]').first();
    await editBtn.click();
    await page.waitForTimeout(1000);

    // Open Crop Studio Modal
    const cropStudioBtn = page
      .locator('.crop-open-studio-btn, button:has-text("Vizual Düzənlə")')
      .first();
    await cropStudioBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await cropStudioBtn.click();
    await page.waitForTimeout(1500);

    console.log('--- Step 2: Clicking Avtomatik Fokusla (or Dragging blue crop box) ---');
    // Click "Avtomatik Fokusla" to trim white background tightly
    const wandBtn = page.locator('button:has-text("Avtomatik Fokusla")').first();
    if (await wandBtn.isVisible()) {
      await wandBtn.click();
      await page.waitForTimeout(800);
    }

    // Also drag top handle slightly down
    const topHandle = page.locator('div[title*="Üst ağ sahəni"]').first();
    if (await topHandle.isVisible()) {
      const tb = await topHandle.boundingBox();
      if (tb) {
        await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
        await page.mouse.down();
        await page.mouse.move(tb.x + tb.width / 2, tb.y + 30, { steps: 5 });
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
    }

    // SCREENSHOT 1: Studio with Blue Frame tightly around the stove
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '1_studiyada_mavi_cerchive_secimi.png'),
    });
    console.log('Saved 1_studiyada_mavi_cerchive_secimi.png');

    // Click "Düzənləməni Saxla & Məhsula Tətbiq Et"
    const applyStudioBtn = page
      .locator('button:has-text("Düzənləməni Saxla"), button:has-text("Tətbiq Et")')
      .first();
    await applyStudioBtn.click();
    await page.waitForTimeout(1000);

    // SCREENSHOT 2: Product Editor preview
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '2_admin_redaktede_duzenlenmis_onbaxis.png'),
    });
    console.log('Saved 2_admin_redaktede_duzenlenmis_onbaxis.png');

    // Click "Yadda saxla" in Product Editor
    const saveProductBtn = page
      .locator('.product-modal-footer button:has-text("Yadda saxla")')
      .first();
    await saveProductBtn.click();
    await page.waitForTimeout(1200);

    // Wait for backdrop to close
    await page
      .locator('.product-modal-backdrop')
      .waitFor({ state: 'detached', timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(800);

    // SCREENSHOT 3: Admin product card in list
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '3_admin_siyahida_duzenlenmis_kart.png'),
    });
    console.log('Saved 3_admin_siyahida_duzenlenmis_kart.png');

    // Click "Canlıya Burax"
    console.log('--- Step 3: Publishing to Live Catalog («Canlıya Burax») ---');
    const livePublishBtn = page.locator('button:has-text("Canlıya Burax")').first();
    if (await livePublishBtn.isVisible()) {
      await livePublishBtn.click({ force: true });
      await page.waitForTimeout(2000);

      const confirmPublish = page
        .locator(
          'button:has-text("Təsdiq et"), button:has-text("Bəli, Dərc Et"), .confirm-publish-btn, button:has-text("Bəli")'
        )
        .first();
      if (await confirmPublish.isVisible()) {
        await confirmPublish.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }

    // ----------------------------------------------------
    // Step 4: Catalog App Verification
    // ----------------------------------------------------
    console.log('--- Step 4: Navigating to Customer Catalog Mode (?mode=catalog) ---');
    await page.goto(`${BASE_URL}/?mode=catalog`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2500);

    const catSearch = page.locator('input[placeholder*="axtar" i], input[type="search"]').first();
    if (await catSearch.isVisible()) {
      await catSearch.fill('201GC');
      await page.waitForTimeout(1500);
    }

    // Scroll to product card
    const card = page.locator('.product-card').first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // SCREENSHOT 4: Catalog Product Card
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '4_kataloqda_canli_mehsul_karti.png'),
    });
    console.log('Saved 4_kataloqda_canli_mehsul_karti.png');

    // Click product card to open Detail Modal
    await card.click({ force: true });
    await page.waitForTimeout(1500);

    // SCREENSHOT 5: Product Detail Modal with 10px Stage Padding & Cropped Zoom
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '5_kataloq_detal_modalinda_yaxinlasmis_gorunus.png'),
    });
    console.log('Saved 5_kataloq_detal_modalinda_yaxinlasmis_gorunus.png');

    // Close detail modal
    const closeDetail = page
      .locator('.modal-close-btn, button[aria-label="Bağla"], button[aria-label="Close"]')
      .first();
    if (await closeDetail.isVisible()) {
      await closeDetail.click({ force: true });
      await page.waitForTimeout(500);
    }

    // ----------------------------------------------------
    // Step 5: Memory Re-opening Verification in Admin Studio
    // ----------------------------------------------------
    console.log('--- Step 5: Re-entering Admin Studio to verify memory persistence ---');
    await page.goto(`${BASE_URL}/AdministratorNT`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    const pwdInput2 = page.locator('input[type="password"]');
    if (await pwdInput2.isVisible()) {
      await pwdInput2.fill('1234567');
      await page.locator('button[type="submit"], button:has-text("Daxil ol")').first().click();
      await page.waitForTimeout(1200);
    }

    const productsTab2 = page.locator('button:has-text("Məhsullar")').first();
    if (await productsTab2.isVisible()) {
      await productsTab2.click();
      await page.waitForTimeout(800);
    }

    const searchAdmin2 = page
      .locator('input[placeholder*="Axtar" i], input[type="search"]')
      .first();
    if (await searchAdmin2.isVisible()) {
      await searchAdmin2.fill('201GC');
      await page.waitForTimeout(800);
    }

    const editBtn2 = page
      .locator('.admin-card-action-btn.edit, button[title*="Redaktə" i]')
      .first();
    await editBtn2.click({ force: true });
    await page.waitForTimeout(1000);

    const cropStudioBtn2 = page
      .locator('.crop-open-studio-btn, button:has-text("Vizual Düzənlə")')
      .first();
    await cropStudioBtn2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await cropStudioBtn2.click({ force: true });
    await page.waitForTimeout(1500);

    // SCREENSHOT 6: Studio Reopened with Exact Frame Memory Restored
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '6_tekrar_daxil_olanda_mavi_cerchivenin_yerinde_qalmasi.png'),
    });
    console.log('Saved 6_tekrar_daxil_olanda_mavi_cerchivenin_yerinde_qalmasi.png');

    console.log('✅ ALL 6 DEMONSTRATION SCREENSHOTS SUCCESSFULLY CAPTURED!');
  } catch (err) {
    console.error('Error during demo capture:', err);
  } finally {
    await browser.close();
  }
}

runDemo();
