import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

function fixDatabase(dbPath, label) {
  console.log(`\n========================================`);
  console.log(`Fixing Exact Media Mappings for ${label} (${dbPath})`);
  console.log(`========================================`);

  const catalogDb = createCatalogDatabase(dbPath);
  const catalog = catalogDb.getCatalog();

  for (const p of catalog.products) {
    if (!p.media) p.media = [];

    // 1. Ardo D980B: Remove all videos
    if (p.id === 'ardo-d980b' || p.code === 'D980B' || p.code === 'D 980 B') {
      p.media = p.media.filter((m) => m.type !== 'video');
      p.image = p.media.find((m) => m.type === 'image')?.url || '/uploads/mtic4322-de8e682d98c9a285.jpg';
      console.log(`[CLEANED ARDO D980B] Removed any videos from ${p.code}`);
    }

    // 2. Lotus Cooktops (LT941 Inox, LT941S Black, TB941GCW, LT-6454İNOX): Remove mismatched cooktop videos
    if (
      p.id === 'lotus-cooktop-lt-941-i-nox' ||
      p.id === 'lotus-lt941-inox' ||
      p.id === 'lotus-lt941s-black' ||
      p.id === 'lotus-tb941gcw' ||
      p.id === 'lotus-cooktop-lt-6454i-nox' ||
      p.id === 'lotus-lt6454-inox'
    ) {
      p.media = p.media.filter((m) => m.type !== 'video');
      const firstImg = p.media.find((m) => m.type === 'image' && m.url)?.url || '';
      if (firstImg) p.image = firstImg;
      console.log(`[CLEANED COOKTOP] Removed mismatched video from ${p.code} (${p.title})`);
    }

    // 3. Lotus Aspirator CTB2752B, CTB2752I, CTB2752K: Remove non-1:1 generic video
    if (
      p.id === 'lotus-ctb2752b' ||
      p.id === 'lotus-ctb2752i' ||
      p.id === 'lotus-ctb2752k' ||
      p.code === 'CTB2752B' ||
      p.code === 'CTB2752I' ||
      p.code === 'CTB2752K'
    ) {
      p.media = p.media.filter((m) => m.type !== 'video');
      const firstImg = p.media.find((m) => m.type === 'image' && m.url)?.url || '';
      if (firstImg) p.image = firstImg;
      console.log(`[CLEANED ASPIRATOR 2752] Removed generic video from ${p.code}`);
    }

    // 4. Lotus Soba (LT645V 8 Program, LT6470 8 Program): Remove mismatched 6450 video
    if (
      p.id === 'lotus-lt645v-8-program' ||
      p.id === 'lotus-lt6470-8-program' ||
      p.code === 'LT645V 8 Program' ||
      p.code === 'LT6470 8 Program'
    ) {
      p.media = p.media.filter((m) => m.type !== 'video');
      const firstImg = p.media.find((m) => m.type === 'image' && m.url)?.url || '';
      if (firstImg) p.image = firstImg;
      console.log(`[CLEANED SOBA] Removed 6450 video from different model ${p.code}`);
    }

    // 5. Lotus Soba LT4545 Airfry Inox & BL: Remove airfryer video from oven card
    if (
      p.id === 'lotus-lt4545-airfry-inox' ||
      p.id === 'lotus-lt4545-airfry-bl' ||
      p.code === 'LT4545 Airfry Inox' ||
      p.code === 'LT4545 Airfry BL'
    ) {
      p.media = p.media.filter((m) => m.type !== 'video');
      const firstImg = p.media.find((m) => m.type === 'image' && m.url)?.url || '';
      if (firstImg) p.image = firstImg;
      console.log(`[CLEANED OVEN LT4545] Removed airfryer video from ${p.code}`);
    }

    // 6. Lotus Mikrodalga LTS25LMWSS: Remove non-1:1 video
    if (p.id === 'lotus-lts25lmwss' || p.code === 'LTS25LMWSS') {
      p.media = p.media.filter((m) => m.type !== 'video');
      const firstImg = p.media.find((m) => m.type === 'image' && m.url)?.url || '';
      if (firstImg) p.image = firstImg;
      console.log(`[CLEANED MIKRODALGA] Removed generic video from ${p.code}`);
    }

    // 7. Lotus Irons: Set strictly exact 1:1 image sets
    if (p.id === 'lotus-iron-lt-8800' || p.code === 'LT-8800') {
      p.image = '/media/products/lotus-iron-lt-8800.jpg';
      p.gallery = [
        '/media/products/lotus-iron-lt-8800.jpg',
        '/media/products/lotus-iron-lt-8800-on.jpg',
        '/media/products/lotus-iron-lt-8800-arxa.jpg',
      ];
      p.media = [
        { id: 'm-8800-1', type: 'image', url: '/media/products/lotus-iron-lt-8800.jpg', originalName: 'LT-8800.jpg', alt: 'Buxarlı Ütü Lotus LT-8800' },
        { id: 'm-8800-2', type: 'image', url: '/media/products/lotus-iron-lt-8800-on.jpg', originalName: 'LT-8800 on.jpg', alt: 'Buxarlı Ütü Lotus LT-8800 Ön' },
        { id: 'm-8800-3', type: 'image', url: '/media/products/lotus-iron-lt-8800-arxa.jpg', originalName: 'LT-8800 arxa.jpg', alt: 'Buxarlı Ütü Lotus LT-8800 Arxa' },
      ];
      console.log(`[FIXED IRON LT-8800] Exactly 3 matching photos set`);
    }

    if (p.id === 'lotus-iron-lt-8801' || p.code === 'LT-8801') {
      p.image = '/media/products/lotus-iron-lt-8801.jpg';
      p.gallery = [
        '/media/products/lotus-iron-lt-8801.jpg',
        '/media/products/lotus-iron-lt-8801-on.jpg',
        '/media/products/lotus-iron-lt-8801-arxa.jpg',
      ];
      p.media = [
        { id: 'm-8801-1', type: 'image', url: '/media/products/lotus-iron-lt-8801.jpg', originalName: 'LT-8801.jpg', alt: 'Buxarlı Ütü Lotus LT-8801' },
        { id: 'm-8801-2', type: 'image', url: '/media/products/lotus-iron-lt-8801-on.jpg', originalName: 'LT-8801 on.jpg', alt: 'Buxarlı Ütü Lotus LT-8801 Ön' },
        { id: 'm-8801-3', type: 'image', url: '/media/products/lotus-iron-lt-8801-arxa.jpg', originalName: 'LT-8801 arxa.jpg', alt: 'Buxarlı Ütü Lotus LT-8801 Arxa' },
      ];
      console.log(`[FIXED IRON LT-8801] Exactly 3 matching photos set (foreign removed)`);
    }

    if (p.id === 'lotus-iron-lt-8802' || p.code === 'LT-8802') {
      p.image = '/media/products/lotus-iron-lt-8802.jpg';
      p.gallery = [
        '/media/products/lotus-iron-lt-8802.jpg',
        '/media/products/lotus-iron-lt-8802-on.jpg',
        '/media/products/lotus-iron-lt-8802-arxa.jpg',
      ];
      p.media = [
        { id: 'm-8802-1', type: 'image', url: '/media/products/lotus-iron-lt-8802.jpg', originalName: 'LT-8802.jpg', alt: 'Buxarlı Ütü Lotus LT-8802' },
        { id: 'm-8802-2', type: 'image', url: '/media/products/lotus-iron-lt-8802-on.jpg', originalName: 'LT-8802 on.jpg', alt: 'Buxarlı Ütü Lotus LT-8802 Ön' },
        { id: 'm-8802-3', type: 'image', url: '/media/products/lotus-iron-lt-8802-arxa.jpg', originalName: 'LT-8802 arxa.jpg', alt: 'Buxarlı Ütü Lotus LT-8802 Arxa' },
      ];
      console.log(`[FIXED IRON LT-8802] Exactly 3 matching photos set (foreign 4th removed)`);
    }

    if (p.id === 'lotus-iron-lt-8803' || p.code === 'LT-8803') {
      p.image = '/media/products/lotus-iron-lt-8803.jpg';
      p.gallery = [
        '/media/products/lotus-iron-lt-8803.jpg',
        '/media/products/lotus-iron-lt-8803-2.jpg',
      ];
      p.media = [
        { id: 'm-8803-1', type: 'image', url: '/media/products/lotus-iron-lt-8803.jpg', originalName: 'Utu Lotus Buxarlı  LT-8803.JPG', alt: 'Buxarlı Ütü Lotus LT-8803' },
        { id: 'm-8803-2', type: 'image', url: '/media/products/lotus-iron-lt-8803-2.jpg', originalName: 'Utu Lotus Buxarlı  LT-8803-1.JPG', alt: 'Buxarlı Ütü Lotus LT-8803 Yan' },
      ];
      console.log(`[FIXED IRON LT-8803] Exactly 2 matching photos set`);
    }
  }

  catalogDb.saveCatalog(catalog);
  catalogDb.close();
  console.log(`[SUCCESS] Fixed and saved exact media for ${label}`);
}

fixDatabase('data/catalog.sqlite', 'Production Catalog');
fixDatabase('data/catalog-draft.sqlite', 'Draft Catalog');
