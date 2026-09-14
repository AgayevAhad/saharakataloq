# Sahara Electronics — Məlumat Keyfiyyəti və Tamlıq Hesabatı (Data Quality Report)

> **Tarix:** 06.09.2026  
> **Analiz edilən bazalar:** `data/catalog.sqlite`, `data/catalog-draft.sqlite`  
> **Məqsəd:** Mövcud məlumatlardakı boşluqları, çatışmazlıqları və bərpa planını sənədləşdirmək.

---

## 1. Məhsul Göstəricilərinin Xülasəsi

| Göstərici | Say | Faiz Nisbəti | Vəziyyət |
| :--- | :--- | :--- | :--- |
| **Ümumi Məhsul Sayı** | 350 | 100% | Baza tam mövcuddur |
| **ARDO Məhsulları** | 130 | 37.1% | Bazada mövcuddur |
| **LOTUS Məhsulları** | 220 | 62.9% | Bazada mövcuddur |
| **ARTEL Məhsulları** | 0 | 0% | `coming_soon = 1` |
| **Dərc Edilmiş (`published`)** | 97 | 27.7% | Şəkli olan aktiv modellər |
| **Qaralama (`draft`)** | 253 | 72.3% | Şəkil gözləyən modellər |

---

## 2. Müəyyən Edilmiş Boşluqlar və Çatışmazlıqlar

### 2.1 İstehsal Ölkəsi (`manufacturing_country`)
- **Vəziyyət:** 160 məhsulda (ARDO-nun 130 məhsulunun hamısında + LOTUS-un 30 məhsulunda) `manufacturing_country` sahəsi boşdur (`""`).
- **Analiz:** ARDO brend mənşəyi İtaliya olsa da, spesifik məhsulların istehsal ölkələri (Türkiyə və Çin fabrikləri) model səviyyəsində doldurulmalıdır.
- **Həll Planı:** Brend mənşəyi ilə istehsal ölkəsi ayrılır. Excel və rəsmi zavod sertifikatları əsasında hər modelə uyğun istehsal ölkəsi təsdiqlənərək doldurulacaq.

### 2.2 Məhsul Şəkilləri (`primary_image`)
- **Vəziyyət:** 253 məhsulun ilkin şəkli boşdur və buna görə də onlar `draft` rejimində saxlanılır.
- **Kateqoriyalar üzrə bölgü:**
  - Plitələr (`cooktop`): 90 şəkilsiz
  - Aspiratorlar (`hood`): 74 şəkilsiz
  - Sobalar (`oven`): 42 şəkilsiz
  - Televizorlar (`tv`): 18 şəkilsiz
  - Soyuducular (`refrigerator`): 17 şəkilsiz
  - Paltaryuyanlar (`washer`): 8 şəkilsiz
- **Həll Planı:** Yalnız rəsmi kataloqdan təsdiqlənmiş 1:1 fotoşəkillər yüklənərək tədricən `published` statusuna keçiriləcək; saxta/təxmini şəkil təyin edilməyəcək.

### 2.3 Qiymət və Endirimlər (`price`, `old_price`)
- **Vəziyyət:** 350 məhsulun hamısında `price = NULL` / `0 AZN`-dir.
- **Analiz:** Sistem hazırda "Əlaqə ilə Qiymət / WhatsApp Məsləhəti" rejimində işləyir. Bu rejim proqressiv kommersiya planı ilə uyğundur.
- **Həll Planı:** Rəsmi pərakəndə qiymətlər təsdiqləndikdən sonra admin paneldən daxil ediləcək.

### 2.4 Texniki Parametrlər (`product_specs`)
- **Vəziyyət:** Cədvəldə 4532 parametr sətri var, lakin bunlardan yüzlərlə sətirdə `value = ""` (boş şablon sətirləri) mövcuddur.
- **Parametrsiz qalan modellər:** ARDO-nun 4 kondisioner modeli (`AR09WS`, `AR12WS`, `AR18WS`, `AR24WS`) üzrə heç bir parametr daxil edilməyib.
- **Həll Planı:** Boş parametr sətirləri təmizlənəcək və kondisioner modelləri üçün rəsmi BTU, kompressor və enerji parametrləri əlavə olunacaq.

### 2.5 ARTEL Brend Qeydləri
- **Vəziyyət:** `origin_country = ''`, `description = ''`, `coming_soon = 1`.
- **Həll Planı:** Rəsmi distribütor müqaviləsi və məhsul bazası təsdiqlənənə qədər brend `coming_soon` rejimində saxlanılacaq.
