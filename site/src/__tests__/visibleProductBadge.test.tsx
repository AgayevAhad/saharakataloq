import { describe, expect, it, vi } from 'vitest';
import { getVisibleBadgeText } from '../components/productCardVisuals';
import { ProductEditor } from '../components/CatalogAdmin';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Product } from '../types/product';
import { lightTheme } from '../types/theme';

const product = {
  id: 'badge-test',
  code: 'badge-test',
  title: 'Badge test',
  category: 'washer',
  categoryName: 'Paltaryuyan',
  image: '',
  shortDesc: '',
  specs: [],
  highlights: [],
} as Product;

describe('admin-controlled product badges', () => {
  it('hides only imported automatic Yeni badges', () => {
    expect(getVisibleBadgeText({ ...product, isNew: true, badgeText: 'Yeni' })).toBe('');
  });

  it('shows an explicitly selected admin badge including Yeni', () => {
    expect(getVisibleBadgeText({ ...product, isNew: false, badgeText: 'Yeni' })).toBe('Yeni');
    expect(getVisibleBadgeText({ ...product, isNew: true, badgeText: 'Endirim' })).toBe('Endirim');
  });

  it('admin editing Yeni clears the legacy automatic-new flag before save', () => {
    const onSave = vi.fn();
    render(
      <ProductEditor
        product={{ ...product, isNew: true, badgeText: 'Yeni' }}
        brands={[]}
        categories={[]}
        availableCountries={[]}
        theme={lightTheme}
        onUpload={vi.fn()}
        onClose={vi.fn()}
        onSave={onSave}
      />
    );
    const badge = screen.getByLabelText('Kampaniya Nişanı (Badge)');
    fireEvent.change(badge, { target: { value: 'Endirim' } });
    fireEvent.change(badge, { target: { value: 'Yeni' } });
    fireEvent.click(screen.getByRole('button', { name: 'Yadda saxla' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ badgeText: 'Yeni', isNew: false })
    );
  });
});
