import { test, expect } from '@playwright/test';

test.describe('Real Browser Focus Trap & Interaction Suite', () => {
  test('1. Product Detail Modal: verifies initial focus, Tab wrapping, Escape dismiss, body scroll lock, and trigger focus restoration', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const firstCard = page.locator('.product-card').first();
    await firstCard.waitFor({ state: 'visible' });

    // Tag the trigger element to assert exact reference restoration
    await firstCard.evaluate((el) => el.setAttribute('data-test-orig-trigger', 'true'));
    await firstCard.focus();

    const initialOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(initialOverflow).not.toBe('hidden');

    await firstCard.click();

    const modal = page.locator('.modal-overlay-wrap, [role="dialog"]').first();
    await modal.waitFor({ state: 'visible' });

    // Body scroll lock
    const lockedOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(lockedOverflow).toBe('hidden');

    // Initial focus inside modal
    const isInitialFocusInsideModal = await page.evaluate(() => {
      const active = document.activeElement;
      const modalEl = document.querySelector('.modal-overlay-wrap, [role="dialog"]');
      return modalEl ? modalEl.contains(active) || modalEl === active : false;
    });
    expect(isInitialFocusInsideModal).toBe(true);

    // Forward Tab wrap
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focusTrapped = await page.evaluate(() => {
        const active = document.activeElement;
        const modalEl = document.querySelector('.modal-overlay-wrap, [role="dialog"]');
        return modalEl ? modalEl.contains(active) : false;
      });
      expect(focusTrapped).toBe(true);
    }

    // Backward Shift+Tab wrap
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+Tab');
      const focusTrapped = await page.evaluate(() => {
        const active = document.activeElement;
        const modalEl = document.querySelector('.modal-overlay-wrap, [role="dialog"]');
        return modalEl ? modalEl.contains(active) : false;
      });
      expect(focusTrapped).toBe(true);
    }

    // Dismiss via Escape
    await page.keyboard.press('Escape');
    await modal.waitFor({ state: 'hidden' });

    // Body scroll lock released
    const releasedOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(releasedOverflow).not.toBe('hidden');

    // Focus restored strictly to original trigger element
    await page.waitForTimeout(100);
    const restoredToExactTrigger = await page.evaluate(() => {
      const active = document.activeElement;
      const originalTrigger = document.querySelector('[data-test-orig-trigger="true"]');
      return active !== null && active === originalTrigger;
    });
    expect(restoredToExactTrigger).toBe(true);
  });

  test('2. Drawer: open, initial focus, Tab wrap, Shift+Tab wrap, Escape, body scroll lock, trigger restoration, and zero overflow', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const drawerTrigger = page.locator('[data-testid="drawer-trigger"]').first();
    await drawerTrigger.waitFor({ state: 'visible' });

    // Focus trigger
    await drawerTrigger.focus();

    // Verify initial zero horizontal overflow
    const initialOverflow = await page.evaluate(() => ({
      docScroll: document.documentElement.scrollWidth,
      docClient: document.documentElement.clientWidth,
      bodyScroll: document.body.scrollWidth,
      bodyClient: document.body.clientWidth,
    }));
    expect(initialOverflow.docScroll).toBeLessThanOrEqual(initialOverflow.docClient + 1);
    expect(initialOverflow.bodyScroll).toBeLessThanOrEqual(initialOverflow.bodyClient + 1);

    // Open Drawer
    await drawerTrigger.click();

    const drawer = page.locator('[data-testid="ui-drawer"]').first();
    await drawer.waitFor({ state: 'visible' });

    // Verify body scroll lock
    const lockedOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(lockedOverflow).toBe('hidden');

    // Verify initial focus inside drawer
    const isFocusInDrawer = await page.evaluate(() => {
      const active = document.activeElement;
      const drawerEl = document.querySelector('[data-testid="ui-drawer"]');
      return drawerEl ? drawerEl.contains(active) || drawerEl === active : false;
    });
    expect(isFocusInDrawer).toBe(true);

    // Verify zero horizontal overflow while drawer is open
    const drawerOpenOverflow = await page.evaluate(() => ({
      docScroll: document.documentElement.scrollWidth,
      docClient: document.documentElement.clientWidth,
      bodyScroll: document.body.scrollWidth,
      bodyClient: document.body.clientWidth,
    }));
    expect(drawerOpenOverflow.docScroll).toBeLessThanOrEqual(drawerOpenOverflow.docClient + 1);
    expect(drawerOpenOverflow.bodyScroll).toBeLessThanOrEqual(drawerOpenOverflow.bodyClient + 1);

    // Forward Tab wrap inside drawer
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab');
      const focusTrapped = await page.evaluate(() => {
        const active = document.activeElement;
        const drawerEl = document.querySelector('[data-testid="ui-drawer"]');
        return drawerEl ? drawerEl.contains(active) : false;
      });
      expect(focusTrapped).toBe(true);
    }

    // Backward Shift+Tab wrap inside drawer
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Shift+Tab');
      const focusTrapped = await page.evaluate(() => {
        const active = document.activeElement;
        const drawerEl = document.querySelector('[data-testid="ui-drawer"]');
        return drawerEl ? drawerEl.contains(active) : false;
      });
      expect(focusTrapped).toBe(true);
    }

    // Escape closes drawer
    await page.keyboard.press('Escape');
    await drawer.waitFor({ state: 'hidden' });

    // Scroll lock released
    const releasedOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(releasedOverflow).not.toBe('hidden');

    // Focus restored to trigger element
    await page.waitForTimeout(100);
    const isFocusRestored = await page.evaluate(() => {
      const active = document.activeElement;
      const trigger = document.querySelector('[data-testid="drawer-trigger"]');
      return active === trigger;
    });
    expect(isFocusRestored).toBe(true);
  });

  test('3. Background isolation & nested modal regression: opens two real stacked modals, tests top dismissal keeps bottom modal active, and final dismissal restores background without loose fallbacks', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // 1. Open first modal (Product Detail Modal)
    const firstCard = page.locator('.product-card').first();
    await firstCard.waitFor({ state: 'visible' });
    await firstCard.click();

    const detailModal = page.locator('.product-detail-modal-overlay, .modal-overlay-wrap').first();
    await detailModal.waitFor({ state: 'visible' });

    // Assert main catalog content exists and is isolated
    const mainIsolation1 = await page.evaluate(() => {
      const main = document.querySelector('.catalog-main');
      if (!main) throw new Error('.catalog-main element not found in DOM');
      return {
        inert: (main as HTMLElement & { inert?: boolean }).inert || false,
        ariaHidden: main.getAttribute('aria-hidden'),
      };
    });
    expect(mainIsolation1.inert).toBe(true);
    expect(mainIsolation1.ariaHidden).toBe('true');

    // 2. Open second nested modal (ShareModal) from within Product Detail Modal
    const shareBtn = detailModal.locator('button.modal-share-btn').first();
    await shareBtn.waitFor({ state: 'visible' });
    await shareBtn.click();

    const shareModal = page.locator('.share-modal-overlay').first();
    await shareModal.waitFor({ state: 'visible' });

    // Verify under nested condition: detail modal is now inert & aria-hidden, share modal is active
    const nestedState = await page.evaluate(() => {
      const detail = document.querySelector('.product-detail-modal-overlay, .modal-overlay-wrap');
      const share = document.querySelector('.share-modal-overlay');
      const main = document.querySelector('.catalog-main');

      if (!detail || !share || !main) {
        throw new Error('Required modal or background elements not found in DOM');
      }

      return {
        detailInert: (detail as HTMLElement & { inert?: boolean }).inert || false,
        detailAriaHidden: detail.getAttribute('aria-hidden'),
        shareInert: (share as HTMLElement & { inert?: boolean }).inert || false,
        mainInert: (main as HTMLElement & { inert?: boolean }).inert || false,
        mainAriaHidden: main.getAttribute('aria-hidden'),
      };
    });

    expect(nestedState.detailInert).toBe(true);
    expect(nestedState.detailAriaHidden).toBe('true');
    expect(nestedState.shareInert).toBe(false);
    expect(nestedState.mainInert).toBe(true);
    expect(nestedState.mainAriaHidden).toBe('true');

    // 3. Press Escape to close only the top modal (ShareModal)
    await page.keyboard.press('Escape');
    await shareModal.waitFor({ state: 'hidden' });

    // Verify detail modal is restored to active state, but main background is STILL inert
    const afterTopCloseState = await page.evaluate(() => {
      const detail = document.querySelector('.product-detail-modal-overlay, .modal-overlay-wrap');
      const main = document.querySelector('.catalog-main');
      if (!detail || !main) throw new Error('Elements missing after closing top modal');

      return {
        detailInert: (detail as HTMLElement & { inert?: boolean }).inert || false,
        detailAriaHidden: detail.getAttribute('aria-hidden'),
        mainInert: (main as HTMLElement & { inert?: boolean }).inert || false,
        mainAriaHidden: main.getAttribute('aria-hidden'),
      };
    });

    expect(afterTopCloseState.detailInert).toBe(false);
    expect(afterTopCloseState.detailAriaHidden).toBeNull();
    expect(afterTopCloseState.mainInert).toBe(true);
    expect(afterTopCloseState.mainAriaHidden).toBe('true');

    // 4. Press Escape to close the bottom modal (Product Detail Modal)
    await page.keyboard.press('Escape');
    await detailModal.waitFor({ state: 'hidden' });

    // Verify main background is completely restored
    const finalState = await page.evaluate(() => {
      const main = document.querySelector('.catalog-main');
      if (!main) throw new Error('.catalog-main element not found in DOM');

      return {
        mainInert: (main as HTMLElement & { inert?: boolean }).inert || false,
        mainAriaHidden: main.getAttribute('aria-hidden'),
      };
    });

    expect(finalState.mainInert).toBe(false);
    expect(finalState.mainAriaHidden).toBeNull();
  });

  test('4. Smart Search: open on interaction, verify overlay, keyboard Escape', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const searchBtn = page
      .locator('button[aria-label="Axtarış pəncərəsini aç"], .header-search-wrap button')
      .first();
    await searchBtn.waitFor({ state: 'visible' });
    await searchBtn.click();

    const overlay = page.locator('.smart-search-overlay').first();
    await overlay.waitFor({ state: 'visible' });

    await page.keyboard.press('Escape');
    await overlay.waitFor({ state: 'hidden' });
  });

  test('5. ProductCard Keyboard Accessibility: Enter & Space open detail modal, Space prevents page scroll, and focus restores to trigger', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const card = page.locator('.product-card').first();
    await card.waitFor({ state: 'visible' });
    await card.evaluate((el) => el.setAttribute('data-test-card-trigger', 'first'));

    // A. Focus card and trigger with Enter
    await card.focus();
    await expect(card).toBeFocused();

    await page.keyboard.press('Enter');
    let modal = page.locator('.product-detail-modal-overlay').first();
    await modal.waitFor({ state: 'visible' });

    // Dismiss with Escape and verify focus returns to exact card
    await page.keyboard.press('Escape');
    await modal.waitFor({ state: 'hidden' });

    await page.waitForTimeout(100);
    const isFocusedAfterEnter = await page.evaluate(() => {
      const active = document.activeElement;
      const trigger = document.querySelector('[data-test-card-trigger="first"]');
      return active === trigger;
    });
    expect(isFocusedAfterEnter).toBe(true);

    // Wait for any initial smooth scroll to settle
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // B. Trigger with Space and verify no vertical page scroll occurs and focus restores
    const scrollBeforeSpace = await page.evaluate(() => window.scrollY);

    await page.keyboard.press('Space');
    modal = page.locator('.product-detail-modal-overlay').first();
    await modal.waitFor({ state: 'visible' });

    // Dismiss with Escape and verify focus and scroll return strictly to exact card
    await page.keyboard.press('Escape');
    await modal.waitFor({ state: 'hidden' });

    await page.waitForTimeout(300);
    const scrollAfterSpace = await page.evaluate(() => window.scrollY);
    expect(scrollAfterSpace).toBe(scrollBeforeSpace);

    const isFocusedAfterSpace = await page.evaluate(() => {
      const active = document.activeElement;
      const trigger = document.querySelector('[data-test-card-trigger="first"]');
      return active === trigger;
    });
    expect(isFocusedAfterSpace).toBe(true);
  });

  test('6. Nested action buttons (WhatsApp, Call, Share) inside ProductCard do not accidentally trigger product detail modal', async ({
    page,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Prevent external tel: or whatsapp window protocol navigation
    await page.evaluate(() => {
      window.open = () => null;
    });

    const card = page.locator('.product-card').first();
    await card.waitFor({ state: 'visible' });

    const detailModal = page.locator('.product-detail-modal-overlay').first();

    // Click nested WhatsApp button -> Detail modal must NOT open
    const waBtn = card.locator('.card-action-btn-wa').first();
    await waBtn.click();
    await page.waitForTimeout(300);
    const isDetailVisibleAfterWa = await detailModal.isVisible();
    expect(isDetailVisibleAfterWa).toBe(false);

    // Click nested Call button -> Detail modal must NOT open
    const callBtn = card.locator('.card-action-btn-call').first();
    await callBtn.click();
    await page.waitForTimeout(300);
    const isDetailVisibleAfterCall = await detailModal.isVisible();
    expect(isDetailVisibleAfterCall).toBe(false);

    // Click nested Share button -> Opens ShareModal, NOT ProductDetailModal
    const shareBtn = card.locator('.card-action-btn-share').first();
    await shareBtn.click();
    const shareModal = page.locator('.share-modal-overlay').first();
    await shareModal.waitFor({ state: 'visible' });
    const isDetailVisibleAfterShare = await detailModal.isVisible();
    expect(isDetailVisibleAfterShare).toBe(false);

    // Close Share modal
    await page.keyboard.press('Escape');
    await shareModal.waitFor({ state: 'hidden' });
  });
});
