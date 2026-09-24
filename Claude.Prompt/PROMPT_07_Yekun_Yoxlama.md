# PROMPT 07 — Yekun Yoxlama və Bütövlük Testi

> **Tətbiq yeri:** `site/`  
> **Risk:** Sıfır — yalnız oxuma və yoxlama  
> **Ön şərt:** PROMPT_00-dan PROMPT_06-ya qədər hamısı tamamlanmış olmalıdır  
> **Nəticə:** Refaktorinqin heç bir funksiyanı sındırmadığını təsdiqləyən tam hesabat

---

## Məqsəd

Bu prompt kod yazmır. Yalnız yoxlayır. Tamamlanan refaktorinqin:
1. Düzgün struktur yaratdığını
2. Heç bir funksiya itirmədiyini
3. Performansın yaxşılaşdığını
4. Testlərin keçdiyini

hər birini müstəqil yoxlayır.

---

## Yoxlama Siyahısı

### Bölmə A: Fayl Strukturu

Aşağıdakı əmrləri icra et və nəticələri qeyd et:

```bash
# 1. Arxiv mövcuddur
ls _archive/ && echo "✅ Arxiv mövcuddur" || echo "❌ Arxiv tapılmadı"

# 2. Köklü src/ yoxdur
[ ! -d "src/" ] && echo "✅ Köklü src/ silindi" || echo "⚠️ src/ hələ mövcuddur"

# 3. Yeni hook-lar mövcuddur
ls site/src/hooks/ | grep -E "useTheme|useCompare|useFavorites|useToast|useCatalog|useContact" | wc -l | \
  xargs -I{} sh -c '[ {} -ge 6 ] && echo "✅ 6 hook mövcuddur" || echo "❌ Hook-lar çatışmır ({})"'

# 4. Admin qovluğu mövcuddur
ls site/src/components/admin/sections/ | wc -l | \
  xargs -I{} sh -c '[ {} -ge 8 ] && echo "✅ Admin bölmələri mövcuddur ({})" || echo "❌ Admin bölmələri çatışmır ({})"'

# 5. CSS modullar mövcuddur
ls site/src/styles/components/ | wc -l | \
  xargs -I{} sh -c '[ {} -ge 5 ] && echo "✅ CSS modular mövcuddur" || echo "❌ CSS modular çatışmır"'

# 6. Apps qovluğu mövcuddur
ls site/src/apps/ | grep -E "SiteApp|CatalogApp" | wc -l | \
  xargs -I{} sh -c '[ {} -eq 2 ] && echo "✅ SiteApp və CatalogApp mövcuddur" || echo "❌ App faylları çatışmır"'

# 7. API router qovluğu mövcuddur
ls site/api/ | wc -l | \
  xargs -I{} sh -c '[ {} -ge 6 ] && echo "✅ API router faylları mövcuddur" || echo "❌ API router faylları çatışmır"'
```

### Bölmə B: Fayl Ölçüsü Yoxlaması

```bash
echo "=== CatalogAdmin.tsx ===" 
wc -l site/src/components/CatalogAdmin.tsx
# Gözlənilən: 3-5 sətir (yalnız re-export)

echo "=== App.tsx ==="
wc -l site/src/App.tsx
# Gözlənilən: maksimum 25 sətir

echo "=== server.mjs ==="
wc -l site/server.mjs
# Gözlənilən: maksimum 200 sətir

echo "=== index.css (yeni) ==="
wc -l site/src/styles/index.css
# Gözlənilən: maksimum 15 sətir (yalnız @import-lar)

echo "=== react-native-web yoxlama ==="
grep -r "react-native-web" site/package.json && echo "❌ Hələ mövcuddur" || echo "✅ Silindi"

echo "=== isSiteMode sayı App.tsx-də ==="
grep -c "isSiteMode" site/src/App.tsx 2>/dev/null && echo "⚠️ İSiteMode hələ App.tsx-dədir" || echo "✅ App.tsx-də isSiteMode yoxdur"
```

### Bölmə C: Build Yoxlaması

```bash
cd site

echo "=== TypeScript yoxlama ==="
npm run typecheck 2>&1 | tail -5
# Gözlənilən: Xəta yoxdur

echo "=== Production build ==="
npm run build 2>&1 | tail -20
# Gözlənilən: "built in X.XXs" mesajı

echo "=== Chunk ölçüləri ==="
ls -lh dist/assets/*.js | sort -k5 -rh | head -15
# Gözlənilən: vendor-react, chunk-admin, chunk-modals görünməlidir

echo "=== Ən böyük chunk ==="
ls -lh dist/assets/*.js | sort -k5 -rh | head -1
# Gözlənilən: 800KB-dan az olmalıdır
```

### Bölmə D: Test Yoxlaması

```bash
cd site

echo "=== Vitest unit testlər ==="
npm run test:vitest 2>&1 | tail -10
# Gözlənilən: "X passed" — heç bir test sınmamalıdır

echo "=== Backend testlər ==="
node --test backend/*.test.mjs 2>&1 | tail -10
# Gözlənilən: "X passed"
```

### Bölmə E: Funksional Yoxlama (Brauzer)

Server-i başlat (`npm start`) və brauzerda aşağıdakıları yoxla:

**Kataloq modu** (`?mode=catalog` ilə açaraq):
- [ ] Məhsul vitrin yüklənir
- [ ] Brend filtrləri işləyir
- [ ] Məhsul kartına klik etdikdə modal açılır
- [ ] WhatsApp düyməsi işləyir
- [ ] Dark/light tema keçidi işləyir
- [ ] `/AdministratorNT` admin girişi işləyir

**Site modu** (normal açaraq):
- [ ] Ana səhifə yüklənir
- [ ] Header naviqasiyası işləyir
- [ ] Katalog səhifəsi açılır
- [ ] Brendlər səhifəsi açılır
- [ ] Axtarış overlay açılır
- [ ] Müqayisə funksiyası işləyir
- [ ] Mobil alt naviqasiya işləyir

**Admin panel** (`/AdministratorNT`):
- [ ] Admin giriş formu görünür
- [ ] Giriş uğurlu olur
- [ ] "Məhsullar" tabı açılır
- [ ] Məhsul redaktə formu açılır
- [ ] Media upload işləyir
- [ ] Snapshot yaratma işləyir
- [ ] Analitika tabı açılır
- [ ] Ayarlar tabı açılır

---

## Hesabat Formatı

Bütün yoxlamalar tamamlandıqdan sonra aşağıdakı formatda hesabat ver:

```
=== YEKUN HESABAT ===

Fayl strukturu: X/7 meyar keçdi
Fayl ölçüsü: X/5 meyar keçdi  
Build: [Uğurlu / Uğursuz]
Testlər: X testdən Y-i keçdi
Funksional: X/20 meyar keçdi

Qalan problemlər (varsa):
- [Problemi təsvir et]
- [Həll yolunu təklif et]
```

---

## Həll Edilməmiş Problem Varsa

Əgər hər hansı yoxlama uğursuz olursa, **bu promptu dayandır** və problemi aşağıdakı formada bildir:

```
PROBLEM: [Faylın adı / xəta mesajı]
KÖK SƏBƏB: [Niyə baş verdi - əgər bəlli isə]
TÖVSİYƏ: [Mümkün həll yolu]
```

Sonra müvafiq prompta qayıt (məsələn, build xətası varsa PROMPT_05-ə) və problemi düzəlt.
