import { test, expect } from '@playwright/test';
import { join } from 'node:path';

test.describe('Splash Screen Rendering & Refresh Regression', () => {
  test('splash screen displays clean text without black background box on initial load and refresh', async ({
    page,
  }) => {
    // 1. Initial page navigation with splash hold for capture
    await page.addInitScript(() => {
      (window as any).__hold_splash_for_test = true;
    });
    await page.goto('/', { waitUntil: 'commit' });

    const splashBrand = page.locator('.sahara-splash-brand');
    await expect(splashBrand).toBeAttached();
    await expect(splashBrand).toHaveText('SAHARA ELECTRONICS');

    // 2. Capture initial splash screenshot (must succeed without try/catch)
    const splashEl = page.locator('#app-splash-screen');
    await expect(splashEl).toBeAttached();
    await page.screenshot({
      path: join(process.cwd(), 'docs/audits/splash-initial.png'),
    });

    // 3. Check computed style: background-clip should NOT be text with transparent fill or black box
    const computedStyles = await splashBrand.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        webkitTextFillColor: computed.webkitTextFillColor,
        color: computed.color,
        backgroundClip: computed.backgroundClip || (computed as any).webkitBackgroundClip,
        backgroundColor: computed.backgroundColor,
        borderWidth: computed.borderWidth,
        borderStyle: computed.borderStyle,
        outlineWidth: computed.outlineWidth,
        outlineStyle: computed.outlineStyle,
        boxShadow: computed.boxShadow,
      };
    });

    expect(computedStyles.webkitTextFillColor).not.toBe('transparent');
    expect(computedStyles.color).toBeTruthy();
    expect(computedStyles.boxShadow).toBe('none');
    expect(['0px', 'none', 'medium']).toContain(computedStyles.borderWidth);
    expect(['0px', 'none', 'medium']).toContain(computedStyles.outlineWidth);

    // Verify logo and ring animation exist
    const logoWrap = page.locator('.sahara-splash-logo-wrap');
    const ring = page.locator('.sahara-splash-ring');
    await expect(logoWrap).toBeAttached();
    await expect(ring).toBeAttached();

    // 4. Reload page and verify second splash screenshot & strict focus/style integrity
    await page.reload({ waitUntil: 'commit' });
    const reloadedSplashBrand = page.locator('.sahara-splash-brand');
    await expect(reloadedSplashBrand).toBeAttached({ timeout: 5000 });

    const reloadInspection = await reloadedSplashBrand.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        activeElementIsBrand: document.activeElement === el,
        matchesFocus: el.matches(':focus'),
        matchesFocusVisible: el.matches(':focus-visible'),
        selectionText: document.getSelection()?.toString() || '',
        borderStyle: computed.borderStyle,
        borderWidth: computed.borderWidth,
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
        boxShadow: computed.boxShadow,
        backgroundColor: computed.backgroundColor,
        webkitTextFillColor: computed.webkitTextFillColor,
        color: computed.color,
      };
    });

    // Capture reload screenshot while splash container is active
    const splashContainer = page.locator('#app-splash-screen');
    await expect(splashContainer).toBeAttached();
    await page.screenshot({
      path: join(process.cwd(), 'docs/audits/splash-reloaded.png'),
    });

    expect(reloadInspection.activeElementIsBrand).toBe(false);
    expect(reloadInspection.matchesFocus).toBe(false);
    expect(reloadInspection.matchesFocusVisible).toBe(false);
    expect(reloadInspection.selectionText).toBe('');
    expect(['none', '', 'hidden']).toContain(reloadInspection.borderStyle);
    expect(['0px', 'none', 'medium']).toContain(reloadInspection.borderWidth);
    expect(['none', '', 'hidden']).toContain(reloadInspection.outlineStyle);
    expect(['0px', 'none', 'medium']).toContain(reloadInspection.outlineWidth);
    expect(reloadInspection.boxShadow).toBe('none');
    expect(['rgba(0, 0, 0, 0)', 'transparent']).toContain(reloadInspection.backgroundColor);
    expect(reloadInspection.webkitTextFillColor).not.toBe('transparent');

    // Release splash and wait for app root
    await page.evaluate(() => {
      (window as any).__hold_splash_for_test = false;
      const splash = document.getElementById('app-splash-screen');
      if (splash) {
        splash.classList.add('splash-fade-out');
        setTimeout(() => splash.remove(), 100);
      }
    });
    await expect(page.locator('#root')).toBeAttached();
  });
});
