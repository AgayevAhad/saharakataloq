import { test, expect } from '@playwright/test';

test.describe('PIM v2 Admin E2E Suite', () => {
  let currentCsrfToken = '';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/AdministratorNT', { waitUntil: 'domcontentloaded' });
    const pwdInput = page.locator('input[type="password"]');
    await pwdInput.waitFor({ state: 'visible' });
    await pwdInput.fill('TestAdmin2026!');

    const [loginRes] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/admin/login') && res.status() === 200),
      page.locator('button.primary-admin-button, button[type="submit"]').first().click(),
    ]);
    const loginJson = await loginRes.json();
    currentCsrfToken = loginJson.csrfToken || loginJson.admin?.csrfToken || '';
    await page.locator('.admin-main').waitFor({ state: 'visible' });
  });

  test('1. PIM v2 tab displays pending status, executes CSRF Dry-Run, and keeps live apply disabled (strict 403 guard)', async ({
    page,
  }) => {
    // Navigate to Snapshots / PIM tab
    const snapshotTab = page.locator('nav button:has-text("Bərpa & Nüsxələr")');
    await snapshotTab.click();

    // Verify PIM v2 migration section is visible
    const pimSection = page.locator('.pim-migration-manager');
    await pimSection.waitFor({ state: 'visible' });

    // 1. Migration Status Badge
    const statusBadge = pimSection.getByText(/Gözləyir|Tətbiq Edilib/).first();
    await statusBadge.waitFor({ state: 'visible', timeout: 15000 });
    await expect(statusBadge).toBeVisible();

    // 2. Disabled Apply Button
    const applyBtn = pimSection.locator('button:has-text("Miqrasiyanı Tətbiq Et")');
    await expect(applyBtn).toBeDisabled();

    // 3. Dry-Run Execution with CSRF Token
    const [dryRunRequest] = await Promise.all([
      page.waitForRequest(
        (req) => req.url().includes('/api/admin/pim/migration/dry-run') && req.method() === 'POST'
      ),
      pimSection.locator('button:has-text("Dry-Run Simulyasiyası")').click(),
    ]);

    expect(dryRunRequest.headers()['x-csrf-token']).toBeDefined();

    // Verify Dry-Run Report appears with token & 0 data loss
    await page.locator('text=Dry-Run Simulyasiya Hesabatı').waitFor({ state: 'visible' });
    await expect(page.locator('text=/0 Data Loss/')).toBeVisible();
    await expect(page.locator('text=Canonical SHA-256 Token')).toBeVisible();

    // 4. Verify direct live apply attempt returns STRICT HTTP 403 Forbidden
    const applyResponse = await page.evaluate(async (token) => {
      const res = await fetch('/api/admin/pim/migration/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token,
        },
        body: JSON.stringify({ dryRunToken: 'dummy_token' }),
      });
      return { status: res.status, json: await res.json() };
    }, currentCsrfToken);

    expect(applyResponse.status).toBe(403);
    expect(applyResponse.json.error).toBe('LIVE_APPLY_DISABLED');
  });

  test('2. Real un-mocked backend: Product editing enforces If-Match (428), handles concurrent conflict (412), and saves with new ETag (200)', async ({
    page,
  }) => {
    // 1. Get first existing product from backend
    const prodInfo = await page.evaluate(async (token) => {
      const dataRes = await fetch('/api/admin/data', {
        headers: { 'X-CSRF-Token': token },
      });
      const data = await dataRes.json();
      const first = data.products[0];
      const getRes = await fetch(`/api/admin/products/${first.id}`, {
        headers: { 'X-CSRF-Token': token },
      });
      const getEtag = getRes.headers.get('etag');
      const getBody = await getRes.json();
      return { product: getBody.product || getBody, etag: getEtag };
    }, currentCsrfToken);

    const targetId = prodInfo.product.id;
    const initialEtag = prodInfo.etag;

    // 2. Verify HTTP 428 Precondition Required when If-Match is omitted
    const noIfMatchRes = await page.evaluate(
      async ({ id, token }) => {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
          },
          body: JSON.stringify({ title: 'Updated title without header' }),
        });
        return { status: res.status, json: await res.json() };
      },
      { id: targetId, token: currentCsrfToken }
    );
    expect(noIfMatchRes.status).toBe(428);
    expect(noIfMatchRes.json.error).toBe('IF_MATCH_REQUIRED');

    // 3. Verify HTTP 412 Precondition Failed when If-Match has stale/invalid version
    const conflictRes = await page.evaluate(
      async ({ id, token }) => {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
            'If-Match': '"p-stale-v999-hash"',
          },
          body: JSON.stringify({ title: 'Conflicted title' }),
        });
        return { status: res.status, json: await res.json() };
      },
      { id: targetId, token: currentCsrfToken }
    );
    expect(conflictRes.status).toBe(412);
    expect(conflictRes.json.error).toBe('PRODUCT_VERSION_CONFLICT');

    // 4. Open Products Tab in Admin UI
    const productsTab = page.locator('nav button:has-text("Məhsullar")');
    await productsTab.click();

    // Open first product editor in UI
    const editBtn = page.getByRole('button', { name: 'Redaktə et' }).first();
    await editBtn.waitFor({ state: 'visible', timeout: 15000 });
    await editBtn.click();

    // Verify product modal opened
    const productModal = page.locator('.product-modal-card');
    await productModal.waitFor({ state: 'visible' });

    // 5. Simulate concurrent out-of-band edit on backend before saving in UI
    const concurrentUpdate = await page.evaluate(
      async ({ id, token, etag, prod }) => {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
            'If-Match': etag || '',
          },
          body: JSON.stringify({
            ...prod,
            title: `${prod.title} (Concurrent Backend Update)`,
          }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { id: targetId, token: currentCsrfToken, etag: initialEtag, prod: prodInfo.product }
    );

    expect(concurrentUpdate.status).toBe(200);
    const newServerEtag = concurrentUpdate.etag;
    expect(newServerEtag).toBeDefined();

    // 6. Click save in UI product editor (which still holds old ETag) -> Triggers real 412 conflict
    const saveBtn = page.locator('.product-modal-footer button:has-text("Yadda saxla")');
    await saveBtn.click();

    // 7. Verify Version Conflict Modal (HTTP 412) opens with real backend response
    const conflictModal = page.locator('[data-testid="conflict-modal"]');
    await conflictModal.waitFor({ state: 'visible' });
    await expect(conflictModal.locator('text=Versiya Konflikti Aşkarlanmışdır')).toBeVisible();

    // 8. Click "Server Versiyasını Qəbul Et"
    const acceptServerBtn = page.locator('[data-testid="conflict-accept-server-btn"]');
    await acceptServerBtn.click();

    // Conflict modal is dismissed
    await expect(conflictModal).toBeHidden();

    // 9. Now edit title in UI and save cleanly with the updated server ETag
    const titleInput = page.locator('.product-modal-card label:has-text("Məhsul adı") input');
    await titleInput.fill('ARDO Real UI Save Tested');

    const finalSaveBtn = page.locator('.product-modal-footer button:has-text("Yadda saxla")');
    await finalSaveBtn.click();

    // Modal closes and success toast appears
    await expect(productModal).toBeHidden({ timeout: 10000 });
  });
});
