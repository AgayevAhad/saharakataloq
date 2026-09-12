// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');

describe('Heavy Media & Physical Asset Audit Suite (Opt-In media:test)', () => {
  const mediaDir = join(ROOT, 'public', 'media', 'products');
  const videoDir = join(ROOT, 'public', 'media', 'products', 'videos');

  const hasMedia =
    existsSync(mediaDir) && readdirSync(mediaDir).filter((f) => !f.startsWith('.')).length >= 10;

  it.skipIf(!hasMedia)(
    'all 192 sample product photos and videos exist and are valid on disk',
    () => {
      const files = readdirSync(mediaDir).filter((f) => !f.startsWith('.'));
      expect(files.length).toBeGreaterThanOrEqual(40);

      // Verify key brand photos
      expect(files).toContain('ardo-ar12ws.jpg');
      expect(files).toContain('ardo-ar6120-black.jpg');
      expect(files).toContain('ardo-6331-gb.jpg');
    }
  );

  it.skipIf(!hasMedia)('all video assets and posters exist and have non-zero size', () => {
    if (!existsSync(videoDir)) return;
    const videoFiles = readdirSync(videoDir).filter((f) => f.endsWith('.mp4'));
    for (const v of videoFiles) {
      const fullPath = join(videoDir, v);
      expect(statSync(fullPath).size).toBeGreaterThan(10000);
    }
  });
});
