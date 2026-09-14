# SAHARA ELECTRONICS — TAM ELEKTRONİKA PLATFORMASI MASTER-PLANI

> Sənədin statusu: icra üçün əsas məhsul və arxitektura planı  
> Tarix: 06.09.2026  
> Əlaqəli sənədlər: `siteplan3.md` — məcburi sayt qaydaları, `siteplan4.md` — texniki kontrakt, `siteplan5.md` — mərhələli icra backlog-u  
> Məqsəd: mövcud kataloqu məlumat, UX/UI, servis və gələcək satış funksiyaları baxımından ölkənin aparıcı elektronika platformalarından daha çevik, etibarlı və gələcəyə hazır sistemə çevirmək.

---

## 1. Məhsul vizyonu

Sahara sadəcə məhsul kartları olan sayt olmayacaq. Platforma istifadəçiyə aşağıdakı sualları bir yerdə cavablandırmalıdır:

1. Mənə uyğun məhsul hansıdır?
2. Modellər arasında real fərq nədir?
3. Məhsul hansı mağazada mövcuddur?
4. Çatdırılma, quraşdırma, zəmanət və servis necə işləyir?
5. Məsləhət üçün ən sürətli əlaqə kanalı hansıdır?
6. Alışdan sonra sifarişi, zəmanəti və servis müraciətini necə izləyəcəyəm?

Platformanın fərqi “çox banner” deyil; düzgün məlumat, sürətli qərarvermə, etibar və alışdan sonrakı xidmət olmalıdır.

### 1.1 Əsas məhsul prinsipləri

- **Həqiqi məlumat:** boş/fake xüsusiyyət, uydurma üstünlük, təsdiqsiz istehsal ölkəsi və saxta rəy public edilmir.
- **Brand-agnostic arxitektura:** Samsung, ARDO, Lotus, Artel və gələcək bütün brendlər eyni data kontraktı ilə işləyir; kodda brendə xüsusi şərt minimum olur.
- **Mobile-first, desktop-premium:** əsas trafik mobil qəbul edilir, lakin geniş ekran təcrübəsi sadələşdirilmiş mobil görünüşün böyüdülmüş forması olmur.
- **Progressive commerce:** başlanğıcda “əlaqə ilə qiymət/satış”, sonra qiymət, mağaza stoku, səbət və ödəniş feature flag-larla mərhələli açılır.
- **Admin-first data governance:** publicdə görünən hər şey admin paneldə idarə, yoxlama, önizləmə, təsdiq və geri qaytarma imkanına malikdir.
- **No destructive migration:** mövcud public/draft bazaları və admin düzəlişləri qorunur; bütün dəyişikliklər idempotent migration və merge ilə aparılır.
- **Accessible by design:** WCAG 2.2 AA sonradan əlavə ediləcək checklist deyil, komponent qəbul meyarıdır.
- **Performance budget:** hər yeni funksiya ölçülən performans büdcəsi daxilində qalmalıdır.

### 1.2 Uğur göstəriciləri

İlk gündən ölçüləcək əsas KPI-lar:

- axtarışdan məhsul baxışına keçid faizi;
- nəticəsiz axtarışların faizi;
- PLP → PDP, PDP → əlaqə/səbət, səbət → checkout konversiyası;
- WhatsApp / zəng / mağaza rezervasiyası üstünlüyü;
- məhsul müqayisəsindən qərara keçid;
- mağaza stoku sorğularının cavablanma müddəti;
- kontent tamlığı: şəkil, spesifikasiya, GTIN, zəmanət, stok, SEO;
- return visitor və wishlist bərpası;
- Core Web Vitals p75;
- servis müraciətinin həll müddəti və məmnunluq göstəricisi.

---

## 2. Araşdırma nəticəsi və strateji üstünlük

### 2.1 Yerli bazarda görünən baza imkanları

Baku Electronics hazırda kampaniya, mağaza, aylıq ödəniş, aktiv müqavilə, zəmanət, servis mərkəzi, çatdırılma/ödəniş, korporativ satış və müraciət axınlarını ayrıca təqdim edir. Kontakt məhsul təklifləri ilə yanaşı hissəli ödəniş, qiymət zəmanəti, qapıda rəsmiləşdirmə, çatdırılma, dəyiş/qaytar, trade-in və korporativ satışı önə çıxarır.

Sahara bunları kor-koranə təkrarlamamalıdır. Üstünlük aşağıdakı kombinasiyada qurulmalıdır:

- daha təmiz və qərarverməyə fokuslanan UI;
- Azərbaycan dilində səhvlərə və transliterasiyaya dözümlü ağıllı axtarış;
- kateqoriyaya uyğun həqiqi müqayisə;
- mağaza üzrə stok və rezervasiya;
- böyük məişət texnikası üçün ölçü/uyğunluq köməkçisi;
- çatdırılma + quraşdırma + köhnə cihazın götürülməsi paketləri;
- ekspert konsultasiyası üçün vaxt seçimi;
- sifariş, zəmanət və servis üçün vahid self-service kabineti;
- admin paneldə data keyfiyyəti və təsdiq workflow-u.

### 2.2 Xarici benchmark-lardan götürüləcək prinsiplər

- **Currys:** çatdırılma, quraşdırma, təkrar emal, təmir, texniki dəstək, order/repair tracking və buying guide-ları vahid xidmət ekosistemində birləşdirir.
- **MediaMarkt:** mağaza seçimi, konsultasiya görüşü, canlı məsləhət, servis, mövsümi discovery və redaksiya məzmununu kommersiya ilə bağlayır.
- **Best Buy:** membership, price-match, trade-in, ekspert/texniki dəstək və mağazadan götürmə ilə uzunmüddətli müştəri əlaqəsi qurur.
- **Apple:** çatdırılma və pickup-u çox sadə izah edir, alışdan sonrakı Personal Setup və trade-in prosesini addım-addım göstərir.
- **Samsung:** iri məişət texnikasında çatdırılma tarixinin seçilməsi, ölçülərin əvvəlcədən yoxlanması, quraşdırma və store pickup fərqlərini məhsul axınına daxil edir.

### 2.3 Sahara-nın fərqləndirici məhsulları

1. **Sahara Match:** 5–7 sualla istifadəçinin büdcə, ölçü, ailə sayı və istifadə ssenarisinə uyğun məhsul seçimi.
2. **Fərqi göstər müqayisəsi:** eyni olan sətirləri gizlədib yalnız mühüm fərqləri vurğulayan müqayisə.
3. **Ölç və uyğunlaşdır:** soyuducu, soba, panel, TV və kondisioner üçün məkan ölçülərini daxil edib uyğunluq xəbərdarlığı.
4. **Enerji xərci kalkulyatoru:** rəsmi və aktual tarif konfiqurasiyası ilə illik təxmini sərfiyyat; heç vaxt hardcode edilməməlidir.
5. **Mənə xəbər ver:** stok, qiymət və kampaniya dəyişiklikləri üçün opt-in bildiriş.
6. **Canlı ekspert:** WhatsApp, zəng, callback və mağazada/video konsultasiya üçün kontekstli müraciət.
7. **Sahara Care:** quraşdırma, zəmanət, servis, təmir statusu və sənədlərin vahid mərkəzi.
8. **Ağıllı paketlər:** TV + kronşteyn + quraşdırma və ya soba + panel + aspirator kimi uyğunluq qaydası ilə bundle; təsadüfi məhsul tövsiyəsi deyil.
9. **Şəffaf mövcudluq:** “var” sözü əvəzinə mağaza, say, rezerv müddəti və mümkün çatdırılma günü.
10. **Ailə/ev layihəsi siyahısı:** istifadəçi otaqlar üzrə məhsul planı yarada, məsləhətçiyə paylaşa və təklif istəyə bilir.

---

## 3. İnformasiya arxitekturası

### 3.1 Public sayt xəritəsi

```text
/
├── /catalog
│   ├── /catalog/[category]
│   ├── /catalog/[category]/[subcategory]
│   └── /product/[brand]-[model]-[id]
├── /brands
│   └── /brands/[brand]
├── /compare
├── /favorites
├── /campaigns
│   └── /campaigns/[slug]
├── /services
│   ├── /delivery-installation
│   ├── /warranty
│   ├── /repair
│   ├── /trade-in
│   └── /corporate-sales
├── /stores
│   └── /stores/[slug]
├── /guides
│   ├── /buying-guides/[slug]
│   └── /technology/[slug]
├── /support
│   ├── /faq
│   ├── /contact
│   ├── /order-tracking
│   └── /service-tracking
├── /cart                         (feature flag)
├── /checkout                     (feature flag)
├── /account
│   ├── /orders
│   ├── /warranties
│   ├── /service-requests
│   ├── /addresses
│   └── /notifications
├── /about
├── /privacy
├── /terms
├── /returns
└── /accessibility
```

AZ əsas dil olacaq; RU və EN content readiness data modelinə ilk gündən daxil ediləcək. Tərcüməsi olmayan səhifə uydurma avtomatik mətnlə public edilməməlidir.

### 3.2 Qlobal naviqasiya

**Desktop header:**

- yuxarı service bar: mağaza seçimi, iş saatı, sifariş/servis izləmə, dil;
- əsas sətir: logo, böyük smart search, müqayisə, favorit, hesab, səbət;
- üçüncü sətir: “Bütün kateqoriyalar” mega-menu, kampaniyalar, brendlər, xidmətlər;
- scroll zamanı sticky compact rejim; backdrop blur, sabit hündürlük, CLS=0;
- mega-menu klaviatura, hover intent və click ilə işləməlidir.

**Mobile header/navigation:**

- logo + search trigger + hesab/səbət;
- aşağıda 5 elementli bottom navigation: Ana səhifə, Kataloq, Axtarış, Favorit, Hesab;
- filter drawer, full-screen search, native momentum scroll;
- safe-area dəstəyi və minimum 44×44 px toxunma sahəsi;
- heç bir horizontal body overflow yoxdur.

---

## 4. Səhifə və komponent tələbləri

### 4.1 Ana səhifə

Sıra bütün istifadəçilərə eyni “banner divarı” kimi göstərilməməlidir. Admin sıralaya bilən bloklar:

1. service bar + header;
2. əsas kampaniya/brand hero — maksimum bir əsas mesaj;
3. top kateqoriyalar;
4. istifadəçi məqsədinə görə shortcut-lar: “Evimi yeniləyirəm”, “Yeni mətbəx”, “Gaming”, “İqlim”;
5. seçilmiş/yeni/populyar məhsullar;
6. aktiv brend texnologiyalarının rotasiyası;
7. həftənin təklifləri — yalnız real kampaniya məlumatı varsa;
8. Sahara Match seçim köməkçisi;
9. xidmətlər: çatdırılma, quraşdırma, zəmanət, servis;
10. mağazalar və yaxın filial;
11. buying guides və ekspert məzmunu;
12. etibar blokları və footer.

Hər blokun admin statusu `draft/review/scheduled/published/archived`, tarix aralığı, auditoriyası və sırası olmalıdır.

### 4.2 Kataloq / PLP

- server-rendered və paylaşılabilən filter URL-ləri;
- breadcrumb və kateqoriya təsviri;
- desktop sol facet panel, mobile bottom-sheet/drawer;
- brend, qiymət, stok, mağaza, rəng, ölçü, enerji sinfi və kateqoriyaya məxsus dinamik facet-lər;
- seçilmiş filter chip-ləri və “hamısını təmizlə”;
- relevance, populyarlıq, yeni, qiymət artan/azalan sort;
- grid/list seçimi, page size və indekslənə bilən pagination;
- məhsul kartında şəkil/video, brand/model, 3 əsas fərqləndirici spesifikasiya, qiymət rejimi, aylıq ödəniş, stok, rating, compare/favorite;
- qiymət yoxdursa boş sahə və ya `0 ₼` deyil, adminin təyin etdiyi “Qiymət üçün əlaqə” rejimi;
- 1:1 skeleton — eyni grid, ölçü və CTA yerləri;
- infinite scroll yalnız istifadə rahatlığı üçün; SEO və geri qayıtma üçün canonical pagination saxlanır.

### 4.3 Smart search

- bütün aktiv brend, məhsul, variant, kateqoriya, sinonim və atributları indeksləyir;
- Azərbaycan hərfləri, rus/latın yazılışı, model kodu, boşluq və defis variasiyalarına dözümlüdür;
- desktop dropdown: solda 8–9 highlight olunmuş suggestion, sağda 3–4 populyar/uyğun məhsul, aşağıda quick category pill-ləri;
- mobile: maksimum 5 suggestion, 2 məhsul və horizontal kateqoriya sırası;
- son axtarışlar yalnız istifadəçi cihazında və ya razılıqlı hesabda;
- nəticəsiz sorğular admin dashboard-a düşür;
- typo correction istifadəçinin yazdığını səssizcə dəyişmir: “Bunu nəzərdə tuturdunuz?” göstərir;
- merchandiser boost mümkündür, amma sponsorlu nəticə işarələnir;
- query → click analitikası şəxsi məlumat toplamadan işləyir.

### 4.4 Məhsul detalı / PDP

- aydın brand + model + variant adı, SKU/GTIN;
- yüksək keyfiyyətli responsive şəkillər, 360/video, zoom, fullscreen;
- video default muted, görünən mute/unmute, captions/transcript;
- variant seçimi: rəng, ölçü, yaddaş və kateqoriyaya görə digər seçimlər;
- qiymət, köhnə qiymət, real endirim, taksit planı və hüquqi qeyd;
- mağaza üzrə stok, rezervasiya və çatdırılma ETA;
- əsas CTA: səbət və ya cari mərhələdə WhatsApp/zəng;
- sticky mobile purchase/contact bar;
- əsas xüsusiyyətlər, tam spesifikasiya, ölçülər, enerji etiketi, manual və zəmanət sənədi;
- mağazadan götürmə, çatdırılma, quraşdırma, köhnə cihazın aparılması;
- compare, favorite, share;
- uyğun aksesuar və qayda əsaslı bundle;
- FAQ, təsdiqlənmiş alıcı rəyləri və sual-cavab;
- kateqoriya üzrə ölçü köməkçisi;
- `Product/ProductGroup`, breadcrumb və video structured data.

### 4.5 Brend səhifəsi

- rəsmi ad, təsdiqlənmiş logo, cover, qısa məlumat və rəsmi source URL;
- kateqoriyalar, məhsullar, texnologiyalar, guide-lar, servis/zəmanət məlumatı;
- brand theme yalnız accent səviyyəsində; Sahara əsas vizual kimliyi itməməlidir;
- məhsulu olmayan brand public edilməməli və indekslənməməlidir; lazım olsa admin-controlled “tezliklə” landing-i `noindex` olur.

### 4.6 Müqayisə

- eyni kateqoriyada 2–4 məhsul;
- sticky məhsul başlığı və horizontal mobile table;
- “yalnız fərqləri göstər”, boş məlumatı gizlət, seçilmiş məhsulu dəyiş;
- kateqoriya spec template-i ilə eyni vahidlərə normallaşdırma;
- müqayisəni link kimi paylaşmaq və bərpa etmək;
- qiymət, stok və servis fərqlərinin yenilənmə vaxtı göstərilməlidir.

### 4.7 Mağazalar

- limitsiz ünvan, telefon, iş saatı, koordinat, xəritə, xidmətlər və şəkillər;
- şəhər/rayon filteri, “mənə yaxın” yalnız icazədən sonra;
- filial detail səhifəsi və LocalBusiness structured data;
- həmin mağazadakı məhsul stoku və pickup rezervasiyası;
- istisna iş saatları/bayram günləri ayrıca idarə olunur.

### 4.8 Xidmət və support

- çatdırılma zonası və vaxt slotu;
- quraşdırma uyğunluğu və qiyməti;
- zəmanət şərtləri və məhsula bağlı zəmanət kartı;
- servis müraciəti: cihaz, seriya nömrəsi, problem, media, ünvan, vaxt;
- order/service tracking üçün təhlükəsiz token və ya authenticated hesab;
- callback, WhatsApp, zəng, email və mağaza görüşü;
- FAQ və guide axtarışı;
- korporativ satış üçün şirkət məlumatlı lead formu və məsul menecer axını.

### 4.9 Hesab, favorit və bildirişlər

- guest wishlist local storage-da, login zamanı conflict-safe merge;
- passwordless OTP əsas giriş; brute force və account enumeration qoruması;
- sifarişlər, qaimə, zəmanət, servis, ünvanlar, notification preferences;
- məlumat ixracı və hesab silmə sorğusu;
- email/SMS/WhatsApp marketing üçün ayrı consent; transactional mesaj consent-dən ayrılır.

### 4.10 Səbət və checkout — feature flag ilə

- guest checkout, hesab məcburi deyil;
- stok və qiymət serverdə checkout əvvəl yenidən təsdiqlənir;
- filial pickup və çatdırılma seçimi;
- address autocomplete yalnız istifadəçi nəzarəti ilə;
- quraşdırma və əlavə xidmət seçimi;
- promo code, gift card, taksit və ödəniş provider abstraction;
- idempotent order/payment əməliyyatları;
- kart məlumatı Sahara serverində saxlanmır;
- uğursuz ödəniş bərpa axını və order status timeline;
- checkout hər addımda klaviatura və screen reader ilə işləməlidir.

---

## 5. Brend və məlumat toplama strategiyası

### 5.1 “Bütün brendləri əlavə etmək” nə deməkdir

Baku Electronics, Kontakt və digər açıq brand directory-ləri **candidate discovery** mənbəyidir, Sahara üçün source of truth deyil. Brend adları ayrıca staging reyestrinə yığılır, təkrarlanan yazılışlar normallaşdırılır və yalnız rəsmi istehsalçı mənbəsi ilə təsdiqdən sonra aktivləşdirilir.

Proses:

1. Public directory-lərdən yalnız brand adı və source URL candidate kimi qeyd edilir.
2. `Samsung`, `SAMSUNG`, `Samsung Electronics` kimi variantlar canonical brand-a bağlanır.
3. Rəsmi sayt, logo istifadəsi, mənşə, support və zəmanət mənbəsi yoxlanır.
4. Logo/foto rəqib saytdan kopyalanmır; rəsmi media kit, distribütor icazəsi və ya Sahara-nın öz materialı istifadə olunur.
5. Brend `candidate → verified → content_ready → published` statusundan keçir.
6. Məhsul yoxdursa public brand səhifəsi yaranmır.

Rəqib saytından məhsul təsviri, foto, rəy, qiymət və kampaniyanın avtomatik kopyalanması planın hissəsi deyil. Model adı/SKU kimi faktiki identifikatorlar belə distribütor siyahısı və ya rəsmi istehsalçı məlumatı ilə tutuşdurulur.

### 5.2 Məhsul data keyfiyyət qapısı

Public olmaq üçün minimum:

- canonical brand və kateqoriya;
- unikal model/SKU, mümkün olduqda GTIN;
- real məhsul adı və variant;
- ən azı 1 hüququ olan, modelə 1:1 uyğun media;
- kateqoriya üçün məcburi spesifikasiyalar;
- zəmanət və istehsalçı/distribütor məlumatı;
- stok və ya “əlaqə ilə” statusu;
- AZ dilində SEO title/description;
- data mənbəsi və son yoxlama tarixi.

Hər hansı media faylı modelə dəqiq uyğun deyilsə bağlanmır və hesabatda bu cümlə ilə göstərilir: **“Bu faylları dəqiq model adında tapmadığım üçün heç bir modelə bağlamadım: […]”**

---

## 6. UX/UI dizayn sistemi

### 6.1 Vizual istiqamət

- Sahara qırmızısı əsas accent, lakin bütün səhifənin dominant fon rəngi deyil.
- Neytral isti ağ / dərin graphite səthlər; məhsul şəkli əsas vizualdır.
- 8px spacing sistemi, responsive fluid type, məhdud shadow səviyyələri.
- Mətn və ikonlar high-contrast; rəng tək status göstəricisi deyil.
- Hər komponent üçün light/dark/high-contrast vəziyyəti.
- Animasiya informasiya iyerarxiyasını dəstəkləyir; dekorativ sonsuz animasiya azaldılır.
- `prefers-reduced-motion`, `prefers-contrast`, keyboard focus və screen reader adları məcburidir.

### 6.2 Dizayn tokenləri

Token qrupları:

- color: brand, semantic, surfaces, text, border;
- typography: display/title/body/label/meta;
- spacing, radius, shadow, z-index;
- motion duration/easing;
- breakpoints və container widths;
- component sizes və touch targets.

Tokenlər CSS variable + typed TypeScript kontraktından gəlməlidir. Admin paneldə sərbəst CSS və font adı yazmaq əvəzinə təsdiqlənmiş theme preset-ləri istifadə olunmalıdır.

### 6.3 Universal komponentlər

Button, IconButton, Input, Select, Combobox, Dialog, Drawer, Sheet, Tabs, Toast, Tooltip, Badge, Price, Stock, Rating, Breadcrumb, Pagination, ProductCard, MediaGallery, ShimmerImage, Skeleton, EmptyState, ErrorState, StorePicker, ConsentBanner.

Hər komponent üçün Storybook/Ladle nümunəsi, interaction testi, a11y testi və responsive visual snapshot olmalıdır.

### 6.4 Loading/error/empty vəziyyətləri

- 1:1 skeleton real komponentin eyni hündürlüyünü və anatomiyasını saxlayır;
- bütün şəkillər mərkəzi `ShimmerImage` vasitəsilə decode/fade/fallback alır;
- retry edilə bilən network error;
- boş kateqoriya public edilməməlidir;
- offline/slow connection üçün aydın vəziyyət;
- optimistic action yalnız rollback və status bildirişi olduqda istifadə edilir.

---

## 7. Qeyri-funksional keyfiyyət qapıları

### 7.1 Performans

Field data p75 hədəfi:

- LCP ≤ 2.5 s;
- INP ≤ 200 ms;
- CLS ≤ 0.10;
- TTFB cached səhifələrdə ≤ 800 ms;
- ilkin route JS gzip hədəfi ≤ 180 KB, route-level code splitting;
- əsas şəkil responsive AVIF/WebP, doğru `sizes`, CDN və priority;
- aşağıdakı media lazy-load, video poster ilə və viewport-a görə başladılır;
- font subset/self-host/preload; maksimum 2 ailə;
- search typing main thread-i bloklamır;
- scroll listener passive + `requestAnimationFrame`; scroll zamanı layout read loop yoxdur.

### 7.2 Accessibility

- WCAG 2.2 AA bütün responsive variantlarda;
- skip link, landmark, düzgün heading ağacı;
- klaviatura ilə mega-menu, search, filter, modal, gallery, compare;
- focus trap + focus restore;
- 200% zoom və 320 CSS px reflow;
- captions/transcript və alt text workflow-u;
- form error summary və field association;
- automated axe + manual keyboard + screen reader smoke test.

### 7.3 Təhlükəsizlik və privacy

- OWASP ASVS 5.0 Level 2 baza, payment/admin kritik axınlarda daha sərt nəzarət;
- admin public URL-dən ayrılmış LAN/VPN + MFA + RBAC;
- HttpOnly/Secure/SameSite cookie, CSRF, rotation, idle/absolute timeout;
- rate limiting, bot protection, upload MIME/signature scan, malware scan;
- CSP nonce/hash, HSTS, secure headers, dependency/SBOM/secret scan;
- parameterized SQL və schema validation;
- audit log append-only, export və retention;
- PII minimization, consent, retention/delete/export workflow;
- payment provider tokenization; PAN/CVV saxlanmır;
- encrypted backup və rüblük restore drill;
- ayrıca hüquqi review: məxfilik, cookie, distant satış, qaytarma, taksit və zəmanət mətnləri.

### 7.4 Etibarlılıq

- production üçün PostgreSQL point-in-time recovery;
- media object storage + versioning + CDN;
- RPO ≤ 15 dəq, RTO ≤ 2 saat başlanğıc hədəfi;
- health/readiness endpoint, structured log, trace ID;
- error monitoring, uptime və synthetic checkout/search testləri;
- queue retry + dead-letter; idempotent webhook;
- deploy əvvəl migration backup və rollback planı.

---

## 8. SEO və discovery

- SSR/ISR və crawl edilə bilən məhsul/kateqoriya HTML-i;
- canonical, hreflang AZ/RU/EN, sitemap index;
- Product/ProductGroup, Offer yalnız real price olduqda, Breadcrumb, Organization, LocalBusiness, Article, FAQ və VideoObject;
- qiymət yoxdursa saxta `Offer`/`0` structured data yazılmır;
- filter URL allowlist: faydalı landing index, kombinasiyaların çoxu canonical/noindex;
- redirect registry və dəyişməz product ID əsaslı slug;
- image sitemap və Merchant Center feed commerce açıldıqda;
- admin SEO preview, missing-field report və structured data validator gate.

---

## 9. Admin panel məhsul sahələri

Admin bölmələri:

1. Dashboard və funnel analitikası
2. Məhsullar və variantlar
3. Kateqoriya ağacı və spec template-ləri
4. Brend verification reyestri
5. Media kitabxanası və unassigned asset report
6. Qiymət, taksit və kampaniya
7. Mağaza, stok və rezervasiya
8. Sifarişlər və ödəniş statusları
9. Müştəri və korporativ lead-lər — permission-lu görünüş
10. Servis/zəmanət müraciətləri
11. CMS: page, hero, guide, FAQ, navigation
12. Search synonyms, redirects və merchandising
13. Reviews/Q&A moderation
14. İstifadəçi, rol və icazələr
15. Site settings, dillər, kontaktlar, bütün ünvanlar
16. Audit log, snapshot, backup və import/export

Hər public field üçün admin support matrisi `siteplan4.md`-də verilir. Public komponenti admin UI-si və preview-si olmadan qəbul etmək qadağandır.

---

## 10. Scope sərhədləri və qərarlar

### 10.1 Birinci buraxılışa daxil deyil

- marketplace üçün üçüncü tərəf seller onboarding;
- AI tərəfindən təsdiqsiz avtomatik məhsul təsviri;
- rəqib qiymətinin icazəsiz scraping-i;
- loyalty/membership-in pullu səviyyəsi;
- native mobil tətbiq;
- microservice parçalanması.

Data və komanda həcmi sübut etmədən bunlar əlavə edilməməlidir.

### 10.2 Məcburi ADR qərarları

İcra başlamazdan əvvəl aşağıdakılar yazılı Architecture Decision Record almalıdır:

- storefront SSR framework;
- PostgreSQL hosting və backup;
- object storage/CDN;
- search engine;
- OTP/SMS/WhatsApp provider;
- payment və taksit provider-ləri;
- analytics/consent platforması;
- xəritə provider-i;
- ERP/POS/stok inteqrasiyasının source of truth-u;
- AZ/RU/EN content ownership.

---

## 11. Mənbələr və benchmark qeydləri

Araşdırma 06.09.2026 tarixində aparılıb. Məqsəd interfeysi kopyalamaq deyil, istifadəçi gözləntilərini və xidmət boşluqlarını müəyyənləşdirməkdir.

- [Baku Electronics — əsas sayt](https://www.bakuelectronics.az/)
- [Baku Electronics — brend directory](https://www.bakuelectronics.az/brend-siyahi)
- [Kontakt — əsas sayt və xidmət təklifləri](https://kontakt.az/)
- [Currys — xidmət ekosistemi](https://www.currys.co.uk/services.html)
- [MediaMarkt — kateqoriya, servis və buying guide yanaşması](https://www.mediamarkt.de/)
- [Best Buy — membership, price match və trade-in](https://www.bestbuy.com/site/help-topics/more-for-your-money/pcmcat1775076332575.c?id=pcmcat1775076332575)
- [Apple — delivery və pickup](https://www.apple.com/shop/shipping-pickup)
- [Apple — trade-in](https://www.apple.com/shop/trade-in)
- [Samsung — iri məhsul çatdırılması və pickup](https://www.samsung.com/us/shop/shipping-delivery-store-pickup/)
- [Google Search — Product structured data](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Google web.dev — Core Web Vitals hədləri](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [OWASP — ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/)

---

## 12. Master Definition of Done

Bir funksiya yalnız aşağıdakılar olduqda “hazır” sayılır:

- real use case və acceptance criteria var;
- mobile, tablet, laptop, desktop dizaynı var;
- loading, empty, error, offline və permission vəziyyətləri var;
- public + admin + database + API + analytics sinxron işləyir;
- migration user customization-u qoruyur və rollback olunur;
- unit, component, integration, contract və lazım olduqda E2E testi var;
- accessibility və keyboard testi keçir;
- visual regression və horizontal overflow testi keçir;
- performance budget pozulmur;
- security/privacy review keçir;
- telemetry, audit və support runbook var;
- AZ məzmunu təsdiqlənib, fake data yoxdur;
- gündəlik dəyişiklik, commit və push yalnız `saharasitedev` branch-də aparılır; `saharasitemain` yalnız ayrıca istifadəçi release təsdiqi ilə yenilənir;
- `Foto/`, `File/`, baza, `.env` və xam şəxsi media Git-ə düşmür.
