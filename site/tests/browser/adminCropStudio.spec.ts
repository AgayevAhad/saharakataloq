import { expect, test } from '@playwright/test';

test('admin crop studio supports pointer drag and remains contained at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/AdministratorNT?mode=catalog', { waitUntil: 'domcontentloaded' });

  const password = page.locator('#admin-password-input, input[type="password"]');
  await password.fill('TestAdmin2026!');
  await Promise.all([
    page.waitForResponse(
      (response) => response.url().includes('/api/admin/login') && response.status() === 200
    ),
    page.locator('button.primary-admin-button, button[type="submit"]').first().click(),
  ]);
  await page.locator('.admin-main').waitFor({ state: 'visible' });

  const editButton = page.getByTitle('Redaktə et').first();
  await editButton.waitFor({ state: 'visible' });
  await editButton.click();
  await expect(page.locator('.product-modal-card')).toBeVisible();

  const cropButton = page.locator('.crop-open-studio-btn').first();
  await cropButton.scrollIntoViewIfNeeded();
  await cropButton.click();
  const studio = page.locator('.crop-studio-modal');
  await expect(studio).toBeVisible();

  const cropBox = page.locator('.crop-box-overlay');
  await expect(cropBox).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: '1:1' }).click();
  const before = await cropBox.boundingBox();
  expect(before).not.toBeNull();

  if (!before) throw new Error('Crop box bounds were not available');
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 24, before.y + before.height / 2 + 18, {
    steps: 5,
  });
  await page.mouse.up();
  const after = await cropBox.boundingBox();
  expect(after).not.toBeNull();
  expect(
    Math.abs((after?.x || 0) - before.x) + Math.abs((after?.y || 0) - before.y)
  ).toBeGreaterThan(5);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(studio).toBeVisible();
  const overflow = await page.evaluate(() => {
    const modal = document.querySelector('.crop-studio-modal') as HTMLElement | null;
    const body = document.querySelector('.crop-studio-body') as HTMLElement | null;
    return {
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      modal: modal ? modal.scrollWidth - modal.clientWidth : 999,
      columns: body ? getComputedStyle(body).gridTemplateColumns.split(' ').length : 0,
    };
  });
  expect(overflow.page).toBeLessThanOrEqual(1);
  expect(overflow.modal).toBeLessThanOrEqual(1);
  expect(overflow.columns).toBe(1);
});
