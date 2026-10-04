import { expect, test } from '@playwright/test';

test('desktop wholesale header does not render the removed info action', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?mode=catalog', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('.header-actions')).toBeVisible();
  await expect(page.locator('.header-info-btn')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Məhsul axtarışı' })).toBeVisible();
  await expect(page.locator('.header-share-btn')).toBeVisible();
  await expect(page.locator('.drawer-trigger-btn')).toBeVisible();
  await page.screenshot({
    path: 'test-results/wholesale-desktop-header-search.png',
    fullPage: false,
  });
});

test('mobile wholesale header keeps logo, expanding search and controls in one row', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?mode=catalog', { waitUntil: 'domcontentloaded' });

  const topRow = page.locator('.header-top-row');
  const logo = page.locator('.brand-lockup');
  const actions = page.locator('.header-actions');
  const search = page.getByRole('textbox', { name: 'Məhsul axtarışı' });
  const searchShell = page.locator('.catalog-search');
  const mobileLogo = page.locator('.header-sahara-logo-mobile img');
  const categories = page.locator('.category-filter-row[aria-label="Kateqoriya filtri"]');

  await expect(topRow).toBeVisible();
  await expect(search).toBeVisible();
  await expect(categories).toBeVisible();
  await expect(page.locator('.header-info-btn')).toHaveCount(0);
  await expect(page.locator('.header-share-btn')).toBeHidden();
  await expect(page.locator('.drawer-trigger-btn')).toBeHidden();

  const [logoBox, actionsBox, searchBox, categoriesBox] = await Promise.all([
    logo.boundingBox(),
    actions.boundingBox(),
    searchShell.boundingBox(),
    categories.boundingBox(),
  ]);
  expect(logoBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(categoriesBox).not.toBeNull();

  expect(Math.abs(logoBox!.y - searchBox!.y)).toBeLessThan(8);
  expect(searchBox!.x).toBeGreaterThanOrEqual(logoBox!.x + logoBox!.width + 6);
  expect(actionsBox!.x).toBeGreaterThanOrEqual(searchBox!.x + searchBox!.width + 6);
  expect(searchBox!.height).toBeCloseTo(34, 0);
  expect(categoriesBox!.y).toBeGreaterThanOrEqual(searchBox!.y + searchBox!.height - 2);
  await expect(mobileLogo).toHaveAttribute('src', '/media/SaharaLogo.png');
  await page.screenshot({
    path: 'test-results/wholesale-mobile-header-inline-search.png',
    fullPage: false,
  });

  await search.focus();
  await expect(topRow).toHaveClass(/is-search-focused/);
  await expect(mobileLogo).toHaveAttribute('src', '/media/SaharaAvatar.png');
  await expect
    .poll(async () => (await searchShell.boundingBox())?.width ?? 0)
    .toBeGreaterThan(searchBox!.width + 35);
  await page.screenshot({
    path: 'test-results/wholesale-mobile-header-focused-search.png',
    fullPage: false,
  });

  await search.blur();
  await expect(topRow).not.toHaveClass(/is-search-focused/);
  await expect(mobileLogo).toHaveAttribute('src', '/media/SaharaLogo.png');
});

test('mobile site header keeps a thin search and removes share and location actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/catalog', { waitUntil: 'domcontentloaded' });

  const mobileHeader = page.locator('.site-header-mobile-layout');
  const searchTrigger = page.getByTestId('header-search-trigger-mobile');
  const searchInput = page.getByTestId('header-search-input-mobile');
  const logoButton = page.locator('.site-header-mobile-logo-btn');
  const logoImage = logoButton.locator('img');
  const actions = page.locator('.site-header-mobile-actions');

  await expect(mobileHeader).toBeVisible();
  await expect(searchTrigger).toBeVisible();
  await expect(page.locator('.site-header-mobile-share-btn')).toBeHidden();
  await expect(page.locator('.site-header-mobile-location-btn')).toBeHidden();
  await expect(searchTrigger).toHaveCSS('height', '34px');

  await expect(logoImage).toHaveAttribute('src', '/media/SaharaLogo.png');
  const [initialLogoBox, initialSearchBox, actionsBox] = await Promise.all([
    logoButton.boundingBox(),
    searchTrigger.boundingBox(),
    actions.boundingBox(),
  ]);
  expect(initialLogoBox).not.toBeNull();
  expect(initialSearchBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(Math.abs(initialLogoBox!.y - initialSearchBox!.y)).toBeLessThan(8);
  expect(initialSearchBox!.x).toBeGreaterThanOrEqual(initialLogoBox!.x + initialLogoBox!.width + 6);
  expect(actionsBox!.x).toBeGreaterThanOrEqual(initialSearchBox!.x + initialSearchBox!.width + 6);
  await page.screenshot({ path: 'test-results/mobile-header-inline-search.png', fullPage: false });

  await searchInput.click();
  await expect(mobileHeader).toHaveClass(/is-search-expanded/);
  await expect(logoImage).toHaveAttribute('src', '/media/SaharaAvatar.png');
  const expandedSearchBox = await searchTrigger.boundingBox();
  expect(expandedSearchBox).not.toBeNull();
  expect(expandedSearchBox!.width).toBeGreaterThan(initialSearchBox!.width + 35);
  await page.screenshot({
    path: 'test-results/mobile-header-expanded-search.png',
    fullPage: false,
  });

  await page.getByRole('button', { name: 'Axtarışı bağla' }).click();
  await expect(mobileHeader).not.toHaveClass(/is-search-expanded/);
  await expect(logoImage).toHaveAttribute('src', '/media/SaharaLogo.png');
});
