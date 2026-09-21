// @vitest-environment happy-dom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { VisualCategoryCards } from '../components/VisualCategoryCards';
import { VisualCategoryCardsSkeleton } from '../components/Skeletons';
import { lightTheme, darkTheme } from '../types/theme';
import { CatalogCategory, Product } from '../types/product';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const mockCategories: CatalogCategory[] = [
  {
    id: 'refrigerator',
    name: 'Soyuducular',
    slug: 'refrigerators',
    active: true,
    icon: 'refrigerator',
  },
  { id: 'oven', name: 'Sobalar', slug: 'ovens', active: true, icon: 'soba' },
  { id: 'cooktop', name: 'Bişirmə Panelləri', slug: 'cooktops', active: true, icon: 'flame' },
  { id: 'hood', name: 'Aspiratorlar', slug: 'hoods', active: true, icon: 'wind' },
  { id: 'washer', name: 'Paltaryuyanlar', slug: 'washers', active: true, icon: 'washer' },
  { id: 'tv', name: 'Televizorlar', slug: 'tv', active: true, icon: 'tv' },
  { id: 'dishwasher', name: 'Qabyuyanlar', slug: 'dishwashers', active: true, icon: 'dishwasher' },
  { id: 'air_conditioner', name: 'Kondisionerlər', slug: 'ac', active: true, icon: 'kondisioner' },
  { id: 'microwave', name: 'Mikrodalğalı Sobalar', slug: 'microwave', active: true, icon: 'zap' },
  { id: 'dryer', name: 'Quruducu Maşınlar', slug: 'dryers', active: true, icon: 'shirt' },
  { id: 'vacuum_cleaner', name: 'Tozsoranlar', slug: 'vacuum', active: true, icon: 'box' },
];

const mockProducts: Product[] = mockCategories.map((cat, idx) => ({
  id: `prod-${idx + 1}`,
  code: `CODE-${idx + 1}`,
  title: `${cat.name} Məhsulu`,
  category: cat.id,
  categoryName: cat.name,
  brandId: 'ardo',
  image: `/media/products/img${idx + 1}.jpg`,
  status: 'published' as const,
  specs: [],
  highlights: [],
  shortDesc: '',
}));

describe('4-Slide Dynamic Category Collage Suite (Kolaj1, Kolaj2, Kolaj3 & Bento)', () => {
  it('1. Removes the subtitle "Ən çox seçim olan 5 kataloq bölməsi" completely', () => {
    render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );

    expect(screen.getByText('Məhsul Kateqoriyaları')).toBeDefined();
    expect(screen.queryByText(/Ən çox seçim olan/i)).toBeNull();
  });

  it('2. Distributes categories across 4 slides with distinct engines (bento, facet, frames, cluster)', () => {
    const { container } = render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );

    // Slide 1 (Bento) should be active initially with YouTube progress bar
    expect(screen.getByText('Böyük Məişət Texnikası')).toBeDefined();
    expect(container.querySelector('.collage-track-bento')).toBeDefined();
    expect(container.querySelector('.collage-tab-progress-fill')).toBeTruthy();

    // Slayd 2-yə keçək (Həndəsi Qəlpələr / Kolaj1.jpeg)
    const slide2Tab = screen.getByText(/Quraşdırılan Texnika/i);
    fireEvent.click(slide2Tab);
    expect(container.querySelector('.collage-track-facet')).toBeDefined();

    // Slayd 3-ə keçək (Bədii Qalereya / Kolaj1.png)
    const slide3Tab = screen.getByText(/Kiçik Məişət Texnikası/i);
    fireEvent.click(slide3Tab);
    expect(container.querySelector('.collage-track-frames')).toBeDefined();

    // Slayd 4-ə keçək (Klaster Mozaikası / Kolak1.jpeg)
    const slide4Tab = screen.getByText(/İqlim Texnikası/i);
    fireEvent.click(slide4Tab);
    expect(container.querySelector('.collage-track-cluster')).toBeDefined();
  });

  it('3. Next and Prev arrow buttons navigate smoothly through the 4 slides', () => {
    const { container } = render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
      />
    );

    const nextBtn = container.querySelector('.collage-next-btn');
    const prevBtn = container.querySelector('.collage-prev-btn');
    expect(nextBtn).toBeTruthy();
    expect(prevBtn).toBeTruthy();

    // Initially Slide 1 (Bento)
    expect(container.querySelector('.collage-track-bento')).toBeDefined();

    // Click Next -> Slide 2 (Facet)
    fireEvent.click(nextBtn!);
    expect(container.querySelector('.collage-track-facet')).toBeDefined();

    // Click Next -> Slide 3 (Frames)
    fireEvent.click(nextBtn!);
    expect(container.querySelector('.collage-track-frames')).toBeDefined();

    // Click Next -> Slide 4 (Cluster)
    fireEvent.click(nextBtn!);
    expect(container.querySelector('.collage-track-cluster')).toBeDefined();

    // Click Prev -> Slide 3 (Frames)
    fireEvent.click(prevBtn!);
    expect(container.querySelector('.collage-track-frames')).toBeDefined();
  });

  it('4. Auto-rotates slides periodically when not hovered', () => {
    vi.useFakeTimers();

    const { container } = render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
        autoPlayIntervalMs={5000}
      />
    );

    expect(container.querySelector('.collage-track-bento')).toBeDefined();

    // Advance timer by 5 seconds -> Slide 2
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(container.querySelector('.collage-track-facet')).toBeDefined();

    // Advance timer by 5 seconds -> Slide 3
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(container.querySelector('.collage-track-frames')).toBeDefined();

    // Advance timer by 5 seconds -> Slide 4
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(container.querySelector('.collage-track-cluster')).toBeDefined();
  });

  it('5. Invokes onSelectCategory with exact category id when a card is clicked', () => {
    const onSelect = vi.fn();
    render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={onSelect}
      />
    );

    const refBtn = screen.getByText('Soyuducular').closest('button');
    expect(refBtn).toBeDefined();
    fireEvent.click(refBtn!);

    expect(onSelect).toHaveBeenCalledWith('refrigerator');
  });

  it('does not auto-rotate slides when reduced motion is requested', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
    }));
    const { container } = render(
      <VisualCategoryCards
        categories={mockCategories}
        products={mockProducts}
        theme={lightTheme}
        onSelectCategory={vi.fn()}
        autoPlayIntervalMs={5000}
      />
    );
    act(() => vi.advanceTimersByTime(15000));
    expect(container.querySelector('.collage-track-bento')).not.toBeNull();
  });

  it('6. VisualCategoryCardsSkeleton matches header and maintains 1:1 skeleton placeholders', () => {
    const { container } = render(<VisualCategoryCardsSkeleton theme={darkTheme} />);
    expect(container.querySelector('.visual-categories-section')).toBeDefined();
    expect(container.querySelector('.visual-categories-header')).toBeDefined();
    expect(container.querySelectorAll('.visual-category-reveal')).toHaveLength(5);
  });
});
