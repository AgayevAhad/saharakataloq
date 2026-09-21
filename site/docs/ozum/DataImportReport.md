# Data Import, Təmizlənmə və Keyfiyyət Audit Hesabatı

Yoxlama tarixi: 2026-09-19; əlavə xarici-açar yoxlaması və bərpa: 2026-09-20

## 📌 Xülasə (Summary)

**Cari vəziyyət (2026-09-20):** Aşağıdakı köhnə “4 baza bərabərdir”, “boş ölkə 0” və “tam təmiz” cədvəli artıq cari vəziyyəti göstərmir; sayt və ayrıca topdançı bazaları qəsdən fərqlidir. Dəqiq son nəticə sənədin sonundakı bölmədədir.
Bütün verilənlər bazaları (`data/catalog.sqlite`, `data/catalog-draft.sqlite`, `site/data/catalog.sqlite`, `site/data/catalog-draft.sqlite`), xammal sənədlər (`File/Book1 (1).xlsx`, `File/Ardo xüsusiyyətlər.xlsx`), `Foto/` və `Foto/output/` qovluqları müqayisə edilmişdir. İlk hesabatdakı “100% mükəmməl” iddiası düzgün deyildi: `site/data` bazalarının hər birində 2 175 göstərici 115 köhnə məhsul ID-sinə bağlı qalmışdı. Bu problem sonradan dəqiq kod uyğunluğu ilə bərpa olundu. Media uyğunluğunun müstəqil yoxlaması ayrıca tələb olunur.

## 2026-09-20 xarici-açar bərpası

- `data/` bazalarındakı 115 orijinal ID məhsulunun kodu, tam adı, brendi və kateqoriyası `site/data/` bazalarındakı məhsullarla birmənalı uyğun gəldi. Təxmini model/fayl uyğunlaşdırması edilmədi.
- `site/scripts/repair-orphan-specs.mjs` əvvəlcə quru yoxlama, sonra `--apply` ilə hər baza üçün ayrıca SQLite ehtiyat nüsxəsi yaradıb 2 175 göstəricini doğru ID-yə bağladı. Əvvəlki nüsxələr `site/data/backups/` qovluğundadır və Git-ə daxil edilmir.
- Bərpadan sonra dörd bazanın hər birində 725 məhsul, 10 985 göstərici, sıfır xarici-açar pozuntusu və `integrity_check=ok` təsdiqləndi.
- Playwright test serveri artıq belə pozuntunu silib gizlətmir; xətanı açıq şəkildə bildirir.

## İstehsal ölkəsi üzrə ayrıca dürüstlük qeydi

Əvvəlki təmizləmə skripti məhsul üzrə sübut olmadıqda brendin mənşə ölkəsini `manufacturing_country` sahəsinə köçürüb. Bunlar eyni anlayış deyil. Bərpa edilmiş sayt bazasında 332 modelin öz “İstehsalçı ölkə” göstəricisi var; 224 modeldə bu göstərici məhsul sətrindəki ölkə ilə ziddiyyət təşkil edir, 393 model üçün isə belə dəqiq göstərici yoxdur. Bu səbəbdən müştəri interfeysi artıq istehsal ölkəsini yalnız modelin öz birmənalı göstəricisi varsa göstərir. Bazadakı əvvəlki dəyərlər admin fərdiləşdirmələri ilə qarışa bildiyi üçün kütləvi silinməyib; ayrıca mənbə/provenans təsdiqi olmadan onlara “dəqiq istehsal ölkəsi” kimi etibar edilməməlidir. Gələcək təmizləmə skriptindən brend-mənşə fallback-i çıxarıldı.

---

## 🔍 Aşkarlanan və Həll Edilən Xətalar (Audit & Corrections)

1. **Xammal Mənbə Skrap Xətalarının Təmizlənməsi (Garbage Spec Removal)**:
   - Mənbə JSON-lardan gələn birləşmiş/təkrar zibil başlıqlar (`XüsusiyyətlərBrend...`, `Məhsul haqqındaXüsusiyyətlər...`, `Aylıq ödəniş...`, `Yekun qiymət...`) tam təmizləndi (253 lazımsız sətir silindi).
   - Bütün 725 məhsulun yalnız aydın, tək-tək ayrılmış parametrləri saxlanıldı.

2. **Qoşa Nöqtə Format Xətalarının Düzəldilməsi (Spec Name Trailing Colon Cleanup)**:
   - 6,217 parametr adının sonundakı `:` işarələri (məsələn, `Brend:`, `Zəmanət:`, `Rəng:`, `Məhsul tipi:`) silinərək vahid və səliqəli `Brend`, `Zəmanət`, `Rəng`, `Məhsul tipi` standartına gətirildi.

3. **Badge Rəng Standartlaşdırılması (Badge Color Normalization)**:
   - Hex formatında yazılmış (`#3b82f6`) rəng kodları TypeScript və UI standartlarına uyğun olaraq `'blue'` rəng növünə çevrildi.

4. **Şəkil və Obyekt Mövqe Dəyərlərinin Standartlaşdırılması**:
   - `'center center'` tipli qeyri-standart formatlar vahid `'center'` dəyərinə normallaşdırıldı.

5. **İstehsalçı Ölkə Məlumatlarının Bərpası (Manufacturing Country Sync)**:
   - 523 məhsulda boş qalmış `manufacturing_country` sahəsi məhsulun öz xüsusiyyətlərindən (`İstehsalçı ölkə`) və ya brendin rəsmi mənşə ölkəsindən avtomatik təyin edilərək dolduruldu.

6. **Mövcud Məlumatların və Fərdiləşdirmələrin Qorunması**:
   - Bütün mövcud ARDO və LOTUS məhsulları (350 məhsul), admin panel düzəlişləri, fərdi qiymətlər, xüsusiyyətlər və şəkil kəsimləri (`objectPosition`, `imagePosition`, `fitMode`) 100% toxunulmaz saxlanıldı.

---

## 📊 Baza Göstəriciləri (4 Baza üzrə Bərabər və Tam Sinxron)

- `data/catalog.sqlite`
- `data/catalog-draft.sqlite`
- `site/data/catalog.sqlite`
- `site/data/catalog-draft.sqlite`

| Göstərici                             | Say                              |
| :------------------------------------ | :------------------------------- |
| **Ümumi Məhsul Sayı**                 | **725** (16 aktiv brend)         |
| **Media Şəkil Sayı**                  | **2 196** (Dəqiq WebP)           |
| **Təmizlənmiş Texniki Xüsusiyyətlər** | **10 985** (Səliqəli açar-dəyər) |
| **Xətalı / Zibil Parametr Sayı**      | **0**                            |
| **Boş Qalan Ölkə Məlumatı**           | **0**                            |

---

## 📷 Dəqiq Model Adı Olmadığı üçün Bağlanmayan Şəkillər (Unassigned Media)

Fayl adında dəqiq model kodu olmayan kamera seriyaları (`406A...`), WhatsApp şəkilləri (`WhatsApp Image...`) və ümumi adlar qaydalara uyğun olaraq heç bir modelə səhvən qoşulmamışdır:

- `Ardo/WhatsApp Image 2026-08-25 at 20.32.22` - `20.32.30` (40 ədəd)
- `ardo havaçəkən/406A4932.jpg`, `AR611 BLACK.jpg`, `AR6113BLACK.jpg`, `I 620X.jpg`, `MOD602WHITE850.jpg`
- `ardo kondisoner/12000BTU.jpg`, `18000BTU.jpg`, `9000BTU.jpg`, `ARDO KONDISONER.jpg`
- `ardo piltə/406A4952.jpg`, `406A4955.jpg`, `406A4956.jpg`, `501 C.jpg`, `502C.jpg`, `AR741OINOX.jpg`
- `artel kondisoner/ARTEL.jpg`, `R410A.jpg`, `islenme --4...25.JPG`
- `lotus airfryer/Airfryer Lotus 5.5 Black.JPG` (və variantları)
- `lotus ətçəkən/406A9658.JPG`
- `ütü lotus/406A8986.JPG` - `406A9003.JPG`

## 2026-09-20 — yalnız sayt kataloquna yoxlanmış Samsung əlavəsi

- `Foto/output/Samsung/Samsung_ALL.json`-dakı 181 mənbə sətri 73 fərqli məhsul başlığına aid idi. İlk keçiddə 71 məhsul daxil edildi; əlavə mənbə-keçid yoxlaması `IRT53DG7A10B1WT` sətrində URL-in `RT53DG7A10B1WT` olduğunu aşkarladı. Bu məhsul hər iki bazada dərhal **draft** statusuna keçirildi; ictimai kataloqda yalnız 70 təsdiqlənmiş Samsung məhsulu qalır. İndiki import skripti belə ziddiyyətləri əvvəlcədən rədd edir.
- 371 fayl ilkin keçiddə WebP-yə optimallaşdırıldı; ziddiyyətli `IRT53...` modelinin 6 şəkli sonradan hər iki bazadan ayrılıb ictimai media qovluğundan `site/data/quarantine-media/samsung/` qovluğuna bərpa edilə bilən şəkildə köçürüldü. İctimai Samsung media qovluğunda və hər bazada 365 yeni Samsung şəkli qalıb. Məhsulun `short_description` sahəsinə mağaza səhifəsindən çıxan qiymət/reytinq/səbət mətnləri köçürülmədi; uydurma təsvir və “Yeni” nişanı əlavə edilmədi. Texniki göstəricilərdə təkrar açarlar və birləşmiş başlıqlar süzüldü.
- Yalnız `site/data/catalog.sqlite` və `site/data/catalog-draft.sqlite` dəyişdi. Hər birində 796 məhsul (470 yayımlı + 326 qaralama), 71 Samsung qeydi (70 yayımlı + 1 qaralama), cəmi 2 561 media qeydi var. Hər iki bazada `integrity_check=ok` və `foreign_key_check=0`. Mövcud məhsulların admin düzəlişlərinə toxunulmadı. Yazmadan əvvəlki bərpa nüsxələri `/tmp/sahara-verified-samsung-backup-adesot_6/`, ziddiyyətli sətrin yayından çıxarılmasından əvvəlki nüsxələr `/tmp/sahara-samsung-source-conflict-backup-hu83_zzf/`, 6 media ayrılmazdan əvvəlki nüsxələr isə `/tmp/sahara-samsung-media-backup-b9yi6x_w/` qovluğundadır. Ayrı `data/` topdançı bazaları dəyişdirilmədi.
- “Cooling” və “18+11 kq” real model kodları deyil; bu adlarla saxlanan 12 Samsung şəkli heç bağlanmadı. `IRT53...` sətrinin 6 şəkli də indi heç bir məhsula bağlı deyil və şəxsi karantin qovluğundadır. Bundan əlavə, 119 ilkin `Foto/` şəkli üçün unikal 1:1 model uyğunluğu yoxdur. **Bu faylları dəqiq model adında tapmadığım üçün heç bir modelə bağlamadım:** tam 137 fayllıq siyahı [UnassignedFotoMedia.md](UnassignedFotoMedia.md) sənədindədir. `IRT53...` şəkillərinin dəqiq model/variantını istifadəçi təsdiqləməlidir.
- Import yoxlaması: `python3 site/scripts/test_import_verified_samsung_catalog.py` — 4 test keçdi. `--apply` olmadan skript yalnız quru audit aparır.
- **Yayım qeydi:** `site/data/*.sqlite` və `site/public/media/products/` Git tərəfindən nəzərə alınmır. Bu keçiddə dəyişiklik yalnız lokal sayt bazası/media qovluğundadır; təkcə kodu push etmək Samsung məhsullarını başqa serverə daşımayacaq. İstehsalat üçün ayrıca təsdiqli data/media ötürülmə mexanizmi lazımdır; burada heç bir canlı server dəyişdirilməyib.
