import { existsSync } from 'node:fs';
import path from 'node:path';
import xlsx from 'xlsx';
import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

const ROOT = process.cwd();
const EXCEL_PATH = path.join(ROOT, 'File', 'Book1 (1).xlsx');

if (!existsSync(EXCEL_PATH)) {
  console.error(`Error: File not found at ${EXCEL_PATH}`);
  process.exit(1);
}

function parseSpecLine(line) {
  const colonIdx = line.indexOf(':');
  const dashIdx = line.indexOf(' - ');
  let name = '';
  let value = '';
  if (colonIdx !== -1 && (dashIdx === -1 || colonIdx < dashIdx)) {
    name = line.substring(0, colonIdx).trim();
    value = line.substring(colonIdx + 1).trim();
  } else if (dashIdx !== -1) {
    name = line.substring(0, dashIdx).trim();
    value = line.substring(dashIdx + 3).trim();
  } else if (line.includes('-')) {
    const parts = line.split('-');
    name = parts[0].trim();
    value = parts.slice(1).join('-').trim();
  } else {
    name = line.trim();
    value = 'Bəli';
  }
  return { name, value };
}

function getCategory(title) {
  const t = title.toLowerCase();
  if (t.startsWith('airfryer')) return { id: 'airfryer', name: 'Fritözlər & Airfryer', slug: 'airfryer', icon: 'Flame', sortOrder: 7 };
  if (t.startsWith('aspirator')) return { id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', icon: 'Wind', sortOrder: 1 };
  if (t.startsWith('mikrodalga') || t.startsWith('mikrodalğalı')) return { id: 'microwave', name: 'Mikrodalğalı sobalar', slug: 'mikrodalgali-sobalar', icon: 'Box', sortOrder: 3 };
  if (t.startsWith('paltaryuyan')) return { id: 'washer', name: 'Paltaryuyanlar', slug: 'paltaryuyanlar', icon: 'Layers', sortOrder: 8 };
  if (t.startsWith('plite') || t.startsWith('plitə')) return { id: 'cooktop', name: 'Bişirmə panelləri', slug: 'bisirme-panelleri', icon: 'Flame', sortOrder: 4 };
  if (t.startsWith('soba')) return { id: 'oven', name: 'Sobalar', slug: 'sobalar', icon: 'Layers', sortOrder: 5 };
  if (t.startsWith('soyuducu')) return { id: 'refrigerator', name: 'Soyuducular', slug: 'soyuducular', icon: 'Refrigerator', sortOrder: 6 };
  if (t.startsWith('termopot')) return { id: 'thermopot', name: 'Termopotlar', slug: 'termopotlar', icon: 'Box', sortOrder: 9 };
  if (t.startsWith('tozsoran')) return { id: 'vacuum_cleaner', name: 'Tozsoranlar', slug: 'tozsoranlar', icon: 'Wind', sortOrder: 10 };
  if (t.startsWith('tv')) return { id: 'tv', name: 'Televizorlar', slug: 'televizorlar', icon: 'Box', sortOrder: 11 };
  return { id: 'other', name: 'Digər', slug: 'diger', icon: 'Box', sortOrder: 12 };
}

function getModelCode(title) {
  const parts = title.trim().split(/\s+/);
  if (parts.length >= 3 && parts[1].toLowerCase() === 'lotus') {
    return parts.slice(2).join(' ');
  }
  if (parts.length >= 2) {
    return parts.slice(1).join(' ');
  }
  return title;
}

export async function importLotusData() {
  const wb = xlsx.readFile(EXCEL_PATH);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets['Sheet1'], { header: 1 });

  const lotusProducts = [];
  const usedIds = new Set();

  for (const r of rows) {
    if (r && r.length >= 2 && r[1] && typeof r[1] === 'string' && r[1].trim()) {
      const title = r[1].trim();
      const rawSpecs = r[2] ? String(r[2]).trim() : '';
      const cat = getCategory(title);
      const code = getModelCode(title);

      let baseId = 'lotus-' + code.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      let id = baseId;
      let counter = 1;
      while (usedIds.has(id)) {
        counter++;
        id = `${baseId}-${counter}`;
      }
      usedIds.add(id);

      const specLines = rawSpecs.split('\n').map((l) => l.trim()).filter(Boolean);
      const specs = specLines.map((line, idx) => {
        const { name, value } = parseSpecLine(line);
        let group = 'Əsas';
        const n = name.toLowerCase();
        if (n.includes('proqram') || n.includes('sürət') || n.includes('funksiya') || n.includes('avtomatik') || n.includes('rejim') || n.includes('displey') || n.includes('idarəetmə') || n.includes('taymer')) {
          group = 'Funksiyalar';
        } else if (n.includes('təhlükəsizlik') || n.includes('qaz-kontrol') || n.includes('kilid') || n.includes('qorunma')) {
          group = 'Təhlükəsizlik';
        } else if (n.includes('ölçü') || n.includes('hündürlük') || n.includes('en') || n.includes('dərinlik') || n.includes('həcm') || n.includes('tutumu') || n.includes('güc') || n.includes('enerji') || n.includes('çəki')) {
          group = 'Ölçü və Enerji';
        } else if (n.includes('material') || n.includes('rəng') || n.includes('örtük') || n.includes('şüşə') || n.includes('korpus') || n.includes('qapı')) {
          group = 'Dizayn və Material';
        }
        return {
          id: `spec-${idx + 1}`,
          name,
          value,
          group,
        };
      });

      const highlights = specs.slice(0, 3).map((s) => `${s.name}: ${s.value}`);

      lotusProducts.push({
        id,
        brandId: 'lotus',
        code,
        title,
        category: cat.id,
        categoryName: cat.name,
        image: '',
        gallery: [],
        media: [],
        highlights,
        shortDesc: `Lotus ${code} ${cat.name}`,
        manufacturingCountry: 'Türkiyə',
        specs,
        stockStatus: 'in_stock',
        isNew: false,
        isFeatured: false,
        status: 'published',
      });
    }
  }

  console.log(`Parsed ${lotusProducts.length} Lotus products from Excel.`);

  const dbPaths = ['data/catalog-draft.sqlite', 'data/catalog.sqlite'];

  for (const dbPath of dbPaths) {
    const db = createCatalogDatabase(path.join(ROOT, dbPath));
    const currentCatalog = db.getCatalog();

    // 1. Ensure Brand LOTUS is present and active
    const brandsMap = new Map((currentCatalog.brands || []).map((b) => [b.id, b]));
    brandsMap.set('lotus', {
      id: 'lotus',
      name: 'LOTUS',
      slug: 'lotus',
      originCountry: 'Türkiyə',
      manufacturingCountries: ['Türkiyə', 'Çin'],
      description: 'Yüksək keyfiyyətli Lotus məişət texnikası və elektronika məhsulları',
      logo: '/media/brands/lotus-mark.svg',
      active: true,
      comingSoon: false,
    });

    // 2. Ensure Categories
    const categoriesMap = new Map((currentCatalog.categories || []).map((c) => [c.id, c]));
    const requiredCategories = [
      { id: 'hood', name: 'Aspiratorlar', slug: 'aspiratorlar', icon: 'Wind', active: true, sortOrder: 1 },
      { id: 'air_conditioner', name: 'Kondisionerlər', slug: 'kondisionerler', icon: 'Snowflake', active: true, sortOrder: 2 },
      { id: 'microwave', name: 'Mikrodalğalı sobalar', slug: 'mikrodalgali-sobalar', icon: 'Box', active: true, sortOrder: 3 },
      { id: 'cooktop', name: 'Bişirmə panelləri', slug: 'bisirme-panelleri', icon: 'Flame', active: true, sortOrder: 4 },
      { id: 'oven', name: 'Sobalar', slug: 'sobalar', icon: 'Layers', active: true, sortOrder: 5 },
      { id: 'refrigerator', name: 'Soyuducular', slug: 'soyuducular', icon: 'Refrigerator', active: true, sortOrder: 6 },
      { id: 'airfryer', name: 'Fritözlər & Airfryer', slug: 'airfryer', icon: 'Flame', active: true, sortOrder: 7 },
      { id: 'washer', name: 'Paltaryuyanlar', slug: 'paltaryuyanlar', icon: 'Layers', active: true, sortOrder: 8 },
      { id: 'thermopot', name: 'Termopotlar', slug: 'termopotlar', icon: 'Box', active: true, sortOrder: 9 },
      { id: 'vacuum_cleaner', name: 'Tozsoranlar', slug: 'tozsoranlar', icon: 'Wind', active: true, sortOrder: 10 },
      { id: 'tv', name: 'Televizorlar', slug: 'televizorlar', icon: 'Box', active: true, sortOrder: 11 },
    ];

    for (const cat of requiredCategories) {
      if (!categoriesMap.has(cat.id)) {
        categoriesMap.set(cat.id, cat);
      }
    }

    // 3. Merge products: Keep all ARDO products (and any other brands) and add/update Lotus products
    const nonLotusProducts = (currentCatalog.products || []).filter((p) => p.brandId !== 'lotus');
    
    // Ensure canonical photos on ARDO products:
    for (const p of nonLotusProducts) {
      if (p.id === 'ardo-201gc') {
        p.image = '/media/products/ardo-201gc.jpg';
        p.gallery = ['/media/products/ardo-201gc.jpg', '/media/products/ardo-201gc-2.jpg'];
        p.media = [
          { id: 'm-201gc-1', type: 'image', url: '/media/products/ardo-201gc.jpg', alt: p.title, fitMode: 'contain', objectPosition: 'center' },
          { id: 'm-201gc-2', type: 'image', url: '/media/products/ardo-201gc-2.jpg', alt: `${p.title} Bucaq`, fitMode: 'contain', objectPosition: 'center' },
        ];
      } else if (p.id === 'ardo-202-gc') {
        p.image = '/media/products/ardo-202-gc.jpg';
        p.gallery = ['/media/products/ardo-202-gc.jpg', '/media/products/ardo-202-gc-2.jpg'];
        p.media = [
          { id: 'm-202gc-1', type: 'image', url: '/media/products/ardo-202-gc.jpg', alt: p.title, fitMode: 'contain', objectPosition: 'center' },
          { id: 'm-202gc-2', type: 'image', url: '/media/products/ardo-202-gc-2.jpg', alt: `${p.title} Bucaq`, fitMode: 'contain', objectPosition: 'center' },
        ];
      } else if (p.id === 'ardo-3166') {
        p.image = '/media/products/ardo-3166.jpg';
        p.gallery = ['/media/products/ardo-3166.jpg'];
        p.media = [
          { id: 'm-3166-1', type: 'image', url: '/media/products/ardo-3166.jpg', alt: p.title, fitMode: 'contain', objectPosition: 'center' },
        ];
      }
    }

    const mergedProducts = [...nonLotusProducts, ...lotusProducts];

    const updatedCatalog = {
      ...currentCatalog,
      brands: Array.from(brandsMap.values()),
      categories: Array.from(categoriesMap.values()),
      products: mergedProducts,
    };

    db.saveCatalog(updatedCatalog);
    console.log(`Saved catalog to ${dbPath}: ${updatedCatalog.brands.length} brands, ${updatedCatalog.categories.length} categories, ${updatedCatalog.products.length} products.`);
    db.close();
  }
}

if (process.argv[1]?.endsWith('import_lotus_catalog.mjs')) {
  importLotusData().then(() => {
    console.log('Lotus catalog import complete!');
  });
}
