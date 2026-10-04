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
  const originalImageUrl = await page.locator('.crop-source-img').getAttribute('src');

  const cropBox = page.locator('.crop-box-overlay');
  await expect(cropBox).toBeVisible({ timeout: 15000 });
  const cardPreviewFrame = await page.locator('.crop-preview-card-frame').boundingBox();
  expect(cardPreviewFrame).not.toBeNull();
  const cardPreviewRatio = (cardPreviewFrame?.width || 0) / (cardPreviewFrame?.height || 1);
  expect(cardPreviewRatio).toBeCloseTo(1, 2);
  await page.getByRole('button', { name: '1:1' }).click();
  const before = await cropBox.boundingBox();
  expect(before).not.toBeNull();
  const beforeCrop = JSON.parse((await studio.getAttribute('data-crop-rect')) || '{}') as {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  const moveX = beforeCrop.x > 0.01 ? -24 : beforeCrop.x + beforeCrop.w < 0.99 ? 24 : 0;
  const moveY = beforeCrop.y > 0.01 ? -18 : beforeCrop.y + beforeCrop.h < 0.99 ? 18 : 0;

  if (!before) throw new Error('Crop box bounds were not available');
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + moveX, before.y + before.height / 2 + moveY, {
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

  const savedCrop = JSON.parse((await studio.getAttribute('data-crop-rect')) || '{}') as {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  expect(savedCrop.w).toBeGreaterThan(0);
  expect(savedCrop.h).toBeGreaterThan(0);
  expect(savedCrop.x + savedCrop.y).toBeGreaterThan(0);

  await page.getByRole('button', { name: /Düzənləməni Saxla/i }).click();
  await expect(studio).toBeHidden();

  const editorFramedImage = page
    .locator('.product-modal-card .admin-thumb .crop-framed-img')
    .first();
  await expect(editorFramedImage).toHaveAttribute('data-crop-rect', JSON.stringify(savedCrop));

  const updateRequestPromise = page.waitForRequest(
    (request) => request.method() === 'PUT' && request.url().includes('/api/admin/products/')
  );
  const updateResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'PUT' &&
      response.url().includes('/api/admin/products/') &&
      response.status() === 200
  );
  await page.getByRole('button', { name: 'Yadda saxla' }).click();
  const updateRequest = await updateRequestPromise;
  const updateResponse = await updateResponsePromise;
  const requestProduct = updateRequest.postDataJSON();
  const savedMedia = requestProduct.media.find(
    (item: { cropRect?: typeof savedCrop }) =>
      JSON.stringify(item.cropRect) === JSON.stringify(savedCrop)
  );
  expect(savedMedia).toBeTruthy();
  expect(savedMedia.url).toBe(originalImageUrl);
  expect(savedMedia.originalUrl).toBe(originalImageUrl);

  const responseBody = await updateResponse.json();
  expect(responseBody.product.cropRect).toEqual(savedCrop);
  expect(
    responseBody.product.media.find((item: { id: string }) => item.id === savedMedia.id)?.cropRect
  ).toEqual(savedCrop);
  await expect(page.locator('.product-modal-card')).toBeHidden();

  const adminCardImage = page.locator('.admin-product-card .crop-framed-img').first();
  await expect(adminCardImage).toHaveAttribute('data-crop-rect', JSON.stringify(savedCrop));
  const adminCardFrame = await page
    .locator('.admin-product-card .admin-card-image-wrap')
    .first()
    .boundingBox();
  expect(adminCardFrame).not.toBeNull();
  expect(
    Math.abs((adminCardFrame?.width || 0) / (adminCardFrame?.height || 1) - cardPreviewRatio)
  ).toBeLessThan(0.015);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('.admin-main').waitFor({ state: 'visible' });
  await expect(page.locator('.admin-product-card .crop-framed-img').first()).toHaveAttribute(
    'data-crop-rect',
    JSON.stringify(savedCrop)
  );

  await page.getByTitle('Redaktə et').first().click();
  await expect(page.locator('.product-modal-card')).toBeVisible();
  await page.locator('.crop-open-studio-btn').first().click();
  const reopenedStudio = page.locator('.crop-studio-modal');
  await expect(reopenedStudio).toBeVisible();
  await expect(reopenedStudio).toHaveAttribute('data-crop-rect', JSON.stringify(savedCrop));

  await reopenedStudio.locator('.crop-close-btn').click();
  await page.locator('.product-modal-header button').click();
  await expect(page.locator('.product-modal-card')).toBeHidden();

  const publishResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().endsWith('/api/admin/publish') &&
      response.status() === 200
  );
  await page.getByRole('button', { name: 'Canlıya Burax' }).click();
  await publishResponsePromise;

  await page.goto('/catalog', { waitUntil: 'domcontentloaded' });
  const catalogSearch = page.getByRole('searchbox', { name: 'Kataloq daxilində axtarış' });
  await catalogSearch.fill(requestProduct.model || requestProduct.title);
  const publicProductCard = page
    .locator('.catalog-products-container .product-card')
    .filter({ hasText: requestProduct.title })
    .first();
  await expect(publicProductCard).toBeVisible();
  await expect(publicProductCard.locator('.crop-framed-img').first()).toHaveAttribute(
    'data-crop-rect',
    JSON.stringify(savedCrop)
  );
  const publicCardFrame = await publicProductCard.locator('.product-card-img-wrap').boundingBox();
  expect(publicCardFrame).not.toBeNull();
  expect(
    Math.abs((publicCardFrame?.width || 0) / (publicCardFrame?.height || 1) - cardPreviewRatio)
  ).toBeLessThan(0.015);
  expect(Math.abs((publicCardFrame?.width || 0) - (publicCardFrame?.height || 0))).toBeLessThan(1);

  const publicCardActions = await publicProductCard
    .locator('.product-card-top-actions')
    .boundingBox();
  expect(publicCardActions).not.toBeNull();
  expect(publicCardActions?.y || 0).toBeGreaterThanOrEqual(
    (publicCardFrame?.y || 0) + (publicCardFrame?.height || 0)
  );

  const catalogGridGaps = await page
    .locator('.catalog-products-container.is-grid-view')
    .evaluate((element) => ({
      columnGap: getComputedStyle(element).columnGap,
      rowGap: getComputedStyle(element).rowGap,
    }));
  expect(catalogGridGaps.columnGap).toBe('32px');
  expect(catalogGridGaps.rowGap).toBe('36px');
});
