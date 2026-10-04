import { expect, test } from '@playwright/test';

test('wholesale catalog keeps the 339px media card compact without right-side dead space', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?mode=catalog', { waitUntil: 'domcontentloaded' });

  const brandCards = page.locator('.brand-showcase-card.ready');
  await expect(brandCards).toHaveCount(3);
  await expect(page.locator('.brand-showcase')).not.toContainText('Şəkil yoxdur');
  for (let index = 0; index < 3; index += 1) {
    const backdropItems = brandCards.nth(index).locator('.brand-card-backdrop-item');
    await expect(backdropItems).toHaveCount(4);
    await expect(backdropItems.first()).toHaveCSS('animation-duration', '48s');
    await expect
      .poll(() =>
        backdropItems
          .locator('img')
          .evaluateAll((images) =>
            images.some((image) => (image as HTMLImageElement).naturalWidth > 0)
          )
      )
      .toBe(true);
  }
  await page.screenshot({
    path: 'test-results/catalog-brand-showcase-motion.png',
    fullPage: false,
  });

  await page
    .getByRole('button', { name: /^Bişirmə panelləri/ })
    .first()
    .click();

  const categoryHeading = page.getByRole('heading', { level: 1, name: 'Bişirmə panelləri' });
  await expect(categoryHeading).toBeVisible();
  await expect(categoryHeading.locator('.category-glyph')).toBeVisible();
  await expect(page.getByText('(Bütün brendlər)', { exact: true })).toHaveCount(0);
  await expect(
    page.getByText('Modellərə və texniki xüsusiyyət sahələrinə baxın', { exact: true })
  ).toHaveCount(0);

  const grid = page.locator('.catalog-body-layout .product-grid');
  const card = grid.locator(':scope > .product-card').first();
  await expect(card).toBeVisible({ timeout: 15_000 });
  await card.scrollIntoViewIfNeeded();

  const geometry = await card.evaluate((element) => {
    const mediaRect = element
      .querySelector<HTMLElement>('.product-card-media')!
      .getBoundingClientRect();
    const detailsRect = element
      .querySelector<HTMLElement>('.product-card-details')!
      .getBoundingClientRect();
    const categoryRect = element
      .querySelector<HTMLElement>('.product-card-category-top')!
      .getBoundingClientRect();
    const brandRect = element
      .querySelector<HTMLElement>('.product-brand-badge')!
      .getBoundingClientRect();
    const identityRect = element
      .querySelector<HTMLElement>('.product-card-identity-top')!
      .getBoundingClientRect();
    const topActionsRect = element
      .querySelector<HTMLElement>('.product-card-top-actions')!
      .getBoundingClientRect();
    const whatsappRect = element
      .querySelector<HTMLElement>('.card-action-btn-wa')!
      .getBoundingClientRect();
    const callRect = element
      .querySelector<HTMLElement>('.card-action-btn-call')!
      .getBoundingClientRect();
    const heartRect = element
      .querySelector<HTMLElement>('.card-action-btn-heart')!
      .getBoundingClientRect();
    const cartRect = element
      .querySelector<HTMLElement>('.card-action-btn-cart')!
      .getBoundingClientRect();
    const cardRect = element.getBoundingClientRect();

    return {
      cardWidth: cardRect.width,
      cardRight: cardRect.right,
      mediaRight: mediaRect.right,
      mediaWidth: mediaRect.width,
      mediaHeight: mediaRect.height,
      detailsWidth: detailsRect.width,
      categoryRightGap: cardRect.right - categoryRect.right,
      topActionsCenter: topActionsRect.left + topActionsRect.width / 2,
      primaryActionsCenter: (heartRect.left + heartRect.right) / 2,
      brandLeft: brandRect.left,
      brandRight: brandRect.right,
      categoryLeft: categoryRect.left,
      identityTop: identityRect.top,
      detailsTop: detailsRect.top,
      contactButtonsSpan: callRect.right - whatsappRect.left,
      callWidth: callRect.width,
      callBottom: callRect.bottom,
      whatsappWidth: whatsappRect.width,
      whatsappTop: whatsappRect.top,
      heartWidth: heartRect.width,
      cartWidth: cartRect.width,
      cartRightGap: cardRect.right - cartRect.right,
    };
  });

  expect(geometry.cardWidth).toBeCloseTo(559, 0);
  expect(geometry.mediaWidth).toBeCloseTo(339, 0);
  expect(geometry.mediaHeight).toBeCloseTo(339, 0);
  expect(geometry.detailsWidth).toBeCloseTo(220, 0);
  expect(geometry.categoryRightGap).toBeLessThanOrEqual(23);
  expect(Math.abs(geometry.topActionsCenter - geometry.primaryActionsCenter)).toBeLessThan(2);
  expect(geometry.brandLeft).toBeGreaterThanOrEqual(geometry.mediaRight);
  expect(geometry.categoryLeft).toBeGreaterThanOrEqual(geometry.brandRight + 5);
  expect(Math.abs(geometry.identityTop - geometry.detailsTop)).toBeLessThanOrEqual(11);
  expect(geometry.heartWidth - geometry.contactButtonsSpan).toBeCloseTo(0, 0);
  expect(geometry.cartWidth - geometry.contactButtonsSpan).toBeCloseTo(0, 0);
  expect(geometry.callWidth).toBeCloseTo(geometry.cartWidth, 0);
  expect(geometry.whatsappWidth).toBeCloseTo(geometry.cartWidth, 0);
  expect(geometry.whatsappTop).toBeGreaterThanOrEqual(geometry.callBottom + 5);
  expect(geometry.cartRightGap).toBeLessThanOrEqual(23);

  const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns);
  expect(columns.split(' ')).toEqual(['559px', '559px']);

  const layoutGeometry = await page.evaluate(() => {
    const headerRect = document
      .querySelector<HTMLElement>('.catalog-header-inner')!
      .getBoundingClientRect();
    const brandRect = document
      .querySelector<HTMLElement>('.brand-showcase')!
      .getBoundingClientRect();
    const section = document.querySelector<HTMLElement>('.catalog-section')!;
    const sectionRect = section.getBoundingClientRect();
    const sectionStyles = getComputedStyle(section);
    const bodyRect = document
      .querySelector<HTMLElement>('.catalog-body-layout')!
      .getBoundingClientRect();
    const panelRect = document
      .querySelector<HTMLElement>('.catalog-products-panel')!
      .getBoundingClientRect();
    const gridRect = document
      .querySelector<HTMLElement>('.catalog-body-layout .product-grid')!
      .getBoundingClientRect();
    const cards = document.querySelectorAll<HTMLElement>(
      '.catalog-body-layout .product-grid > .product-card'
    );
    const secondCardRect = cards[1].getBoundingClientRect();

    return {
      headerWidth: headerRect.width,
      brandWidth: brandRect.width,
      sectionWidth: sectionRect.width,
      sectionContentRight: sectionRect.right - Number.parseFloat(sectionStyles.paddingRight),
      bodyWidth: bodyRect.width,
      bodyRight: bodyRect.right,
      panelWidth: panelRect.width,
      gridWidth: gridRect.width,
      gridRight: gridRect.right,
      secondCardRight: secondCardRect.right,
    };
  });

  expect(layoutGeometry.headerWidth).toBeCloseTo(1498, 0);
  expect(layoutGeometry.brandWidth).toBeCloseTo(1498, 0);
  expect(layoutGeometry.sectionWidth).toBeCloseTo(1498, 0);
  expect(layoutGeometry.bodyWidth).toBeCloseTo(1434, 0);
  expect(layoutGeometry.panelWidth).toBeCloseTo(1150, 0);
  expect(layoutGeometry.gridWidth).toBeCloseTo(1150, 0);
  expect(Math.abs(layoutGeometry.bodyRight - layoutGeometry.sectionContentRight)).toBeLessThan(1);
  expect(Math.abs(layoutGeometry.gridRight - layoutGeometry.secondCardRight)).toBeLessThan(1);

  await page.screenshot({
    path: 'test-results/catalog-wholesale-square-media.png',
    fullPage: false,
  });

  await expect(grid.locator(':scope > .product-card').nth(1)).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  const compactDesktop = await page.evaluate(() => {
    const bodyRect = document
      .querySelector<HTMLElement>('.catalog-body-layout')!
      .getBoundingClientRect();
    const panelRect = document
      .querySelector<HTMLElement>('.catalog-products-panel')!
      .getBoundingClientRect();
    const compactGrid = document.querySelector<HTMLElement>('.catalog-body-layout .product-grid')!;
    const gridRect = compactGrid.getBoundingClientRect();
    const cards = compactGrid.querySelectorAll<HTMLElement>(':scope > .product-card');
    const firstRect = cards[0].getBoundingClientRect();
    const secondRect = cards[1].getBoundingClientRect();

    return {
      bodyWidth: bodyRect.width,
      panelWidth: panelRect.width,
      gridWidth: gridRect.width,
      columns: getComputedStyle(compactGrid).gridTemplateColumns,
      secondBelowFirst: secondRect.top > firstRect.bottom,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(compactDesktop.bodyWidth).toBeCloseTo(843, 0);
  expect(compactDesktop.panelWidth).toBeCloseTo(559, 0);
  expect(compactDesktop.gridWidth).toBeCloseTo(559, 0);
  expect(compactDesktop.columns).toBe('559px');
  expect(compactDesktop.secondBelowFirst).toBe(true);
  expect(compactDesktop.pageOverflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 900, height: 900 });
  const tabletLayout = await page.evaluate(() => {
    const bodyRect = document
      .querySelector<HTMLElement>('.catalog-body-layout')!
      .getBoundingClientRect();
    const panelRect = document
      .querySelector<HTMLElement>('.catalog-products-panel')!
      .getBoundingClientRect();
    const sidebar = document.querySelector<HTMLElement>('.catalog-desktop-sidebar')!;
    return {
      bodyWidth: bodyRect.width,
      panelWidth: panelRect.width,
      sidebarDisplay: getComputedStyle(sidebar).display,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(tabletLayout.bodyWidth).toBeCloseTo(559, 0);
  expect(tabletLayout.panelWidth).toBeCloseTo(559, 0);
  expect(tabletLayout.sidebarDisplay).toBe('none');
  expect(tabletLayout.pageOverflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await page.evaluate(() => {
    const bodyRect = document
      .querySelector<HTMLElement>('.catalog-body-layout')!
      .getBoundingClientRect();
    const cardRect = document
      .querySelector<HTMLElement>('.catalog-body-layout .product-card')!
      .getBoundingClientRect();
    return {
      bodyWidth: bodyRect.width,
      cardWidth: cardRect.width,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(mobileLayout.bodyWidth).toBeLessThanOrEqual(358);
  expect(mobileLayout.cardWidth).toBeLessThanOrEqual(339);
  expect(mobileLayout.pageOverflow).toBeLessThanOrEqual(1);
});
