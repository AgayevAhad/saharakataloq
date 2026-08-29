import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Boxes,
  Building2,
  Copy,
  Download,
  Eye,
  FileSpreadsheet,
  FolderPlus,
  Globe,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Pencil,
  Phone,
  Plus,
  Rocket,
  Save,
  Search,
  Tag,
  Trash2,
  Upload,
  UploadCloud,
  X,
  Zap,
} from 'lucide-react';
import { AdminPayload, catalogApi } from '../services/catalogApi';
import {
  Brand,
  CatalogCategory,
  CatalogData,
  CatalogSettings,
  Product,
  ProductMedia,
  ProductSpecItem,
  StoreAddress,
  TechnologyArticle,
} from '../types/product';
import { DEFAULT_ADDRESSES, DEFAULT_COUNTRIES, DEFAULT_SETTINGS } from '../data/catalog';
import { ThemeColors } from '../types/theme';
import { SaharaLogo } from './SaharaLogo';
import { AdminCatalogPreview } from './AdminCatalogPreview';
import {
  downloadFile,
  exportProductsToCsv,
  generateCsvTemplate,
  importProductsFromCsv,
} from '../utils/csv';

interface Props {
  initial: AdminPayload;
  theme: ThemeColors;
  onSave: (catalog: CatalogData) => Promise<void>;
  onPublish: (catalog: CatalogData) => Promise<void>;
  onUpload: (file: File) => Promise<ProductMedia>;
  onLogout: () => Promise<void>;
  showToast: (message: string) => void;
}

type Tab =
  | 'dashboard'
  | 'products'
  | 'brands'
  | 'categories'
  | 'appearance'
  | 'articles'
  | 'contact'
  | 'security';

type CompletenessFilter = 'all' | 'missing-media' | 'missing-specs' | 'draft';

const slugify = (text: string) =>
  text
    .toLocaleLowerCase('az')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70);

const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;

const emptyProduct = (brands: Brand[], categories: CatalogCategory[]): Product => ({
  id: newId('product'),
  code: '',
  title: '',
  brandId: brands[0]?.id || 'ardo',
  category: categories[0]?.id || 'hood',
  categoryName: categories[0]?.name || 'Aspiratorlar',
  image: '',
  gallery: [],
  highlights: [],
  specs: [],
  shortDesc: '',
  manufacturingCountry: '',
  price: undefined,
  oldPrice: undefined,
  currency: '₼',
  badgeText: '',
  badgeColor: 'red',
  stockStatus: 'in_stock',
  status: 'draft',
});

const PRESET_COLORS = [
  { name: 'Sahara Qırmızı', color: '#dc2626' },
  { name: 'Kral Göyü', color: '#2563eb' },
  { name: 'Zümrüd Yaşılı', color: '#16a34a' },
  { name: 'Bənövşəyi', color: '#7c3aed' },
  { name: 'Kəhrəba Qızılı', color: '#d97706' },
  { name: 'Klassik Qara', color: '#0f172a' },
];

export const CatalogAdmin: React.FC<Props> = ({
  initial,
  theme,
  onSave,
  onPublish,
  onUpload,
  onLogout,
  showToast,
}) => {
  const [catalog, setCatalog] = useState<CatalogData>(initial);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [query, setQuery] = useState('');
  const [adminCategory, setAdminCategory] = useState<string>('all');
  const [completeness, setCompleteness] = useState<CompletenessFilter>('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const stats = initial.analytics;

  const availableCountries = useMemo(() => {
    return catalog.settings.countries && catalog.settings.countries.length
      ? catalog.settings.countries
      : DEFAULT_COUNTRIES;
  }, [catalog.settings.countries]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('az');
    return catalog.products.filter((p) => {
      const matchesCategory = adminCategory === 'all' || p.category === adminCategory;
      const matchesNeedle =
        !needle ||
        `${p.code} ${p.title} ${p.categoryName} ${p.badgeText || ''}`
          .toLocaleLowerCase('az')
          .includes(needle);
      let matchesCompleteness = true;
      if (completeness === 'missing-media') matchesCompleteness = !(p.image || p.media?.length);
      if (completeness === 'missing-specs') matchesCompleteness = !p.specs?.length;
      if (completeness === 'draft') matchesCompleteness = p.status === 'draft';
      return matchesCategory && matchesNeedle && matchesCompleteness;
    });
  }, [adminCategory, catalog.products, completeness, query]);

  const topProducts = useMemo(
    () =>
      Object.entries(stats.productViews || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    [stats.productViews]
  );

  const persist = async () => {
    setSaving(true);
    try {
      await onSave(catalog);
      showToast('Dəyişikliklər qaralama olaraq saxlanıldı.');
    } catch (e) {
      showToast(`Xəta: ${e instanceof Error ? e.message : 'Saxlamaq olmadı'}`);
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setSaving(true);
    try {
      await onPublish(catalog);
      showToast('Kataloq uğurla canlıda yeniləndi!');
    } catch (e) {
      showToast(`Xəta: ${e instanceof Error ? e.message : 'Public etmək olmadı'}`);
    } finally {
      setSaving(false);
    }
  };

  const upsertProduct = (item: Product) => {
    const categoryName =
      catalog.categories.find((c) => c.id === item.category)?.name || item.categoryName;
    const clean = { ...item, categoryName, updatedAt: new Date().toISOString() };
    const exists = catalog.products.some((p) => p.id === clean.id);
    setCatalog((prev) => ({
      ...prev,
      products: exists
        ? prev.products.map((p) => (p.id === clean.id ? clean : p))
        : [clean, ...prev.products],
    }));
    setEditing(null);
  };

  const duplicateProduct = (p: Product) => {
    const copy: Product = {
      ...structuredClone(p),
      id: newId('product'),
      code: `${p.code}-KOPYA`,
      title: `${p.title} (Nüsxə)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setCatalog((prev) => ({ ...prev, products: [copy, ...prev.products] }));
    showToast(`"${p.code}" məhsulunun nüsxəsi yaradıldı.`);
  };

  const removeProduct = (id: string) => {
    if (!window.confirm('Bu məhsulu silmək istədiyinizdən əminsiniz?')) return;
    setCatalog((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
  };

  // CSV Export
  const handleExportCsv = () => {
    try {
      const csvContent = exportProductsToCsv(catalog.products, catalog.categories, catalog.brands);
      downloadFile(
        csvContent,
        `sahara-kataloq-mehsullar-${new Date().toISOString().slice(0, 10)}.csv`
      );
      showToast('Bütün məhsullar CSV/Excel formatında endirildi.');
    } catch (e) {
      showToast(`İxrac xətası: ${e instanceof Error ? e.message : 'Uğursuz oldu'}`);
    }
  };

  // CSV Template Download
  const handleDownloadTemplate = () => {
    const templateContent = generateCsvTemplate();
    downloadFile(templateContent, 'sahara-kataloq-sablon.csv');
    showToast('Nümunə CSV şablonu endirildi.');
  };

  // CSV Import
  const handleImportCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { products: imported, errors } = importProductsFromCsv(
        text,
        catalog.categories,
        catalog.brands
      );
      if (errors.length > 0) {
        alert(`Bəzi xətalar baş verdi:\n${errors.slice(0, 5).join('\n')}`);
      }
      if (imported.length === 0) {
        showToast('CSV faylından heç bir məhsul oxuna bilmədi.');
        return;
      }

      setCatalog((prev) => {
        // Merge or replace by product code
        const existingMap = new Map(prev.products.map((p) => [p.code.toLowerCase(), p]));
        for (const p of imported) {
          existingMap.set(p.code.toLowerCase(), p);
        }
        return { ...prev, products: Array.from(existingMap.values()) };
      });

      showToast(`${imported.length} məhsul uğurla idxal edildi və qaralamaya əlavə olundu.`);
    } catch (err) {
      showToast(`İdxal xətası: ${err instanceof Error ? err.message : 'Fayl oxunmadı'}`);
    } finally {
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) return showToast('Zəhmət olmasa köhnə şifrəni daxil edin');
    if (!newPassword || newPassword.length < 6)
      return showToast('Yeni şifrə ən azı 6 simvoldan ibarət olmalıdır');
    if (newPassword !== confirmPassword)
      return showToast('Yeni şifrə ilə təsdiq şifrəsi eyni deyil');

    setPasswordUpdating(true);
    try {
      await catalogApi.changePassword(oldPassword, newPassword, initial.csrfToken);
      showToast('Admin şifrəsi uğurla yeniləndi!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(`Xəta: ${err instanceof Error ? err.message : 'Şifrə dəyişdirilə bilmədi'}`);
    } finally {
      setPasswordUpdating(false);
    }
  };

  const tabs: Array<[Tab, string, React.ReactNode]> = [
    ['dashboard', 'Statistika', <BarChart3 size={17} />],
    ['products', 'Məhsullar', <Boxes size={17} />],
    ['brands', 'Brendlər', <Building2 size={17} />],
    ['categories', 'Kateqoriyalar', <FolderPlus size={17} />],
    ['appearance', 'Görünüş & Mətnlər', <Palette size={17} />],
    ['articles', 'Texnologiyalar (i)', <Zap size={17} />],
    ['contact', 'Əlaqə & Sosial', <Phone size={17} />],
    ['security', 'Təhlükəsizlik', <Lock size={17} />],
  ];

  return (
    <div className="admin-shell" style={{ color: theme.text, background: theme.bg }}>
      <aside className="admin-sidebar" style={{ background: theme.bgCard, borderColor: theme.border }}>
        <a href="/" className="admin-brand">
          <SaharaLogo className="admin-login-logo" isDark={theme.mode === 'dark'} />
        </a>
        <nav>
          {tabs.map(([id, label, icon]) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
              style={{ color: tab === id ? '#ffffff' : theme.text }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button
          className="admin-logout"
          onClick={onLogout}
          style={{ color: '#ef4444', borderColor: theme.border }}
        >
          <LogOut size={16} />
          <span>Çıxış et</span>
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-toolbar" style={{ borderColor: theme.border }}>
          <div>
            <h1>Admin İdarəetmə Paneli</h1>
            <p style={{ color: theme.textMuted }}>
              Kataloqun bütün məlumatlarını, görünüşünü və məhsullarını birbaşa buradan idarə edin
            </p>
          </div>
          <div className="admin-toolbar-actions">
            <button
              className="preview-admin-btn"
              onClick={() => setPreviewOpen(true)}
              title="Canlı kataloq görünüşünü test et"
            >
              <Eye size={15} />
              <span>Önizləmə</span>
            </button>
            <button
              onClick={persist}
              disabled={saving}
              style={{ background: theme.bgSecondary, color: theme.text, border: `1px solid ${theme.border}` }}
            >
              <Save size={15} />
              <span>{saving ? 'Saxlanılır...' : 'Qaralamanı saxla'}</span>
            </button>
            <button
              onClick={publish}
              disabled={saving}
              style={{ background: theme.primary, color: '#fff' }}
              title="Dəyişiklikləri ictimai kataloqda aktivləşdir"
            >
              <Rocket size={15} />
              <span>Kataloqda Yayınla</span>
            </button>
          </div>
        </header>

        {/* TAB 1: DASHBOARD */}
        {tab === 'dashboard' && (
          <div className="dashboard-grid">
            <article className="stat-card" style={{ background: theme.bgCard, borderColor: theme.border }}>
              <span>Ümumi Kataloq Baxışları</span>
              <strong style={{ color: theme.primary }}>{stats.catalogViews}</strong>
            </article>
            <article className="stat-card" style={{ background: theme.bgCard, borderColor: theme.border }}>
              <span>Məhsul Baxışları Sayı</span>
              <strong>{Object.values(stats.productViews || {}).reduce((a, b) => a + b, 0)}</strong>
            </article>
            <article className="stat-card" style={{ background: theme.bgCard, borderColor: theme.border }}>
              <span>WhatsApp Klikləri</span>
              <strong style={{ color: '#16a34a' }}>{stats.contactActions.whatsapp}</strong>
            </article>
            <article className="stat-card" style={{ background: theme.bgCard, borderColor: theme.border }}>
              <span>Zəng Klikləri</span>
              <strong style={{ color: '#2563eb' }}>{stats.contactActions.call}</strong>
            </article>
            <article className="top-products-card" style={{ background: theme.bgCard, borderColor: theme.border }}>
              <h2>Ən çox baxılan məhsullar</h2>
              {topProducts.length ? (
                topProducts.map(([id, count], index) => (
                  <div key={id} style={{ borderColor: theme.border }}>
                    <span>
                      {index + 1}. {catalog.products.find((p) => p.id === id)?.title || id}
                    </span>
                    <b>{count} baxış</b>
                  </div>
                ))
              ) : (
                <p style={{ color: theme.textMuted }}>Məlumat toplanır...</p>
              )}
            </article>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {tab === 'products' && (
          <div>
            <div className="admin-list-actions" style={{ flexWrap: 'wrap', gap: '10px' }}>
              <div className="admin-search" style={{ background: theme.bgCard, borderColor: theme.border }}>
                <Search size={15} color={theme.textMuted} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Məhsul adı, kod və ya nişan ilə axtar..."
                  style={{ color: theme.text }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={adminCategory}
                  onChange={(e) => setAdminCategory(e.target.value)}
                  className="admin-category-select"
                >
                  <option value="all">Bütün kateqoriyalar</option>
                  {catalog.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  value={completeness}
                  onChange={(e) => setCompleteness(e.target.value as CompletenessFilter)}
                  className="admin-category-select"
                >
                  <option value="all">Bütün statuslar</option>
                  <option value="draft">Yalnız Qaralamalar</option>
                  <option value="missing-media">Şəkli olmayanlar</option>
                  <option value="missing-specs">Texniki göstəricisi boş olanlar</option>
                </select>

                {/* Bulk CSV Buttons */}
                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: theme.bgSecondary,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                  title="Məhsulları Excel/CSV kimi endir"
                >
                  <Download size={14} />
                  <span>CSV İxrac</span>
                </button>

                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                  title="CSV faylı ilə məhsulları toplu yüklə"
                >
                  <Upload size={14} />
                  <span>CSV İdxal</span>
                  <input
                    ref={csvFileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImportCsv}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'transparent',
                    color: theme.textMuted,
                    border: `1px dashed ${theme.border}`,
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                  title="Nümunə CSV şablon faylını endir"
                >
                  <FileSpreadsheet size={13} />
                  <span>Şablon Endir</span>
                </button>

                <button
                  className="manager-add"
                  onClick={() => setEditing(emptyProduct(catalog.brands, catalog.categories))}
                  style={{ background: theme.primary, color: '#fff' }}
                >
                  <Plus size={16} /> Yeni Məhsul
                </button>
              </div>
            </div>

            <div className="admin-table-wrap" style={{ borderColor: theme.border, background: theme.bgCard }}>
              <table>
                <thead>
                  <tr style={{ borderBottomColor: theme.border }}>
                    <th>Foto</th>
                    <th>Model Kodu</th>
                    <th>Məhsul Adı</th>
                    <th>Qiymət</th>
                    <th>Nişan (Badge)</th>
                    <th>Kateqoriya</th>
                    <th>Brend</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => (
                    <tr key={product.id} style={{ borderBottomColor: theme.border }}>
                      <td>
                        <div className="admin-prod-thumb">
                          {product.image ? <img src={product.image} alt="" /> : '🖼'}
                        </div>
                      </td>
                      <td>
                        <strong>{product.code}</strong>
                      </td>
                      <td>{product.title}</td>
                      <td>
                        {product.price ? (
                          <span>
                            <b>{product.price} {product.currency || '₼'}</b>
                            {product.oldPrice && (
                              <del style={{ color: theme.textMuted, marginLeft: '4px', fontSize: '11px' }}>
                                {product.oldPrice}
                              </del>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: theme.textMuted }}>—</span>
                        )}
                      </td>
                      <td>
                        {product.badgeText ? (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor:
                                product.badgeColor === 'green'
                                  ? '#16a34a'
                                  : product.badgeColor === 'blue'
                                  ? '#2563eb'
                                  : product.badgeColor === 'amber'
                                  ? '#d97706'
                                  : product.badgeColor === 'purple'
                                  ? '#7c3aed'
                                  : theme.primary,
                              color: '#ffffff',
                            }}
                          >
                            {product.badgeText}
                          </span>
                        ) : (
                          <span style={{ color: theme.textMuted }}>—</span>
                        )}
                      </td>
                      <td>{product.categoryName}</td>
                      <td>
                        {catalog.brands.find((b) => b.id === product.brandId)?.name ||
                          product.brandId}
                      </td>
                      <td>
                        <span
                          className={`status-pill ${
                            product.status === 'published' ? 'published' : 'draft'
                          }`}
                        >
                          {product.status === 'published' ? 'Yayımda' : 'Qaralama'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => duplicateProduct(product)}
                            title="Nüsxəsini çıxar"
                            style={{ background: 'transparent', color: theme.textMuted, border: 'none', cursor: 'pointer' }}
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            onClick={() => setEditing(product)}
                            title="Redaktə et"
                            style={{ background: 'transparent', color: theme.primary, border: 'none', cursor: 'pointer' }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => removeProduct(product.id)}
                            title="Sil"
                            style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: theme.textMuted }}>
                        Axtarışa uyğun məhsul tapılmadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BRANDS */}
        {tab === 'brands' && (
          <BrandManager
            theme={theme}
            brands={catalog.brands}
            onChange={(brands) => setCatalog((p) => ({ ...p, brands }))}
          />
        )}

        {/* TAB 4: CATEGORIES */}
        {tab === 'categories' && (
          <CategoryManager
            theme={theme}
            categories={catalog.categories}
            products={catalog.products}
            onView={(catId) => {
              setAdminCategory(catId);
              setTab('products');
            }}
            onChange={(categories) => setCatalog((p) => ({ ...p, categories }))}
          />
        )}

        {/* TAB 5: APPEARANCE & TEXTS */}
        {tab === 'appearance' && (
          <AppearanceManager
            theme={theme}
            settings={catalog.settings}
            onChange={(settings) => setCatalog((p) => ({ ...p, settings }))}
          />
        )}

        {/* TAB 6: ARTICLES & INVERTER GUIDE */}
        {tab === 'articles' && (
          <ArticleManager
            theme={theme}
            articles={catalog.articles || []}
            onChange={(articles) => setCatalog((p) => ({ ...p, articles }))}
          />
        )}

        {/* TAB 7: CONTACT & SOCIAL */}
        {tab === 'contact' && (
          <ContactManager
            theme={theme}
            settings={catalog.settings}
            analytics={stats}
            products={catalog.products}
            onChange={(settings) => setCatalog((p) => ({ ...p, settings }))}
          />
        )}

        {/* TAB 8: SECURITY & PASSWORD */}
        {tab === 'security' && (
          <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border, maxWidth: '540px' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={18} color={theme.primary} />
                Admin Giriş Şifrəsini Dəyişdir
              </h2>
              <p style={{ color: theme.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
                Admin panelə daxil olmaq üçün istifadə edilən təhlükəsiz şifrəni birbaşa buradan yeniləyə bilərsiniz.
              </p>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '14px' }}>
              <label>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Hazırkı (Köhnə) Şifrə</span>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Köhnə şifrənizi daxil edin"
                  required
                />
              </label>

              <label>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Yeni Şifrə</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ən azı 6 simvoldan ibarət yeni şifrə"
                  required
                />
              </label>

              <label>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Yeni Şifrənin Təkrarı</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Yeni şifrəni yenidən yazın"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={passwordUpdating}
                style={{
                  background: theme.primary,
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 18px',
                  borderRadius: '9px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                {passwordUpdating ? 'Yenilənir...' : 'Şifrəni Təsdiqlə və Yenilə'}
              </button>
            </form>
          </article>
        )}
      </main>

      {/* PRODUCT EDITOR MODAL */}
      {editing && (
        <ProductEditor
          product={editing}
          brands={catalog.brands}
          categories={catalog.categories}
          availableCountries={availableCountries}
          theme={theme}
          onUpload={onUpload}
          onClose={() => setEditing(null)}
          onSave={upsertProduct}
        />
      )}

      {/* LIVE PREVIEW MODAL */}
      {previewOpen && (
        <AdminCatalogPreview
          catalog={catalog}
          theme={theme}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </div>
  );
};

// APPEARANCE MANAGER
const AppearanceManager = ({
  theme,
  settings,
  onChange,
}: {
  theme: ThemeColors;
  settings: CatalogSettings;
  onChange: (value: CatalogSettings) => void;
}) => {
  const update = (patch: Partial<CatalogSettings>) => {
    onChange({ ...settings, ...patch });
  };

  return (
    <div className="manager-list">
      <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={18} color={theme.primary} />
            Saytın Əsas Rəngi və Şrifti
          </h2>
          <p style={{ color: theme.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
            Kataloqda düymələrin, vurğuların və nişanların əsas rəngini seçin.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.color}
              type="button"
              onClick={() => update({ primaryColor: preset.color })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '10px',
                border: settings.primaryColor === preset.color ? `2px solid ${preset.color}` : `1px solid ${theme.border}`,
                backgroundColor: settings.primaryColor === preset.color ? `${preset.color}15` : theme.bgSecondary,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                color: theme.text,
              }}
            >
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.color, display: 'inline-block' }} />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>

        <div className="form-grid">
          <label>
            <span>Xüsusi HEX Rəngi</span>
            <input
              value={settings.primaryColor || '#dc2626'}
              onChange={(e) => update({ primaryColor: e.target.value })}
              placeholder="#dc2626"
            />
          </label>
          <label>
            <span>Şrift Tipi (Typography)</span>
            <select value={settings.fontFamily || 'Inter'} onChange={(e) => update({ fontFamily: e.target.value })}>
              <option value="Inter">Inter & Outfit (Standart Müasir)</option>
              <option value="Roboto">Roboto (Klassik & Dəqiq)</option>
              <option value="Segoe UI">Segoe UI (Sistem Şrifti)</option>
            </select>
          </label>
        </div>
      </article>

      <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Saytın Başlıqları və Şüarları</h2>
          <p style={{ color: theme.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
            Brauzer başlığı, başlıq altındakı mətn və kataloq bölməsinin şüarlarını dəyişin.
          </p>
        </div>

        <div className="form-grid">
          <label>
            <span>Saytın Əsas Başlığı (Browser Title)</span>
            <input
              value={settings.siteTitle || DEFAULT_SETTINGS.siteTitle}
              onChange={(e) => update({ siteTitle: e.target.value })}
            />
          </label>
          <label>
            <span>Başlıq Şüarı (Header Caption)</span>
            <input
              value={settings.headerCaption || DEFAULT_SETTINGS.headerCaption}
              onChange={(e) => update({ headerCaption: e.target.value })}
            />
          </label>
          <label>
            <span>Kataloq Bölməsi Başlığı</span>
            <input
              value={settings.catalogHeading || DEFAULT_SETTINGS.catalogHeading}
              onChange={(e) => update({ catalogHeading: e.target.value })}
            />
          </label>
          <label>
            <span>Kataloq Bölməsi Alt Başlığı</span>
            <input
              value={settings.catalogSubheading || DEFAULT_SETTINGS.catalogSubheading}
              onChange={(e) => update({ catalogSubheading: e.target.value })}
            />
          </label>
          <label>
            <span>Hero Banner Başlığı</span>
            <input
              value={settings.heroBannerTitle || DEFAULT_SETTINGS.heroBannerTitle}
              onChange={(e) => update({ heroBannerTitle: e.target.value })}
            />
          </label>
          <label>
            <span>Hero Banner Alt Şüarı</span>
            <input
              value={settings.heroBannerSubtitle || DEFAULT_SETTINGS.heroBannerSubtitle}
              onChange={(e) => update({ heroBannerSubtitle: e.target.value })}
            />
          </label>
        </div>
      </article>

      <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Düymə Yazıları və Naviqasiya Mətnləri</h2>
          <p style={{ color: theme.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
            Kartların və üzən panellərin üzərində görünən düymələrin yazılarını fərdiləşdirin.
          </p>
        </div>

        <div className="form-grid">
          <label>
            <span>WhatsApp Düyməsi Mətni</span>
            <input
              value={settings.whatsappButtonText || DEFAULT_SETTINGS.whatsappButtonText}
              onChange={(e) => update({ whatsappButtonText: e.target.value })}
            />
          </label>
          <label>
            <span>Zəng Düyməsi Mətni</span>
            <input
              value={settings.callButtonText || DEFAULT_SETTINGS.callButtonText}
              onChange={(e) => update({ callButtonText: e.target.value })}
            />
          </label>
          <label>
            <span>Paylaş Düyməsi Mətni</span>
            <input
              value={settings.shareButtonText || DEFAULT_SETTINGS.shareButtonText}
              onChange={(e) => update({ shareButtonText: e.target.value })}
            />
          </label>
          <label>
            <span>Yuxarı Qalx Düyməsi Mətni</span>
            <input
              value={settings.scrollTopButtonText || DEFAULT_SETTINGS.scrollTopButtonText}
              onChange={(e) => update({ scrollTopButtonText: e.target.value })}
            />
          </label>
        </div>
      </article>

      <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Footer və Müəllif Hüquqları Mətnləri</h2>
        </div>

        <div className="form-grid">
          <label style={{ gridColumn: '1 / -1' }}>
            <span>Footer Haqqımızda Qısa Mətn</span>
            <textarea
              value={settings.footerAbout || DEFAULT_SETTINGS.footerAbout}
              onChange={(e) => update({ footerAbout: e.target.value })}
              rows={2}
            />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            <span>Müəllif Hüquqları Mətni (Copyright)</span>
            <input
              value={settings.footerCopyright || DEFAULT_SETTINGS.footerCopyright}
              onChange={(e) => update({ footerCopyright: e.target.value })}
            />
          </label>
        </div>
      </article>
    </div>
  );
};

// CONTACT MANAGER
const ContactManager = ({
  theme,
  settings,
  analytics,
  products,
  onChange,
}: {
  theme: ThemeColors;
  settings: CatalogSettings;
  analytics: { contactActions: { whatsapp: number; call: number }; contactActionsByProduct?: Record<string, { whatsapp: number; call: number }> };
  products: Product[];
  onChange: (value: CatalogSettings) => void;
}) => {
  const [newPhone, setNewPhone] = useState('');
  const [newCountry, setNewCountry] = useState('');

  const currentPhones = settings.phoneNumbers || (settings.phoneNumber ? [settings.phoneNumber] : []);
  const currentCountries = settings.countries && settings.countries.length ? settings.countries : DEFAULT_COUNTRIES;

  const currentAddresses: StoreAddress[] = settings.addresses && settings.addresses.length
    ? settings.addresses
    : settings.address
      ? [{ id: 'addr-1', title: 'Əsas Mağaza', address: settings.address, mapUrl: settings.mapUrl || '', workingHours: settings.workingHours || '', note: settings.locationNote || '' }]
      : DEFAULT_ADDRESSES;

  const [newAddrTitle, setNewAddrTitle] = useState('');
  const [newAddrText, setNewAddrText] = useState('');
  const [newAddrMapUrl, setNewAddrMapUrl] = useState('');
  const [newAddrHours, setNewAddrHours] = useState('');
  const [newAddrNote, setNewAddrNote] = useState('');
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);

  const update = (patch: Partial<CatalogSettings>) => {
    onChange({ ...settings, ...patch });
  };

  const addOrUpdateAddress = () => {
    const trimmed = newAddrText.trim();
    if (!trimmed) return;
    const title = newAddrTitle.trim() || `Filial ${currentAddresses.length + 1}`;
    let updated: StoreAddress[];
    if (editingAddrId) {
      updated = currentAddresses.map((a) =>
        a.id === editingAddrId
          ? {
              ...a,
              title,
              address: trimmed,
              mapUrl: newAddrMapUrl.trim(),
              workingHours: newAddrHours.trim(),
              note: newAddrNote.trim(),
            }
          : a
      );
      setEditingAddrId(null);
    } else {
      updated = [
        ...currentAddresses,
        {
          id: newId('addr'),
          title,
          address: trimmed,
          mapUrl: newAddrMapUrl.trim(),
          workingHours: newAddrHours.trim(),
          note: newAddrNote.trim(),
        },
      ];
    }
    update({
      addresses: updated,
      address: updated[0]?.address || '',
      mapUrl: updated[0]?.mapUrl || '',
      workingHours: updated[0]?.workingHours || settings.workingHours,
      locationNote: updated[0]?.note || settings.locationNote,
    });
    setNewAddrTitle('');
    setNewAddrText('');
    setNewAddrMapUrl('');
    setNewAddrHours('');
    setNewAddrNote('');
  };

  const startEditAddress = (addr: StoreAddress) => {
    setEditingAddrId(addr.id);
    setNewAddrTitle(addr.title || '');
    setNewAddrText(addr.address || '');
    setNewAddrMapUrl(addr.mapUrl || '');
    setNewAddrHours(addr.workingHours || '');
    setNewAddrNote(addr.note || '');
  };

  const cancelEditAddress = () => {
    setEditingAddrId(null);
    setNewAddrTitle('');
    setNewAddrText('');
    setNewAddrMapUrl('');
    setNewAddrHours('');
    setNewAddrNote('');
  };

  const removeAddress = (id: string) => {
    const updated = currentAddresses.filter((a) => a.id !== id);
    update({
      addresses: updated,
      address: updated[0]?.address || '',
      mapUrl: updated[0]?.mapUrl || '',
      workingHours: updated[0]?.workingHours || settings.workingHours,
      locationNote: updated[0]?.note || settings.locationNote,
    });
    if (editingAddrId === id) cancelEditAddress();
  };

  const addPhone = () => {
    const trimmed = newPhone.trim();
    if (!trimmed) return;
    if (currentPhones.includes(trimmed)) return;
    const updated = [...currentPhones, trimmed];
    update({ phoneNumbers: updated, phoneNumber: updated[0] });
    setNewPhone('');
  };

  const removePhone = (phone: string) => {
    const updated = currentPhones.filter((p) => p !== phone);
    update({ phoneNumbers: updated, phoneNumber: updated[0] || '' });
  };

  const addCountry = () => {
    const trimmed = newCountry.trim();
    if (!trimmed) return;
    if (currentCountries.includes(trimmed)) return;
    update({ countries: [...currentCountries, trimmed] });
    setNewCountry('');
  };

  const removeCountry = (country: string) => {
    update({ countries: currentCountries.filter((c) => c !== country) });
  };

  return (
    <div className="manager-list">
      <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}>
        <h2>Əsas Əlaqə və Şirkət Məlumatları</h2>
        <div className="form-grid" style={{ marginTop: '14px' }}>
          <label>
            <span>Şirkət Adı</span>
            <input value={settings.companyName || ''} onChange={(e) => update({ companyName: e.target.value })} placeholder="Sahara Electronics" />
          </label>
          <label>
            <span>WhatsApp Nömrəsi (Beynəlxalq formatda)</span>
            <input inputMode="tel" value={settings.whatsappNumber || ''} onChange={(e) => update({ whatsappNumber: e.target.value })} placeholder="994501234567" />
          </label>
          <label>
            <span>Əsas Rəsmi Ünvan (1-ci Ünvan)</span>
            <input
              value={settings.address || ''}
              onChange={(e) => {
                const val = e.target.value;
                const updatedAddrs = currentAddresses.length
                  ? currentAddresses.map((a, i) => i === 0 ? { ...a, address: val } : a)
                  : [{ id: 'addr-1', title: 'Əsas Mağaza', address: val, mapUrl: settings.mapUrl || '' }];
                update({ address: val, addresses: updatedAddrs });
              }}
              placeholder="Bakı şəhəri, Sədərək Ticarət Mərkəzi"
            />
          </label>
          <label>
            <span>Email Ünvanı</span>
            <input value={settings.email || ''} onChange={(e) => update({ email: e.target.value })} placeholder="info@saharaelectronics.az" />
          </label>
          <label>
            <span>İş Saatları</span>
            <input value={settings.workingHours || ''} onChange={(e) => update({ workingHours: e.target.value })} placeholder="09:00 - 18:00" />
          </label>
          <label>
            <span>Xəritə Linki (Google Maps)</span>
            <input value={settings.mapUrl || ''} onChange={(e) => update({ mapUrl: e.target.value })} placeholder="https://maps.google.com/..." />
          </label>
        </div>

        {/* Multi-Phone Manager */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
          <h3 style={{ fontSize: '14px', marginBottom: '8px', color: theme.text }}>Əlaqə Zəng Nömrələri</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              inputMode="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="Məs: 994121234567 və ya +994 50 123 45 67"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhone())}
              style={{ flex: 1 }}
            />
            <button type="button" onClick={addPhone} style={{ background: theme.primary, color: '#fff', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Plus size={15} /> Nömrə Əlavə et
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {currentPhones.map((ph, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: theme.primary }}>
                <span>{ph}</span>
                <button type="button" onClick={() => removePhone(ph)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '2px', display: 'flex' }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* MULTIPLE ADDRESSES / SHOWROOMS MANAGER */}
      <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <MapPin size={18} color={theme.primary} />
              <span>Mağaza və Filial Ünvanları (Çoxsaylı Ünvanlar)</span>
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
              Saytın footer və əlaqə hissəsində görünəcək bütün 1-ci, 2-ci və digər filial/mağaza ünvanlarını idarə edin.
            </p>
          </div>
        </div>

        {/* Add / Edit Address Form */}
        <div style={{ background: theme.bgSecondary, padding: '14px', borderRadius: '10px', border: `1px solid ${theme.border}`, marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: theme.text, fontWeight: 750 }}>
            {editingAddrId ? '✏️ Ünvanı Redaktə Et' : '➕ Yeni Filial / Ünvan Əlavə Et'}
          </h4>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <label>
              <span>Filial / Mağaza Adı</span>
              <input
                value={newAddrTitle}
                onChange={(e) => setNewAddrTitle(e.target.value)}
                placeholder="Məs: 2-ci Filial (Dərnəgül Şourumu)"
              />
            </label>
            <label>
              <span>Dəqiq Ünvan</span>
              <input
                value={newAddrText}
                onChange={(e) => setNewAddrText(e.target.value)}
                placeholder="Məs: Ziya Bünyadov pr. 1965, Şourum 3"
              />
            </label>
            <label>
              <span>Google Maps Linki</span>
              <input
                value={newAddrMapUrl}
                onChange={(e) => setNewAddrMapUrl(e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </label>
            <label>
              <span>İş Saatları</span>
              <input
                value={newAddrHours}
                onChange={(e) => setNewAddrHours(e.target.value)}
                placeholder="Məs: 10:00 - 20:00"
              />
            </label>
            <label style={{ gridColumn: '1 / -1' }}>
              <span>Qeyd / Xüsusi Məlumat</span>
              <input
                value={newAddrNote}
                onChange={(e) => setNewAddrNote(e.target.value)}
                placeholder="Məs: Şourum və anbar satışı, parkinq mövcuddur"
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={addOrUpdateAddress}
              style={{
                background: theme.primary,
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {editingAddrId ? 'Yenilə və Saxla' : 'Ünvanı Əlavə Et'}
            </button>
            {editingAddrId && (
              <button
                type="button"
                onClick={cancelEditAddress}
                style={{
                  background: 'transparent',
                  color: theme.textMuted,
                  border: `1px solid ${theme.border}`,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                İmtina
              </button>
            )}
          </div>
        </div>

        {/* Existing Addresses List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentAddresses.map((addr, idx) => (
            <div
              key={addr.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                padding: '12px 16px',
                borderRadius: '10px',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
                <MapPin size={18} color={theme.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: theme.text }}>
                    {addr.title || `Filial ${idx + 1}`} {idx === 0 && <span style={{ fontSize: '11px', color: theme.primary, fontWeight: 700 }}>(Əsas)</span>}
                  </div>
                  <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '2px' }}>
                    {addr.address}
                  </div>
                  {(addr.workingHours || addr.note) && (
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>
                      {addr.workingHours && `🕒 ${addr.workingHours}`} {addr.note && `• ${addr.note}`}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => startEditAddress(addr)}
                  title="Redaktə et"
                  style={{
                    background: 'transparent',
                    color: theme.primary,
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                  }}
                >
                  <Pencil size={15} />
                </button>
                {currentAddresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddress(addr.id)}
                    title="Sil"
                    style={{
                      background: 'transparent',
                      color: '#ef4444',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px',
                      borderRadius: '6px',
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* Social Media Links */}
      <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}>
        <h2>Sosial Şəbəkə Linkləri</h2>
        <div className="form-grid" style={{ marginTop: '14px' }}>
          <label>
            <span>Instagram İstifadəçi Adı</span>
            <input value={settings.instagramUsername || ''} onChange={(e) => update({ instagramUsername: e.target.value })} placeholder="@saharaelectronics.az" />
          </label>
          <label>
            <span>Instagram URL Linki</span>
            <input value={settings.instagramUrl || ''} onChange={(e) => update({ instagramUrl: e.target.value })} placeholder="https://instagram.com/saharaelectronics.az" />
          </label>
          <label>
            <span>Facebook Hesab Adı</span>
            <input value={settings.facebookUsername || ''} onChange={(e) => update({ facebookUsername: e.target.value })} placeholder="Sahara Electronics" />
          </label>
          <label>
            <span>Facebook URL Linki</span>
            <input value={settings.facebookUrl || ''} onChange={(e) => update({ facebookUrl: e.target.value })} placeholder="https://facebook.com/saharaelectronics" />
          </label>
        </div>
      </article>

      {/* Countries Manager */}
      <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}>
        <h2><Globe size={16} /> İstehsal Ölkələri Siyahısı</h2>
        <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
          <input
            value={newCountry}
            onChange={(e) => setNewCountry(e.target.value)}
            placeholder="Məs: Almaniya, İtaliya, Polşa..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCountry())}
            style={{ flex: 1 }}
          />
          <button type="button" onClick={addCountry} style={{ background: theme.primary, color: '#fff', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={15} /> Əlavə et
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {currentCountries.map((country) => (
            <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}`, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
              <span>{country}</span>
              <button type="button" onClick={() => removeCountry(country)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '2px', display: 'flex' }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </article>

      {/* Contact Statistics Summary */}
      <section className="contact-stat-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <article className="stat-card whatsapp-stat" style={{ background: theme.bgCard, borderColor: theme.border }}>
          <span>WhatsApp seçimi</span>
          <strong style={{ color: '#16a34a', fontSize: '24px' }}>{analytics.contactActions.whatsapp}</strong>
        </article>
        <article className="stat-card call-stat" style={{ background: theme.bgCard, borderColor: theme.border }}>
          <span>Zəng seçimi</span>
          <strong style={{ color: '#2563eb', fontSize: '24px' }}>{analytics.contactActions.call}</strong>
        </article>
      </section>
    </div>
  );
};

// ARTICLE MANAGER
const ArticleManager = ({
  theme,
  articles,
  onChange,
}: {
  theme: ThemeColors;
  articles: TechnologyArticle[];
  onChange: (value: TechnologyArticle[]) => void;
}) => {
  const add = () => {
    const newArt: TechnologyArticle = {
      id: newId('art'),
      title: 'Yeni Texnologiya Başlığı',
      subtitle: 'Bu texnologiyanın qısa izahı və üstünlükləri.',
      badge: '✨ Yeni',
      icon: 'Zap',
      active: true,
      advantages: [
        { title: '1-ci Əsas Üstünlük', desc: 'Müştəriyə faydası və necə işlədiyi.' },
        { title: '2-ci Əsas Üstünlük', desc: 'Enerji və ya rahatlıq qənaəti.' },
      ],
    };
    onChange([...articles, newArt]);
  };

  const update = (index: number, patch: Partial<TechnologyArticle>) => {
    onChange(articles.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addAdvantage = (artIndex: number) => {
    const art = articles[artIndex];
    const updated = [...(art.advantages || []), { title: 'Yeni üstünlük', desc: 'İzahı buraya yazın' }];
    update(artIndex, { advantages: updated });
  };

  const updateAdvantage = (artIndex: number, advIndex: number, patch: Partial<{ title: string; desc: string }>) => {
    const art = articles[artIndex];
    const updated = (art.advantages || []).map((item, i) => (i === advIndex ? { ...item, ...patch } : item));
    update(artIndex, { advantages: updated });
  };

  const removeAdvantage = (artIndex: number, advIndex: number) => {
    const art = articles[artIndex];
    const updated = (art.advantages || []).filter((_, i) => i !== advIndex);
    update(artIndex, { advantages: updated });
  };

  return (
    <div className="manager-list">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0' }}>Texnologiyalar və "i" Məlumat Bələdçisi</h2>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '13px' }}>
            Kataloqun karuselində və başlıqdakı "i" pəncərəsində görünəcək texnologiya məqalələri.
          </p>
        </div>
        <button className="manager-add" onClick={add} style={{ background: theme.primary, color: '#fff', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 750, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} /> Yeni Texnologiya Əlavə Et
        </button>
      </div>

      {articles.map((article, index) => (
        <article key={article.id} className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px', padding: '20px', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
          <div className="form-grid">
            <label>
              <span>Texnologiya Başlığı</span>
              <input value={article.title} onChange={(e) => update(index, { title: e.target.value })} />
            </label>
            <label>
              <span>Qısa İzah / Xülasə</span>
              <input value={article.subtitle} onChange={(e) => update(index, { subtitle: e.target.value })} />
            </label>
            <label>
              <span>Xüsusi Nişan (Badge)</span>
              <input value={article.badge || ''} onChange={(e) => update(index, { badge: e.target.value })} placeholder="Məs: ⚡ Qənaət və Səssiz" />
            </label>
            <label>
              <span>İkon Tipi</span>
              <select value={article.icon || 'Zap'} onChange={(e) => update(index, { icon: e.target.value })}>
                <option value="Zap">Zap (İldırım / İnvertor)</option>
                <option value="Flame">Flame (Alov / Sabaf Qaz)</option>
                <option value="Wind">Wind (Külək / 3D Konveksiya)</option>
                <option value="ShieldCheck">ShieldCheck (Təhlükəsizlik)</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: theme.text }}>4 Əsas Üstünlük və İzahları</h4>
              <button
                type="button"
                onClick={() => addAdvantage(index)}
                style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, color: theme.text, padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
              >
                + Üstünlük əlavə et
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(article.advantages || []).map((adv, aIdx) => (
                <div key={aIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: theme.bgSecondary, padding: '8px 12px', borderRadius: '8px' }}>
                  <input
                    value={adv.title}
                    onChange={(e) => updateAdvantage(index, aIdx, { title: e.target.value })}
                    placeholder="Üstünlük adı"
                    style={{ flex: 1, minWidth: '140px', fontWeight: 700 }}
                  />
                  <input
                    value={adv.desc}
                    onChange={(e) => updateAdvantage(index, aIdx, { desc: e.target.value })}
                    placeholder="Ətraflı izahı"
                    style={{ flex: 2 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeAdvantage(index, aIdx)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '4px' }}
                    title="Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="manager-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${theme.border}` }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={article.active !== false} onChange={(e) => update(index, { active: e.target.checked })} />
              <b>Kataloqda və Karuseldə Aktivdir</b>
            </label>
            <button
              onClick={() => window.confirm('Bu texnologiya məlumatı silinsin?') && onChange(articles.filter((_, i) => i !== index))}
              style={{ background: 'none', border: `1px solid ${theme.border}`, color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Trash2 size={15} /> Sil
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

// BRAND MANAGER
const BrandManager = ({
  theme,
  brands,
  onChange,
}: {
  theme: ThemeColors;
  brands: Brand[];
  onChange: (value: Brand[]) => void;
}) => {
  const add = () =>
    onChange([
      ...brands,
      {
        id: newId('brand'),
        name: 'Yeni brend',
        slug: newId('brand'),
        originCountry: '',
        manufacturingCountries: [],
        active: true,
      },
    ]);
  const update = (index: number, patch: Partial<Brand>) =>
    onChange(brands.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="manager-list">
      <button className="manager-add" onClick={add} style={{ background: theme.primary }}>
        <Plus size={16} /> Brend əlavə et
      </button>
      {brands.map((brand, index) => (
        <article key={brand.id} className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border }}>
          <div className="form-grid">
            <label>
              <span>Brend adı</span>
              <input
                value={brand.name}
                onChange={(e) => update(index, { name: e.target.value, slug: slugify(e.target.value) || brand.slug })}
              />
            </label>
            <label>
              <span>Mənşə ölkəsi</span>
              <input
                value={brand.originCountry}
                onChange={(e) => update(index, { originCountry: e.target.value })}
              />
            </label>
            <label>
              <span>İstehsal ölkələri (vergüllə)</span>
              <input
                value={brand.manufacturingCountries.join(', ')}
                onChange={(e) =>
                  update(index, {
                    manufacturingCountries: e.target.value
                      .split(',')
                      .map((x) => x.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <label>
              <span>Logo URL</span>
              <input
                value={brand.logo || ''}
                onChange={(e) => update(index, { logo: e.target.value })}
                placeholder="/media/brands/logo.svg"
              />
            </label>
          </div>
          <label style={{ marginTop: '10px' }}>
            <span>Haqqında Açıqlama</span>
            <textarea
              value={brand.description || ''}
              onChange={(e) => update(index, { description: e.target.value })}
              rows={2}
            />
          </label>
          <div className="manager-footer" style={{ marginTop: '12px' }}>
            <div className="manager-checks">
              <label>
                <input
                  type="checkbox"
                  checked={brand.active}
                  onChange={(e) => update(index, { active: e.target.checked })}
                />{' '}
                Aktiv
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!brand.comingSoon}
                  onChange={(e) => update(index, { comingSoon: e.target.checked })}
                />{' '}
                Tezliklə
              </label>
            </div>
            <button
              onClick={() => window.confirm('Brend silinsin?') && onChange(brands.filter((_, i) => i !== index))}
            >
              <Trash2 size={15} /> Sil
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

// CATEGORY MANAGER
const CategoryManager = ({
  theme,
  categories,
  products,
  onView,
  onChange,
}: {
  theme: ThemeColors;
  categories: CatalogCategory[];
  products: Product[];
  onView: (id: string) => void;
  onChange: (value: CatalogCategory[]) => void;
}) => {
  const add = () =>
    onChange([
      ...categories,
      {
        id: newId('category'),
        name: 'Yeni kateqoriya',
        slug: newId('category'),
        active: true,
        sortOrder: categories.length,
      },
    ]);
  const update = (index: number, patch: Partial<CatalogCategory>) =>
    onChange(categories.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="manager-list">
      <button className="manager-add" onClick={add} style={{ background: theme.primary }}>
        <Plus size={16} /> Kateqoriya əlavə et
      </button>
      {categories.map((category, index) => (
        <article key={category.id} className="manager-card compact" style={{ background: theme.bgCard, borderColor: theme.border }}>
          <div className="category-manager-title">
            <div>
              <b>{category.name}</b>
              <span>{products.filter((item) => item.category === category.id).length} məhsul</span>
            </div>
            <button onClick={() => onView(category.id)}>
              <Eye size={14} /> Məhsullara bax
            </button>
          </div>
          <div className="form-grid">
            <label>
              <span>Kateqoriya adı</span>
              <input
                value={category.name}
                onChange={(e) => update(index, { name: e.target.value, slug: slugify(e.target.value) || category.slug })}
              />
            </label>
            <label>
              <span>İkon adı (Lucide)</span>
              <input
                value={category.icon || ''}
                onChange={(e) => update(index, { icon: e.target.value })}
                placeholder="Wind, Snowflake, Box, Flame, Layers..."
              />
            </label>
            <label>
              <span>Sıra nömrəsi</span>
              <input
                type="number"
                value={category.sortOrder || 0}
                onChange={(e) => update(index, { sortOrder: Number(e.target.value) })}
              />
            </label>
          </div>
          <div className="manager-footer" style={{ marginTop: '10px' }}>
            <label>
              <input
                type="checkbox"
                checked={category.active}
                onChange={(e) => update(index, { active: e.target.checked })}
              />{' '}
              Aktiv
            </label>
            <button
              onClick={() => window.confirm('Kateqoriya silinsin?') && onChange(categories.filter((_, i) => i !== index))}
            >
              <Trash2 size={15} /> Sil
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

// PRODUCT EDITOR MODAL
const ProductEditor = ({
  product: initial,
  brands,
  categories,
  availableCountries,
  theme,
  onUpload,
  onClose,
  onSave,
}: {
  product: Product;
  brands: Brand[];
  categories: CatalogCategory[];
  availableCountries: string[];
  theme: ThemeColors;
  onUpload: (file: File) => Promise<ProductMedia>;
  onClose: () => void;
  onSave: (value: Product) => void;
}) => {
  const [product, setProduct] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [customCountryInput, setCustomCountryInput] = useState('');
  const [isAddingCustomCountry, setIsAddingCustomCountry] = useState(false);

  const change = <K extends keyof Product>(key: K, value: Product[K]) =>
    setProduct((current) => ({ ...current, [key]: value }));

  const addMedia = (type: ProductMedia['type']) =>
    change('media', [...(product.media || []), { id: newId('media'), type, url: '', alt: '' }]);

  const updateMedia = (index: number, patch: Partial<ProductMedia>) =>
    change('media', (product.media || []).map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const addSpec = () =>
    change('specs', [...product.specs, { id: newId('spec'), name: '', value: '', group: 'Əsas' }]);

  const updateSpec = (index: number, patch: Partial<ProductSpecItem>) =>
    change('specs', product.specs.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const uploaded = await onUpload(file);
      if (!product.image && uploaded.type === 'image') change('image', uploaded.url);
      change('media', [...(product.media || []), uploaded]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Media yüklənmədi');
    } finally {
      setUploading(false);
    }
  };

  const discountPercent =
    product.price && product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div
        className="product-modal-card"
        style={{ background: theme.bgCard, borderColor: theme.border, maxWidth: '900px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="product-modal-header" style={{ borderColor: theme.border }}>
          <div>
            <h2>{product.code ? `${product.code} redaktəsi` : 'Yeni məhsul'}</h2>
            <p style={{ color: theme.textMuted }}>Kataloq üçün bütün parametrləri birbaşa buradan doldurun</p>
          </div>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="product-modal-body">
          <div className="form-grid">
            <label>
              <span>Model kodu *</span>
              <input
                value={product.code}
                onChange={(e) => change('code', e.target.value)}
                placeholder="Məs: ARDO-HD60"
              />
            </label>
            <label>
              <span>Məhsul adı *</span>
              <input
                value={product.title}
                onChange={(e) => change('title', e.target.value)}
                placeholder="Məs: ARDO 60 sm İnox Aspirator"
              />
            </label>
            <label>
              <span>Brend *</span>
              <select value={product.brandId || ''} onChange={(e) => change('brandId', e.target.value)}>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Kateqoriya *</span>
              <select value={product.category} onChange={(e) => change('category', e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            {/* Price & Discount Fields */}
            <label>
              <span>Qiymət ({product.currency || '₼'})</span>
              <input
                type="number"
                value={product.price !== undefined ? product.price : ''}
                onChange={(e) => change('price', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Məs: 450"
              />
            </label>
            <label>
              <span>Köhnə Qiymət (Endirim üçün)</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={product.oldPrice !== undefined ? product.oldPrice : ''}
                  onChange={(e) => change('oldPrice', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Məs: 520"
                  style={{ flex: 1 }}
                />
                {discountPercent && (
                  <span
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    -{discountPercent}%
                  </span>
                )}
              </div>
            </label>

            {/* Campaign Badge & Badge Color */}
            <label>
              <span>Kampaniya Nişanı (Badge)</span>
              <input
                value={product.badgeText || ''}
                onChange={(e) => change('badgeText', e.target.value)}
                placeholder="Məs: Yeni Model, Endirim, Top Model, Kreditlə..."
              />
            </label>
            <label>
              <span>Nişan Rəngi</span>
              <select
                value={product.badgeColor || 'red'}
                onChange={(e) => change('badgeColor', e.target.value as Product['badgeColor'])}
              >
                <option value="red">Qırmızı (Sahara Red)</option>
                <option value="green">Yaşıl (Yeni / Eko)</option>
                <option value="blue">Göy (Xüsusi Təklif)</option>
                <option value="amber">Kəhrəba Qızılı (Top Model)</option>
                <option value="purple">Bənövşəyi (Premium)</option>
              </select>
            </label>

            {/* Stock & Country */}
            <label>
              <span>Stok Vəziyyəti</span>
              <select
                value={product.stockStatus || 'in_stock'}
                onChange={(e) => change('stockStatus', e.target.value as Product['stockStatus'])}
              >
                <option value="in_stock">Anbarda Mövcuddur</option>
                <option value="preorder">Sifarişlə Gətirilir</option>
                <option value="out_of_stock">Müvəqqəti Bitib</option>
              </select>
            </label>

            <label>
              <span>İstehsal ölkəsi</span>
              <select
                value={product.manufacturingCountry || ''}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsAddingCustomCountry(true);
                  } else {
                    setIsAddingCustomCountry(false);
                    change('manufacturingCountry', e.target.value);
                  }
                }}
              >
                <option value="">Seçilməyib</option>
                {availableCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
                <option value="__custom__">+ Başqa ölkə daxil et...</option>
              </select>
              {isAddingCustomCountry && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    value={customCountryInput}
                    onChange={(e) => setCustomCountryInput(e.target.value)}
                    placeholder="Ölkə adını daxil edin"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCountryInput.trim()) {
                        change('manufacturingCountry', customCountryInput.trim());
                        setIsAddingCustomCountry(false);
                        setCustomCountryInput('');
                      }
                    }}
                    style={{ background: theme.primary, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Təsdiqlə
                  </button>
                </div>
              )}
            </label>

            <label>
              <span>Status</span>
              <select
                value={product.status || 'draft'}
                onChange={(e) => change('status', e.target.value as Product['status'])}
              >
                <option value="draft">Qaralama (Kataloqda gizli)</option>
                <option value="published">Yayımda (Kataloqda açıq)</option>
              </select>
            </label>

            <label>
              <span>Əsas foto URL</span>
              <input
                value={product.image || ''}
                onChange={(e) => change('image', e.target.value)}
                placeholder="/media/products/ardo-1.jpg"
              />
            </label>
          </div>

          <label style={{ marginTop: '14px' }}>
            <span>Qısa xülasə və məlumat</span>
            <textarea
              value={product.shortDesc || ''}
              onChange={(e) => change('shortDesc', e.target.value)}
              rows={2}
            />
          </label>

          {/* Media Manager */}
          <div className="editor-section" style={{ marginTop: '16px' }}>
            <div className="editor-section-head">
              <h3>Media faylları (Hover şəkil və videoları)</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label className="upload-btn" style={{ background: theme.primary, cursor: 'pointer' }}>
                  <UploadCloud size={15} /> {uploading ? 'Yüklənir...' : 'Kompüterdən yüklə'}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                <button type="button" onClick={() => addMedia('image')}>
                  <Plus size={14} /> Şəkil URL
                </button>
                <button type="button" onClick={() => addMedia('video')}>
                  <Plus size={14} /> Video URL
                </button>
              </div>
            </div>
            {uploadError && <p style={{ color: '#ef4444', fontSize: '12px' }}>{uploadError}</p>}
            <div className="media-list-grid">
              {(product.media || []).map((m, i) => (
                <div key={m.id || i} className="media-row-card">
                  <div className="admin-thumb">
                    {m.type === 'video' ? '🎬' : m.url ? <img src={m.url} alt="" /> : '🖼'}
                  </div>
                  <input
                    value={m.url}
                    onChange={(e) => updateMedia(i, { url: e.target.value })}
                    placeholder="Media URL"
                  />
                  <input
                    value={m.alt || ''}
                    onChange={(e) => updateMedia(i, { alt: e.target.value })}
                    placeholder="Alt izahı"
                  />
                  <button type="button" onClick={() => change('image', m.url)} title="Əsas şəkil et">
                    ⭐
                  </button>
                  <button
                    type="button"
                    onClick={() => change('media', (product.media || []).filter((_, idx) => idx !== i))}
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Specs Manager */}
          <div className="editor-section" style={{ marginTop: '16px' }}>
            <div className="editor-section-head">
              <h3>Texniki göstəricilər (Parametrlər)</h3>
              <button type="button" onClick={addSpec}>
                <Plus size={14} /> Yeni parametr
              </button>
            </div>
            <div className="specs-list-grid">
              {product.specs.map((spec, i) => (
                <div key={spec.id || i} className="spec-row-card">
                  <input
                    value={spec.name}
                    onChange={(e) => updateSpec(i, { name: e.target.value })}
                    placeholder="Parametr adı"
                  />
                  <input
                    value={spec.value}
                    onChange={(e) => updateSpec(i, { value: e.target.value })}
                    placeholder="Dəyəri"
                  />
                  <input
                    value={spec.description || ''}
                    onChange={(e) => updateSpec(i, { description: e.target.value })}
                    placeholder="Əlavə izah"
                  />
                  <button
                    type="button"
                    onClick={() => change('specs', product.specs.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="product-modal-footer" style={{ borderColor: theme.border }}>
          <button type="button" onClick={onClose}>
            İmtina
          </button>
          <button
            type="button"
            onClick={() => {
              if (!product.code.trim() || !product.title.trim()) return alert('Model kodu və adı mütləqdir');
              onSave(product);
            }}
            style={{ background: theme.primary, color: '#fff' }}
          >
            Yadda saxla
          </button>
        </footer>
      </div>
    </div>
  );
};
