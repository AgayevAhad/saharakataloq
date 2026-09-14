# SAHARA ELECTRONICS — AI ÜÇÜN MƏRHƏLƏLİ İCRA PLANI

> Bu backlog `siteplan2.md`, `siteplan3.md` və `siteplan4.md` əsasında işlənməlidir. Mərhələlər sıra ilə icra olunur; qəbul qapısı keçmədən növbəti mərhələ başlanmır.

---

## 0. AI agent üçün dəyişməz icra protokolu

Hər iş sessiyasının əvvəlində:

1. `AGENTS.md`, `siteplan2.md`, `siteplan3.md`, `siteplan4.md`, bu sənəd və mövcud testləri tam oxu.
2. `git status`, branch və ignore qaydalarını yoxla. Branch `saharasitedev` deyilsə gündəlik dəyişiklik, commit və push etmə.
3. Public/draft SQLite, media və admin custom field-lərini backup etmədən migration/import işlətmə.
4. İstifadəçinin cari tapşırığının scope-unu yaz; başqa mərhələləri gizli şəkildə əlavə etmə.
5. Mövcud davranış üçün baseline test və lazım olduqda screenshot yarat.
6. Schema → API → admin → public → analytics → tests ardıcıllığında tam vertical slice qur.
7. Fake məhsul, təsdiqsiz iddia, qiymət, stok, ünvan və rəy yaratma.
8. Yeni/modified bütün şəkilləri `ShimmerImage`, bütün section/card-ları 1:1 skeleton ilə təmin et.
9. Mobil və desktop horizontal overflow testini keçir.
10. Test/build uğursuzdursa işi hazır elan etmə.

Hər sessiyanın sonunda hesabat:

- dəyişən fayllar və nəticə;
- migration/backup statusu;
- işlədilən testlər və nəticə;
- manual yoxlama cihazları;
- unresolved risk və növbəti təhlükəsiz addım;
- dəqiq modelə bağlanmayan media siyahısı;
- commit/push edilibsə yalnız `saharasitedev` branch və commit hash; `saharasitemain` üçün ayrıca istifadəçi təsdiqi.

---

## Mərhələ 0 — Discovery, qoruma və qərarlar

### Məqsəd

Mövcud kataloqu itirmədən real transformasiya bazası yaratmaq.

### İşlər

- bütün route, component, DB table, API, script və test inventory-si;
- cari Lighthouse/Web Vitals, bundle, API latency və accessibility baseline;
- desktop/mobile/tablet screenshot matrisi;
- SQLite public/draft backup + restore testi;
- bütün import/fix script-lərinin destructive/merge-safe auditi;
- `.gitignore` audit: private File/Foto/data/uploads/env;
- cari fake/unsupported claim və data completeness report;
- stakeholder qərarları: commerce tarixi, dillər, payment, ERP/POS, delivery, stores;
- ADR-001–009 sənədləri;
- threat model və data classification.

### Deliverables

- `docs/current-state-audit.md`;
- `docs/adr/*.md`;
- `docs/data-quality-report.md`;
- `docs/threat-model.md`;
- backup/restore runbook;
- ölçülən baseline report.

### Qəbul

- heç bir real data dəyişməyib;
- backup-dan ayrı temp mühitdə restore sübut edilib;
- bütün script-lər risk statusu alıb;
- product owner açıq qərarları təsdiqləyib.

---

## Mərhələ 1 — Repository, design token və quality foundation

### İşlər

- modular monolith folder sərhədləri;
- shared TypeScript contracts və runtime schemas;
- lint/format/typecheck/test/build CI;
- design tokens, responsive containers, z-index və motion scale;
- Button/Input/Dialog/Drawer/Tabs/Toast/Badge/Skeleton/ShimmerImage primitives;
- Storybook/Ladle və visual regression;
- centralized error boundary, network error/retry;
- passive/rAF scroll utilities və horizontal pill hook;
- accessibility test harness;
- feature flag sistemi.

### Qəbul

- 320, 390, 768, 1024, 1440, 1920 px-də body overflow yoxdur;
- light/dark/reduced-motion snapshots;
- bütün primitives keyboard və axe testindən keçir;
- cari katalog funksiyaları regression olmadan işləyir.

---

## Mərhələ 2 — PIM v2 və təhlükəsiz migration

### İşlər

- brand candidates, aliases, verification və source model;
- category tree + localized content;
- spec definitions + category templates + unit normalization;
- product family/variant/SKU/GTIN modeli;
- media rights/source/exact-match metadata;
- publication state machine və completeness scorer;
- optimistic concurrency və revisions;
- mövcud data üçün additive migration;
- PostgreSQL copy/verify tooling və rollback;
- admin PIM form-ları və bulk dry-run.

### Qəbul

- mövcud hər product/media/spec/crop/fit məlumatı field-level müqayisədə eynidir;
- migration iki dəfə işlədikdə dəyişiklik yaratmır;
- rollback test edilir;
- incomplete məhsul public edilmir;
- admin preview public DTO ilə eyni renderer istifadə edir.

---

## Mərhələ 3 — Brend reyestri və geniş taxonomy

### İşlər

- Baku Electronics/Kontakt/public directory-lərdən brand candidate siyahısı;
- canonicalization və duplicate review;
- official manufacturer source verification;
- logo rights workflow;
- brand landing template;
- çoxsəviyyəli electronics taxonomy;
- category-specific spec templates;
- admin tree editor, reorder, archive və impact preview.

### Qəbul

- candidate ad public deyil;
- verification source olmayan brand publish edilmir;
- məhsulsuz brand default olaraq route/sitemap-a düşmür;
- category silmək əvəzinə archive və dependency check;
- brend və kateqoriya dəyişiklikləri audit olunur.

---

## Mərhələ 4 — Storefront shell və dünya səviyyəli naviqasiya

### İşlər

- SSR/ISR app shell;
- desktop service bar + sticky header + mega-menu;
- mobile header + bottom nav + drawers;
- locale/store selector;
- breadcrumbs;
- dynamic footer;
- CMS-managed navigation;
- exact skeleton header/home sections;
- scroll compact behavior və selected pill auto-center.

### Qəbul

- sticky header jump yaratmır və z-index modallarla toqquşmur;
- mega-menu mouse, touch, keyboard ilə işləyir;
- route change focus management düzgündür;
- 60/120fps scroll profilində long task yoxdur;
- CLS ≤ 0.10 lab və field instrumentation hazırdır.

---

## Mərhələ 5 — Smart search v2

### İşlər

- search engine adapter və incremental index job;
- Azərbaycan normalization, aliases, model exact match;
- desktop multi-column və mobile full-screen overlay;
- highlighted 8–9 desktop / 5 mobile suggestion;
- popular/featured real product cards;
- category pills, history, typo suggestion;
- no-result analytics və admin query simulator;
- synonyms, redirects və guarded boosts;
- search skeleton/error/offline state.

### Qəbul

- bütün aktiv brendlər dinamik indexdə;
- exact SKU həmişə ilk nəticə;
- unpublished/out-of-scope məhsul çıxmır;
- typing p95 response və UI latency büdcəyə uyğundur;
- keyboard arrows/enter/escape və screen reader announcement testlidir.

---

## Mərhələ 6 — PLP, filter və məhsul kartı v2

### İşlər

- category route, facets və shareable URL;
- desktop/mobile filters;
- sort, compare, favorite, grid/list;
- variant-aware product card;
- price/contact mode, installment, stock/store;
- primary video motion preview və badge;
- 1:1 skeleton;
- SEO pagination/canonical;
- empty/error/retry.

### Qəbul

- filter nəticəsi API, URL, back/forward və refresh-də eynidir;
- selected pill smooth auto-center;
- card video muted/loop/playsInline və viewport-aware;
- no horizontal overflow;
- 1000+ nəticədə interaction büdcəsi pozulmur.

---

## Mərhələ 7 — PDP, variant, compare və Sahara Match

### İşlər

- media gallery/video/audio/fullscreen;
- variant selector və URL synchronization;
- specs, documents, energy, warranty;
- store availability, delivery/install block;
- contact/cart sticky CTA;
- compare engine və difference mode;
- category measurement assistant;
- Sahara Match questionnaire/rule engine;
- compatible accessories/bundles;
- Product/ProductGroup/VideoObject schema.

### Qəbul

- hər media/tab/variant interaktiv testdə dəyişir;
- parent `useEffect` istifadəçi tab state-ini vaxtından əvvəl reset etmir;
- video default səssiz, işlək audio toggle var;
- compare vahidləri normallaşdırır;
- variant stock/price yanlış məhsula keçmir;
- no fake recommendation: rule və səbəb adminə görünür.

---

## Mərhələ 8 — Mağaza, stok, rezervasiya və delivery

### İşlər

- multiple store CRUD + hours exceptions;
- store locator, map consent və LocalBusiness schema;
- ERP/POS inventory adapter;
- available-to-sell hesabı və sync health;
- pickup reservation TTL;
- delivery zone/slot və installation capability;
- notification və expiration job;
- admin manual override permission + audit.

### Qəbul

- eyni variant üçün oversell race test edilir;
- stale stock UI-də timestamp/status ilə görünür;
- rezervasiya idempotentdir;
- limitsiz ünvan bütün admin/public/API testlərindən keçir;
- xəritə işləməsə ünvan və əlaqə itmir.

---

## Mərhələ 9 — CMS, kampaniya və buying guides

### İşlər

- block-based page builder, revisions və schedule;
- multi-brand hero/technology rotation;
- campaign rules + landing;
- guide/article/FAQ və related products;
- navigation builder;
- translation workflow;
- SEO/schema preview;
- broken-link/media checker.

### Qəbul

- yeni brend/texnologiya hardcode olmadan spotlight-a qoşulur;
- schedule timezone-aware `Asia/Baku` işləyir;
- expired campaign CTA avtomatik deaktivdir;
- unsupported marketing claim reviewer approval olmadan public deyil;
- page revision rollback olunur.

---

## Mərhələ 10 — Kontakt, lead, konsultasiya və Sahara Care

### İşlər

- contextual WhatsApp/zəng/callback;
- store/department routing və iş saatı fallback;
- appointment calendar;
- corporate lead;
- warranty registration;
- service request + media + status timeline;
- secure tracking link;
- SLA dashboard və notification;
- consent/retention.

### Qəbul

- contact analytics product/store/context üzrə aggregate görünür;
- nömrə və ünvan admin-public sinxron;
- PII analytics-ə düşmür;
- tracking token enumeration-a davamlıdır;
- service attachment təhlükəsiz scan olunur.

---

## Mərhələ 11 — Favorit, hesab və bildiriş

### İşlər

- guest favorite/compare persistence;
- OTP auth və account security;
- guest→account merge;
- addresses/orders/warranties/service screens;
- back-in-stock və price notification;
- communication preference center;
- data export/delete request.

### Qəbul

- login merge duplicate yaratmır;
- OTP brute-force/rate-limit/account enumeration testlidir;
- unsubscribe kanal üzrə işləyir;
- account route-ları authz testindən keçir.

---

## Mərhələ 12 — Qiymət, kampaniya, səbət və checkout

### Ön şərt

Payment, taksit, vergi/qaimə, qaytarma, delivery və ERP contract-ları təsdiqlənmədən başlanmır.

### İşlər

- price service/history/contact mode;
- promotion rule engine;
- cart and cart merge;
- checkout validation;
- delivery/pickup/install services;
- payment provider adapter/webhook/refund;
- order management və status timeline;
- transactional notification;
- fraud/rate/idempotency controls.

### Qəbul

- client qiymətinə etibar edilmir;
- parallel stock/order/payment race testləri;
- duplicate webhook/order yaranmır;
- payment failure recovery;
- kart məlumatı log/DB/analytics-də yoxdur;
- checkout accessibility və mobile E2E tam keçir.

---

## Mərhələ 13 — Reviews, Q&A, loyalty və trade-in

Commerce sabitləşəndən sonra:

- verified-purchase review + moderation;
- Q&A və expert answer;
- review fraud/spam controls;
- loyalty ledger, expiry, correction audit;
- trade-in estimate → inspection → final offer workflow;
- recycling/service partnership content.

Bu mərhələ real əməliyyat komandası və hüquqi qaydalar olmadan UI demo kimi public edilməməlidir.

---

## Mərhələ 14 — Launch hardening

### Test matrisi

- unit: domain rules, normalization, money, stock;
- component: bütün state və event;
- integration: DB, search, queue, provider adapters;
- contract: OpenAPI consumer/provider;
- E2E: search→PDP→contact/cart→order; admin draft→preview→publish→rollback;
- visual: light/dark, AZ/RU/EN, breakpoints;
- accessibility: axe + keyboard + screen reader smoke;
- performance: Lighthouse CI + WebPageTest + RUM;
- load: search, PLP, reservation, checkout, webhook;
- security: SAST, dependency, secrets, DAST, ASVS checklist;
- migration: production-like copy, rollback, restore;
- resilience: provider timeout, queue retry, stale stock, CDN failure.

### Launch gate

- Sev-1/Sev-2 bug yoxdur;
- accessibility critical/serious yoxdur;
- Core Web Vitals budget keçir;
- privacy/legal mətn təsdiqlidir;
- backup restore sübutludur;
- monitoring/alert/on-call var;
- rollback rehearsed;
- content completeness qəbul həddindədir;
- admin/support/warehouse komandası təlim alıb;
- əvvəlcə internal → 5% → 25% → 100% mərhələli release.

---

## Prioritet xəritəsi

### P0 — əvvəl edilməli

Mərhələ 0–7: data təhlükəsizliyi, arxitektura, design system, brand/taxonomy, navigation, search, PLP, PDP, compare.

### P1 — real üstünlük yaradan

Mərhələ 8–10: mağaza stoku, rezervasiya, delivery/install, CMS/guides, konsultasiya və Sahara Care.

### P2 — commerce

Mərhələ 11–12: account, notifications, price, promotion, cart, checkout, payment, order.

### P3 — retention

Mərhələ 13: reviews, loyalty, trade-in.

P0 tamamlanmadan P2-yə tələsmək qadağandır; gözəl checkout səhv məhsul datasını və stok problemini həll etmir.

---

## Hər ticket üçün şablon

```md
# [ID] Ticket adı
## Problem / istifadəçi dəyəri
## Scope / out of scope
## Mövcud davranış və sübut
## UX states və breakpoint-lər
## Data/schema migration
## API contract
## Admin support + preview
## Public implementation
## Analytics/audit
## Accessibility
## Performance budget
## Security/privacy
## Automated tests
## Manual verification
## Rollback
## Acceptance criteria
```

Ticket bu bölmələrdən uyğun olanlarını doldurmadan implementasiyaya keçməməlidir.
