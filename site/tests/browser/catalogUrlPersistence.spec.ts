import { expect, test } from '@playwright/test';

test('wholesale brand and category selection survive a browser refresh', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?mode=catalog', { waitUntil: 'domcontentloaded' });

  await page.getByRole('button', { name: /^ARDO məhsullarına bax/ }).click();
  await expect(page.getByRole('tablist', { name: /ARDO kateqoriyaları/ })).toBeVisible();
  await expect
    .poll(() => new URL(page.url()).searchParams.get('brand'))
    .toBe('ardo');
  expect(new URL(page.url()).searchParams.get('mode')).toBe('catalog');

  const categoryTab = page.getByRole('tab', { name: /Bişirmə panelləri/ });
  await categoryTab.click();
  await expect(categoryTab).toHaveAttribute('aria-selected', 'true');

  const selectedCategory = new URL(page.url()).searchParams.get('category');
  expect(selectedCategory).toBeTruthy();
  expect(selectedCategory).not.toBe('all');

  await page.reload({ waitUntil: 'domcontentloaded' });

  await expect(page.getByRole('tablist', { name: /ARDO kateqoriyaları/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Bişirmə panelləri/ })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(new URL(page.url()).searchParams.get('mode')).toBe('catalog');
  expect(new URL(page.url()).searchParams.get('brand')).toBe('ardo');
  expect(new URL(page.url()).searchParams.get('category')).toBe(selectedCategory);
  await expect(page.locator('.catalog-body-layout .product-card').first()).toBeVisible();
});

test('invalid wholesale URL selections are removed safely', async ({ page }) => {
  await page.goto('/?mode=catalog&brand=missing-brand&category=missing-category', {
    waitUntil: 'domcontentloaded',
  });

  await expect(page.getByRole('button', { name: /^ARDO məhsullarına bax/ })).toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get('brand')).toBeNull();
  await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBeNull();
  expect(new URL(page.url()).searchParams.get('mode')).toBe('catalog');
});
