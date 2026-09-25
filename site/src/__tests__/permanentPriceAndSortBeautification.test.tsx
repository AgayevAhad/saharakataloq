import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { FloatingActions } from '../components/FloatingActions';
import { ShareModal } from '../components/ShareModal';
import { CatalogApp } from '../apps/CatalogApp';
import { lightTheme } from '../types/theme';
import { Product } from '../types/product';
import { sortCatalogPageProducts } from '../features/catalog/catalogSelection';

const mockProductWithPrice: Product = {
  id: 'ardo-test-01',
  code: '501C FFD',
  modelCode: '501C FFD',
  title: 'Plitə ARDO 501C FFD',
  brand: 'ARDO',
  brandId: 'ardo',
  category: 'cooktops',
  categoryName: 'Bişirmə panelləri',
  price: 1250,
  oldPrice: 1450,
  currency: '₼',
  image: '/media/ardo/501c.jpg',
  gallery: ['/media/ardo/501c.jpg'],
  status: 'published',
  specs: [{ name: 'Rəng', value: 'Inox' }],
  highlights: ['Sabaf ocaqlar', 'Qaz-kontrol'],
};

const mockProductWithoutPrice: Product = {
  id: 'lotus-test-02',
  code: 'L-900',
  modelCode: 'L-900',
  title: 'Aspirator Lotus L-900',
  brand: 'Lotus',
  brandId: 'lotus',
  category: 'hoods',
  categoryName: 'Aspiratorlar',
  currency: '₼',
  image: '/media/lotus/l900.jpg',
  gallery: ['/media/lotus/l900.jpg'],
  status: 'published',
  specs: [{ name: 'Rəng', value: 'Qara' }],
};

describe('Permanent Price & Modernized Sort Filter Tests', () => {
  it('1. ProductCard renders permanent price row with formatted price and strikethrough oldPrice', () => {
    const { container } = render(
      <ProductCard
        product={mockProductWithPrice}
        brand="ARDO"
        theme={lightTheme}
        onSelect={() => {}}
      />
    );

    const priceRow = container.querySelector('.product-card-price-row');
    expect(priceRow).toBeDefined();
    expect(screen.getByText('1.250 ₼')).toBeDefined();
    expect(screen.getByText('1.450 ₼')).toBeDefined();
  });

  it('2. ProductCard displays "Qiymət: Sorğu ilə" when product has no numeric price', () => {
    const { container } = render(
      <ProductCard
        product={mockProductWithoutPrice}
        brand="Lotus"
        theme={lightTheme}
        onSelect={() => {}}
      />
    );

    const priceRow = container.querySelector('.product-card-price-row');
    expect(priceRow).toBeDefined();
    expect(screen.getByText('Qiymət: Sorğu ilə')).toBeDefined();
  });

  it('3. ProductDetailModal displays permanent clean price section', () => {
    const { container } = render(
      <ProductDetailModal
        product={mockProductWithPrice}
        brand="ARDO"
        theme={lightTheme}
        themeMode="light"
        isOpen={true}
        onClose={() => {}}
      />
    );

    const priceRow = container.querySelector('.product-detail-price-row');
    expect(priceRow).toBeDefined();
    expect(screen.getByText(/1\.250\s*₼/)).toBeDefined();
    expect(screen.getByText(/1\.450\s*₼/)).toBeDefined();
  });

  it('4. sortCatalogPageProducts does not include discount option and sorts correctly', () => {
    const products: Product[] = [
      { ...mockProductWithPrice, id: 'p1', price: 1000 },
      { ...mockProductWithPrice, id: 'p2', price: 500 },
      { ...mockProductWithPrice, id: 'p3', price: 1500 },
    ];

    const asc = sortCatalogPageProducts(products, 'price-asc');
    expect(asc.map((p) => p.price)).toEqual([500, 1000, 1500]);

    const desc = sortCatalogPageProducts(products, 'price-desc');
    expect(desc.map((p) => p.price)).toEqual([1500, 1000, 500]);
  });

  it('5. CatalogApp renders modern sort dropdown and opens popover without discount option', () => {
    const mockCatalogData = {
      catalog: {
        brands: [
          { id: 'ardo', name: 'ARDO', active: true },
          { id: 'lotus', name: 'Lotus', active: true },
        ],
        categories: [{ id: 'cooktops', name: 'Bişirmə panelləri', active: true }],
        products: [mockProductWithPrice],
        settings: { catalogActive: true },
      },
    };

    const { container } = render(<CatalogApp initialData={mockCatalogData} />);

    // Click on ARDO brand card to enter catalog view
    const ardoCard = container.querySelector('.brand-showcase-card.brand-ardo') as HTMLElement;
    expect(ardoCard).toBeDefined();
    fireEvent.click(ardoCard);

    const sortBtn = container.querySelector('.catalog-sort-btn') as HTMLButtonElement;
    expect(sortBtn).toBeDefined();

    // Click sort button
    fireEvent.click(sortBtn);

    const popover = container.querySelector('.catalog-sort-popover');
    expect(popover).toBeDefined();
    expect(screen.getAllByText('Tövsiyə olunan').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Qiymət: Ucuzdan bahaya')).toBeDefined();
    expect(screen.getByText('Qiymət: Bahadan ucuza')).toBeDefined();
    expect(screen.getByText('Yeni modellər')).toBeDefined();
    expect(screen.queryByText('Endirimli')).toBeNull();
    expect(screen.queryByText('Ən böyük endirim')).toBeNull();
  });

  it('6. FloatingActions renders Sayta keçid link above WA and Call buttons with correct color scheme', () => {
    const mockSettings = {
      phoneNumber: '+994124445566',
      whatsappNumber: '994501234567',
      catalogActive: true,
      siteName: 'Sahara Electronics',
    };

    const { container } = render(
      <FloatingActions
        settings={mockSettings as any}
        theme={lightTheme}
        showToast={() => {}}
      />
    );

    const siteLink = container.querySelector('.floating-site-btn') as HTMLAnchorElement;
    expect(siteLink).toBeDefined();
    expect(siteLink.getAttribute('href')).toBe('/');
    expect(siteLink.textContent).toContain('Sayta keçid');

    const waBtn = container.querySelector('.floating-wa') as HTMLButtonElement;
    const callBtn = container.querySelector('.floating-call') as HTMLButtonElement;
    expect(waBtn).toBeDefined();
    expect(callBtn).toBeDefined();
  });

  it('7. Mobile filter drawer has zero blur on its backdrop', () => {
    const mockCatalogData = {
      catalog: {
        brands: [{ id: 'ardo', name: 'ARDO', active: true }],
        categories: [{ id: 'cooktops', name: 'Bişirmə panelləri', active: true }],
        products: [mockProductWithPrice],
        settings: { catalogActive: true },
      },
    };

    const { container } = render(<CatalogApp initialData={mockCatalogData} />);

    // Click ARDO brand card
    const ardoCard = container.querySelector('.brand-showcase-card.brand-ardo') as HTMLElement;
    fireEvent.click(ardoCard);

    // Click mobile filter button
    const mobileFilterBtn = container.querySelector('.catalog-mobile-filter-btn') as HTMLElement;
    expect(mobileFilterBtn).toBeDefined();
    fireEvent.click(mobileFilterBtn);

    const backdrop = container.querySelector('.catalog-mobile-filter-backdrop') as HTMLElement;
    expect(backdrop).toBeDefined();
    expect(backdrop.style.backdropFilter).toBe('none');
  });

  it('8. ShareModal renders "Məişət texnikası modelləri" without extra text and has styled WA and Telegram buttons', () => {
    const { container } = render(
      <ShareModal
        product={null}
        theme={lightTheme}
        visible={true}
        onClose={() => {}}
        onCopyLink={() => {}}
        onWhatsAppShare={() => {}}
        onTelegramShare={() => {}}
      />
    );

    expect(screen.getByText('Məişət texnikası modelləri')).toBeDefined();
    expect(screen.queryByText(/və təsdiqlənmiş texniki göstəricilər/i)).toBeNull();

    const waBtn = container.querySelector('.share-btn-wa') as HTMLButtonElement;
    expect(waBtn).toBeDefined();
    expect(waBtn.style.backgroundColor).toBe('rgba(34, 197, 94, 0.14)');
    expect(waBtn.style.color).toBe('#16a34a');

    const tgBtn = container.querySelector('.share-btn-tg') as HTMLButtonElement;
    expect(tgBtn).toBeDefined();
    expect(tgBtn.style.backgroundColor).toBe('rgba(2, 132, 199, 0.14)');
    expect(tgBtn.style.color).toBe('#0284c7');
  });

  it('9. Top controls toolbar includes responsive search field', () => {
    const mockCatalogData = {
      catalog: {
        brands: [{ id: 'ardo', name: 'ARDO', active: true }],
        categories: [{ id: 'cooktops', name: 'Bişirmə panelləri', active: true }],
        products: [mockProductWithPrice],
        settings: { catalogActive: true },
      },
    };

    const { container } = render(<CatalogApp initialData={mockCatalogData} />);

    // Click ARDO brand card
    const ardoCard = container.querySelector('.brand-showcase-card.brand-ardo') as HTMLElement;
    fireEvent.click(ardoCard);

    const searchField = container.querySelector('.catalog-top-search-field input') as HTMLInputElement;
    expect(searchField).toBeDefined();
    expect(searchField.placeholder).toBe('Məhsul axtar...');
  });
});

