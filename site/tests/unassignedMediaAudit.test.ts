import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { auditUnassignedMedia } from '../backend/unassignedMediaAudit.mjs';

describe('PIM v2 Unassigned Media Audit & Exact Match Suite', () => {
  let tempDir: string;
  let dbPath: string;
  let mediaDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-media-audit-'));
    dbPath = join(tempDir, 'catalog.sqlite');
    mediaDir = join(tempDir, 'media');
    mkdirSync(mediaDir, { recursive: true });

    const db = createCatalogDatabase(dbPath);
    db.saveCatalog({
      brands: [
        {
          id: 'ardo',
          name: 'ARDO',
          slug: 'ardo',
          originCountry: 'İtaliya',
          manufacturingCountries: ['İtaliya'],
          comingSoon: false,
          active: true,
        },
      ],
      categories: [
        {
          id: 'cooktop',
          name: 'Qaz Panelləri',
          slug: 'cooktop',
          icon: 'flame',
          active: true,
          sortOrder: 1,
        },
      ],
      products: [
        {
          id: 'p-1',
          code: 'HB-60',
          title: 'ARDO HB-60 Qaz Paneli',
          brandId: 'ardo',
          category: 'cooktop',
          image: '/media/hb-60-main.jpg',
          status: 'published',
          specs: [],
          media: [
            {
              id: 'm-1',
              type: 'image',
              url: '/media/hb-60-main.jpg',
              alt: 'ARDO HB-60',
            },
          ],
        },
      ],
    });
    db.close();

    // Create test media files
    writeFileSync(join(mediaDir, 'hb-60-main.jpg'), 'fake-image-content-hb60');
    writeFileSync(join(mediaDir, 'hb-60-angle.jpg'), 'fake-image-content-hb60-angle');
    writeFileSync(join(mediaDir, 'unrelated-photo-1.jpg'), 'fake-random-image-1');
    writeFileSync(join(mediaDir, 'unknown-sample-draft.png'), 'fake-random-image-2');
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Matches exact 1:1 model files and isolates unassigned files with official report statement', () => {
    const auditResult = auditUnassignedMedia(dbPath, mediaDir);

    expect(auditResult.totalScanned).toBe(4);
    expect(auditResult.matchedCount).toBe(2);
    expect(auditResult.unassignedCount).toBe(2);

    expect(auditResult.unassignedFiles).toContain('unrelated-photo-1.jpg');
    expect(auditResult.unassignedFiles).toContain('unknown-sample-draft.png');

    expect(auditResult.unassignedNotice).toContain(
      'Bu faylları dəqiq model adında tapmadığım üçün heç bir modelə bağlamadım'
    );
    expect(auditResult.unassignedNotice).toContain('unrelated-photo-1.jpg');
    expect(auditResult.unassignedNotice).toContain('unknown-sample-draft.png');
  });
});
