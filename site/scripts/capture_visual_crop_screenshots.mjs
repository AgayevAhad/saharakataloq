import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR =
  '/home/oni10/.gemini/antigravity-ide/brain/66e5e38d-e45f-4fad-b468-3e810a6c014d';

async function capture() {
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
    // ----------------------------------------------------
    // 1. ADMIN PANEL: Login -> Products -> Edit -> Crop Studio
    // ----------------------------------------------------
    console.log('1. Navigating to Admin Panel (/AdministratorNT)...');
    await page.goto('http://localhost:5174/AdministratorNT', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    const pwdInput = page.locator('input[type="password"]');
    if (await pwdInput.isVisible()) {
      console.log('Logging in with 1234567 ...');
      await pwdInput.fill('1234567');
      const submitBtn = page.locator('button[type="submit"], button:has-text("Daxil ol")').first();
      await submitBtn.click();
      await page.waitForTimeout(1500);
    }

    // Products Tab
    const productsTab = page.locator('button:has-text("Məhsullar")').first();
    if (await productsTab.isVisible()) {
      await productsTab.click();
      await page.waitForTimeout(1000);
    }

    // Search 201GC in Admin
    const searchAdmin = page.locator('input[placeholder*="Axtar" i], input[type="search"]').first();
    if (await searchAdmin.isVisible()) {
      await searchAdmin.fill('201GC');
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, '1_admin_mehsullar_siyahisi.png'),
    });
    console.log('Saved 1_admin_mehsullar_siyahisi.png');

    // Click Edit (Redaktə et) button on the first card
    const editBtn = page.locator('.admin-card-action-btn.edit, button[title*="Redaktə" i]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await page.waitForTimeout(1200);

      // Media Section in Editor
      const visualCropBtn = page
        .locator('.crop-open-studio-btn, button:has-text("Vizual Düzənlə")')
        .first();
      if (await visualCropBtn.isVisible()) {
        await visualCropBtn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);

        await page.screenshot({
          path: path.join(ARTIFACT_DIR, '2_admin_redakte_formu.png'),
        });
        console.log('Saved 2_admin_redakte_formu.png');

        // Open Visual Crop Studio Modal
        await visualCropBtn.click();
        await page.waitForTimeout(1500);

        await page.screenshot({
          path: path.join(ARTIFACT_DIR, '3_vizual_duzenle_studiyasi.png'),
        });
        console.log('Saved 3_vizual_duzenle_studiyasi.png');
      }
    }

    // ----------------------------------------------------
    // 2. CATALOG APP: Cards & Detail Modal
    // ----------------------------------------------------
    console.log('2. Navigating to Catalog Mode (?mode=catalog)...');
    await page.goto('http://localhost:5174/?mode=catalog', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(2500);

    // Search 201GC in Catalog
    const catSearch = page.locator('input[placeholder*="axtar" i], input[type="search"]').first();
    if (await catSearch.isVisible()) {
      await catSearch.fill('201GC');
      await page.waitForTimeout(1500);
    }

    // Scroll to products grid
    const card = page.locator('.product-card').first();
    if (await card.isVisible()) {
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      await page.screenshot({
        path: path.join(ARTIFACT_DIR, '4_kataloq_mehsul_karti.png'),
      });
      console.log('Saved 4_kataloq_mehsul_karti.png');

      // Click card to open Detail Modal
      await card.click({ force: true });
      await page.waitForTimeout(1500);

      const detailModal = page
        .locator('.product-detail-modal-overlay, .modal-backdrop, [role="dialog"]')
        .first();
      if (await detailModal.isVisible()) {
        await page.screenshot({
          path: path.join(ARTIFACT_DIR, '5_mehsul_detal_modali.png'),
        });
        console.log('Saved 5_mehsul_detal_modali.png');
      }
    }

    console.log('ALL 5 SCREENSHOTS SUCCESSFULLY CAPTURED!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
