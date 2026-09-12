# Sahara Electronics — Rəsmi Veb Platforması (`site/`)

Bu qovluq Sahara Electronics rəsmi çoxbrendli e-ticarət və korporativ saytının müstəqil arxitekturasını təşkil edir.
Repository rootunda yerləşən məhsul kataloqundan tam izolyasiya edilmişdir.

## Quruluş
- `src/` — React frontend tətbiqi (səhifələr, dizayn tokenləri, komponentlər).
- `backend/` — Müstəqil Node.js API və SQLite bazası idarəetməsi.
- `data/` — Saytın özəl verilənlər bazaları (`catalog.sqlite`, `catalog-draft.sqlite`, media).
- `public/` — Production media və statik fayllar.
- `tests/` — Boundary, a11y, vahid və inteqrasiya testləri.
- `scripts/` — İnteqrasiya və sərhəd yoxlama skriptləri.
- `docs/` — Mərhələ 0 arxitektura, audit, ADR və təhlükəsizlik sənədləri.

## Başlatma
- DEV: `npm run dev` və ya rootdan `./startsaharasitedev.sh`
- PROD: `npm run build && npm start` və ya rootdan `./startsaharasite.sh`
- Test: `npm test`
