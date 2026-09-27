# Sahara Electronic kataloqu

Layihə public məhsul kataloqu və yalnız lokal şəbəkədən açılan idarəetmə panelindən ibarətdir.

## Başlatmaq

1. `.env.example` faylını `.env` adı ilə kopyalayın.
2. `ADMIN_PASSWORD` üçün uzun və unikal şifrə yazın.
3. `./start.sh` başladın.

Əgər `3000` portu başqa proqram tərəfindən istifadə olunursa, `start.sh` növbəti boş portu avtomatik tapır və ekranda düzgün ünvanları göstərir. Sabit alternativ port üçün `.env` daxilində, məsələn, `PORT=3100` yaza bilərsiniz.

Public kataloq: `http://SERVER_IP:3000/`  
Admin panel: `http://SERVER_IP:3000/AdministratorNT`

Admin ünvanı public IP-lərdən server səviyyəsində `404` qaytarır. Giriş sessiyası `HttpOnly`/`SameSite` cookie, CSRF tokeni və uğursuz giriş limiti ilə qorunur. İnternetə çıxararkən HTTPS reverse proxy-də real müştəri IP-sinin `X-Forwarded-For` başlığı ilə ötürülməsini, `/AdministratorNT` və `/api/admin/` yollarının əlavə olaraq LAN/VPN ilə məhdudlaşdırılmasını və `site/data/` qovluğunun müntəzəm backup-ını təmin edin.

## Məlumat və media

- Brend, kateqoriya, məhsul, xüsusiyyət, status və istehsal ölkəsi admin paneldən idarə olunur.
- Admin paneldə JPG, PNG, WEBP, SVG, MP4 və WEBM fayllarını birbaşa yükləmək, önizləmək, dəyişmək və əsas şəkli seçmək mümkündür. Yüklənən fayllar `site/data/media/` qovluğunda saxlanılır.
- Sahara loqosu `public/media/SaharaLogo.png` yolunda saxlanılır və public/admin interfeysində istifadə olunur.
- Qiymət, kontragent və müştəri məlumatı kataloq sxemində saxlanılmır və public interfeysə çıxarılmır.
- Public kataloq `site/data/catalog.sqlite`, admin qaralaması isə ayrıca `site/data/catalog-draft.sqlite` SQLite bazasında saxlanılır. Rootdakı köhnə `data/*.sqlite` faylları runtime tərəfindən istifadə edilmir. “Qaralamanı saxla” public görünüşü dəyişmir; “Önizləmə” yoxlamadan sonra yalnız “Public et” əmri qaralamanı yayımlayır.
- Brendlər, istehsal ölkələri, kateqoriyalar, məhsullar, media, xüsusiyyətlər və statistika əlaqəli cədvəllərlə saxlanılır; məhsul məlumatları JSON faylına yazılmır.
- Köhnə `site/data/catalog.json` və `site/data/analytics.json` varsa, ilk start zamanı əməliyyat daxilində SQLite-a miqrasiya edilir və yalnız uğurlu miqrasiyadan sonra silinir.
- Backup üçün server dayandırıldıqdan sonra hər iki SQLite faylının və `site/data/media/` qovluğunun surətini saxlayın.

## Excel-dən ARDO idxalı

`npm run import:ardo` əmri `File/Ardo xüsusiyyətlər.xlsx` faylından yalnız xüsusiyyət başlıqlarını, `File/Mal və kontragent.xlsx` faylının “Mallar” vərəqindən isə yalnız məhsul adlarını oxuyur. Qiymət/say sütunları və kontragent vərəqi oxunmur. İdxal həm public, həm qaralama bazasını 130 unikal ARDO məhsulu ilə yeniləyir.

## Əmrlər

- `npm test` — testlər
- `npm run import:ardo` — verilmiş Excel fayllarından ARDO kataloqunu yenidən qurur
- `npm run build` — production frontend build
- `npm start` — API və production statik server
