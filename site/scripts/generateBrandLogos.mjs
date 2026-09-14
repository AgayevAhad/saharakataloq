import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DatabaseSync } from 'node:sqlite';

const BRAND_SVGS = {
  samsung: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="4">SAMSUNG</text>
  </svg>`,

  lg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <g transform="translate(16, 6)">
      <circle cx="18" cy="18" r="17" fill="none" stroke="currentColor" stroke-width="2.6"/>
      <path d="M12 11 v14 h12" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="14" cy="14" r="2.2" fill="currentColor"/>
    </g>
    <text x="66" y="32" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="1">LG</text>
  </svg>`,

  bosch: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <g transform="translate(10, 8)">
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <rect x="7" y="10" width="18" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
    </g>
    <text x="52" y="32" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2">BOSCH</text>
  </svg>`,

  philips: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="3">PHILIPS</text>
  </svg>`,

  ariston: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="25" letter-spacing="2">ARISTON</text>
  </svg>`,

  beko: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="1.5">beko</text>
  </svg>`,

  toshiba: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="3">TOSHIBA</text>
  </svg>`,

  hisense: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="26" letter-spacing="2">Hisense</text>
  </svg>`,

  electrolux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48" fill="currentColor">
    <g transform="translate(10, 8)">
      <path d="M16 4 L26 28 L6 28 Z" fill="none" stroke="currentColor" stroke-width="2.2"/>
      <circle cx="16" cy="18" r="4" fill="currentColor"/>
    </g>
    <text x="48" y="32" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="22" letter-spacing="1">Electrolux</text>
  </svg>`,

  aeg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="30" letter-spacing="4">AEG</text>
  </svg>`,

  arcelik: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="25" letter-spacing="1.5">arçelik</text>
  </svg>`,

  indesit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <g transform="translate(12, 10)">
      <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <path d="M14 6 v8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <text x="46" y="32" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="23" letter-spacing="1">INDESIT</text>
  </svg>`,

  hotpoint: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="24" letter-spacing="1">Hotpoint</text>
  </svg>`,

  midea: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="26" letter-spacing="1">Midea</text>
  </svg>`,

  tcl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="30" letter-spacing="3">TCL</text>
  </svg>`,

  siemens: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">SIEMENS</text>
  </svg>`,

  hitachi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">HITACHI</text>
  </svg>`,

  sharp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="27" letter-spacing="3">SHARP</text>
  </svg>`,

  whirlpool: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="24" letter-spacing="1">Whirlpool</text>
  </svg>`,

  vestel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">VESTEL</text>
  </svg>`,

  pozis: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">POZIS</text>
  </svg>`,

  biryusa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2">БИРЮСА</text>
  </svg>`,

  daewoo: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">DAEWOO</text>
  </svg>`,

  zanussi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">ZANUSSI</text>
  </svg>`,

  finlux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">FINLUX</text>
  </svg>`,

  goldmaster: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 190 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="23" letter-spacing="1">GoldMaster</text>
  </svg>`,

  hoffmann: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2">HOFFMANN</text>
  </svg>`,

  shivaki: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">SHIVAKI</text>
  </svg>`,

  skyworth: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="23" letter-spacing="2">SKYWORTH</text>
  </svg>`,

  tesla: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="4">TESLA</text>
  </svg>`,

  yoshiro: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">YOSHIRO</text>
  </svg>`,

  ardesto: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="24" letter-spacing="2">ARDESTO</text>
  </svg>`,

  eurolux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2">EUROLUX</text>
  </svg>`,

  hailang: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2">HAILANG</text>
  </svg>`,

  hayland: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2">HAYLAND</text>
  </svg>`,

  darkin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">DAIKIN</text>
  </svg>`,

  javel: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">JAVEL</text>
  </svg>`,

  konka: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">KONKA</text>
  </svg>`,

  konko: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">KONKA</text>
  </svg>`,

  lanova: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">LANOVA</text>
  </svg>`,

  mgi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="3">MGI</text>
  </svg>`,

  neos: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="27" letter-spacing="3">NEOS</text>
  </svg>`,

  regal: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">REGAL</text>
  </svg>`,

  rokos: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">ROKOS</text>
  </svg>`,

  silver: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">SILVER</text>
  </svg>`,

  talberg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="24" letter-spacing="2">TALBERG</text>
  </svg>`,

  vegas: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="3">VEGAS</text>
  </svg>`,

  winsor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">WINSOR</text>
  </svg>`,

  ficher: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">FICHER</text>
  </svg>`,

  everest: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="25" letter-spacing="2">EVEREST</text>
  </svg>`,

  arlant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="26" letter-spacing="2">ARLANT</text>
  </svg>`,

  es: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 48" fill="currentColor">
    <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle" font-family="'Outfit', 'Helvetica Neue', Arial, sans-serif" font-weight="900" font-size="28" letter-spacing="3">ES</text>
  </svg>`,
};

// Target directories
const targetDirs = [
  join(process.cwd(), 'site', 'public', 'media', 'brands'),
  join(process.cwd(), 'public', 'media', 'brands'),
];

for (const dir of targetDirs) {
  mkdirSync(dir, { recursive: true });
}

console.log('Generating Brand Logos...');
for (const [brandId, svgContent] of Object.entries(BRAND_SVGS)) {
  const fileName = `${brandId}-logo.svg`;
  for (const dir of targetDirs) {
    writeFileSync(join(dir, fileName), svgContent.trim());
  }
}

// Update databases
const dbs = [
  join(process.cwd(), 'site', 'data', 'catalog.sqlite'),
  join(process.cwd(), 'site', 'data', 'catalog-draft.sqlite'),
  join(process.cwd(), 'data', 'catalog.sqlite'),
  join(process.cwd(), 'data', 'catalog-draft.sqlite'),
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
console.log('All brand logos generated and registered successfully!');
