// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { ProductDetailModal } from '../src/components/ProductDetailModal';
import { lightTheme, darkTheme } from '../src/types/theme';
import { Product, Brand } from '../src/types/product';
import { normalizeProduct } from '../src/data/catalog';

afterEach(cleanup);

const testBrand: Brand = {
  id: 'ardo',
  name: 'ARDO',
  slug: 'ardo',
  originCountry: 'İtaliya',
  manufacturingCountries: ['Türkiyə', 'Çin'],
  logo: '/media/brands/ardo-logo.png',
  active: true,
};

const testProduct: Product = normalizeProduct({
  id: 'ardo-hood-500',
  code: 'HOD-500',
  title: 'ARDO HOD-500 Aspirator',
  category: 'hood',
  categoryName: 'Aspiratorlar',
  image: '/foto/hod500.jpg',
  gallery: ['/foto/hod500.jpg', '/foto/hod500-2.jpg'],
  shortDesc: 'Güclü aspirator, invert motor ilə',
  specs: [
    { id: 's1', name: 'Motor gücü', value: '350W', group: 'Əsas' },
    { id: 's2', name: 'Səs səviyyəsi', value: '42 dB', group: 'Əsas' },
  ],
  highlights: ['İnvertor motor', 'Enerji qənaəti A++'],
  manufacturingCountry: 'Türkiyə',
  status: 'published',
  isNew: true,
  isFeatured: true,
  badgeText: 'Yeni',
});

describe('ProductDetailModal — məhsul detal modalı', () => {

  it('visible=false olduqda heç nə render etmir', () => {
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={false}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    expect(screen.queryByText('ARDO HOD-500 Aspirator')).toBeNull();
  });

  it('visible=true olduqda məhsul adı göstərilir', () => {
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={true}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    expect(screen.getByText('ARDO HOD-500 Aspirator')).toBeDefined();
  });

  it('məhsul kodu göstərilir', () => {
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={true}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    expect(screen.getByText('HOD-500')).toBeDefined();
  });

  it('spec dəyərləri göstərilir', () => {
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={true}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    expect(screen.getByText('Motor gücü')).toBeDefined();
    expect(screen.getByText('350W')).toBeDefined();
  });

  it('onClose callback bağla düyməsindən çağırılır', () => {
    const onClose = vi.fn();
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={true}
        onClose={onClose} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    const closeBtn = screen.getByRole('button', { name: /Bağla/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('WhatsApp düyməsinə kliklədikdə onWhatsApp çağırılır', () => {
    const onWhatsApp = vi.fn();
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={true}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={onWhatsApp} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    const waBtns = screen.getAllByText(/WhatsApp/i);
    fireEvent.click(waBtns[0]);
    expect(onWhatsApp).toHaveBeenCalledWith(testProduct);
  });

  it('Zəng et düyməsinə kliklədikdə onCall çağırılır', () => {
    const onCall = vi.fn();
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={true}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={onCall} onCopyLink={vi.fn()} />
    );
    const callBtn = screen.getByText('Zəng et');
    fireEvent.click(callBtn);
    expect(onCall).toHaveBeenCalledWith(testProduct);
  });

  it('Məhsul linki kopyala düyməsi onCopyLink çağırır', () => {
    const onCopyLink = vi.fn();
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={true}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={onCopyLink} />
    );
    const copyBtn = screen.getByText('Məhsul linki kopyala');
    fireEvent.click(copyBtn);
    expect(onCopyLink).toHaveBeenCalledWith(testProduct);
  });

  it('Paylaş düyməsi onShare çağırır', () => {
    const onShare = vi.fn();
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={true}
        onClose={vi.fn()} onShare={onShare} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    const shareBtn = screen.getByTitle('Paylaş');
    fireEvent.click(shareBtn);
    expect(onShare).toHaveBeenCalledWith(testProduct);
  });

  it('dark theme-də də düzgün render olur', () => {
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={darkTheme} visible={true}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    expect(screen.getByText('ARDO HOD-500 Aspirator')).toBeDefined();
  });

  it('product=null olduqda heç nə render etmir', () => {
    render(
      <ProductDetailModal product={null} brand={undefined} theme={lightTheme} visible={true}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    expect(screen.queryByText('HOD-500')).toBeNull();
  });

  it('istehsal ölkəsi göstərilir', () => {
    render(
      <ProductDetailModal product={testProduct} brand={testBrand} theme={lightTheme} visible={true}
        onClose={vi.fn()} onShare={vi.fn()} onWhatsApp={vi.fn()} onCall={vi.fn()} onCopyLink={vi.fn()} />
    );
    expect(screen.getByText(/Türkiyə/i)).toBeDefined();
  });
});
