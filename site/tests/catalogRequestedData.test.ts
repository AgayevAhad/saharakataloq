// @vitest-environment node
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const siteDir = resolve(__dirname, '..');
const databases = [
  resolve(siteDir, 'data/catalog.sqlite'),
  resolve(siteDir, 'data/catalog-draft.sqlite'),
  resolve(siteDir, '../data/catalog.sqlite'),
  resolve(siteDir, '../data/catalog-draft.sqlite'),
];

describe('requested catalog data corrections', () => {
  it.each(databases)('%s keeps LOTUS origin and technology data synchronized', (databasePath) => {
    const database = new DatabaseSync(databasePath, { readOnly: true });
    try {
      const lotus = database
        .prepare("SELECT origin_country FROM brands WHERE lower(id)='lotus' OR lower(name)='lotus'")
        .get() as { origin_country: string };
      const settings = database
        .prepare('SELECT countries, articles FROM catalog_settings WHERE id=1')
        .get() as { countries: string; articles: string };

      expect(lotus.origin_country).toBe('İngiltərə');
      expect(JSON.parse(settings.countries)).toContain('İngiltərə');
      expect(
        JSON.parse(settings.articles).some(
          (article: { id?: string }) => article.id === 'art-inverter'
        )
      ).toBe(false);
    } finally {
      database.close();
    }
  });
});
