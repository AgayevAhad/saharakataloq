# SAHARA ELECTRONICS — TEXNİKİ ARXİTEKTURA VƏ DATA KONTRAKTI

> Bu sənəd `siteplan2.md` master-planının texniki icra kontraktıdır. AI agent `AGENTS.md`, `siteplan3.md` qaydaları və bu faylı oxumadan schema, API və ya admin dəyişməməlidir.

---

## 1. Cari sistemdən hədəf sistemə keçid

Cari layihədə React/Vite storefront, Node HTTP serveri, public/draft SQLite bazaları, admin panel, media, analitika, snapshot, multiple address, video, image positioning, skeleton/shimmer və multi-brand search üçün baza mövcuddur. Bunlar birdəfəlik rewrite ilə atılmır.

### 1.1 Tövsiyə olunan hədəf: modular monolith

```text
apps/
├── storefront/       SSR/ISR public sayt
├── admin/            qorunan idarəetmə tətbiqi
├── api/              modul API + webhook + worker entry
└── worker/           media, search, notification, import job-ları
packages/
├── ui/               design system və accessibility primitives
├── contracts/        schema, DTO və event kontraktları
├── database/         migrations, repository və seed olmayan fixtures
├── catalog-domain/   product/category/brand/spec qaydaları
├── commerce-domain/  price/cart/order/payment qaydaları
├── content-domain/   CMS/SEO/navigation
├── observability/    logger/metrics/tracing
└── testing/          fixtures, factories, test helpers
```

Tövsiyə:

- storefront: SEO üçün SSR/ISR dəstəyi olan React framework;
- admin: mövcud React komponentlərinin mərhələli daşınması;
- API: typed schema validation-lı Node framework və OpenAPI;
- primary DB: PostgreSQL;
- cache/session/rate limit: Redis;
- search: Azərbaycan dili, synonym və facet dəstəyi yoxlanmış ayrıca engine;
- media: S3-compatible object storage + CDN;
- queue: Redis-backed job queue;
- email/SMS/WhatsApp/payment/map: provider adapter-ləri.

Framework və vendor adları ADR nəticəsində kilidlənməlidir. İlk mərhələdə microservice yoxdur; modul sərhədləri kod daxilində qorunur.

### 1.2 Strangler migration

1. Mövcud test baseline-i dondur.
2. SQLite bazalarının checksum-lu backup-ını yarat və restore test et.
3. Domain kontraktlarını cari datanın üstünə əlavə et.
4. PostgreSQL-ə copy + verify migration hazırla; source bazanı silmə.
5. Read path-i feature flag ilə yeni API-yə keçir.
6. Admin write path-i dual-write etmə; qısa maintenance window-da atomik cutover et.
7. Rollback zamanı köhnə sistem read-only işləyə bilsin.

---

## 2. Domain modulları

### 2.1 Identity & access

- admin users, roles, permissions, sessions, MFA, recovery;
- customers, OTP identities, devices, consent;
- service-to-service credentials;
- audit event-ləri.

### 2.2 Catalog/PIM

- brands, category tree, spec definitions/templates;
- product family, product variant, SKU/GTIN;
- localized copy;
- media və document;
- compatibility və bundles;
- content completeness və publication workflow.

### 2.3 Pricing & promotion

- channel/store/currency üzrə qiymət;
- price history;
- campaign, coupon, bundle discount;
- installment plan və hüquqi disclosure;
- “contact for price” mode.

### 2.4 Inventory & fulfillment

- stores/warehouses;
- on-hand, reserved, available-to-sell;
- reservation TTL;
- delivery zone, slot, installation capability;
- pickup və shipment.

### 2.5 Commerce

- cart, checkout, order, line item snapshots;
- payment intents, webhook, refund;
- order status timeline;
- invoice/receipt reference.

### 2.6 Service & CRM

- leads, callbacks, consultation appointments;
- warranty registrations;
- repair/service request, attachments, status timeline;
- corporate quotes.

### 2.7 CMS & discovery

- page, reusable section, hero, campaign landing;
- buying guide, technology article, FAQ;
- menu/navigation;
- redirects, SEO metadata, search synonyms/boosts.

### 2.8 Analytics

- consent-aware behavioral events;
- aggregate funnel;
- search quality;
- contact/order/service conversion;
- admin audit analytics-dən ayrı saxlanılır.

---

## 3. Əsas data modeli

### 3.1 Catalog

```text
brands
  id UUID, canonical_name, slug, official_url, origin_country_id,
  logo_media_id, verification_status, active, created_at, updated_at

brand_aliases
  id, brand_id, alias, normalized_alias, locale

brand_sources
  id, brand_id/candidate_id, source_url, source_type,
  observed_name, checked_at, rights_note, verification_status

categories
  id, parent_id, slug, sort_order, active

category_translations
  category_id, locale, name, description, seo_title, seo_description

spec_definitions
  id, key, data_type, unit_family, filterable, comparable, required, sort_order

category_spec_templates
  category_id, spec_definition_id, group_name, required, filterable, sort_order

products
  id, brand_id, category_id, family_code, publication_status,
  featured, source_id, verified_at, created_at, updated_at, version

product_translations
  product_id, locale, title, short_description, description, seo fields

product_variants
  id, product_id, sku, model_code, gtin, mpn, color_id,
  warranty_months, manufacturing_country_id, status, created_at, updated_at

product_spec_values
  variant_id, spec_definition_id, value_text/value_number/value_boolean,
  unit_id, source_id, verified_at

media_assets
  id, storage_key, kind, mime, width, height, duration,
  checksum, original_name, rights_status, source_url, processing_status

product_media
  variant_id, media_id, sort_order, role, alt_text,
  object_position, fit_mode, exact_match_key

documents
  id, variant_id, type, locale, media_id, version
```

`product_variants` olmadan rəng/yaddaş/ölçü fərqlərini ayrıca məhsul kimi çoxaltmaq qadağandır. Model variantı həqiqətən ayrıca SKU-dursa variant olur.

### 3.2 Qiymət və kampaniya

```text
prices
  id, variant_id, store_id nullable, channel, currency,
  amount, compare_at_amount nullable, valid_from, valid_to, status

price_history
  id, price_id, amount, reason, actor_id, effective_at

installment_plans
  id, provider_id, months, monthly_amount, total_amount,
  annual_rate, fees, disclosure, valid_from, valid_to

promotions
  id, type, name, rules_json, benefit_json, priority,
  stackable, start_at, end_at, status
```

Qiymət `NULL` ola bilər. `0` qiymət kimi istifadə edilmir. Product snapshot sifarişə daxil edilərək sonrakı dəyişiklikdən qorunur.

### 3.3 Mağaza və stok

```text
stores
  id, slug, title, address, city, district, latitude, longitude,
  phones, email, regular_hours, exception_hours, services, active

warehouses
  id, store_id nullable, title, fulfillment_capabilities

inventory_levels
  variant_id, warehouse_id, on_hand, reserved, safety_stock,
  available_to_sell, updated_at, source_version

reservations
  id, variant_id, store_id, customer/contact, quantity,
  expires_at, status, idempotency_key

delivery_zones / delivery_slots / service_capabilities
```

Birdən çox ünvan həm DB, həm admin, həm storefront, həm structured data-da tam dəstəklənir.

### 3.4 Customer, order və service

```text
customers / customer_identities / customer_addresses / consents
carts / cart_items
orders / order_items / order_status_events
payment_intents / payment_events / refunds
shipments / pickup_allocations
warranty_registrations
service_requests / service_status_events / service_attachments
leads / consultation_appointments / corporate_quotes
reviews / review_media / review_moderation_events
```

PII ilə analytics event eyni cədvəldə saxlanılmır. Public tracking token-ləri yüksək entropiyalı, expiring və rate-limited olmalıdır.

### 3.5 CMS və governance

```text
pages / page_revisions / page_sections
navigation_menus / navigation_items
campaigns / campaign_sections
technology_articles / buying_guides / faq_items
seo_redirects / search_synonyms / search_boost_rules
publication_jobs
audit_logs / catalog_snapshots / import_jobs / import_job_rows
```

---

## 4. Status və publication state machine

Catalog/CMS obyektləri:

```text
draft → in_review → approved → scheduled → published → archived
             ↘ rejected → draft
```

Qaydalar:

- editor draft yaradır;
- reviewer öz dəyişiklik paketini təkbaşına təsdiq edə bilməz (komanda ölçüsü imkan verirsə four-eyes);
- publish preflight data completeness, broken media, SEO, stok/qiymət və hüquq statusunu yoxlayır;
- scheduled publish DB job-dur, browser timer deyil;
- hər publish immutable revision və diff yaradır;
- rollback köhnə revision-u yeni revision kimi publish edir; tarix silinmir.

---

## 5. API kontraktı

### 5.1 Prinsiplər

- `/api/v1` versioning;
- OpenAPI source of truth və generated TypeScript client;
- input/output runtime schema validation;
- cursor pagination admin/event API-lərində, SEO PLP-də page pagination;
- idempotency key: checkout, payment, reservation, import, webhook;
- ETag/If-Match optimistic concurrency admin edit-də;
- Problem Details formatında səhv;
- request/trace ID;
- locale/currency explicit;
- public DTO heç vaxt internal cost, supplier, margin və private source göstərmir.

### 5.2 Public endpoint qrupları

```text
GET  /api/v1/navigation
GET  /api/v1/home
GET  /api/v1/categories/:slug
GET  /api/v1/products
GET  /api/v1/products/:slug
GET  /api/v1/brands/:slug
POST /api/v1/search
POST /api/v1/compare/resolve
GET  /api/v1/stores
GET  /api/v1/stores/:slug/availability
POST /api/v1/reservations
POST /api/v1/contact-events
POST /api/v1/leads/callback
POST /api/v1/consultations
GET  /api/v1/pages/:slug
GET  /api/v1/guides/:slug
```

Commerce flag açıldıqda:

```text
GET/PUT /api/v1/cart
POST    /api/v1/checkout/validate
POST    /api/v1/orders
POST    /api/v1/payments/intents
POST    /api/v1/webhooks/payments/:provider
GET     /api/v1/order-tracking/:token
```

### 5.3 Admin endpoint qrupları

Catalog, variants, category tree, spec templates, brands, media, price, promotion, inventory, stores, orders, services, CMS, SEO, search merchandising, users/roles, audit, snapshots və imports üçün ayrı controller/service/repository modulları.

Bulk mutation endpoint-i:

- dry-run;
- validation report;
- explicit confirm token;
- transaction;
- immutable audit;
- rollback snapshot tələb edir.

---

## 6. Admin-public sinxronizasiya matrisi

| Public funksiya | Admin nəzarəti | Preview | Audit/analytics |
|---|---|---|---|
| Header/menu | menu builder, sıra, dil, feature flag | desktop/mobile | publish diff |
| Ana səhifə blokları | block CMS, schedule, targeting | breakpoint preview | impression/click |
| Brend | verification, logo rights, aliases, content | brand page | source + revision |
| Kateqoriya | tree, slug, spec template, facets | PLP | taxonomy diff |
| Məhsul/variant | bütün field-lər, completeness | PDP/PLP | field diff |
| Şəkil/video | upload, exact match, reorder, crop, poster, primary | gallery/card | media audit |
| Qiymət/taksit | channel/store/date/status | card/PDP/checkout | price history |
| Stok | store/warehouse sync, manual override permission | availability | sync health |
| Kampaniya | rule builder, dates, legal note | landing/cart | conversion |
| Search | synonyms, redirects, boosts | query simulator | no-result/CTR |
| Müqayisə | comparable spec template | compare preview | compare events |
| Mağazalar | limitsiz ünvan, saat, xidmət, xəritə | store page | edit log |
| Support | FAQ/form routing/SLA | form preview | funnel/SLA |
| Kontakt CTA | nömrə/channel/saat/label | PDP/card | WhatsApp/call |
| SEO | metadata, canonical, schema preview | SERP/schema | validation |
| Dil | translation status | locale preview | completeness |

Bu matrisi pozan “yalnız frontend” və ya “yalnız DB field” işi tamamlanmış sayılmır.

---

## 7. Search arxitekturası

Index document:

- product, variant, SKU, model, GTIN;
- brand canonical + aliases;
- category path;
- localized title/description;
- normalized spec values;
- price range, stock/store availability;
- popularity, freshness, featured;
- publication and rights status.

Normalization:

- Unicode NFKC;
- Azərbaycan `ə/ı/ğ/ş/ç/ö/ü` və klaviatura variasiyaları;
- Cyrillic/Latin aliases yalnız curated dictionary;
- model kodunda boşluq, `/`, `-` və case normalization;
- brand alias və typo dictionary;
- unit normalization.

Ranking ilkin qaydası:

1. exact SKU/model;
2. exact brand + model;
3. title prefix/token match;
4. category/brand exact;
5. spec/synonym;
6. popularity/availability/freshness kiçik boost.

Admin boost exact relevance-i boğmamalıdır. Sponsored/boosted nəticə şəffaf işarələnməlidir.

---

## 8. Media pipeline

1. Upload quarantine.
2. MIME + magic byte + ölçü + malware yoxlaması.
3. SHA-256 duplicate detection.
4. Original immutable storage.
5. Image metadata strip və orientation normalize.
6. AVIF/WebP/JPEG responsive derivatives; blur placeholder.
7. Video transcode profilləri, poster, duration, optional captions.
8. Exact filename/model match report.
9. Admin human approval.
10. CDN publish və cache invalidation.

Modelə 1:1 uyğunluğu olmayan media avtomatik attach edilmir. Crop/objectPosition/fitMode hər derivative generation və migration-da qorunur.

---

## 9. Rol və icazələr

Minimum rollar:

- `super_admin` — təhlükəsizlik, role, provider, publish;
- `catalog_manager` — catalog və taxonomy;
- `content_editor` — CMS və lokalizasiya;
- `reviewer/publisher` — review və publish;
- `inventory_manager` — mağaza/stok;
- `pricing_manager` — price/promotion;
- `order_operator` — order/fulfillment;
- `service_agent` — warranty/service;
- `analyst` — yalnız aggregate read;
- `auditor` — audit və revision read.

Permission resource + action + scope (store/brand) əsasında yoxlanır. UI-də düyməni gizlətmək authorization deyil; server hər əməliyyatı yoxlayır.

---

## 10. Observability və event kontraktı

Event nümunələri:

```text
page_view, search_submitted, search_no_result, suggestion_clicked,
filter_applied, product_viewed, media_played, compare_added,
favorite_added, store_checked, reservation_started,
contact_whatsapp, contact_call, callback_requested,
add_to_cart, checkout_started, payment_succeeded,
order_completed, service_request_created
```

Hər event-də `event_id`, `occurred_at`, `anonymous_session_id`, `consent_state`, `locale`, `page/context`, optional product/variant/store ID. Telefon, email, tam ünvan və axtarışda təsadüfi PII analytics payload-a yazılmır.

Texniki telemetry:

- structured JSON logs;
- trace ID API/queue/provider boyunca;
- latency/error/saturation metrics;
- search index lag, inventory sync lag, failed webhook, dead-letter alert;
- Web Vitals real-user monitoring.

---

## 11. Migration və import təhlükəsizlik kontraktı

Hər import:

1. source fingerprint yaradır;
2. staging cədvəlinə yazır;
3. exact key ilə match edir;
4. `create/update/conflict/skip/unassigned` dry-run report verir;
5. admin custom field-ləri və media positioning-i toxunulmaz saxlayır;
6. yalnız təsdiqlənmiş field ownership üzrə merge edir;
7. transaction + snapshot ilə apply olur;
8. row-level audit saxlayır;
9. eyni fayl ikinci dəfə işlədikdə idempotent olur;
10. public və draft bazanı static seed ilə əvəz etmir.

`scripts/import*`, `fix*`, `update*` faylları bu kontrakta uyğun audit olunmadan production bazasında işə salınmamalıdır.

---

## 12. Repository və CI qaydaları

- gündəlik iş, commit və push yalnız `saharasitedev`; `saharasitemain` yalnız explicit user release təsdiqi ilə;
- conventional atomic commits, migration və test eyni commit-də;
- `Foto/`, `File/`, `data/*.sqlite*`, uploads, `.env`, dumps Git ignore;
- yalnız optimallaşdırılmış hüquqlu asset `public/media/` və ya object storage;
- protected branch, required review, signed release tag tövsiyə olunur;
- CI: lint → typecheck → unit/component → API/DB → E2E → a11y → visual → build → security scan;
- production deploy manual approval + backup + migration preflight;
- migration rollback yoxdursa deploy yoxdur.
