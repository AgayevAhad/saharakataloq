# ArdoKataloq v2 — Test Prompt Paketi (Yenilənmiş)

Öncəki promptlar hələ də keçərlidir. Bu paket yalnız **yeni versiyada əlavə olan sahələri** əhatə edir.

---

## PROMPT A — 🔍 Funksional: filterCatalogProducts (ən vacib!)

```
ArdoKataloq-un src/utils/filter.ts faylını sənə göndərirəm.

filterCatalogProducts() funksiyası üçün aşağıdakı testləri yaz:

1. Bütün published məhsullar — kateqoriya 'all', brend 'all', axtarış boş
2. Draft məhsul uyğun gəlsə belə nəticəyə daxil edilmir
3. categoryName sahəsinə görə axtarış işləyir
   (məs: "Sobalar" yazıldıqda soba kateqoriyasındakı məhsullar tapılır)
4. specs sahəsi null/undefined olan məhsulda axtarış xəta atmır
5. highlights sahəsi null/undefined olan məhsulda axtarış xəta atmır
6. Azərbaycan lokal axtarışı — "aspirator" axtarışı "Aspirator" adlı məhsulu tapır
   (toLocaleLowerCase('az') ilə)
7. Kateqoriya + brend + axtarış üçlü filtri düzgün işləyir
8. Nəticəsi boş olan filtr kombinasiyası — boş massiv qayıdır, xəta atmır

Test faylını src/__tests__/filterUnit.test.ts kimi yaz.
Mock məhsullar üçün normalizeProduct() istifadə et.
```

**Nə qaytarmalıdır:** 8 test, hamısı keçməli. Bu ən kritik boşluqdur.

---

## PROMPT B — 🔐 Təhlükəsizlik: CSV Injection

```
ArdoKataloq-un src/utils/csv.ts faylını sənə göndərirəm.

CSV injection hücumlarına qarşı aşağıdakı testləri yaz:

1. code sahəsindəki "=CMD()" dəyəri string olaraq saxlanır, icra edilmir
   (importProductsFromCsv nəticəsindəki products[0].code === '=CMD()')
2. title sahəsindəki "=HYPERLINK(...)" dəyəri string olaraq qayıdır
3. "@SUM(1+1)" başlığı ilə məhsul düzgün idxal olunur
4. "+998501234567" formatındakı telefon kodu zədəsiz import edilir
   (CSV formul kimi başlayan "+" simvolları)
5. Uzun (5000 simvollu) spec dəyəri CSV-ə ixrac edilib geri idxal edilir —
   kəsilmir, xəta atmır

Test faylını src/__tests__/csvSecurity.test.ts kimi yaz.

NOT: React render zamanı escape edilir — amma məlumat bazasına gedən yol
üçün code sahəsi test edilməlidir.
```

**Nə qaytarmalıdır:** 5 test. 1-5 testlər keçməli — çünki `importProductsFromCsv` məlumatı raw string kimi saxlayır, icra etmir. Bu testlər bu davranışı sənədləşdirir.

---

## PROMPT C — 🔍 Funksional: CSV Edge Case-lər

```
ArdoKataloq-un src/utils/csv.ts faylını sənə göndərirəm.

importProductsFromCsv() funksiyası üçün aşağıdakı edge case testlərini yaz:

1. Boş CSV mətni ('') → errors[] dolu, products[] boş
2. Yalnız başlıq sətri (məhsul yoxdur) → errors[] boş, products[] boş
3. `code` sahəsi boş olan sətir → errors[]-ə əlavə olunur, keçilir
4. BOM olmayan CSV (xarici proqramdan) düzgün parse edilir
   (\uFEFF olmadan başlayan fayl)
5. Eyni `code`-u olan iki məhsul → ikisi də idxal olunur (deduplikasiya yoxdur)
   — bu hal sənədləşdirilməlidir
6. `badgeColor` sahəsindəki yanlış dəyər ('neon') → 'red' default-a düşür
7. `stockStatus` sahəsindəki yanlış dəyər ('unknown') → 'in_stock' default-a düşür
8. Windows CRLF (\r\n) ilə Mac LF (\n) qarışıq sətir sonları — düzgün parse edilir

Test faylını src/__tests__/csvEdgeCases.test.ts kimi yaz.
```

**Nə qaytarmalıdır:** 8 test. 5-ci test möhkəm sənəddir — duplikat kod idxal olunur, bu davranış gözləntidir.

---

## PROMPT D — 🔍 Funksional: Excel Edge Case-lər

```
ArdoKataloq-un src/utils/excel.ts faylını sənə göndərirəm.

importProductsFromExcel() funksiyası üçün aşağıdakı testləri yaz:

1. Heç bir vərəq olmayan Excel faylı → xəta qaytarır
2. Başlıq sətri olmayan Excel faylı → xəta qaytarır
3. `manufacturingCountry` sütunu olmayan Excel-də məhsulun ölkəsi 'İtaliya' default qayıdır
4. Tanınmayan kateqoriya adı olan məhsul categories[0]-a düşür, xəta atmır
5. `oldPrice` dolu, `price` boş olan məhsul — oldPrice qorunur, price undefined qalır
6. Highlights sahəsi "; " ilə ayrılmış — massivə düzgün bölünür

Test faylını src/__tests__/excelEdgeCases.test.ts kimi yaz.
```

**Nə qaytarmalıdır:** 6 test. 3-cü test importantdır — default İtaliya davranışı kodda var ama test edilməyib.

---

## PROMPT E — 🧭 UX: downloadFile Funksiyası

```
ArdoKataloq-un src/utils/csv.ts faylındakı downloadFile() funksiyasını sənə göndərirəm:

export const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

4 test yaz:
1. Funksiya çağırıldıqda document-ə <a> elementi əlavə olunur
2. <a> elementinin download atributu ötürülən filename-ə bərabərdir
3. Funksiya bitdikdən sonra <a> elementi document-dən silinir
4. URL.createObjectURL və URL.revokeObjectURL çağırılır (yaddaş sızması yoxdur)

Test faylını src/__tests__/downloadFile.test.ts kimi yaz.
Mühit: // @vitest-environment happy-dom
URL.createObjectURL-u vi.fn() ilə mock et.
```

**Nə qaytarmalıdır:** 4 test. 3-cü test yaddaş sızması qarşı mühafizəni sənədləşdirir.

---

## PROMPT F — ♿ Əlçatımlılıq: Toast role="status"

```
ArdoKataloq-un src/components/Toast.tsx faylını sənə göndərirəm.

Aşağıdakı 3 testi yaz:

1. Toast render olunduqda komponentin kökündə role="status" atributu var
   (ekran oxuyucusu bildirişi oxuyur)
2. Toast komponenti aria-live="polite" atributu ilə render olunur
   (dinamik məzmun ekran oxuyucusuna çatır)
3. Toast görünən (visible=true) olduqda mətn DOM-da mövcuddur

Əgər Toast.tsx-də role="status" yoxdursa:
- Test uğursuz olacaq
- Testin altında bu kodu əlavə etmək lazım olduğunu izah et:
  <div role="status" aria-live="polite"> ... </div>

Test faylını src/__tests__/toastAccessibility.test.tsx kimi yaz.
Mühit: // @vitest-environment happy-dom
```

**Nə qaytarmalıdır:** 3 test. Əgər test uğursuz olursa — bu real tapıntıdır, Toast.tsx-də düzəliş lazımdır.

---

## PROMPT G — 🔎 SEO: index.html Yoxlaması

```
ArdoKataloq-un index.html faylını sənə göndərirəm.

8 SEO testini yaz (node mühitində fs.readFileSync ilə oxu):

1. <html lang="az"> — dil atributu mövcuddur
2. <title> — "Sahara" sözünü ehtiva edir
3. <meta name="description"> — content 50+ simvoldur
4. <meta property="og:title"> — mövcuddur
5. <meta property="og:description"> — mövcuddur
6. <meta property="og:type" content="website"> — mövcuddur
7. <meta property="og:locale" content="az_AZ"> — mövcuddur
8. <link rel="icon"> — mövcuddur

Əlavə olaraq bu 3 çatışmazlığı describe.skip ilə qeyd et:
- og:image yoxdur → "Tövsiyə: <meta property='og:image' content='/media/SaharaLogo.png' />"
- canonical URL yoxdur → "Tövsiyə: <link rel='canonical' href='https://saharaelectronics.az/' />"
- twitter:card yoxdur → "Tövsiyə: <meta name='twitter:card' content='summary_large_image' />"

Test faylını src/__tests__/seo.test.ts kimi yaz.
```

**Nə qaytarmalıdır:** 8 test keçir + 3 skip edilmiş test (gələcək tapşırıqlar kimi).

---

## PROMPT H — 🔍 Funksional: inferCategoryFromName Tam Əhatə

```
ArdoKataloq-un src/utils/excel.ts faylındakı inferCategoryFromName() funksiyasını sənə göndərirəm.

Aşağıdakı testləri yaz:

1. "ARDO 60 sm İnox Aspirator" → 'aspirator' kateqoriyası
2. "ARDO 4 gözlü Qaz Plitəsi" → 'plite' kateqoriyası
3. "ARDO Elektrikli Daxili Soba 65L" → 'soba' kateqoriyası
4. "ARDO Tam İnteqrasiya Edilən Qabyuyan" → 'qabyuyan' kateqoriyası
5. "ARDO İkikameralı Soyuducu No-Frost" → 'soyuducu' kateqoriyası
6. "ARDO Split Kondisioner 9000 BTU" → 'air_conditioner' kateqoriyası
7. "ARDO Mikrodalğa Soba 20L" → 'microwave' kateqoriyası
8. "ARDO Naməlum Cihaz XZ-999" → categories[0]-a düşür, xəta atmır
9. Boş ad ('') → categories[0]-a düşür, xəta atmır

Test faylını src/__tests__/inferCategory.test.ts kimi yaz.

NOT: ardoSpecsImport.test.ts-də 5 test var, amma air_conditioner, microwave,
boş ad testləri yoxdur. Bu faylda onları əhatə et.
```

**Nə qaytarmalıdır:** 9 test. 8-9-cu testlər unknown/empty dəyər üçün safe fallback-ı sənədləşdirir.

---

## PROMPT I — 🧭 UX: Çoxsaylı Ünvanlar (mapUrl boş olduqda)

```
ArdoKataloq-un src/components/Footer.tsx faylını sənə göndərirəm.

Footer komponentinin ünvan linklərini test et:

1. addresses[0].mapUrl dolu olduqda href düzgün URL-ə işarə edir ('#' deyil)
2. addresses[0].mapUrl boş ('') olduqda link '#' istifadə edir
   (bu hal UX problemi — klik sayfanı yuxarı atır)
3. Bir neçə ünvan olduqda hamısı Footer-də göstərilir
4. addresses[] boş massiv olduqda Footer xəta atmadan render olunur
5. Hər ünvanın workingHours mətni DOM-da mövcuddur

Test faylını src/__tests__/footerAddresses.test.tsx kimi yaz.
Mühit: // @vitest-environment happy-dom

NOT: 2-ci test mapUrl boş olduqda '#' href-inin problemi olduğunu sənədləşdirir.
Testin altında düzəliş tövsiyəsi yaz:
  href={addr.mapUrl && addr.mapUrl.trim() ? addr.mapUrl : undefined}
  (undefined olduqda <a> elementi düymə kimi davranmaz)
```

**Nə qaytarmalıdır:** 5 test + düzəliş tövsiyəsi. 2-ci test real UX problemini aşkar edəcək.

---

## İcra ardıcıllığı

Ən vacibdən başla:

1. **PROMPT A** — `filterCatalogProducts` (yeni ayrılmış funksiya, sıfır test)
2. **PROMPT C** — CSV edge case-lər (import zamanı gizli davranışlar)
3. **PROMPT G** — SEO (bir dəfə yazılır, daima çalışır)
4. **PROMPT F** — Toast accessibility (real tapıntı gözlənilir)
5. **PROMPT B** — CSV injection sənədləşdirməsi
6. Qalanlar istədiyiniz ardıcıllıqla

Her prompt üçün:
```bash
npx vitest run src/__tests__/<fayl>
```

---

## Xatırlatma: Test/ qovluğu

`/Test/` qovluğundakı 6 fayl Vitest tərəfindən tapılmır.
Onları köçürmək üçün:

```bash
cp Test/filtering.test.ts src/__tests__/
cp Test/normalization.test.ts src/__tests__/
cp Test/security.test.ts src/__tests__/
cp Test/adminLogin.test.tsx src/__tests__/
cp Test/productModal.test.tsx src/__tests__/
cp Test/urlAndTracking.test.ts src/__tests__/

# Köçürdükdən sonra hamısını yoxla
npx vitest run src/__tests__
```

---

*Bu prompt paketi ArdoKataloq v2 (29 Avqust 2026) üçün hazırlanmışdır.*
*Cari test sayı: 53. Bütün promptlar tamamlandıqda gözlənilən: ~120+ test.*
