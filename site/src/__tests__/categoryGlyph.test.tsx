import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { CategoryGlyph } from '../components/CategoryGlyph';

describe('Sahara category glyphs', () => {
  it('uses a distinct pictogram for each populated catalog department and one visual shell', () => {
    const ids = [
      'hood',
      'cooktop',
      'oven',
      'refrigerator',
      'air_conditioner',
      'washer',
      'dryer',
      'dishwasher',
      'tv',
      'audio',
      'microwave',
      'vacuum_cleaner',
      'airfryer',
      'thermopot',
      'meat_grinder',
      'iron',
    ];
    const icons = ids.map((id) => {
      const { container, unmount } = render(<CategoryGlyph id={id} compact />);
      const shell = container.querySelector('[data-category-glyph]');
      expect(shell?.classList.contains('category-glyph')).toBe(true);
      const icon = shell?.querySelector('svg')?.getAttribute('class');
      unmount();
      return icon;
    });
    expect(new Set(icons).size).toBe(ids.length);
  });
});
