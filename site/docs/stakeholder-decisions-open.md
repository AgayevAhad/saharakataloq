# Sahara Electronics — Stakeholder / Product Owner Qərarları

> Bu sənəd `siteplan5.md` Mərhələ 0 çərçivəsində stakeholder (Product Owner) tərəfindən qəbul edilmiş strateji, hüquqi və funksional qərarları və gələcək mərhələlər üçün açıq qalan texniki inteqrasiya məsələlərini əks etdirir.

---

## 1. E-ticarət və Ödəniş Modeli (Commerce & Checkout)

- **Status**: ✅ **Qərar verildi**
- **Qəbul Edilən Qərar**:
  - İlkin mərhələ **"WhatsApp konsultasiyası + zəng + mağazadan təhvil üçün müraciət"** modeli ilə işləyir.
  - Hələlik heç bir onlayn bank kartı ödənişi aktiv edilmir.
  - Səbət, checkout və ödəniş arxitekturası gələcək genişlənmə üçün modular və hazır layihələndirilir, lakin feature flag (`checkout_enabled: false`) ilə deaktiv saxlanılır.
  - Təsdiqlənməmiş qiymət, stok və taksit məlumatı public göstərilmir.
  - Mövcud olmayan sifariş və ya rezervasiya heç bir halda saxta olaraq "uğurlu" kimi təqdim edilmir.

---

## 2. Filial və Ünvanlar (Showrooms & Addresses)

- **Status**: ✅ **Qərar verildi**
- **Qəbul Edilən Qərar**:
  - "Sədərək TM Sıra 12 Mağaza 44", "Dərnəgül servis mərkəzi" və ya AI tərəfindən təxmin edilən digər ünvanlar rəsmi təsdiqlənmədiyi üçün public göstərilmir.
  - Heç bir hardcode və ya təxmin edilən ünvan public tərəfdə göstərilmir.
  - Yalnız admin paneldə istifadəçinin daxil etdiyi və aktiv etdiyi rəsmi ünvanlar göstərilir.
  - Bazada aktiv ünvan olmadıqda heç bir saxta fallback yaradılmır; standart təmiz **"Ünvan məlumatı tezliklə əlavə ediləcək"** vəziyyəti göstərilir.
  - Limitsiz sayda filial əlavə etmək, redaktə etmək, deaktiv etmək və sıralamaq admin paneldən tam idarə olunur.
  - Telefon, iş saatı, xəritə linki və qeydlər hər filial üçün ayrıca bazada saxlanılır və idarə edilir.

---

## 3. Zəmanət və Servis Siyasəti (Warranty & Claims)

- **Status**: ✅ **Qərar verildi**
- **Qəbul Edilən Qərar**:
  - ARDO üçün 3 il, Lotus üçün 1–2 il və ya hər hansı digər zəmanət müddəti təsdiqlənmədən qəbul edilmir.
  - Heç bir zəmanət müddəti hardcode edilmir.
  - Zəmanət brend və lazım gəldikdə məhsul səviyyəsində admin paneldən daxil edilir və idarə olunur.
  - Məlumat daxil edilmədikdə və ya boş olduqda zəmanət müddəti göstərilmir.
  - Yalnız rəsmi məlumat admin tərəfindən daxil edilib dərc edildikdən sonra public görünür.
  - "Rəsmi zəmanət", "sertifikatlı quraşdırma", "sığortalı çatdırılma" kimi təsdiqlənməmiş iddialar public mətndə istifadə edilmir.

---

## 4. Dillər və Lokallaşdırma (Localization)

- **Status**: ✅ **Qərar verildi**
- **Qəbul Edilən Qərar**:
  - İlkin public dil yalnız Azərbaycan dili (`az`) olur.
  - Arxitektura indidən `az`, `ru` və `en` dillərini dəstəkləyəcək modular i18n strukturunda qurulur.
  - `ru` və `en` rəsmi tərcümələri tam hazır olmayana qədər public dil seçicisində aktiv göstərilmir (yalnız `az` aktiv qalır).
  - Azərbaycan dilindəki məhsul mətnləri avtomatik və keyfiyyətsiz maşın tərcüməsi ilə başqa dillərə çevrilmir.

---

## 5. Brendlər və Dinamik Brend Sistemi (Brands & IP)

- **Status**: ✅ **Qərar verildi**
- **Qəbul Edilən Qərar**:
  - Sistem limitsiz və dinamik brend arxitekturasını dəstəkləyir.
  - Hazırda yalnız bazada mövcud olan və admin tərəfindən aktiv edilən **ARDO**, **Lotus** və **Artel** brendləri public ola bilər.
  - Məhsulu olmayan və ya təsdiqlənməyən brend yalnız `comingSoon` statusu admin tərəfindən aktiv edildikdə göstərilə bilər.
  - Samsung, Bosch və ya digər təsdiqlənməmiş brendlər özbaşına public əlavə edilmir.
  - Xarici saytlardan və ya kataloqlardan götürülən brend adları yalnız "candidate" siyahısında saxlanılır; yoxlanmadan və təsdiq edilmədən public edilmir.
  - Yeni brend əlavə etmək üçün frontend kod dəyişikliyi tələb olunmur (tamamilə DB/Admin əsaslıdır).

---

## Gələcək Mərhələlər Üçün Açıq Qalan Texniki Qərarlar

Aşağıdakı məsələlər Mərhələ 0 üçün bloklayıcı deyil və gələcək mərhələlərdə (Mərhələ 3-5) icra olunacaqdır:

1. **Ödəniş Gateway Seçimi (Mərhələ 3-4 üçün)**:
   - Onlayn ödəniş aktivləşdiriləcəyi təqdirdə hansı bank/ödəniş aqreqatoru (Kapital Bank E-commerce / ABB / e-Point / GoldenPay) ilə müqavilə bağlanacaq.
2. **ERP / 1C Sinxronizasiya Metodu (Mərhələ 4 üçün)**:
   - Anbar və qalıqların 1C/ERP sistemi ilə avtomatlaşdırılmış inteqrasiya protokolu (Direct REST Webhook, SFTP XML/CSV export və ya manual Excel import).
3. **Məhsul Təhlükəsizlik və Uyğunluq Sertifikatları (Mərhələ 2 üçün)**:
   - Hər model üçün rəsmi mənşə sertifikatı və ya texniki pasport PDF fayllarının admin paneldən birbaşa yüklənməsi.
