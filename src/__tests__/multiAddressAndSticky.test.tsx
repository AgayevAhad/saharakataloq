/** @vitest-environment happy-dom */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { DEFAULT_CATEGORIES, normalizeCatalog } from '../data/catalog';
import { lightTheme } from '../types/theme';
import { StoreAddress } from '../types/product';

describe('Çoxsaylı Ünvanlar (Multiple Addresses) və Sticky Header Testləri', () => {
  it('çoxsaylı mağaza və filial ünvanlarını kataloqda düzgün normallaşdırır', () => {
    const multiAddresses: StoreAddress[] = [
      {
        id: 'addr-1',
        title: 'Sədərək Filialı',
        address: 'Bakı şəhəri, Sədərək TM, Sıra 12',
        mapUrl: 'https://maps.google.com/sederek',
        workingHours: '09:00 - 18:00',
        note: 'Əsas satış mərkəzi',
      },
      {
        id: 'addr-2',
        title: '2-ci Filial (Dərnəgül Şourumu)',
        address: 'Ziya Bünyadov pr. 1965, Şourum 3',
        mapUrl: 'https://maps.google.com/dernegul',
        workingHours: '10:00 - 20:00',
        note: 'Şourum və anbar satışı',
      },
    ];

    const catalog = normalizeCatalog({
      settings: {
        whatsappNumber: '994501234567',
        phoneNumber: '994121234567',
        addresses: multiAddresses,
      },
    });

    expect(catalog.settings.addresses?.length).toBe(2);
    expect(catalog.settings.addresses?.[0].title).toBe('Sədərək Filialı');
    expect(catalog.settings.addresses?.[1].title).toBe('2-ci Filial (Dərnəgül Şourumu)');
    expect(catalog.settings.address).toBe('Bakı şəhəri, Sədərək TM, Sıra 12');
  });

  it('Footer komponenti 2-ci ünvan və çoxsaylı filialları düzgün əks etdirir', () => {
    const multiAddresses: StoreAddress[] = [
      {
        id: 'addr-1',
        title: '1-ci Filial (Sədərək)',
        address: 'Bakı şəhəri, Sədərək TM',
        mapUrl: 'https://maps.google.com/sederek',
        workingHours: '09:00 - 18:00',
      },
      {
        id: 'addr-2',
        title: '2-ci Filial (Dərnəgül)',
        address: 'Ziya Bünyadov pr. 1965',
        mapUrl: 'https://maps.google.com/dernegul',
        workingHours: '10:00 - 20:00',
      },
    ];

    render(
      <Footer
        settings={{
          whatsappNumber: '994501234567',
          phoneNumber: '994121234567',
          addresses: multiAddresses,
        }}
        categories={DEFAULT_CATEGORIES}
        theme={lightTheme}
      />
    );

    expect(screen.getByText('Mağaza və Filiallarımız')).toBeDefined();
    expect(screen.getByText('1-ci Filial (Sədərək)')).toBeDefined();
    expect(screen.getByText('Bakı şəhəri, Sədərək TM')).toBeDefined();
    expect(screen.getByText('2-ci Filial (Dərnəgül)')).toBeDefined();
    expect(screen.getByText('Ziya Bünyadov pr. 1965')).toBeDefined();
  });

  it('tək ünvan olduqda geriyə uyğunluqla düzgün göstərilir', () => {
    render(
      <Footer
        settings={{
          whatsappNumber: '994501234567',
          phoneNumber: '994121234567',
          address: 'Bakı şəhəri, Nizami küçəsi 45',
        }}
        categories={DEFAULT_CATEGORIES}
        theme={lightTheme}
      />
    );

    expect(screen.getByText('Ünvan və Lokasiya')).toBeDefined();
    expect(screen.getByText('Bakı şəhəri, Nizami küçəsi 45')).toBeDefined();
  });

  it('Header komponenti sabit (sticky) pozisiya, top: 0 və z-index: 1000 xüsusiyyətlərinə malikdir', () => {
    const { container } = render(
      <Header
        theme={lightTheme}
        isDarkMode={false}
        onToggleTheme={() => {}}
        selectedCategory="all"
        onSelectCategory={() => {}}
        selectedBrand="all"
        onSelectBrand={() => {}}
        brands={[]}
        categories={DEFAULT_CATEGORIES}
        products={[]}
        searchQuery=""
        onSearchChange={() => {}}
        onOpenInverterInfo={() => {}}
        onOpenCatalogShare={() => {}}
        totalCount={0}
        filteredCount={0}
      />
    );

    const header = container.querySelector('.catalog-header');
    expect(header).toBeDefined();
    expect(header?.getAttribute('style')).toContain('position: sticky');
    expect(header?.getAttribute('style')).toContain('top: 0');
    expect(header?.getAttribute('style')).toContain('z-index: 1000');
  });
});
