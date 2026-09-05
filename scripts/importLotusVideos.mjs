import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';
import { existsSync } from 'fs';
import { join } from 'path';

// STRICT 1:1 EXACT MATCH ONLY (Rule 17)
// Any video without an exact 1:1 model code in filename must remain unassigned.
const VIDEO_MAPPINGS = [
  {
    videoFile: 'lotus-cooktop-ftb941cmw.mp4',
    posterFile: 'lotus-cooktop-ftb941cmw-poster.jpg',
    originalName: 'LOTUS F-TB941CM(W).mp4',
    productIds: ['lotus-cooktop-lt-941-cmw'],
    title: 'Lotus LT-941-CMW / F-TB941CM(W) Bişirmə Paneli Video İcmal',
  },
  {
    videoFile: 'lotus-soba-6450.mp4',
    posterFile: 'lotus-soba-6450-poster.jpg',
    originalName: 'LOTUS SOBA 6450.mp4',
    productIds: ['lotus-lt645o'],
    title: 'Lotus LT 6450 Soba Video İcmal',
  },
];

async function importVideosForDatabase(dbPath, label) {
  console.log(`\n========================================`);
  console.log(`Importing Lotus videos to ${label} (${dbPath})`);
  console.log(`========================================`);

  const catalogDb = createCatalogDatabase(dbPath);
  const catalog = catalogDb.getCatalog();

  let attachedCount = 0;
  let posterSetCount = 0;

  for (const mapping of VIDEO_MAPPINGS) {
    const videoUrl = `/media/products/videos/${mapping.videoFile}`;
    const posterUrl = `/media/products/videos/${mapping.posterFile}`;

    for (const prodId of mapping.productIds) {
      const product = catalog.products.find((p) => p.id === prodId);
      if (!product) {
        console.warn(`[WARN] Product ${prodId} not found in ${label}.`);
        continue;
      }

      if (!product.media) product.media = [];

      const existingVideoIndex = product.media.findIndex(
        (m) => m.url === videoUrl || m.originalName === mapping.originalName || m.type === 'video'
      );

      const videoMediaItem = {
        id: `${prodId}-video`,
        type: 'video',
        url: videoUrl,
        alt: `${product.title} — ${mapping.title}`,
        originalName: mapping.originalName,
        poster: posterUrl,
        objectPosition: 'center',
        fitMode: 'contain',
      };

      if (existingVideoIndex >= 0) {
        product.media[existingVideoIndex] = {
          ...product.media[existingVideoIndex],
          ...videoMediaItem,
        };
        console.log(`[UPDATED VIDEO] -> ${product.code} (${product.title}): ${videoUrl}`);
      } else {
        product.media.push(videoMediaItem);
        attachedCount++;
        console.log(`[ATTACHED VIDEO] -> ${product.code} (${product.title}): ${videoUrl}`);
      }

      // If product has no primary image, set it to the high-res poster thumbnail
      if (!product.image) {
        product.image = posterUrl;
        posterSetCount++;
        console.log(`[SET POSTER AS PRIMARY IMAGE] -> ${product.code}: ${posterUrl}`);
      }
    }
  }

  catalogDb.saveCatalog(catalog);
  console.log(`[SUCCESS] ${label}: Attached ${attachedCount} videos, set ${posterSetCount} primary posters.`);
  catalogDb.close();
}

async function run() {
  const publicDb = join(process.cwd(), 'data', 'catalog.sqlite');
  const draftDb = join(process.cwd(), 'data', 'catalog-draft.sqlite');

  if (existsSync(publicDb)) {
    await importVideosForDatabase(publicDb, 'Public Catalog');
  }
  if (existsSync(draftDb)) {
    await importVideosForDatabase(draftDb, 'Draft Catalog');
  }

  console.log('\nAll Lotus videos have been successfully imported into the catalog database!\n');
}

run().catch((err) => {
  console.error('Fatal error importing videos:', err);
  process.exit(1);
});

