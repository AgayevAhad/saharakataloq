import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CatalogCompareSidebar } from '../features/catalog/CatalogCompareSidebar';
import { lightTheme } from '../types/theme';
import { Product } from '../types/product';

const products = [
  { id: 'one', title: 'ARDO soba', image: '', code: 'A-1' },
  { id: 'two', title: 'Lotus soba', image: '', code: 'L-1' },
] as Product[];

afterEach(cleanup);

describe('catalog comparison entry', () => {
  it('explains the empty state and requires two real selected products', () => {
    const onOpen = vi.fn();
    const { rerender } = render(
      <CatalogCompareSidebar products={[]} theme={lightTheme} onOpen={onOpen} onRemove={vi.fn()} />
    );
    expect(screen.getByText(/tərəzi işarəsini seçin/)).toBeTruthy();
    rerender(
      <CatalogCompareSidebar
        products={[products[0]]}
        theme={lightTheme}
        onOpen={onOpen}
        onRemove={vi.fn()}
      />
    );
    expect(
      (screen.getByRole('button', { name: 'Daha bir məhsul seçin' }) as HTMLButtonElement).disabled
    ).toBe(true);
    rerender(
      <CatalogCompareSidebar
        products={products}
        theme={lightTheme}
        onOpen={onOpen}
        onRemove={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Məhsulları müqayisə et' }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('removes only the chosen product and can clear the entire selection', () => {
    const onRemove = vi.fn();
    const onClear = vi.fn();
    render(
      <CatalogCompareSidebar
        products={products}
        theme={lightTheme}
        onOpen={vi.fn()}
        onRemove={onRemove}
        onClear={onClear}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'ARDO soba müqayisədən çıxart' }));
    expect(onRemove).toHaveBeenCalledWith(products[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Seçimi təmizlə' }));
    expect(onClear).toHaveBeenCalledOnce();
  });
});
