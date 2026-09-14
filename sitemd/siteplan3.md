# SAHARA ELECTRONICS SAYTI — MƏCBURİ İNKİŞAF QAYDALARI

> Status: bütün insan və AI developer-lər üçün məcburi  
> Scope: Sahara-nın kataloqdan tam sayta keçən bütün frontend, backend, admin, database, media, infra və sənədləşmə işləri  
> Prioritet: bu qaydalar `siteplan2.md`, `siteplan4.md` və `siteplan5.md` icra edilərkən dəyişməz keyfiyyət qapısıdır.

---

## 1. Branch izolyasiyası — ən kritik qayda

Sahara **saytı** üçün icazəli iki branch var:

- `saharasitedev` — bütün gündəlik inkişaf, test, commit və push;
- `saharasitemain` — yalnız stabil release və yalnız istifadəçinin açıq təsdiqindən sonra.

Məcburi davranış:

1. Hər işdən əvvəl `git branch --show-current` və `git status --short` yoxlanılır.
2. Yeni sayt kodu, migration, asset, test və sənəd yalnız `saharasitedev` daxilində hazırlanır.
3. `saharasitedev` xaricində gündəlik commit və push qadağandır.
4. `saharasitemain`-ə birbaşa commit/push/merge yalnız istifadəçi konkret həmin release üçün açıq icazə verdikdə mümkündür.
5. `main`, `dev`, kataloqa aid branch-lar və istənilən başqa branch-a sayt dəyişikliyi commit və ya push edilmir.
6. Başqa branch-a merge, rebase, cherry-pick, force-push və branch silmə istifadəçinin ayrıca icazəsi olmadan edilmir.
7. Branch səhvdirsə agent fayl dəyişməyə başlamazdan əvvəl dayanır və vəziyyəti bildirir.
8. İstifadəçinin mövcud uncommitted dəyişiklikləri heç vaxt reset, checkout, clean və ya overwrite edilmir.
9. Commit/push istifadəçi tərəfindən istənilməyibsə avtomatik edilmir; istənildikdə belə yalnız yuxarıdakı branch siyasəti tətbiq olunur.

Release axını:

```text
feature işi → saharasitedev → test/build/security gate
             → istifadəçi təsdiqi → saharasitemain release
```

---

## 2. Mənbə və media məxfiliyi

1. `Foto/`, `File/`, `Logo/`, `Video/`, raw spreadsheet, source dump, `.env`, SQLite bazaları, uploads və backup GitHub-a düşmür.
2. Bu yollar `.gitignore` və CI secret/file scan ilə qorunur.
3. Yalnız istehsal üçün optimallaşdırılmış və istifadə hüququ təsdiqlənmiş asset `public/media/` və ya object storage-a çıxır.
4. Rəqib saytların şəkli, mətni, qiyməti, rəyi və kampaniya materialı kopyalanmır.
5. Brand logo yalnız rəsmi media kit, istehsalçı/distribütor icazəsi və ya Sahara-nın öz asset-i ilə istifadə edilir.
6. Şəxsi məlumat, kontragent, maya dəyəri və daxili sənədlər public bundle/API/log-a düşmür.

---

## 3. Mövcud məlumatların qorunması

1. `data/catalog.sqlite` və `data/catalog-draft.sqlite` user customization-ları müqəddəsdir.
2. Static seed ilə bazanı yenidən qurmaq, cədvəli silib yaratmaq və ya bütün məhsulları replace etmək qadağandır.
3. Migration additive, idempotent, transaction-lı, backup-lı və rollback-lı olmalıdır.
4. Import əvvəl dry-run report verir; sonra admin təsdiqi ilə merge edilir.
5. Import field ownership qaydasına tabedir: mənbə yalnız ona məxsus field-i yeniləyir.
6. `objectPosition`, `imagePosition`, `fitMode`, media sırası, edited specs, description, custom price və admin qeydləri həmişə qorunur.
7. Production data üzərində script işlətməzdən əvvəl temp copy-də eyni əməliyyat və diff yoxlanılır.
8. Backup yaradılması kifayət deyil; restore testi də keçməlidir.

---

## 4. Həqiqi data və brend verification

1. Fake məhsul, xüsusiyyət, qiymət, stok, endirim, ünvan, zəmanət, servis iddiası və rəy public edilmir.
2. Rəqib brand directory-ləri yalnız candidate discovery üçündür.
3. Brend `candidate → verified → content_ready → published` axınından keçir.
4. Canonical ad, alias, rəsmi URL, logo hüququ və source yoxlanmadan brend aktiv edilmir.
5. Məhsulu olmayan brend default olaraq public/sitemap/search-də görünmür; “tezliklə” səhifəsi ayrıca admin qərarı ilə `noindex` olur.
6. Model/SKU/GTIN distribütor və ya rəsmi istehsalçı mənbəsi ilə tutuşdurulur.
7. Marketing claim ölçülə bilən source olmadan yazılmır; “ən yaxşı”, “100%”, “40%-dək” kimi iddialar sübut və hüquqi review tələb edir.
8. İstehsal ölkəsi brand mənşəyi ilə qarışdırılmır və variant səviyyəsində saxlanılır.

---

## 5. Exact media matching

1. Media yalnız filename/model arasında dəqiq 1:1 uyğunluq olduqda avtomatik bağlanır.
2. Inox/Black/White, ölçü və series variantları arasında fuzzy/category-wide təxmin qadağandır.
3. Ambiguous media unattached qalır və admin review queue-ya düşür.
4. Hesabatda məcburi mətn istifadə edilir: **“Bu faylları dəqiq model adında tapmadığım üçün heç bir modelə bağlamadım: […]”**
5. Video upload, poster, sıra, primary cover, mute/unmute, captions və silmə həm admin, həm public axında tam dəstəklənir.
6. Original media immutable saxlanır; derivative-lər yenidən yaradıla bilər.

---

## 6. Admin-public tam sinxronizasiya

1. Yeni public field/funksiya admin CRUD, validation, permission, preview, audit və rollback olmadan tamamlanmış sayılmır.
2. Admin dəyişiklikləri əvvəl draft-a yazılır; public yalnız ayrıca publish əməliyyatı ilə dəyişir.
3. Preview public renderer və eyni DTO-dan istifadə edir.
4. Publish data completeness və broken media preflight-dan keçir.
5. Hər publish immutable revision/snapshot yaradır.
6. Brand, category, product, variant, media, price, stock, address, campaign, content, search və settings hamısı audit edilir.
7. Admin UI light/dark mode-da kontrastlı, responsive və keyboard accessible olmalıdır.
8. Permission serverdə yoxlanır; düyməni UI-dən gizlətmək authorization hesab edilmir.

---

## 7. Birdən çox mağaza və ünvan

1. Ünvan tək string kimi hardcode edilmir.
2. Limitsiz mağaza/showroom: ad, ünvan, telefonlar, koordinat, normal və xüsusi iş saatları, xidmətlər, şəkillər, aktivlik.
3. Bütün ünvanlar admin, API, storefront, footer/contact, store locator və LocalBusiness structured data-da sinxron olur.
4. Xəritə provider-i işləmədikdə mətn ünvanı və telefon əlçatan qalır.
5. Geolocation yalnız istifadəçi icazəsi ilə işləyir.

---

## 8. Multi-brand davranış

1. Search, suggestion, hero, technology spotlight, categories, recommendations və analytics bütün aktiv brendlərdən dinamik formalaşır.
2. ARDO/Samsung/Lotus və ya başqa brend adını business logic-də hardcode etmək qadağandır; yalnız migration mapping və təsdiqlənmiş brand theme istisnadır.
3. Yeni brend admin vasitəsilə əlavə ediləndə kod deploy etmədən əsas komponentlərdə işləməlidir.
4. Brand accent Sahara-nın əsas vizual kimliyini əvəz etmir.
5. Technology spotlight yalnız həmin texnologiyaya real bağlı məhsulları göstərir.

---

## 9. Smart search

1. Bütün active/published brand, product, variant, category, alias və spec-lər indekslənir.
2. Exact model/SKU nəticəsi ranking-də birincidir.
3. Azərbaycan hərfləri, klaviatura variasiyası, defis/boşluq və curated transliterasiya dəstəklənir.
4. Desktop: 8–9 highlighted suggestion, real məhsul kartları və quick category pill-ləri.
5. Mobile: maksimum 5 suggestion və yığcam real məhsul nəticəsi.
6. Fake/popular adı altında hardcode məhsul göstərilmir; popularity real event-dən gəlir.
7. Nəticəsiz axtarış adminə aggregate analytics kimi düşür.
8. Search input keyboard, screen reader və composition event-lərlə işləyir.

---

## 10. UX/UI və responsive keyfiyyət

1. Desktop, laptop, tablet və telefon ayrıca qəbul edilir.
2. `html`, `body`, app shell, modal və drawer-larda horizontal body scrollbar qadağandır.
3. Minimum touch target 44×44 CSS px.
4. Sticky desktop header proper z-index/backdrop blur ilə scroll zamanı qalır və CLS yaratmır.
5. Scroll listener passive və `requestAnimationFrame` ilə throttled olur; scroll zamanı təkrarlanan layout measurement qadağandır.
6. Anchor və scroll-to-top `behavior: 'smooth'` istifadə edir; instant teleport override edilmir.
7. Horizontal pill/chip/media sıraları touch swipe və desktop grab-scroll dəstəkləyir.
8. Aktiv pill seçiləndə smooth şəkildə mərkəzlənir və kənardan kəsilmir.
9. Modal/drawer focus trap, Escape, backdrop, focus restore və body scroll lock düzgün işləyir.
10. Modal tab state-i parent prop synchronization tərəfindən vaxtından əvvəl reset edilmir.
11. Dekorativ motion `prefers-reduced-motion` zamanı söndürülür.
12. UI competitor clone deyil; Sahara design token və component system-dən gəlir.

---

## 11. Skeleton, shimmer və şəkillər

1. Yeni və dəyişən section, search, product grid/card, brand card, banner və modal üçün 1:1 skeleton məcburidir.
2. Skeleton real layout-un sütun, padding, media, mətn və CTA hündürlüyünü eynilə saxlayır.
3. Bütün render olunan şəkillər centralized `ShimmerImage` istifadə edir.
4. Download/decode zamanı shimmer + incə spinner; load zamanı smooth opacity; error zamanı ölçünü pozmayan branded fallback.
5. Responsive `srcset/sizes`, AVIF/WebP, lazy loading və LCP priority düzgün seçilir.
6. Video viewport xaricində lazımsız decode/autoplay etmir.
7. Skeleton light/dark mode və reduced motion-da test edilir.

---

## 12. Accessibility

1. Minimum standart WCAG 2.2 AA-dır.
2. Semantik HTML, landmark, heading ağacı, skip link və visible focus məcburidir.
3. Rəng tək status daşıyıcısı deyil; kontrast AA həddindən aşağı düşmür.
4. Bütün action keyboard-la icra edilir.
5. Dialog, tabs, combobox, mega-menu, gallery və compare uyğun ARIA pattern istifadə edir.
6. 200% zoom və 320 CSS px reflow zamanı content/action itmir.
7. Video captions/transcript, şəkil alt text workflow-u olur.
8. Automated axe test manual keyboard/screen-reader testini əvəz etmir.

---

## 13. Performans

Field p75 büdcəsi:

- LCP ≤ 2.5 s;
- INP ≤ 200 ms;
- CLS ≤ 0.10;
- route-level code splitting;
- cached TTFB hədəfi ≤ 800 ms;
- ilkin JS gzip hədəfi ≤ 180 KB.

Qaydalar:

1. Yeni dependency bundle təsiri ölçülmədən əlavə edilmir.
2. Böyük third-party script consent və lazy-load olmadan əsas route-a düşmür.
3. Image/video ölçüsü CI budget ilə yoxlanır.
4. Search və filter input main thread-i bloklamır.
5. Real User Monitoring və Lighthouse CI regression gate olur.

---

## 14. Qiymət, stok və commerce dürüstlüyü

1. Qiymət yoxdursa `0 ₼`, saxta endirim və boş price shell göstərilmir; “Qiymət üçün əlaqə” rejimi olur.
2. Endirim yalnız real əvvəlki qiymət və hüquqi qayda ilə hesablanır.
3. Stok server source-of-truth-dur; client dəyərinə etibar edilmir.
4. Stale stock statusu və yenilənmə vaxtı göstərilir.
5. Səbət/checkout zamanı qiymət və stok yenidən yoxlanır.
6. Order, reservation, payment və webhook idempotentdir.
7. Kart PAN/CVV Sahara DB, log və analytics-də saxlanmır.
8. Taksit üçün total amount, fee/rate və hüquqi disclosure adminlə idarə olunur.

---

## 15. Təhlükəsizlik və privacy

1. OWASP ASVS 5.0 Level 2 baza qəbul edilir.
2. Admin yalnız qorunan şəbəkə/VPN, MFA, RBAC və audit ilə açılır.
3. HttpOnly/Secure/SameSite cookie, CSRF, session rotation, idle/absolute timeout.
4. Input runtime schema ilə validate edilir; SQL parametrikdir.
5. Upload MIME/magic-byte/ölçü/malware yoxlamasından keçir.
6. Rate limit login, OTP, search abuse, contact, reservation, checkout və upload-a tətbiq edilir.
7. CSP, HSTS, secure headers, dependency/secret/SBOM scan CI-dədir.
8. PII minimum toplanır, məqsəd/retention müəyyən edilir, export/delete axını olur.
9. Marketing consent kanal üzrə və transactional mesajdan ayrıdır.
10. Loglarda şifrə, token, kart və həssas PII yoxdur.

---

## 16. SEO və kontent

1. Product/category/brand səhifələri SSR/ISR ilə crawl edilə bilən HTML verir.
2. Canonical, hreflang, sitemap və redirect registry var.
3. `Product/ProductGroup`, `Offer`, `Breadcrumb`, `Organization`, `LocalBusiness`, `Article`, `FAQ`, `VideoObject` yalnız uyğun real data ilə yazılır.
4. Price yoxdursa saxta `Offer` yazılmır.
5. Slug dəyişəndə permanent redirect yaranır; internal ID dəyişmir.
6. AZ əsas dil; RU/EN translation statusu admin tərəfindən izlənir.
7. AI-generated mətn source və human review olmadan public edilmir.

---

## 17. Test qaydası

Hər dəyişiklik üçün riskə uyğun:

- unit test;
- component interaction test;
- DB/API integration və contract test;
- admin draft→preview→publish→rollback E2E;
- public əsas user journey E2E;
- visual regression light/dark və breakpoint-lər;
- horizontal overflow testi;
- accessibility testi;
- performance budget;
- security test;
- migration/rollback/restore testi.

Tab/modal/filter üçün test sadəcə render yox, bütün option-lara real click edib content/title/active state dəyişməsini yoxlamalıdır. Test və production build keçmədən iş hazır deyil.

---

## 18. Observability və əməliyyat

1. Structured log, trace ID, metric və error monitoring məcburidir.
2. Search index lag, stock sync lag, failed webhook, queue dead-letter və backup failure alert yaradır.
3. Analytics consent-aware və PII-sizdir.
4. Kritik funksiya üçün runbook və rollback addımı yazılır.
5. Production release mərhələli olur: internal → kiçik trafik → tam trafik.
6. Sev-1/Sev-2 zamanı feature flag/rollback yolu əvvəlcədən yoxlanır.

---

## 19. Definition of Done

Ticket yalnız bu şərtlərlə bağlanır:

- branch `saharasitedev` qaydasına uyğundur;
- scope və acceptance criteria qarşılanıb;
- fake/təsdiqsiz data yoxdur;
- DB/API/admin/public/analytics tam sinxrondur;
- user customization qorunub;
- loading/error/empty/offline/permission states var;
- mobile/desktop responsive və overflow-suzdur;
- WCAG, performance və security gate keçir;
- testlər və production build uğurludur;
- migration/rollback və sənədləşmə hazırdır;
- unattached media açıq hesabatdadır;
- `saharasitemain`-ə heç nə istifadəçi release təsdiqi olmadan keçirilməyib.
