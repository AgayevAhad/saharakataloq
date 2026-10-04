import { expect, test } from '@playwright/test';

test('catalog grid dedicates a 339px square to media and keeps actions outside it', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/catalog', { waitUntil: 'domcontentloaded' });

  const grid = page.locator('.catalog-products-container.is-grid-view');
  const card = grid.locator('.catalog-product-reveal > .product-card').first();
  await expect(card).toBeVisible();
  await card.scrollIntoViewIfNeeded();

  const image = card.locator('.product-card-media .shimmer-img').first();
  const imageFallback = card.locator('.product-card-media .img-fallback-box').first();
  await expect(image.or(imageFallback)).toBeVisible();
  if ((await image.count()) > 0) {
    await expect
      .poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth))
      .toBeGreaterThan(0);
  }

  const geometry = await card.evaluate((element) => {
    const media = element.querySelector<HTMLElement>('.product-card-media')!;
    const details = element.querySelector<HTMLElement>('.product-card-details')!;
    const topActions = element.querySelector<HTMLElement>('.product-card-top-actions')!;
    const brandBadge = element.querySelector<HTMLElement>('.product-brand-badge')!;
    const categoryBadge = element.querySelector<HTMLElement>('.product-card-category-top')!;
    const identity = element.querySelector<HTMLElement>('.product-card-identity-top')!;
    const contactActions = element.querySelector<HTMLElement>('.product-card-contact-actions')!;
    const primaryActions = element.querySelector<HTMLElement>('.product-card-primary-actions')!;
    const whatsappButton = element.querySelector<HTMLElement>('.card-action-btn-wa')!;
    const callButton = element.querySelector<HTMLElement>('.card-action-btn-call')!;
    const heartButton = element.querySelector<HTMLElement>('.card-action-btn-heart')!;
    const cartButton = element.querySelector<HTMLElement>('.card-action-btn-cart')!;
    const mediaRect = media.getBoundingClientRect();
    const detailsRect = details.getBoundingClientRect();
    const topActionsRect = topActions.getBoundingClientRect();
    const brandRect = brandBadge.getBoundingClientRect();
    const categoryRect = categoryBadge.getBoundingClientRect();
    const identityRect = identity.getBoundingClientRect();
    const contactRect = contactActions.getBoundingClientRect();
    const primaryRect = primaryActions.getBoundingClientRect();
    const whatsappRect = whatsappButton.getBoundingClientRect();
    const callRect = callButton.getBoundingClientRect();
    const heartRect = heartButton.getBoundingClientRect();
    const cartRect = cartButton.getBoundingClientRect();
    const cardRect = element.getBoundingClientRect();
    return {
      cardWidth: cardRect.width,
      detailsWidth: detailsRect.width,
      mediaWidth: mediaRect.width,
      mediaHeight: mediaRect.height,
      mediaRight: mediaRect.right,
      detailsLeft: detailsRect.left,
      cardHeight: cardRect.height,
      topActionsCenter: topActionsRect.left + topActionsRect.width / 2,
      primaryActionsCenter: primaryRect.left + primaryRect.width / 2,
      brandLeft: brandRect.left,
      brandRight: brandRect.right,
      categoryLeft: categoryRect.left,
      categoryRight: categoryRect.right,
      identityTop: identityRect.top,
      cardTop: cardRect.top,
      cardLeft: cardRect.left,
      cardRight: cardRect.right,
      contactWidth: contactRect.width,
      primaryWidth: primaryRect.width,
      contactButtonHeight: Math.max(whatsappRect.height, callRect.height),
      contactButtonsSpan: callRect.right - whatsappRect.left,
      callWidth: callRect.width,
      callBottom: callRect.bottom,
      whatsappWidth: whatsappRect.width,
      whatsappTop: whatsappRect.top,
      heartWidth: heartRect.width,
      heartHeight: heartRect.height,
      cartWidth: cartRect.width,
      cartHeight: cartRect.height,
      cartRight: cartRect.right,
      heartTop: heartRect.top,
      heartBottom: heartRect.bottom,
      cartTop: cartRect.top,
    };
  });

  expect(geometry.cardWidth).toBeCloseTo(559, 0);
  expect(geometry.detailsWidth).toBeCloseTo(220, 0);
  expect(geometry.mediaWidth).toBeCloseTo(339, 0);
  expect(geometry.mediaHeight).toBeCloseTo(339, 0);
  expect(geometry.detailsLeft).toBeGreaterThanOrEqual(geometry.mediaRight - 1);
  expect(geometry.cardHeight).toBeCloseTo(339, 0);
  expect(Math.abs(geometry.topActionsCenter - geometry.primaryActionsCenter)).toBeLessThan(2);
  expect(geometry.brandLeft).toBeGreaterThanOrEqual(geometry.mediaRight);
  expect(geometry.categoryLeft).toBeGreaterThanOrEqual(geometry.brandRight + 5);
  expect(geometry.cardRight - geometry.categoryRight).toBeLessThanOrEqual(23);
  expect(geometry.identityTop - geometry.cardTop).toBeCloseTo(10, 0);
  expect(Math.abs(geometry.contactButtonsSpan - geometry.contactWidth)).toBeLessThan(1);
  expect(geometry.primaryWidth - geometry.contactButtonsSpan).toBeCloseTo(0, 0);
  expect(geometry.heartWidth - geometry.contactButtonsSpan).toBeCloseTo(0, 0);
  expect(geometry.cartWidth - geometry.contactButtonsSpan).toBeCloseTo(0, 0);
  expect(geometry.callWidth).toBeCloseTo(geometry.cartWidth, 0);
  expect(geometry.whatsappWidth).toBeCloseTo(geometry.cartWidth, 0);
  expect(geometry.whatsappTop).toBeGreaterThanOrEqual(geometry.callBottom + 5);
  expect(geometry.cardRight - geometry.cartRight).toBeLessThanOrEqual(23);
  expect(Math.abs(geometry.heartHeight - geometry.contactButtonHeight)).toBeLessThan(1);
  expect(Math.abs(geometry.cartHeight - geometry.contactButtonHeight)).toBeLessThan(1);
  expect(geometry.cartTop).toBeGreaterThanOrEqual(geometry.heartBottom + 5);

  const title = card.locator('.product-card-full-title');
  await expect(title).toBeVisible();
  const titlePresentation = await title.evaluate((element) => ({
    whiteSpace: getComputedStyle(element).whiteSpace,
    textOverflow: getComputedStyle(element).textOverflow,
    fullyVisible: element.scrollHeight <= element.clientHeight,
  }));
  expect(titlePresentation.whiteSpace).toBe('normal');
  expect(titlePresentation.textOverflow).not.toBe('ellipsis');
  expect(titlePresentation.fullyVisible).toBe(true);

  await expect(card.getByRole('button', { name: 'Seçilmişlər' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Səbətə əlavə et' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'WhatsApp' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Zəng et' })).toBeVisible();
  await expect(card.getByRole('button', { name: 'Ətraflı bax' })).toBeVisible();
  await expect(card.locator('.product-card-top-actions').getByRole('button')).toHaveCount(2);

  await page.evaluate(() => {
    document.documentElement.dataset.lastOpenedUrl = '';
    window.open = ((url?: string | URL) => {
      document.documentElement.dataset.lastOpenedUrl = String(url || '');
      return null;
    }) as typeof window.open;
  });
  const productTitle = (await title.textContent())?.trim() || '';
  await card.getByRole('button', { name: 'WhatsApp' }).click();
  const openedWhatsAppUrl = await page.evaluate(
    () => document.documentElement.dataset.lastOpenedUrl || ''
  );
  const parsedWhatsAppUrl = new URL(openedWhatsAppUrl);
  const whatsappMessage = parsedWhatsAppUrl.searchParams.get('text') || '';
  expect(parsedWhatsAppUrl.origin).toBe('https://wa.me');
  expect(parsedWhatsAppUrl.pathname).toMatch(/^\/\d+$/);
  expect(whatsappMessage).toContain('🔗 Məhsulun linki:');
  expect(whatsappMessage).toContain(`🏷 Məhsulun adı:\n${productTitle}`);
  expect(whatsappMessage).toContain('Salam, bu məhsul haqqında ətraflı məlumat almaq istəyirəm.');
  expect(whatsappMessage.indexOf('🔗 Məhsulun linki:')).toBeLessThan(
    whatsappMessage.indexOf('🏷 Məhsulun adı:')
  );
  expect(whatsappMessage.indexOf('🏷 Məhsulun adı:')).toBeLessThan(
    whatsappMessage.indexOf('Salam, bu məhsul haqqında')
  );
  await page.mouse.move(0, 0);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  const nextMediaButton = card.locator('.card-media-nav-btn.next');
  if ((await nextMediaButton.count()) > 0) {
    const mediaBox = await card.locator('.product-card-media').boundingBox();
    const nextBox = await nextMediaButton.boundingBox();
    expect(mediaBox).not.toBeNull();
    expect(nextBox).not.toBeNull();
    expect(
      (mediaBox?.x || 0) + (mediaBox?.width || 0) - ((nextBox?.x || 0) + (nextBox?.width || 0))
    ).toBeLessThanOrEqual(3);
    await expect(nextMediaButton).toHaveCSS('opacity', '0');
    await card.hover();
    await expect(nextMediaButton).toHaveCSS('opacity', '1');
    await page.mouse.move(0, 0);
    await expect(nextMediaButton).toHaveCSS('opacity', '0');
  }

  const gaps = await grid.evaluate((element) => ({
    column: getComputedStyle(element).columnGap,
    row: getComputedStyle(element).rowGap,
  }));
  expect(gaps.column).toBe('32px');
  expect(gaps.row).toBe('36px');

  await page.setViewportSize({ width: 1920, height: 1080 });
  const firstTwoCards = grid.locator('.catalog-product-reveal > .product-card:visible');
  await expect(firstTwoCards.nth(1)).toBeVisible();
  const wideGrid = await grid.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    columns: getComputedStyle(element).gridTemplateColumns,
  }));
  const firstBox = await firstTwoCards.nth(0).boundingBox();
  const secondBox = await firstTwoCards.nth(1).boundingBox();
  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  expect(wideGrid.width).toBeGreaterThan(1200);
  expect(wideGrid.columns.split(' ').length).toBe(2);
  expect(Math.abs((firstBox?.y || 0) - (secondBox?.y || 0))).toBeLessThan(2);

  await page.screenshot({ path: 'test-results/catalog-square-media.png', fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileCard = grid.locator('.catalog-product-reveal > .product-card:visible').first();
  await mobileCard.scrollIntoViewIfNeeded();
  const mobileGeometry = await mobileCard.evaluate((element) => {
    const cardRect = element.getBoundingClientRect();
    const mediaRect = element
      .querySelector<HTMLElement>('.product-card-media')!
      .getBoundingClientRect();
    const detailsRect = element
      .querySelector<HTMLElement>('.product-card-details')!
      .getBoundingClientRect();
    const brandRect = element
      .querySelector<HTMLElement>('.product-brand-badge')!
      .getBoundingClientRect();
    const categoryRect = element
      .querySelector<HTMLElement>('.product-card-category-top')!
      .getBoundingClientRect();
    const callButton = element.querySelector<HTMLElement>('.card-action-btn-call')!;
    const whatsappButton = element.querySelector<HTMLElement>('.card-action-btn-wa')!;
    const shareButton = element.querySelector<HTMLElement>('.card-action-btn-share')!;
    const detailsButton = element.querySelector<HTMLElement>('.card-action-btn-details')!;
    const titleRect = element
      .querySelector<HTMLElement>('.product-card-full-title')!
      .getBoundingClientRect();
    const priceRect = element
      .querySelector<HTMLElement>('.product-card-price-compare-row')!
      .getBoundingClientRect();
    const heartRect = element
      .querySelector<HTMLElement>('.card-action-btn-heart')!
      .getBoundingClientRect();
    const cartButton = element.querySelector<HTMLElement>('.card-action-btn-cart')!;
    const cartRect = cartButton.getBoundingClientRect();
    const callRect = callButton.getBoundingClientRect();
    const whatsappRect = whatsappButton.getBoundingClientRect();
    const shareRect = shareButton.getBoundingClientRect();
    return {
      cardWidth: cardRect.width,
      cardLeft: cardRect.left,
      cardRight: cardRect.right,
      mediaWidth: mediaRect.width,
      mediaHeight: mediaRect.height,
      mediaBottom: mediaRect.bottom,
      detailsTop: detailsRect.top,
      cardBottom: cardRect.bottom,
      brandTop: brandRect.top,
      brandLeft: brandRect.left,
      categoryTop: categoryRect.top,
      categoryRight: categoryRect.right,
      callTop: callRect.top,
      callRight: callRect.right,
      whatsappLeft: whatsappRect.left,
      whatsappRight: whatsappRect.right,
      shareLeft: shareRect.left,
      callWidth: callRect.width,
      whatsappWidth: whatsappRect.width,
      shareWidth: shareRect.width,
      callLabelDisplay: getComputedStyle(callButton.querySelector('span')!).display,
      whatsappLabelDisplay: getComputedStyle(whatsappButton.querySelector('span')!).display,
      detailsDisplay: getComputedStyle(detailsButton).display,
      shareBackground: getComputedStyle(shareButton).backgroundColor,
      shareColor: getComputedStyle(shareButton).color,
      titleBottom: titleRect.bottom,
      priceTop: priceRect.top,
      heartTop: heartRect.top,
      heartBottom: heartRect.bottom,
      cartTop: cartRect.top,
      heartWidth: heartRect.width,
      cartWidth: cartRect.width,
      cartVisibleText: cartButton.innerText.trim(),
      desktopCartLabelDisplay: getComputedStyle(
        element.querySelector<HTMLElement>('.product-card-cart-label-desktop')!
      ).display,
      mobileCartLabelDisplay: getComputedStyle(
        element.querySelector<HTMLElement>('.product-card-cart-label-mobile')!
      ).display,
      pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(mobileGeometry.cardWidth).toBeLessThanOrEqual(339);
  expect(Math.abs(mobileGeometry.mediaWidth - mobileGeometry.mediaHeight)).toBeLessThan(1);
  expect(mobileGeometry.detailsTop).toBeGreaterThanOrEqual(mobileGeometry.mediaBottom - 1);
  expect(Math.abs(mobileGeometry.brandTop - mobileGeometry.categoryTop)).toBeLessThan(2);
  expect(mobileGeometry.brandLeft - mobileGeometry.cardLeft).toBeCloseTo(10, 0);
  expect(mobileGeometry.cardRight - mobileGeometry.categoryRight).toBeCloseTo(10, 0);
  expect(mobileGeometry.callTop).toBeGreaterThanOrEqual(mobileGeometry.detailsTop);
  expect(mobileGeometry.whatsappLeft).toBeGreaterThanOrEqual(mobileGeometry.callRight + 5);
  expect(mobileGeometry.shareLeft).toBeGreaterThanOrEqual(mobileGeometry.whatsappRight + 5);
  expect(mobileGeometry.callWidth).toBeCloseTo(36, 0);
  expect(mobileGeometry.whatsappWidth).toBeCloseTo(36, 0);
  expect(mobileGeometry.shareWidth).toBeCloseTo(36, 0);
  expect(mobileGeometry.callLabelDisplay).toBe('none');
  expect(mobileGeometry.whatsappLabelDisplay).toBe('none');
  expect(mobileGeometry.detailsDisplay).toBe('none');
  expect(mobileGeometry.shareBackground).toBe('rgb(248, 250, 252)');
  expect(mobileGeometry.shareColor).toBe('rgb(17, 24, 39)');
  expect(mobileGeometry.heartTop).toBeGreaterThanOrEqual(mobileGeometry.titleBottom + 5);
  expect(mobileGeometry.priceTop).toBeGreaterThanOrEqual(mobileGeometry.heartBottom + 5);
  expect(Math.abs(mobileGeometry.heartTop - mobileGeometry.cartTop)).toBeLessThan(1);
  expect(Math.abs(mobileGeometry.heartWidth - mobileGeometry.cartWidth)).toBeLessThan(1);
  expect(mobileGeometry.cartVisibleText).toBe('Əlavə et');
  expect(mobileGeometry.desktopCartLabelDisplay).toBe('none');
  expect(mobileGeometry.mobileCartLabelDisplay).not.toBe('none');
  expect(mobileGeometry.pageOverflow).toBeLessThanOrEqual(1);

  const mobileNextMediaButton = mobileCard.locator('.card-media-nav-btn.next');
  if ((await mobileNextMediaButton.count()) > 0) {
    await expect(mobileNextMediaButton).toHaveCSS('visibility', 'visible');
    await expect(mobileNextMediaButton).toHaveCSS('pointer-events', 'auto');
  }

  const secondMobileCard = grid.locator('.catalog-product-reveal > .product-card:visible').nth(1);
  const secondMobileBox = await secondMobileCard.boundingBox();
  expect(secondMobileBox).not.toBeNull();
  expect(secondMobileBox?.y || 0).toBeGreaterThanOrEqual(mobileGeometry.cardBottom + 30);

  await page.screenshot({ path: 'test-results/catalog-square-media-mobile.png', fullPage: false });
});
