import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateDryRunToken, validateDryRunToken } from '../backend/pimV2Migration.mjs';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

describe('Canonical Hash Token Invalidation on Field Edit Suite', () => {
  let tempDir: string;
  let publicDbPath: string;
  let draftDbPath: string;

  beforeEach(() => {
    process.env.PIM_TOKEN_SECRET = 'test_secret_for_vitest';
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-token-test-'));
    publicDbPath = join(tempDir, 'catalog.sqlite');
    draftDbPath = join(tempDir, 'catalog-draft.sqlite');

    const db = createCatalogDatabase(publicDbPath);
    db.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'cooktop', name: 'Cooktops', slug: 'cooktop', sortOrder: 1 }],
      products: [
        {
          id: 'p-1',
          code: 'M-101',
          title: 'ARDO Cooktop',
          brandId: 'ardo',
          category: 'cooktop',
          image: '/media/ardo/m-101.jpg',
          imagePosition: 'center center',
          imageFit: 'contain',
          price: 500,
          status: 'published',
          specs: [{ id: 's1', name: 'Burners', value: '4' }],
          media: [
            {
              id: 'm1',
              type: 'image',
              url: '/media/ardo/m-101.jpg',
              objectPosition: 'center center',
              fitMode: 'contain',
            },
          ],
        },
      ],
      settings: { companyName: 'Sahara Electronics' },
    });
    db.close();

    const draftDb = createCatalogDatabase(draftDbPath);
    draftDb.saveCatalog({
      brands: [{ id: 'ardo', name: 'ARDO', slug: 'ardo', originCountry: 'Italy' }],
      categories: [{ id: 'cooktop', name: 'Cooktops', slug: 'cooktop', sortOrder: 1 }],
      products: [
        {
          id: 'p-1',
          code: 'M-101',
          title: 'ARDO Cooktop',
          brandId: 'ardo',
          category: 'cooktop',
          image: '/media/ardo/m-101.jpg',
          imagePosition: 'center center',
          imageFit: 'contain',
          price: 500,
          status: 'published',
          specs: [{ id: 's1', name: 'Burners', value: '4' }],
          media: [
            {
              id: 'm1',
              type: 'image',
              url: '/media/ardo/m-101.jpg',
              objectPosition: 'center center',
              fitMode: 'contain',
            },
          ],
        },
      ],
    });
    draftDb.close();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Generates and validates valid dry-run token on unchanged database', () => {
    const { dryRunToken } = generateDryRunToken(tempDir, 'admin-user');
    expect(dryRunToken).toBeDefined();

    const validation = validateDryRunToken(dryRunToken, tempDir);
    expect(validation.valid).toBe(true);
  });

  it('2. Editing price invalidates the dry-run token', () => {
    const { dryRunToken } = generateDryRunToken(tempDir, 'admin-user');

    const db = new DatabaseSync(publicDbPath);
    db.prepare('UPDATE products SET price = 550 WHERE id = ?').run('p-1');
    db.close();

    const validation = validateDryRunToken(dryRunToken, tempDir);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('MANIFEST_CHANGED');
  });

  it('3. Editing title invalidates the dry-run token', () => {
    const { dryRunToken } = generateDryRunToken(tempDir, 'admin-user');

    const db = new DatabaseSync(publicDbPath);
    db.prepare("UPDATE products SET title = 'ARDO Cooktop New Title' WHERE id = ?").run('p-1');
    db.close();

    const validation = validateDryRunToken(dryRunToken, tempDir);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('MANIFEST_CHANGED');
  });

  it('4. Editing image crop / object position invalidates the dry-run token', () => {
    const { dryRunToken } = generateDryRunToken(tempDir, 'admin-user');

    const db = new DatabaseSync(publicDbPath);
    db.prepare("UPDATE product_media SET object_position = 'top left' WHERE id = ?").run('m1');
    db.close();

    const validation = validateDryRunToken(dryRunToken, tempDir);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('MANIFEST_CHANGED');
  });

  it('5. Editing a single spec value invalidates the dry-run token', () => {
    const { dryRunToken } = generateDryRunToken(tempDir, 'admin-user');

    const db = new DatabaseSync(publicDbPath);
    db.prepare("UPDATE product_specs SET value = '5' WHERE id = ?").run('s1');
    db.close();

    const validation = validateDryRunToken(dryRunToken, tempDir);
    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('MANIFEST_CHANGED');
  });
});
