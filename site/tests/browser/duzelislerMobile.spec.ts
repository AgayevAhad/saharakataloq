import { test, expect } from '@playwright/test';

const hasHorizontalOverflow = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    return (
      document.documentElement.scrollWidth > viewportWidth ||
      document.body.scrollWidth > viewportWidth
    );
  });

test.describe('Duzelisler.md mobile completion', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
  });

  test('account login and registration stay inside a 320px viewport', async ({ page }) => {
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Xoş Gəlmisiniz!' })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await page.getByRole('button', { name: 'Qeydiyyat', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Hesab Yaradın' })).toBeVisible();
    await expect(page.getByText('Doğum tarixi *')).toBeVisible();
    await expect(page.getByLabel('Şifrə tələbləri')).toContainText('8+ simvol');
    await expect(page.getByText('Yeni Qeydiyyat')).toHaveCount(0);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('catalog controls, drawer and product grid stay responsive', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByRole('heading', { name: /Məhsul Kataloqu/i })).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await page.getByRole('button', { name: /Filtrlər/i }).click();
    await expect(page.locator('.catalog-filter-drawer-panel')).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('category rail exposes the next card and footer clears the fixed dock', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const track = page.locator('.visual-category-scroll-track');
    await track.scrollIntoViewIfNeeded();
    await expect(track).toBeVisible();

    const geometry = await page.evaluate(() => {
      const rail = document.querySelector('.visual-category-scroll-track') as HTMLElement;
      const first = rail?.children.item(0)?.getBoundingClientRect();
      const second = rail?.children.item(1)?.getBoundingClientRect();
      const railRect = rail?.getBoundingClientRect();
      return {
        ratio: first && railRect ? first.width / railRect.width : 0,
        secondVisible: Boolean(second && railRect && second.left < railRect.right),
      };
    });
    expect(geometry.ratio).toBeGreaterThan(0.84);
    expect(geometry.ratio).toBeLessThan(0.92);
    expect(geometry.secondVisible).toBe(true);

    const copyright = page.getByText(/Bütün hüquqlar qorunur/i);
    await copyright.scrollIntoViewIfNeeded();
    const copyBox = await copyright.boundingBox();
    const dockBox = await page.locator('.mobile-bottom-nav').boundingBox();
    expect(copyBox).not.toBeNull();
    expect(dockBox).not.toBeNull();
    expect(copyBox!.y + copyBox!.height).toBeLessThanOrEqual(dockBox!.y);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('category rail gives one smooth next-card hint and returns to the first card', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const track = page.locator('.visual-category-scroll-track');
    await track.scrollIntoViewIfNeeded();
    await expect(track).toBeVisible();
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft), {
        timeout: 4500,
        intervals: [40],
      })
      .toBeGreaterThan(20);
    await expect
      .poll(() => track.evaluate((element) => element.scrollLeft), {
        timeout: 4500,
        intervals: [100],
      })
      .toBeLessThan(5);
  });

  test('mobile dock menu opens the complete responsive navigation drawer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Əsas menyunu aç' }).click();
    const drawer = page.getByRole('dialog', { name: /Mobil Kateqoriya və Naviqasiya Menyu/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Ana səhifə' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Kataloq', exact: true })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Brendlər' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Mağazalar' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Endirimlər' })).toBeVisible();
    await expect(drawer.locator('.mobile-drawer-brand-logo img').first()).toBeVisible();
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test('mobile footer stacks contact links in the requested order', async ({ page }) => {
    await page.goto('/');
    const contacts = page.locator('.footer-direct-contacts');
    await contacts.scrollIntoViewIfNeeded();
    const kinds = await contacts
      .locator('[data-contact-kind]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-contact-kind')));
    const requested = kinds.filter((kind) =>
      ['email', 'phone', 'instagram', 'facebook'].includes(kind || '')
    );
    expect(requested[0]).toBe('email');
    expect(requested.indexOf('instagram')).toBeGreaterThan(requested.lastIndexOf('phone'));
    expect(requested.indexOf('facebook')).toBeGreaterThan(requested.indexOf('instagram'));
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
});

test.describe('Duzelisler.md new desktop and general completion', () => {
  test('catalog honors the edited document-scroll layout and still reaches the footer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/catalog');
    await expect(page.locator('.catalog-products-container .product-card').first()).toBeVisible();
    const initial = await page.evaluate(() => {
      const header = document.querySelector('.site-header-sticky')!;
      const toolbar = document.querySelector('.catalog-sticky-toolbar')!;
      const body = document.querySelector('.catalog-body-layout')!;
      const sidebar = body.querySelector('aside')!;
      return {
        headerBottom: header.getBoundingClientRect().bottom,
        toolbarTop: toolbar.getBoundingClientRect().top,
        toolbarBottom: toolbar.getBoundingClientRect().bottom,
        bodyTop: body.getBoundingClientRect().top,
        sidebarMax: sidebar.scrollHeight - sidebar.clientHeight,
        pageMax: document.documentElement.scrollHeight - innerHeight,
        cardTop: document
          .querySelector('.catalog-products-container .product-card')!
          .getBoundingClientRect().top,
      };
    });
    expect(initial.toolbarTop).toBeGreaterThanOrEqual(initial.headerBottom - 2);
    expect(initial.bodyTop).toBeGreaterThanOrEqual(initial.toolbarBottom - 2);
    expect(initial.sidebarMax).toBeGreaterThan(0);
    expect(initial.pageMax).toBeGreaterThan(1000);

    await page.evaluate(() => {
      window.scrollTo({ top: 500, behavior: 'instant' });
      document.querySelector<HTMLElement>('.catalog-body-layout aside')!.scrollTop = 160;
    });
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
    const scrolled = await page.evaluate(() => ({
      headerBottom: document.querySelector('.site-header-sticky')!.getBoundingClientRect().bottom,
      sidebarScroll: document.querySelector<HTMLElement>('.catalog-body-layout aside')!.scrollTop,
      cardTop: document
        .querySelector('.catalog-products-container .product-card')!
        .getBoundingClientRect().top,
    }));
    expect(scrolled.headerBottom).toBeGreaterThan(0);
    expect(scrolled.sidebarScroll).toBeGreaterThan(0);
    expect(scrolled.cardTop).toBeLessThan(initial.cardTop - 400);

    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })
    );
    await expect(page.locator('footer')).toBeInViewport();
  });

  test('catalog list layout keeps actions visible in the space beside the product media', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/catalog');
    await page.getByTitle('Siyahı görünüşü').click();
    const card = page.locator('.catalog-products-container.is-list-view .product-card').first();
    await expect(card).toBeVisible();
    const positions = await card.evaluate((element) => {
      const media = element.querySelector('.product-card-media')!.getBoundingClientRect();
      const actions = element.querySelector('.card-hover-actions-cluster')!.getBoundingClientRect();
      const style = getComputedStyle(element.querySelector('.card-hover-actions-cluster')!);
      return {
        mediaRight: media.right,
        actionsLeft: actions.left,
        actionsVisible: style.opacity,
        cardHeight: element.getBoundingClientRect().height,
      };
    });
    expect(positions.cardHeight).toBeLessThan(260);
    expect(positions.actionsLeft).toBeGreaterThan(positions.mediaRight);
    expect(positions.actionsVisible).toBe('1');
  });

  test('cart uses a compact checkout action and contains no fabricated offer', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem(
        'sahara_cart_items',
        JSON.stringify([
          {
            quantity: 1,
            product: {
              id: 'live-cart-check',
              code: 'LIVE-1',
              title: 'Canlı yoxlama məhsulu',
              category: 'oven',
              categoryName: 'Soba',
              image: '/media/placeholder.png',
              price: 999,
              shortDesc: '',
              specs: [],
              highlights: [],
              status: 'published',
            },
          },
        ])
      );
    });
    await page.goto('/cart');
    await expect(page.getByText('Canlı yoxlama məhsulu')).toBeVisible();
    await expect(page.getByText(/pulsuz çatdırılma/i)).toHaveCount(0);
    await expect(page.getByText(/SAHARA10/i)).toHaveCount(0);
    const checkout = page.getByTestId('cart-whatsapp-checkout');
    await expect(checkout).toBeVisible();
    const box = await checkout.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThan(360);
  });

  test('brand cards open detail pages and careers contains no invented vacancy', async ({
    page,
  }) => {
    await page.goto('/brands');
    const firstCard = page.locator('.brand-directory-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.getByRole('button', { name: /Brend haqqında/i }).click();
    await expect(page).toHaveURL(/\/brand\//);
    await expect(page.locator('.brand-detail-page')).toBeVisible();

    await page.goto('/careers');
    await expect(
      page.getByRole('heading', { name: /Hazırda elan edilmiş vakansiya yoxdur/i })
    ).toBeVisible();
    await expect(page.getByText(/Satış Məsləhətçisi/i)).toHaveCount(0);
  });

  test('product lightbox rotates and zooms the real catalog image', async ({ page }) => {
    await page.goto('/catalog');
    const firstProduct = page.locator('.product-card').first();
    await firstProduct.scrollIntoViewIfNeeded();
    await firstProduct.click();
    await expect(page).toHaveURL(/\/product\//);
    await page.getByTitle('Böyük ekranda bax').click();
    const rotateRight = page.getByLabel('Şəkli sağa fırlat');
    const rotateLeft = page.getByLabel('Şəkli sola fırlat');
    await expect(rotateRight).toBeVisible();
    await expect(rotateLeft).toBeVisible();
    await rotateRight.click();
    await rotateLeft.click();
    await page.getByTitle('Böyüt (Kliklə yaxınlaşdır)').click();
    await expect(page.getByText('140%')).toBeVisible();
  });

  test('catalog product cards remain sharp and visible before, during and after hover', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/catalog');
    const cards = page.locator('.catalog-product-reveal > .product-card');
    await expect(cards).not.toHaveCount(0);

    const readVisualState = (card: import('@playwright/test').Locator) =>
      card.evaluate((element) => {
        const cardStyle = getComputedStyle(element);
        const reveal = element.parentElement as HTMLElement;
        const revealStyle = getComputedStyle(reveal);
        const actionCluster = element.querySelector('.card-hover-actions-cluster') as HTMLElement;
        return {
          cardOpacity: cardStyle.opacity,
          cardFilter: cardStyle.filter,
          revealOpacity: revealStyle.opacity,
          revealFilter: revealStyle.filter,
          revealReady: reveal.classList.contains('is-revealed'),
          revealClass: element.classList.contains('scroll-reveal-item'),
          actionBackdrop: getComputedStyle(actionCluster).backdropFilter,
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
        };
      });

    for (const index of [0, 3, 7]) {
      const card = cards.nth(index);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      const cover = card.locator('.product-card-media .shimmer-img');
      await expect(cover).toBeVisible();
      await expect
        .poll(() => cover.evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);
      const coverSrc = await cover.getAttribute('src');

      for (const phase of ['before', 'hover', 'after'] as const) {
        if (phase === 'hover') await card.hover();
        if (phase === 'after') await page.mouse.move(2, 2);
        await page.waitForTimeout(120);
        const state = await readVisualState(card);
        expect(state, `${index}:${phase}`).toMatchObject({
          cardOpacity: '1',
          cardFilter: 'none',
          revealOpacity: '1',
          revealFilter: 'none',
          revealReady: true,
          revealClass: false,
          actionBackdrop: 'none',
        });
        expect(state.width, `${index}:${phase}:width`).toBeGreaterThan(200);
        expect(state.height, `${index}:${phase}:height`).toBeGreaterThan(300);
      }

      await card.hover();
      await page.waitForTimeout(1850);
      expect(await cover.getAttribute('src'), `${index}:stable-cover`).toBe(coverSrc);
      expect(await cover.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(
        0
      );
    }

    await page.goto('/');
    const featuredCards = page.locator('.featured-product-reveal > .featured-product-card');
    const featuredGrid = page.locator('.featured-products-grid');
    await expect(featuredGrid).toHaveAttribute('data-visible-rows', '8');
    const featuredColumns = Number(await featuredGrid.getAttribute('data-column-count'));
    await expect(featuredCards).toHaveCount(featuredColumns * 8);
    for (const index of [0, 7]) {
      const card = featuredCards.nth(index);
      await card.scrollIntoViewIfNeeded();
      await card.hover();
      await expect(card.locator('..')).toHaveCSS('opacity', '1');
      const state = await readVisualState(card);
      expect(state, `featured:${index}`).toMatchObject({
        cardOpacity: '1',
        cardFilter: 'none',
        revealOpacity: '1',
        revealFilter: 'none',
        revealReady: true,
        revealClass: false,
        actionBackdrop: 'none',
      });
    }
  });

  test('homepage shows five populated neutral category cards without numeric labels', async ({
    page,
  }) => {
    await page.goto('/');
    const cards = page.locator('.visual-category-card');
    await expect(cards.first()).toBeVisible();
    await expect(cards).toHaveCount(5);
    await expect(page.getByText('Ən çox seçim olan 5 kataloq bölməsi')).toHaveCount(0);
    await expect(page.locator('.visual-category-sequence')).toHaveCount(0);
    await expect(page.locator('.visual-category-ambient')).toHaveCount(0);
    await expect(cards.first().getByText(/\d+ model/)).toHaveCount(0);
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS('background-image', 'none');
    }
    await expect(page.locator('[data-category-id="notebook"]')).toHaveCount(0);
    await expect(page.locator('[data-category-id="tablet"]')).toHaveCount(0);
    await expect
      .poll(async () =>
        page
          .locator('.visual-category-card .shimmer-img')
          .evaluateAll(
            (images) =>
              images.filter((image) => (image as HTMLImageElement).naturalWidth > 0).length
          )
      )
      .toBeGreaterThanOrEqual(5);

    const cardSizes = await page.locator('.visual-category-reveal').evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return `${Math.round(rect.width)}x${Math.round(rect.height)}`;
      })
    );
    expect(new Set(cardSizes).size).toBeGreaterThan(2);

    const firstImage = cards.first().locator('.visual-category-img-inner');
    expect(await firstImage.evaluate((element) => getComputedStyle(element).animationName)).toBe(
      'categoryVisualFloat'
    );
    await cards.first().hover();
    await expect(cards.first().locator('.visual-category-explore')).toHaveCSS('opacity', '1');
  });

  test('dark category covers retain the same neutral white card surface', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Qaranlıq rejimə keç' }).click();
    const cards = page.locator('.theme-dark .visual-category-card');
    await expect(cards).toHaveCount(5);
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    }
  });

  test('featured products occupy eight responsive rows and load eight more rows in place', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Önə çıxan məhsullar' })).toBeVisible();
    await expect(page.getByText('Seçilmiş məhsullar', { exact: true })).toHaveCount(0);
    const grid = page.locator('.featured-products-grid');
    const cards = grid.locator('.featured-product-card');
    await expect(grid).toHaveAttribute('data-visible-rows', '8');
    const columns = Number(await grid.getAttribute('data-column-count'));
    expect(columns).toBeGreaterThanOrEqual(2);
    await expect(cards).toHaveCount(columns * 8);
    await expect(grid.locator('.product-brand-badge')).toHaveCount(columns * 8);
    const rowCount = async () =>
      grid
        .locator('.featured-product-reveal')
        .evaluateAll(
          (elements) =>
            new Set(elements.map((element) => Math.round(element.getBoundingClientRect().top))).size
        );
    expect(await rowCount()).toBe(8);

    await page.getByTestId('featured-load-more').click();
    await expect(grid).toHaveAttribute('data-visible-rows', '16');
    await expect(cards).toHaveCount(columns * 16);
    expect(await rowCount()).toBe(16);
    await expect(page.getByText('Notebook', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Planşet', { exact: true })).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const mobileGrid = page.locator('.featured-products-grid');
    await expect(mobileGrid).toHaveAttribute('data-column-count', '1');
    await expect(mobileGrid.locator('.featured-product-card')).toHaveCount(8);
    await page.getByTestId('featured-load-more').click();
    await expect(mobileGrid.locator('.featured-product-card')).toHaveCount(16);
  });

  test('featured eight-row geometry stays stable on tablet, laptop and large desktop', async ({
    page,
  }) => {
    for (const width of [768, 1024, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const grid = page.locator('.featured-products-grid');
      await expect(grid).toHaveAttribute('data-visible-rows', '8');
      const columns = Number(await grid.getAttribute('data-column-count'));
      await expect(grid.locator('.featured-product-card')).toHaveCount(columns * 8);
      const geometry = await grid.evaluate((element) => ({
        rows: new Set(
          Array.from(element.children).map((child) => Math.round(child.getBoundingClientRect().top))
        ).size,
      }));
      expect(geometry.rows, `${width}px rows`).toBe(8);
      // The country flag deliberately protrudes from its card, so a grid's
      // scrollWidth may exceed its clientWidth without creating a page scrollbar.
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
            ),
          {
            message: `${width}px page horizontal overflow after entrance motion settles`,
          }
        )
        .toBe(false);
    }
  });

  test('scroll reveal prepares rows early without long blank or blurred states', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(650);

    const motion = await page
      .locator('.scroll-reveal-item')
      .first()
      .evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          delay: Math.max(
            ...style.transitionDelay.split(',').map((value) => Number.parseFloat(value))
          ),
          duration: Math.max(
            ...style.transitionDuration.split(',').map((value) => Number.parseFloat(value))
          ),
        };
      });
    expect(motion.delay).toBeLessThanOrEqual(0.14);
    expect(motion.duration).toBeLessThanOrEqual(0.52);
    await expect(page.locator('.scroll-reveal-item').first()).toHaveCSS('filter', 'none');

    for (const scrollY of [350, 700, 1050, 1400]) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'auto' }), scrollY);
      await page.waitForTimeout(240);
      const nearlyInvisibleInViewport = await page.locator('.scroll-reveal-item').evaluateAll(
        (elements) =>
          elements.filter((element) => {
            const rect = element.getBoundingClientRect();
            const visible = rect.bottom > 0 && rect.top < window.innerHeight;
            return visible && Number.parseFloat(getComputedStyle(element).opacity) < 0.15;
          }).length
      );
      expect(nearlyInvisibleInViewport).toBe(0);
    }
  });

  test('home and information pages reveal their own sections in order without hiding interactive cards', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    const cases = [
      { path: '/', selector: '.visual-categories-section.scroll-reveal-item' },
      { path: '/', selector: '.trust-highlight-card.scroll-reveal-item' },
      { path: '/services', selector: '.service-card-grid > .scroll-reveal-item' },
      { path: '/support', selector: '.support-contact-grid > .scroll-reveal-item' },
      { path: '/about', selector: '.about-stats-grid > .scroll-reveal-item' },
      { path: '/delivery', selector: '.customer-care-step-card.scroll-reveal-item' },
      { path: '/privacy', selector: '.scroll-reveal-item' },
    ];
    for (const { path, selector } of cases) {
      await page.goto(path);
      const item = page.locator(selector).first();
      await expect(item, `${path}: reveal target exists`).toHaveCount(1);
      await item.scrollIntoViewIfNeeded();
      await expect(item, `${path}: target becomes visible`).toHaveClass(/is-revealed/);
      await expect(item).toHaveCSS('filter', 'none');
      await expect(item).toHaveCSS('opacity', '1');
    }
    await expect(page.locator('.product-card.scroll-reveal-item')).toHaveCount(0);
  });

  test('desktop brand rail supports grab-to-drag and uses readable logo shells', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto('/');
    const viewport = page.getByTestId('brand-rail-viewport');
    await expect(viewport).toBeVisible();
    await viewport.scrollIntoViewIfNeeded();
    const box = await viewport.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + 500, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + 650, box!.y + box!.height / 2, { steps: 6 });
    await expect(viewport).toHaveClass(/is-dragging/);
    const draggedTransform = await page
      .getByTestId('brand-rail-drag-layer')
      .evaluate((element) => (element as HTMLElement).style.transform);
    expect(draggedTransform).toContain('150px');
    await page.mouse.up();
    await expect(viewport).not.toHaveClass(/is-dragging/);
  });
});
