import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DatabaseSync } from 'node:sqlite';

const BRAND_SVGS = {
  samsung: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="4" fill="#1428A0">SAMSUNG</text>
  </svg>`,

  lg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <g transform="translate(16, 6)">
      <circle cx="18" cy="18" r="17" fill="#A50034"/>
      <path d="M12 11 v14 h12" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="14" cy="14" r="2.2" fill="#FFFFFF"/>
    </g>
    <text x="66" y="32" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="1" fill="#222222">LG</text>
  </svg>`,

  bosch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <g transform="translate(10, 8)">
      <circle cx="16" cy="16" r="14" fill="none" stroke="#EA1C24" stroke-width="2.6"/>
      <rect x="7" y="10" width="18" height="12" rx="2" fill="none" stroke="#EA1C24" stroke-width="2.2"/>
    </g>
    <text x="52" y="32" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2" fill="#0F172A">BOSCH</text>
  </svg>`,

  philips: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="3" fill="#0B5ED7">PHILIPS</text>
  </svg>`,

  ariston: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#C8102E">ARISTON</text>
  </svg>`,

  beko: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="1.5" fill="#0066CC">beko</text>
  </svg>`,

  toshiba: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="3" fill="#E60012">TOSHIBA</text>
  </svg>`,

  hisense: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="26" letter-spacing="2" fill="#00A19C">Hisense</text>
  </svg>`,

  electrolux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48">
    <g transform="translate(10, 8)">
      <path d="M16 4 L26 28 L6 28 Z" fill="none" stroke="#011E41" stroke-width="2.2"/>
      <circle cx="16" cy="18" r="4" fill="#011E41"/>
    </g>
    <text x="48" y="32" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="22" letter-spacing="1" fill="#011E41">Electrolux</text>
  </svg>`,

  aeg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="30" letter-spacing="4" fill="#E30613">AEG</text>
  </svg>`,

  arcelik: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="25" letter-spacing="1.5" fill="#E30A17">arçelik</text>
  </svg>`,

  indesit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <g transform="translate(12, 10)">
      <circle cx="14" cy="14" r="12" fill="none" stroke="#0084C7" stroke-width="2.5"/>
      <path d="M14 6 v8" stroke="#0084C7" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <text x="46" y="32" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="23" letter-spacing="1" fill="#0084C7">INDESIT</text>
  </svg>`,

  hotpoint: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="24" letter-spacing="1" fill="#D3122A">Hotpoint</text>
  </svg>`,

  midea: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="26" letter-spacing="1" fill="#009AD9">Midea</text>
  </svg>`,

  tcl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="30" letter-spacing="3" fill="#E4002B">TCL</text>
  </svg>`,

  siemens: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#00646E">SIEMENS</text>
  </svg>`,

  hitachi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#E60012">HITACHI</text>
  </svg>`,

  sharp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="27" letter-spacing="3" fill="#E60012">SHARP</text>
  </svg>`,

  whirlpool: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 48">
    <circle cx="20" cy="24" r="12" fill="none" stroke="#F59E0B" stroke-width="2.5"/>
    <text x="40" y="32" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="24" letter-spacing="1" fill="#1E3A8A">Whirlpool</text>
  </svg>`,

  vestel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#D81E05">VESTEL</text>
  </svg>`,

  pozis: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#0055A5">POZIS</text>
  </svg>`,

  biryusa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2" fill="#0284C7">БИРЮСА</text>
  </svg>`,

  daewoo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#003399">DAEWOO</text>
  </svg>`,

  zanussi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#F59E0B">ZANUSSI</text>
  </svg>`,

  finlux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#004B93">FINLUX</text>
  </svg>`,

  goldmaster: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="23" letter-spacing="1" fill="#D4AF37">GoldMaster</text>
  </svg>`,

  hoffmann: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2" fill="#CC0000">HOFFMANN</text>
  </svg>`,

  shivaki: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#E50914">SHIVAKI</text>
  </svg>`,

  skyworth: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="23" letter-spacing="2" fill="#0080FF">SKYWORTH</text>
  </svg>`,

  tesla: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="4" fill="#E82127">TESLA</text>
  </svg>`,

  yoshiro: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#D90429">YOSHIRO</text>
  </svg>`,

  ardesto: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="24" letter-spacing="2" fill="#FF5722">ARDESTO</text>
  </svg>`,

  eurolux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2" fill="#003399">EUROLUX</text>
  </svg>`,

  hailang: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2" fill="#0088CC">HAILANG</text>
  </svg>`,

  hayland: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2" fill="#0088CC">HAYLAND</text>
  </svg>`,

  darkin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#0097E6">DAIKIN</text>
  </svg>`,

  javel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#E11D48">JAVEL</text>
  </svg>`,

  konka: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#FF3B30">KONKA</text>
  </svg>`,

  konko: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#FF3B30">KONKA</text>
  </svg>`,

  lanova: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#0D9488">LANOVA</text>
  </svg>`,

  mgi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="3" fill="#4338CA">MGI</text>
  </svg>`,

  neos: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="27" letter-spacing="3" fill="#2563EB">NEOS</text>
  </svg>`,

  regal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#0052CC">REGAL</text>
  </svg>`,

  rokos: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#0891B2">ROKOS</text>
  </svg>`,

  silver: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#64748B">SILVER</text>
  </svg>`,

  talberg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2" fill="#059669">TALBERG</text>
  </svg>`,

  vegas: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="3" fill="#7C3AED">VEGAS</text>
  </svg>`,

  winsor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#1E3A8A">WINSOR</text>
  </svg>`,

  ficher: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#DC2626">FICHER</text>
  </svg>`,

  everest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2" fill="#0284C7">EVEREST</text>
  </svg>`,

  arlant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2" fill="#2563EB">ARLANT</text>
  </svg>`,

  es: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 48">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="3" fill="#475569">ES</text>
  </svg>`,
};

// Target directory strictly in site/
const targetDir = join(process.cwd(), 'site', 'public', 'media', 'brands');
mkdirSync(targetDir, { recursive: true });

console.log('Generating Brand Logos with authentic colors...');
for (const [brandId, svgContent] of Object.entries(BRAND_SVGS)) {
  const fileName = `${brandId}-logo.svg`;
  writeFileSync(join(targetDir, fileName), svgContent.trim());
}

// Update site databases strictly
const dbs = [
  join(process.cwd(), 'site', 'data', 'catalog.sqlite'),
  join(process.cwd(), 'site', 'data', 'catalog-draft.sqlite'),
];

for (const dbPath of dbs) {
  try {
    const db = new DatabaseSync(dbPath);
    for (const brandId of Object.keys(BRAND_SVGS)) {
      const logoUrl = `/media/brands/${brandId}-logo.svg`;
      db.prepare("UPDATE brands SET logo = ? WHERE id = ? OR slug = ?").run(logoUrl, brandId, brandId);
    }
    // Ensure ardo, lotus, artel have their original logos preserved
    db.prepare("UPDATE brands SET logo = '/media/brands/ardo-logo.png' WHERE id = 'ardo' OR slug = 'ardo'").run();
    db.prepare("UPDATE brands SET logo = '/media/brands/lotus-logo.png' WHERE id = 'lotus' OR slug = 'lotus'").run();
    db.prepare("UPDATE brands SET logo = '/media/brands/artel-logo.svg' WHERE id = 'artel' OR slug = 'artel'").run();
    
    db.close();
    console.log(`Updated logos in ${dbPath}`);
  } catch (err) {
    console.log(`DB update skipped for ${dbPath}:`, err.message);
  }
}
console.log('All brand logos generated with authentic colors successfully!');
