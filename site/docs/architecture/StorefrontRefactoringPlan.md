# Storefront refaktorinq planı

Bu plan görünüşü və mövcud admin məlumatlarını dəyişmədən kod bazasını mərhələli şəkildə sadələşdirir. Hər mərhələ ayrıca test olunmalı və əvvəlki mərhələ sabit olmadan növbəti mərhələyə keçməməlidir.

## Hədəf arxitektura

- `pages/`: yalnız səhifənin quruluşu və route səviyyəli koordinasiya.
- `features/<feature>/`: katalog, axtarış, səbət, hesab və admin kimi biznes sahələri; hər sahənin komponentləri, hook-ları və testləri birlikdə.
- `components/`: yalnız sahələrdən asılı olmayan UI elementləri.
- `services/`: HTTP, kataloq və sessiya kimi xarici məlumat sərhədləri.
- `utils/`: yan təsirsiz seçim, sıralama və formatlama funksiyaları.
- `types/`: API və domen müqavilələri; komponentə məxsus tiplər komponentin yanında qalır.

Axın `page -> feature hook/controller -> service -> API` istiqamətində olmalıdır. UI komponenti birbaşa fetch, route və ya verilənlər bazası məntiqi daşımamalıdır.

## Mərhələlər

1. **Render və animasiya sərhədləri — tamamlandı.** Səhifə/section səviyyəli scroll observer, məhsul seçimi üçün yan təsirsiz utility, ortaq brend nişanı və ProductCard vizual helper-ləri ayrıldı. Hər kart üçün ayrıca observer ləğv edildi. Reveal xarici wrapper-də, hover isə daxili kartda işləyir; kartın özünə blur tətbiq olunmur. Avtomatik hover şəkil dəyişməsi çıxarıldı, video yalnız həqiqətən oynayanda şəkli örtür. Real media ilə browser hover testi var. Ana səhifənin önə çıxan məhsul koordinasiyası ayrıca `features/home/FeaturedProductsSection.tsx` komponentinə çıxarıldı; `HomePage.tsx` 132 sətrə endi. Responsive səkkiz-sıralı pəncərə və mərhələli genişlənmə ayrıca utility/unit/browser testləri ilə qorunur.
2. **Kataloq səhifəsi — davam edir.** `CatalogProductGrid` ayrı feature komponentidir; brend/favorit/müqayisə lookup-ları memoizə olunur. Filtr state-i, gec gələn kataloq datasına uyğun qiymət hədləri, seçim/sıralama və sıfırlama `features/catalog/useCatalogFilters.ts` hook-una çıxarılıb. Responsive sütun hesabı, grid/list rejimi, səkkiz-sətirlik paginasiya və filtr dəyişəndə sıfırlanma isə `useCatalogPagination.ts`-ə ayrılıb. Hər ikisi unit və real kataloq browser testləri ilə qorunur. Növbəti kiçik addımlarda desktop sidebar, mobile filter drawer və nəticə toolbarı çıxarılmalıdır. Mövcud `CatalogPage.tsx` hələ böyükdür; bu mərhələ tamamlanmış sayılmır.
3. **Header və axtarış.** `SiteHeader.tsx`-dən smart-search, desktop navigation, mobil drawer triggerləri və account action-ları ayırmaq; paylaşılmış indeks qurmaq.
4. **App koordinasiyası.** `App.tsx`-də route mapping, modal registry, cart/favorite/compare controller və catalog bootstrapping-i ayrı hook/service-lərə çıxarmaq.
5. **Stil qatları.** `index.css` faylını tokens, layout, feature və responsive qatlarına bölmək; selector prioritetini sabit saxlamaq üçün CSS layer istifadə etmək.
6. **Performans və ölçmə.** Lighthouse/Playwright büdcələri, render sayğacları, media lazy-decoding və bundle split; nəticələri ölçmədən vizual dəyişiklik etməmək.

## Cari yoxlama və açıq borclar

- `Duzelisler.md` üçün 15 browser ssenarisi mobil/desktop davranışını, real media ilə kart hover-ini və səkkiz real grid sətrini yoxlayır. Production build üzərində əlavə test canlı kataloq surətində brend ardıcıllığını, genişlənməni və brend nişanlarını yoxlayır. Kateqoriya qapağı əvvəl adminin seçdiyi şəkli göstərir; yüklənməsə, yalnız həmin real məhsulun digər mediasına keçir.
- Kateqoriya bölməsinin skeleton-u eyni beşkartlı bento quruluşunu və hər kartın media/başlıq anatomiyasını saxlayır; kartlarda say/ton göstəriciləri artıq yoxdur. Kartdakı video görünən sahədə hover olmadan oynayır, ekran xaricində dekodlaşdırma dayanır; şəkil video həqiqətən işləyəndən sonra örtülür.
- SSR və `/api/catalog` eyni açıq kataloq filtrindən keçir. Köhnə PIM miqrasiyasının `unverified` statusu verilmiş mövcud brendləri gizlətməsi və hidratasiya zamanı loqoların yoxa çıxması aradan qaldırıldı; `candidate` və `comingSoon` gizliliyi qalır. ARTEL-in yayımlanmış modelləri admin tərəfindən hələ `comingSoon` kimi işarələndiyi üçün açıq kataloqda yoxdur; LOTUS modelləri isə qaralamadır. Bu admin vəziyyəti avtomatik dəyişdirilmir.
- Lokal test serveri artıq DB snapshot-unda istinad edilən upload şəkillərini də müvəqqəti mühitə köçürür. Əvvəlki browser testlərində bu şəkillər yox idi və nəticə etibarlı hover yoxlaması deyildi.
- Production kodundakı TypeScript xətaları və köhnə test fixture-lərinin domen tipi uyğunsuzluqları düzəldildi. `npm run typecheck` bütöv mənbə və testlər üçün keçir; `npm run build` isə yalnız production mənbələrini `tsconfig.build.json` ilə ayrıca yoxlayır.
- Cari production bundle ölçüsü hələ böyükdür (əsas JS təxminən 826 kB, admin JS təxminən 773 kB minifikasiya olunmuş). Mərhələ 6-da real profil/ölçmə nəticələri əsasında bölünməlidir; indidən sırf xəbərdarlığı gizlədən limit artırılmır.
- `npm run format:check` hələ 19 mövcud faylda (o cümlədən istifadəçinin redaktə etdiyi `Duzelisler.md`/`Data.md` və `server.mjs`) stil fərqi göstərir. Yeni test və test-server faylları formatlandı; qalan böyük/istifadəçi redaktəli fayllar sadəcə yaşıl nəticə almaq üçün kütləvi yenidən formatlanmadı. Ayrıca, diff-i idarə olunan format mərhələsi lazımdır.
- Header, App və CSS mərhələləri hələ tamamlanmayıb. Böyük faylların birdəfəlik bölünməsi əvəzinə hər extraction üçün davranış testi əlavə ediləcək.

## Qoruyucu qaydalar

- Hər extraction əvvəl davranış testi ilə kilidlənir.
- Admin tərəfindən dəyişdirilmiş media mövqeyi, təsvir, qiymət və spesifikasiyalar seed/import ilə əvəz edilmir.
- Bir mərhələdə həm data müqaviləsi, həm route, həm də geniş UI restaylinqi dəyişdirilmir.
- Yeni feature faylları praktik olaraq 300–500 sətri keçməməlidir; böyük mövcud fayllar hər mərhələdə kiçildilir.
