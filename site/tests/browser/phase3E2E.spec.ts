import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Phase 3: Brand Registry, Hierarchy & Spec Templates Real E2E', () => {
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

  test('1. Candidate create, source create = pending, source review = verified, invalid transition, official-source publication gate, logo rights, public visibility and candidate invisibility', async ({
    page,
  }) => {
    const brandsTab = page.locator('nav button:has-text("Brendlər")');
    await brandsTab.click();

    const studio = page.locator('.brand-registry-studio');
    await studio.waitFor({ state: 'visible' });

    // 1. Candidate create
    const addCandidateBtn = page.locator('button:has-text("Yeni Namizəd Əlavə Et")');
    await addCandidateBtn.click();

    const modal = page.locator('.brand-candidate-modal');
    await modal.waitFor({ state: 'visible' });
    const nameInput = modal.locator('input[placeholder*="Bosch, Siemens"]');
    await nameInput.fill('Whirlpool Corp');
    const sourceUrlInput = modal.locator('input[placeholder*="https://"]');
    await sourceUrlInput.fill('https://www.whirlpool.com');

    const [createRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/admin/brands/candidates') && res.status() === 201
      ),
      modal.locator('button[type="submit"]:has-text("Namizədi Yadda Saxla")').click(),
    ]);
    const createJson = await createRes.json();
    const brandId = createJson.brand.id;
    expect(brandId).toBeTruthy();

    // Also create a rejected candidate brand to test rejection exclusion
    const rejectBrandRes = await page.evaluate(async (token) => {
      const createR = await fetch('/api/admin/brands/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({
          name: 'Reject Test Brand',
          slug: 'reject-test-brand',
          sourceUrl: 'https://rejectbrand.example.com',
        }),
      });
      const createdJson = await createR.json();
      const rejId = createdJson.brand?.id;
      const etag = createR.headers.get('etag') || `"b-${rejId}-v1"`;

      // Set status to rejected
      const rejStatusR = await fetch(`/api/admin/brands/${rejId}/verification-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
          'If-Match': etag,
        },
        body: JSON.stringify({ status: 'rejected', note: 'Qeyri-rəsmi brend' }),
      });
      return { rejId, status: rejStatusR.status };
    }, currentCsrfToken);
    expect(rejectBrandRes.status).toBe(200);
    const rejectedBrandId = rejectBrandRes.rejId;

    // 2. Candidate & rejected invisibility in public catalog before publish
    const publicCatalogBefore = await page.evaluate(async () => {
      const res = await fetch(`/api/catalog?_t=${Date.now()}`, { cache: 'no-store' });
      return await res.json();
    });
    expect(publicCatalogBefore.brands.some((b: any) => b.id === brandId)).toBe(false);
    expect(publicCatalogBefore.brands.some((b: any) => b.id === rejectedBrandId)).toBe(false);

    // 3. Search and select created candidate brand
    const searchInput = page.locator('input[placeholder*="Brend adı və ya slug"]');
    await searchInput.fill('Whirlpool Corp');
    await page.locator(`.brand-item-card:has-text("Whirlpool Corp")`).first().click();

    // Verify initial candidate status
    await expect(page.locator('.brand-status-badge:has-text("candidate")').first()).toBeVisible();

    // Get fresh brand ETag via GET
    const brandGet1 = await page.evaluate(async (bId) => {
      const res = await fetch(`/api/admin/brands/${bId}`);
      return { etag: res.headers.get('etag'), json: await res.json() };
    }, brandId);
    let brandEtag = brandGet1.etag || `"b-${brandId}-v1"`;

    // 4. Source create with concrete If-Match -> forced pending
    const addSrcRes = await page.evaluate(
      async ({ bId, etag, token }) => {
        const res = await fetch(`/api/admin/brands/${bId}/sources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({
            sourceUrl: 'https://www.whirlpool.com/official',
            sourceType: 'official_website',
            rightsNote: 'Rəsmi istehsalçı portalı',
          }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { bId: brandId, etag: brandEtag, token: currentCsrfToken }
    );
    expect(addSrcRes.status).toBe(201);
    expect(addSrcRes.json.source.verificationStatus).toBe('pending');
    const sourceId = addSrcRes.json.source.id;
    brandEtag = addSrcRes.etag || `"b-${brandId}-v${addSrcRes.json.brand.version}"`;

    // 5. Invalid transition: candidate -> published directly must fail
    const invalidTransRes = await page.evaluate(
      async ({ bId, etag, token }) => {
        const res = await fetch(`/api/admin/brands/${bId}/verification-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ status: 'published' }),
        });
        return { status: res.status, json: await res.json() };
      },
      { bId: brandId, etag: brandEtag, token: currentCsrfToken }
    );
    expect(invalidTransRes.status).toBe(400);
    expect(invalidTransRes.json.error).toBe('BRAND_VERIFICATION_ERROR');

    // 6. Valid intermediate transitions: candidate -> verified -> content_ready
    const verifRes = await page.evaluate(
      async ({ bId, etag, token }) => {
        const res = await fetch(`/api/admin/brands/${bId}/verification-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ status: 'verified' }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { bId: brandId, etag: brandEtag, token: currentCsrfToken }
    );
    expect(verifRes.status).toBe(200);
    brandEtag = verifRes.etag || `"b-${brandId}-v${verifRes.json.brand.version}"`;

    const readyRes = await page.evaluate(
      async ({ bId, etag, token }) => {
        const res = await fetch(`/api/admin/brands/${bId}/verification-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ status: 'content_ready' }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { bId: brandId, etag: brandEtag, token: currentCsrfToken }
    );
    expect(readyRes.status).toBe(200);
    brandEtag = readyRes.etag || `"b-${brandId}-v${readyRes.json.brand.version}"`;

    // 7. Official-source publication gate: content_ready -> published fails while source is pending
    const gateRes = await page.evaluate(
      async ({ bId, etag, token }) => {
        const res = await fetch(`/api/admin/brands/${bId}/verification-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ status: 'published' }),
        });
        return { status: res.status, json: await res.json() };
      },
      { bId: brandId, etag: brandEtag, token: currentCsrfToken }
    );
    expect(gateRes.status).toBe(400);
    expect(gateRes.json.message).toContain('BRAND_REQUIRES_VERIFIED_OFFICIAL_SOURCE');

    // 8. Source review = verified via manual review endpoint with concrete If-Match
    const reviewRes = await page.evaluate(
      async ({ bId, sId, etag, token }) => {
        const res = await fetch(`/api/admin/brands/${bId}/sources/${sId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ status: 'verified', note: 'Rəsmi domen yoxlanıldı' }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { bId: brandId, sId: sourceId, etag: brandEtag, token: currentCsrfToken }
    );
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.json.source.verificationStatus).toBe('verified');
    brandEtag = reviewRes.etag || `"b-${brandId}-v${reviewRes.json.brand.version}"`;

    // 9. Now publication succeeds with concrete If-Match
    const pubRes = await page.evaluate(
      async ({ bId, etag, token }) => {
        const res = await fetch(`/api/admin/brands/${bId}/verification-status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ status: 'published' }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { bId: brandId, etag: brandEtag, token: currentCsrfToken }
    );
    expect(pubRes.status).toBe(200);
    expect(pubRes.json.brand.verificationStatus).toBe('published');
    brandEtag = pubRes.etag || `"b-${brandId}-v${pubRes.json.brand.version}"`;

    // 10. Logo rights update with concrete If-Match
    const logoRightsRes = await page.evaluate(
      async ({ bId, etag, token }) => {
        const res = await fetch(`/api/admin/brands/${bId}/logo-rights`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({
            logoRightsStatus: 'approved',
            logoSource: 'https://www.whirlpool.com/press-kit',
            rightsNote: 'Hüquqi icazə təsdiqləndi',
          }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { bId: brandId, etag: brandEtag, token: currentCsrfToken }
    );
    expect(logoRightsRes.status).toBe(200);
    expect(logoRightsRes.json.brand.logoRightsStatus).toBe('approved');

    // 10.5 Add a product to Whirlpool Corp brand to ensure public visibility with productCount > 0
    await page.evaluate(
      async ({ bId, token }) => {
        const treeR = await fetch('/api/admin/categories/tree');
        const treeJson = await treeR.json();
        const firstCatId = treeJson.tree?.[0]?.id || 'hood';

        await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
          body: JSON.stringify({
            id: 'prod_whirlpool_test_1',
            code: 'WP-6S-900',
            title: 'Whirlpool 6th Sense Washing Machine',
            slug: 'whirlpool-6th-sense-washing-machine',
            brandId: bId,
            brand_id: bId,
            categoryId: firstCatId,
            category_id: firstCatId,
            status: 'published',
            price: 1199,
          }),
        });
      },
      { bId: brandId, token: currentCsrfToken }
    );

    // 11. Call /api/admin/publish to promote changes to public catalog
    const publishRes = await page.evaluate(async (token) => {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      });
      return { status: res.status, json: await res.json() };
    }, currentCsrfToken);
    expect(publishRes.status).toBe(200);
    expect(publishRes.json.ok).toBe(true);

    // 12. Verify public catalog and /api/brands reflect the published brand
    const publicCatalogAfter = await page.evaluate(async () => {
      const res = await fetch(`/api/catalog?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      return await res.json();
    });
    expect(publicCatalogAfter.brands.some((b: any) => b.id === brandId)).toBe(true);
    expect(publicCatalogAfter.brands.some((b: any) => b.id === rejectedBrandId)).toBe(false);

    const publicBrandsAfter = await page.evaluate(async () => {
      const res = await fetch(`/api/brands?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      return await res.json();
    });
    expect(publicBrandsAfter.brands.some((b: any) => b.id === brandId)).toBe(true);
    expect(publicBrandsAfter.brands.some((b: any) => b.id === rejectedBrandId)).toBe(false);
  });

  test('2. Brand alias collision, ETag 428/412/200 concurrency and structured audit logging', async ({
    page,
  }) => {
    // 1. Get concrete ETag for brand 'ardo'
    const ardoGet = await page.evaluate(async () => {
      const res = await fetch('/api/admin/brands/ardo');
      return { etag: res.headers.get('etag'), json: await res.json() };
    });
    const ardoEtag = ardoGet.etag || `"b-ardo-v${ardoGet.json.brand?.version || 1}"`;

    // 2. Wildcard If-Match: * must be strictly rejected with HTTP 412
    const wildcardRes = await page.evaluate(async (token) => {
      const res = await fetch('/api/admin/brands/ardo/aliases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
          'If-Match': '*',
        },
        body: JSON.stringify({ alias: 'Ardo Italy Premium' }),
      });
      return { status: res.status, json: await res.json() };
    }, currentCsrfToken);
    expect(wildcardRes.status).toBe(412);
    expect(wildcardRes.json.error).toBe('PRECONDITION_FAILED');

    // 3. ETag 428 (If-Match required when missing)
    const missingIfMatch = await page.evaluate(async (token) => {
      const res = await fetch('/api/admin/brands/ardo/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
        body: JSON.stringify({ sourceUrl: 'https://ardo.it', sourceType: 'official_website' }),
      });
      return { status: res.status, json: await res.json() };
    }, currentCsrfToken);
    expect(missingIfMatch.status).toBe(428);

    // 4. ETag 412 (Stale version precondition failed)
    const staleIfMatch = await page.evaluate(async (token) => {
      const res = await fetch('/api/admin/brands/ardo/logo-rights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': token,
          'If-Match': '"v999"',
        },
        body: JSON.stringify({ logoRightsStatus: 'approved' }),
      });
      return { status: res.status, json: await res.json() };
    }, currentCsrfToken);
    expect(staleIfMatch.status).toBe(412);

    // 5. Add alias on 'ardo' using valid concrete ETag
    const addAliasRes = await page.evaluate(
      async ({ etag, token }) => {
        const res = await fetch('/api/admin/brands/ardo/aliases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ alias: 'Ardo Italy Premium' }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { etag: ardoEtag, token: currentCsrfToken }
    );
    expect(addAliasRes.status).toBe(201);
    expect(addAliasRes.json.ok).toBe(true);

    // 6. Duplicate alias collision on 'lotus' with concrete ETag must fail with 400
    const lotusGet = await page.evaluate(async () => {
      const res = await fetch('/api/admin/brands/lotus');
      return { etag: res.headers.get('etag'), json: await res.json() };
    });
    const lotusEtag = lotusGet.etag || `"b-lotus-v${lotusGet.json.brand?.version || 1}"`;

    const dupRes = await page.evaluate(
      async ({ etag, token }) => {
        const res = await fetch('/api/admin/brands/lotus/aliases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ alias: 'Ardo Italy Premium' }),
        });
        return { status: res.status, json: await res.json() };
      },
      { etag: lotusEtag, token: currentCsrfToken }
    );
    expect(dupRes.status).toBe(400);
    expect(dupRes.json.error).toBe('BRAND_ALIAS_ERROR');

    // 7. Audit log structured verification: action, actor, entityId, ipAddress, userAgent, beforeVersion, afterVersion
    const logsRes = await page.evaluate(async () => {
      const res = await fetch('/api/admin/logs?limit=50');
      return { status: res.status, json: await res.json() };
    });
    expect(logsRes.status).toBe(200);
    const logsList = Array.isArray(logsRes.json.logs) ? logsRes.json.logs : logsRes.json;
    expect(Array.isArray(logsList)).toBe(true);
    expect(logsList.length).toBeGreaterThan(0);

    // Find the alias_added audit log specifically
    const aliasLog = logsList.find((l: any) => l.action === 'alias_added');
    expect(aliasLog).toBeDefined();
    expect(aliasLog.action).toBe('alias_added');
    expect(aliasLog.ipAddress || aliasLog.ip_address).toBeDefined();
    expect(aliasLog.userAgent || aliasLog.user_agent).toBeDefined();

    const parsedDetails =
      typeof aliasLog.details === 'string' ? JSON.parse(aliasLog.details) : aliasLog.details;
    expect(parsedDetails).toBeDefined();
    expect(parsedDetails.actor).toBeDefined();
    expect(parsedDetails.entityId || parsedDetails.brandId).toBe('ardo');
    expect(typeof parsedDetails.beforeVersion).toBe('number');
    expect(typeof parsedDetails.afterVersion).toBe('number');
    expect(parsedDetails.afterVersion).toBe(parsedDetails.beforeVersion + 1);
  });

  test('3. Root and child category create, move and sibling reorder, impact preview, subtree archive with reassignment, restore, spec inheritance and child override, and public publish', async ({
    page,
  }) => {
    const catTab = page.locator('nav button:has-text("Kateqoriyalar")');
    await catTab.click();

    const catManager = page.locator('.category-tree-manager');
    await catManager.waitFor({ state: 'visible' });

    // 1. Root category create
    const newRootBtn = page.locator('button:has-text("Yeni Əsas Kateqoriya")');
    await newRootBtn.click();

    const catNameInput = page.locator('input[placeholder*="Daxili quraşdırılan plitələr"]');
    await catNameInput.fill('Klimat Texnikası');

    const [createRootRes] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/admin/categories') && res.status() === 201
      ),
      page.locator('button[type="submit"]:has-text("Yarat")').click(),
    ]);
    const rootCatJson = await createRootRes.json();
    const rootId = rootCatJson.category.id;
    expect(rootId).toBeTruthy();

    // 2. Child category create
    const createChildRes = await page.evaluate(
      async ({ pId, token }) => {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
          body: JSON.stringify({
            name: 'Split Kondisionerlər',
            slug: 'split-kondisionerler',
            parentId: pId,
          }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { pId: rootId, token: currentCsrfToken }
    );
    expect(createChildRes.status).toBe(201);
    const childId = createChildRes.json.category.id;
    expect(createChildRes.json.category.depth).toBe(2);

    // 3. Child Category 2 create for sibling reorder & move testing
    const createChild2Res = await page.evaluate(
      async ({ pId, token }) => {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
          body: JSON.stringify({
            name: 'Mobil Kondisionerlər',
            slug: 'mobil-kondisionerler',
            parentId: pId,
          }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { pId: rootId, token: currentCsrfToken }
    );
    expect(createChild2Res.status).toBe(201);
    const child2Id = createChild2Res.json.category.id;

    // 4. Create a real test product attached to child category (to verify archive reassignment)
    const createProdRes = await page.evaluate(
      async ({ cId, token }) => {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
          body: JSON.stringify({
            id: 'prod_e2e_ac_test_101',
            code: 'AR-INV-12K',
            title: 'Ardo Inverter Split AC 12000 BTU',
            slug: 'ardo-inverter-split-ac-12000-btu',
            brandId: 'ardo',
            brand_id: 'ardo',
            categoryId: cId,
            category_id: cId,
            status: 'published',
            price: 899,
          }),
        });
        return { status: res.status, json: await res.json() };
      },
      { cId: childId, token: currentCsrfToken }
    );
    expect([200, 201]).toContain(createProdRes.status);

    // Verify initial product category is childId
    const prodInitial = await page.evaluate(async () => {
      const res = await fetch('/api/admin/products/prod_e2e_ac_test_101');
      return await res.json();
    });
    expect(prodInitial.product?.category_id || prodInitial.product?.categoryId).toBe(childId);

    // 5. Category Move with concrete If-Match: Move child2 under root level (parentId: null)
    const child2Etag = createChild2Res.etag || `"c-${child2Id}-v1"`;
    const moveRes = await page.evaluate(
      async ({ catId, etag, token }) => {
        const res = await fetch(`/api/admin/categories/${catId}/move`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ newParentId: null, newSortOrder: 99 }),
        });
        return { status: res.status, json: await res.json() };
      },
      { catId: child2Id, etag: child2Etag, token: currentCsrfToken }
    );
    expect(moveRes.status).toBe(200);
    expect(moveRes.json.category.depth).toBe(1);

    // 6. Sibling Reorder under rootId with concrete sibling set ETag
    const reorderRes = await page.evaluate(
      async ({ pId, cId, token }) => {
        // Compute / fetch tree to get fresh sibling set
        const treeR = await fetch('/api/admin/categories/tree');
        const treeJson = await treeR.json();
        const rootNode = treeJson.tree?.find((c: any) => c.id === pId);
        const siblingTag = rootNode
          ? `"c-${rootNode.id}-v${rootNode.version}"`
          : `"reorder-p-${pId}-v1"`;

        const res = await fetch('/api/admin/categories/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': siblingTag,
          },
          body: JSON.stringify({
            parentId: pId,
            items: [{ id: cId, sortOrder: 5 }],
          }),
        });
        return { status: res.status, json: await res.json() };
      },
      { pId: rootId, cId: childId, token: currentCsrfToken }
    );
    expect(reorderRes.status).toBe(200);

    // 7. Impact preview
    const impactRes = await page.evaluate(async (catId) => {
      const res = await fetch(`/api/admin/categories/${catId}/impact`);
      return { status: res.status, json: await res.json() };
    }, childId);
    expect(impactRes.status).toBe(200);
    expect(impactRes.json.totalAffectedProducts).toBeGreaterThanOrEqual(1);

    // 8. Spec template creation on root category with concrete If-Match
    const rootFresh = await page.evaluate(async (catId) => {
      const res = await fetch(`/api/admin/categories/${catId}/spec-templates`);
      return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
    }, rootId);
    const rootEtag = rootFresh.etag || `"c-${rootId}-v1"`;

    const rootSpecRes = await page.evaluate(
      async ({ catId, etag, token }) => {
        const res = await fetch(`/api/admin/categories/${catId}/spec-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({
            specKey: 'cooling_capacity',
            label: 'Soyutma Gücü',
            unit: 'BTU',
            required: true,
            sortOrder: 1,
          }),
        });
        return { status: res.status, json: await res.json() };
      },
      { catId: rootId, etag: rootEtag, token: currentCsrfToken }
    );
    expect(rootSpecRes.status).toBe(201);

    // 9. Spec inheritance on child category
    const childSpecsRes = await page.evaluate(async (catId) => {
      const res = await fetch(`/api/admin/categories/${catId}/spec-templates`);
      return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
    }, childId);
    expect(childSpecsRes.status).toBe(200);
    expect(childSpecsRes.json.templates.some((t: any) => t.specKey === 'cooling_capacity')).toBe(
      true
    );
    const childEtag = childSpecsRes.etag || `"c-${childId}-v1"`;

    // 10. Child override with concrete If-Match
    const childOverrideRes = await page.evaluate(
      async ({ catId, etag, token }) => {
        const res = await fetch(`/api/admin/categories/${catId}/spec-templates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({
            specKey: 'cooling_capacity',
            label: 'Soyutma Gücü (İnverter)',
            unit: 'BTU/h',
            required: true,
            sortOrder: 1,
          }),
        });
        return { status: res.status, json: await res.json() };
      },
      { catId: childId, etag: childEtag, token: currentCsrfToken }
    );
    expect(childOverrideRes.status).toBe(201);

    // 11. Subtree archive and product reassignment with concrete If-Match
    const childSpecFresh = await page.evaluate(async (catId) => {
      const res = await fetch(`/api/admin/categories/${catId}/spec-templates`);
      return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
    }, childId);
    const archiveEtag = childSpecFresh.etag || `"c-${childId}-v2"`;

    const archiveRes = await page.evaluate(
      async ({ catId, reassignId, etag, token }) => {
        const res = await fetch(`/api/admin/categories/${catId}/archive`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
          body: JSON.stringify({ reassignToCategoryId: reassignId }),
        });
        return { status: res.status, etag: res.headers.get('etag'), json: await res.json() };
      },
      { catId: childId, reassignId: rootId, etag: archiveEtag, token: currentCsrfToken }
    );
    expect(archiveRes.status).toBe(200);
    expect(archiveRes.json.category.isArchived).toBe(true);

    // 12. Verify product category_id was safely reassigned to target category (rootId)
    const prodAfterArchive = await page.evaluate(async () => {
      const res = await fetch('/api/admin/products/prod_e2e_ac_test_101');
      return await res.json();
    });
    expect(prodAfterArchive.product?.category_id || prodAfterArchive.product?.categoryId).toBe(
      rootId
    );

    // 13. Category restore with concrete If-Match
    const restoreEtag = archiveRes.etag || `"c-${childId}-v3"`;
    const restoreRes = await page.evaluate(
      async ({ catId, etag, token }) => {
        const res = await fetch(`/api/admin/categories/${catId}/restore`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': token,
            'If-Match': etag,
          },
        });
        return { status: res.status, json: await res.json() };
      },
      { catId: childId, etag: restoreEtag, token: currentCsrfToken }
    );
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.json.category.isArchived).toBe(false);

    // 14. Draft -> Admin publish -> Public visibility
    const publishRes = await page.evaluate(async (token) => {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'x-csrf-token': token },
      });
      return { status: res.status, json: await res.json() };
    }, currentCsrfToken);
    expect(publishRes.status).toBe(200);
    expect(publishRes.json.ok).toBe(true);

    // Verify public catalog endpoint reflects published state (bypass browser cache)
    const pubCatalog = await page.evaluate(async () => {
      const res = await fetch(`/api/catalog?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      return await res.json();
    });
    expect(pubCatalog.categories.some((c: any) => c.id === rootId)).toBe(true);
  });

  test('4. 390 and 1440 viewport clipping and scrollWidth, axe accessibility and screenshot regression', async ({
    page,
  }) => {
    // 1. Mobile 390 viewport on Brand Registry
    await page.setViewportSize({ width: 390, height: 844 });
    const brandsTab = page.locator('nav button:has-text("Brendlər")');
    await brandsTab.click();
    await expect(page.locator('.brand-registry-studio')).toBeVisible();

    // Check zero horizontal overflow on mobile
    const mobileOverflowBrands = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= window.innerWidth + 1;
    });
    expect(mobileOverflowBrands).toBe(true);

    // Check interactive elements are visible within viewport
    await expect(page.locator('button:has-text("Yeni Namizəd Əlavə Et")')).toBeVisible();

    // Screenshot baseline 1: Brand Registry 390px (fail-closed, no try-catch)
    await expect(page).toHaveScreenshot('phase3-brand-registry-390.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });

    // 2. Mobile 390 viewport on Category Manager
    const catTab = page.locator('nav button:has-text("Kateqoriyalar")');
    await catTab.click();
    await expect(page.locator('.category-tree-manager')).toBeVisible();

    const mobileOverflowCats = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= window.innerWidth + 1;
    });
    expect(mobileOverflowCats).toBe(true);
    await expect(page.locator('button:has-text("Yeni Əsas Kateqoriya")')).toBeVisible();

    // Screenshot baseline 2: Category Manager 390px (fail-closed, no try-catch)
    await expect(page).toHaveScreenshot('phase3-category-manager-390.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });

    // 3. Desktop 1440 viewport on Category Manager
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.category-tree-manager')).toBeVisible();

    const desktopOverflowCats = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= window.innerWidth + 1;
    });
    expect(desktopOverflowCats).toBe(true);
    await expect(page.locator('button:has-text("Yeni Əsas Kateqoriya")')).toBeVisible();

    // Screenshot baseline 3: Category Manager 1440px (fail-closed, no try-catch)
    await expect(page).toHaveScreenshot('phase3-category-manager-1440.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });

    // 4. Desktop 1440 viewport on Brand Registry
    await brandsTab.click();
    await expect(page.locator('.brand-registry-studio')).toBeVisible();

    const desktopOverflowBrands = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth <= window.innerWidth + 1;
    });
    expect(desktopOverflowBrands).toBe(true);

    // Screenshot baseline 4: Brand Registry 1440px (fail-closed, no try-catch)
    await expect(page).toHaveScreenshot('phase3-brand-registry-1440.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.05,
    });

    // 5. Real Axe Accessibility Audit without disabling color-contrast
    const axeResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(axeResults.violations).toHaveLength(0);
  });
});
