import { expect, test } from '@playwright/test';

test('desktop navigation expands as one header surface without a scroll seam', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Kataloq' }).hover();
  const panel = page.locator('#mega-menu-overlay');
  await expect(panel).toBeVisible();

  const isContainedMonolithically = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('.site-header-sticky');
    const menu = document.querySelector<HTMLElement>('#mega-menu-overlay');
    if (!header || !menu) return false;
    const headerRect = header.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    // Menu is physically rendered inside header bounding box
    return (
      header.contains(menu) &&
      menuRect.top >= headerRect.top &&
      menuRect.bottom <= headerRect.bottom + 1
    );
  });

  expect(isContainedMonolithically).toBe(true);
});
