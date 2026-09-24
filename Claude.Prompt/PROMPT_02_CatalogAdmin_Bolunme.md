# PROMPT 02 — `CatalogAdmin.tsx` 7038 Sətiri Bölmək

> **Tətbiq yeri:** `site/src/components/`  
> **Risk:** Orta-Yüksək — admin panel funksiyaları mövcud qalmalıdır  
> **Ön şərt:** PROMPT_01 tamamlanmış olmalıdır  
> **Nəticə:** 7038 sətirlik bir fayl 9 müstəqil fayla bölünür

---

## Kontekst

`site/src/components/CatalogAdmin.tsx` hazırda **7038 sətirdir**. Bu fayl içərisindəki hər mövzu ayrı bölmə kimi var:

1. Admin naviqasiya/layout qabığı
2. Məhsul siyahısı + CRUD
3. Brend idarəsi
4. Kateqoriya idarəsi
5. Media upload + crop
6. Snapshot + rollback
7. Analitika paneli
8. Audit log görünüşü
9. Kataloq ayarları (settings)

Bu 9 mövzunun hər biri ayrı fayla çıxarılacaq.

---

## Yaradılacaq Qovluq Strukturu

```
site/src/components/admin/
├── AdminShell.tsx              ← naviqasiya tab-ları, layout qabığı
├── sections/
│   ├── ProductsSection.tsx     ← məhsul siyahısı, redaktə, sil, əlavə et
│   ├── BrandsSection.tsx       ← brend CRUD
│   ├── CategoriesSection.tsx   ← kateqoriya CRUD
│   ├── MediaSection.tsx        ← media upload, crop, sil
│   ├── SnapshotsSection.tsx    ← snapshot yarat, bərpa et, sil
│   ├── AnalyticsSection.tsx    ← analitika qrafik və rəqəmlər
│   ├── LogsSection.tsx         ← audit log siyahısı
│   └── SettingsSection.tsx     ← şirkət məlumatları, şifrə dəyişdirmə
└── index.ts                    ← yalnız re-export
```

---

## İcra Qaydası

### Addım 1: Mövcud `CatalogAdmin.tsx`-i oxu və analiz et

`site/src/components/CatalogAdmin.tsx` faylını tam oxu. İçərisindəki:
- Bütün `interface` və `type` təriflərini müəyyənləşdir
- Hər bir "tab" və ya "section"-ı müəyyənləşdir (admin naviqasiya maddələrini tap)
- Ortaq istifadə olunan helper funksiyaları müəyyənləşdir

### Addım 2: `site/src/components/admin/` qovluğunu yarat

```bash
mkdir -p site/src/components/admin/sections
```

### Addım 3: Hər bölməni öz faylına köçür

**Bölmələri köçürərkən qaydalar:**
- Hər fayl yalnız öz bölməsinə aid komponentləri saxlayır
- Props tipi hər faylın başında `interface` olaraq təyin edilir
- Ortaq tipləri `site/src/types/product.ts`-dən import et — yenidən yaratma
- `catalogApi` hər bölmədə birbaşa import edilə bilər
- Hər section komponenti `export const SectionAdi: React.FC<Props> = (...)` formatında olur

**Minimum Props interfeysi (hər section üçün fərqli olacaq):**

```typescript
// ProductsSection.tsx üçün nümunə
interface ProductsSectionProps {
  products: Product[];
  brands: Brand[];
  categories: CatalogCategory[];
  csrfToken: string;
  theme: ThemeColors;
  showToast: (msg: string) => void;
  onProductsChange: (products: Product[]) => void;
}
```

### Addım 4: `AdminShell.tsx` yarat

Bu fayl naviqasiya tab-larını saxlayır və aktiv tab-a görə müvafiq section-ı render edir:

```typescript
import React, { useState } from 'react';
import { ThemeColors } from '../../types/theme';
import { AdminPayload } from '../../services/catalogApi';
import { ProductsSection } from './sections/ProductsSection';
import { BrandsSection } from './sections/BrandsSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { MediaSection } from './sections/MediaSection';
import { SnapshotsSection } from './sections/SnapshotsSection';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { LogsSection } from './sections/LogsSection';
import { SettingsSection } from './sections/SettingsSection';

type AdminTab =
  | 'products'
  | 'brands'
  | 'categories'
  | 'media'
  | 'snapshots'
  | 'analytics'
  | 'logs'
  | 'settings';

interface AdminShellProps {
  initial: AdminPayload;
  theme: ThemeColors;
  showToast: (msg: string) => void;
  onSave: (data: any) => Promise<void>;
  onPublish: (data: any) => Promise<void>;
  onUpload: (file: File) => Promise<any>;
  onLogout: () => Promise<void>;
}

export const AdminShell: React.FC<AdminShellProps> = ({
  initial,
  theme,
  showToast,
  onSave,
  onPublish,
  onUpload,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [data, setData] = useState(initial);

  // Tab siyahısı
  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'products', label: 'Məhsullar' },
    { id: 'brands', label: 'Brendlər' },
    { id: 'categories', label: 'Kateqoriyalar' },
    { id: 'media', label: 'Media' },
    { id: 'snapshots', label: 'Snapshotlar' },
    { id: 'analytics', label: 'Analitika' },
    { id: 'logs', label: 'Loglar' },
    { id: 'settings', label: 'Ayarlar' },
  ];

  return (
    <div className="admin-shell" style={{ background: theme.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div className="admin-header" style={{ borderColor: theme.border }}>
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                color: activeTab === tab.id ? theme.primary : theme.textMuted,
                borderBottomColor: activeTab === tab.id ? theme.primary : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={onLogout} className="admin-logout-btn">
          Çıxış
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {activeTab === 'products' && (
          <ProductsSection
            products={data.products}
            brands={data.brands}
            categories={data.categories}
            csrfToken={data.csrfToken}
            theme={theme}
            showToast={showToast}
            onProductsChange={(products) => setData((prev) => ({ ...prev, products }))}
          />
        )}
        {activeTab === 'brands' && (
          <BrandsSection
            brands={data.brands}
            csrfToken={data.csrfToken}
            theme={theme}
            showToast={showToast}
            onBrandsChange={(brands) => setData((prev) => ({ ...prev, brands }))}
          />
        )}
        {activeTab === 'categories' && (
          <CategoriesSection
            categories={data.categories}
            csrfToken={data.csrfToken}
            theme={theme}
            showToast={showToast}
            onCategoriesChange={(categories) => setData((prev) => ({ ...prev, categories }))}
          />
        )}
        {activeTab === 'media' && (
          <MediaSection
            products={data.products}
            csrfToken={data.csrfToken}
            theme={theme}
            showToast={showToast}
            onUpload={onUpload}
          />
        )}
        {activeTab === 'snapshots' && (
          <SnapshotsSection
            csrfToken={data.csrfToken}
            theme={theme}
            showToast={showToast}
          />
        )}
        {activeTab === 'analytics' && (
          <AnalyticsSection
            analytics={data.analytics}
            products={data.products}
            csrfToken={data.csrfToken}
            theme={theme}
          />
        )}
        {activeTab === 'logs' && (
          <LogsSection csrfToken={data.csrfToken} theme={theme} />
        )}
        {activeTab === 'settings' && (
          <SettingsSection
            settings={data.settings}
            csrfToken={data.csrfToken}
            theme={theme}
            showToast={showToast}
            onSave={onSave}
            onPublish={() => onPublish(data)}
            onSettingsChange={(settings) => setData((prev) => ({ ...prev, settings }))}
          />
        )}
      </div>
    </div>
  );
};
```

### Addım 5: `index.ts` yarat

```typescript
// site/src/components/admin/index.ts
export { AdminShell } from './AdminShell';
```

### Addım 6: Köhnə `CatalogAdmin.tsx`-i yenilə

`site/src/components/CatalogAdmin.tsx` faylının **bütün mövcud məzmununu** aşağıdakı ilə **əvəz et** (köhnə kodu saxlama):

```typescript
// Bu fayl artıq yalnız yönləndirmə üçündür.
// Əsl məntiq site/src/components/admin/ qovluğundadır.
export { AdminShell as CatalogAdmin } from './admin';
```

### Addım 7: `App.tsx`-dəki import-u yoxla

`site/src/App.tsx` içərisindəki:
```typescript
const CatalogAdmin = lazy(() =>
  import('./components/CatalogAdmin').then((m) => ({ default: m.CatalogAdmin }))
);
```
Bu import dəyişdirilməməlidir — köhnə `CatalogAdmin.tsx` artıq re-export etdiyi üçün işləyəcək.

---

## Vacib Qeydlər

**Bölmə içərisindəki mövcud məntiqi itirmə:**
- Məhsul redaktə formu məntiqi (validation, field-lər) `ProductsSection`-a tam köçürülməlidir
- Media crop məntiqi `MediaSection`-a köçürülməlidir
- Analitika tarix filtri (custom date range) `AnalyticsSection`-a köçürülməlidir
- Audit log pagination `LogsSection`-a köçürülməlidir
- Şifrə dəyişdirmə formu `SettingsSection`-a köçürülməlidir

**Hər section özü API çağırışlarını idarə edir** — `AdminShell`-dən prop kimi `onSave` göndərmək yerinə, hər section öz `catalogApi` çağırışlarını birbaşa edə bilər (bu daha sadədir).

---

## Uğur Meyarı

- [ ] `site/src/components/admin/` qovluğu 10 fayl içərir
- [ ] Köhnə `CatalogAdmin.tsx` 7038 sətirdən 3 sətirə enib (yalnız re-export)
- [ ] Admin panel brauzerdə açılır və bütün tablar işləyir
- [ ] Məhsul əlavə etmə, redaktə etmə, silmə işləyir
- [ ] Media upload işləyir
- [ ] `npm run build` uğurla tamamlanır
- [ ] `npm test` bütün testlər keçir
