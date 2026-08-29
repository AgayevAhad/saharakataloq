import React, { useMemo, useState } from 'react';
import { BarChart3, Boxes, Building2, Copy, Eye, Facebook, FolderPlus, Globe, Instagram, LogOut, Mail, MapPin, MessageCircle, Pencil, Phone, Plus, Rocket, Save, Search, Trash2, UploadCloud, X, Zap } from 'lucide-react';
import { AdminPayload } from '../services/catalogApi';
import { Brand, CatalogAnalytics, CatalogCategory, CatalogData, CatalogSettings, Product, ProductMedia, ProductSpecItem, TechnologyArticle } from '../types/product';
import { DEFAULT_COUNTRIES, DEFAULT_ARTICLES } from '../data/catalog';
import { ThemeColors } from '../types/theme';
import { SaharaLogo } from './SaharaLogo';
import { AdminCatalogPreview } from './AdminCatalogPreview';

interface Props {
  initial: AdminPayload;
  theme: ThemeColors;
  onSave: (catalog: CatalogData) => Promise<void>;
  onPublish: (catalog: CatalogData) => Promise<void>;
  onUpload: (file: File) => Promise<ProductMedia>;
  onLogout: () => Promise<void>;
  showToast: (message: string) => void;
}

type Tab = 'dashboard' | 'products' | 'brands' | 'categories' | 'articles' | 'contact';
type CompletenessFilter = 'all' | 'missing-media' | 'missing-specs' | 'draft';
const slugify = (text: string) => text.toLocaleLowerCase('az').replace(/ə/g, 'e').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}`;
const emptyProduct = (brands: Brand[], categories: CatalogCategory[]): Product => ({
  id: newId('product'), code: '', title: '', brandId: brands[0]?.id || '', category: categories[0]?.id || '',
  categoryName: categories[0]?.name || '', image: '', gallery: [], highlights: [], specs: [], shortDesc: '',
  manufacturingCountry: '', status: 'draft',
});

export const CatalogAdmin: React.FC<Props> = ({ initial, theme, onSave, onPublish, onUpload, onLogout, showToast }) => {
  const [catalog, setCatalog] = useState<CatalogData>(initial);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [query, setQuery] = useState('');
  const [adminCategory, setAdminCategory] = useState<string>('all');
  const [completeness, setCompleteness] = useState<CompletenessFilter>('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
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
      const matchesNeedle = !needle || `${p.code} ${p.title} ${p.categoryName}`.toLocaleLowerCase('az').includes(needle);
      let matchesCompleteness = true;
      if (completeness === 'missing-media') matchesCompleteness = !(p.image || p.media?.length);
      if (completeness === 'missing-specs') matchesCompleteness = !p.specs?.length;
      if (completeness === 'draft') matchesCompleteness = p.status === 'draft';
      return matchesCategory && matchesNeedle && matchesCompleteness;
    });
  }, [adminCategory, catalog.products, completeness, query]);

  const topProducts = useMemo(() => Object.entries(stats.productViews || {}).sort(([, a], [, b]) => b - a).slice(0, 5), [stats.productViews]);

  const persist = async () => {
    setSaving(true);
    try { await onSave(catalog); showToast('Dəyişikliklər qaralama olaraq saxlanıldı.'); }
    catch (e) { showToast(`Xəta: ${e instanceof Error ? e.message : 'Saxlamaq olmadı'}`); }
    finally { setSaving(false); }
  };

  const publish = async () => {
    setSaving(true);
    try { await onPublish(catalog); showToast('Kataloq uğurla public edildi!'); }
    catch (e) { showToast(`Xəta: ${e instanceof Error ? e.message : 'Public etmək olmadı'}`); }
    finally { setSaving(false); }
  };

  const upsertProduct = (item: Product) => {
    const categoryName = catalog.categories.find((c) => c.id === item.category)?.name || item.categoryName;
    const clean = { ...item, categoryName, updatedAt: new Date().toISOString() };
    const exists = catalog.products.some((p) => p.id === clean.id);
    setCatalog((prev) => ({ ...prev, products: exists ? prev.products.map((p) => p.id === clean.id ? clean : p) : [clean, ...prev.products] }));
    setEditing(null);
  };

  const duplicateProduct = (p: Product) => {
    const copy: Product = { ...structuredClone(p), id: newId('product'), code: `${p.code}-KOPYA`, title: `${p.title} (Nüsxə)`, status: 'draft', createdAt: new Date().toISOString() };
    setCatalog((prev) => ({ ...prev, products: [copy, ...prev.products] }));
    showToast(`"${p.code}" məhsulunun nüsxəsi yaradıldı.`);
  };

  const removeProduct = (id: string) => {
    if (!window.confirm('Bu məhsulu silmək istədiyinizdən əminsiniz?')) return;
    setCatalog((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
  };

  const tabs: Array<[Tab, string, React.ReactNode]> = [
    ['dashboard', 'Statistika', <BarChart3 size={17} />],
    ['products', 'Məhsullar', <Boxes size={17} />],
    ['brands', 'Brendlər', <Building2 size={17} />],
    ['categories', 'Kateqoriyalar', <FolderPlus size={17} />],
    ['articles', 'Texnologiyalar (i)', <Zap size={17} />],
    ['contact', 'Əlaqə və Ünvan', <Phone size={17} />],
  ];

  return (
    <main className="admin-shell" style={{ background: theme.bg, color: theme.text }}>
      <aside className="admin-sidebar" style={{ background: theme.bgCard, borderColor: theme.border }}>
        <a href="/" className="admin-brand" aria-label="Sahara kataloqu"><SaharaLogo compact /></a>
        <nav>{tabs.map(([id, label, icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)} style={{ '--admin-primary': theme.primary, color: tab === id ? '#fff' : theme.textSecondary } as React.CSSProperties}>{icon}{label}</button>)}</nav>
        <button className="admin-logout" onClick={onLogout} style={{ color: theme.textMuted }}><LogOut size={17} /> Çıxış</button>
      </aside>

      <section className="admin-main">
        <div className="admin-toolbar">
          <div><h1>{tabs.find(([id]) => id === tab)?.[1]}</h1><p style={{ color: theme.textMuted }}>Real kataloq məlumatlarını, əlaqə və istehsal ölkələrini idarə edin</p></div>
          <div className="admin-toolbar-actions"><button className="preview-admin-btn" onClick={() => setPreviewOpen(true)} disabled={saving}><Eye size={16} /> Önizləmə</button><button onClick={persist} disabled={saving} style={{ background: theme.textSecondary }}><Save size={16} /> Qaralamanı saxla</button><button onClick={publish} disabled={saving} style={{ background: theme.primary }}><Rocket size={16} /> Public et</button></div>
        </div>

        {tab === 'dashboard' && <Dashboard theme={theme} products={catalog.products} brands={catalog.brands} categories={catalog.categories} analytics={stats} topProducts={topProducts} />}

        {tab === 'products' && <>
          <div className="admin-list-actions"><div className="admin-search" style={{ background: theme.bgCard, borderColor: theme.border }}><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Model və ya məhsul axtar..." style={{ color: theme.text }} /></div><select className="admin-category-select" value={adminCategory} onChange={(event) => setAdminCategory(event.target.value)}><option value="all">Bütün kateqoriyalar</option>{catalog.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select className="admin-category-select" aria-label="Tamamlanma filtri" value={completeness} onChange={(event) => setCompleteness(event.target.value as CompletenessFilter)}><option value="all">Bütün vəziyyətlər</option><option value="missing-media">Şəkilsiz</option><option value="missing-specs">Xüsusiyyətləri boş</option><option value="draft">Qaralama</option></select><button onClick={() => setEditing(emptyProduct(catalog.brands.filter((item) => !item.comingSoon), catalog.categories))} style={{ background: theme.primary }}><Plus size={16} /> Yeni məhsul</button></div>
          <div className="admin-table-wrap" style={{ background: theme.bgCard, borderColor: theme.border }}><table><thead><tr style={{ borderColor: theme.border }}><th>Media</th><th>Model / məhsul</th><th>Brend</th><th>Kateqoriya</th><th>İstehsal</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((product) => { const cover = product.image || product.media?.find((item) => item.type === 'image')?.url; return <tr key={product.id} style={{ borderColor: theme.border }}><td><div className="admin-thumb" style={{ background: theme.bgSecondary }}>{cover ? <img src={cover} alt="" /> : <Boxes size={20} />}</div></td><td><b>{product.code}</b><span>{product.title}</span></td><td>{catalog.brands.find((item) => item.id === product.brandId)?.name || '—'}</td><td>{product.categoryName}</td><td>{product.manufacturingCountry || '—'}</td><td><span className={`status-badge ${product.status === 'draft' ? 'draft' : 'published'}`}>{product.status === 'draft' ? 'Qaralama' : 'Yayımda'}</span></td><td><div className="row-actions"><button onClick={() => setEditing(structuredClone(product))} title="Redaktə"><Pencil size={15} /></button><button onClick={() => duplicateProduct(product)} title="Surətini yarat"><Copy size={15} /></button><button onClick={() => removeProduct(product.id)} title="Sil"><Trash2 size={15} /></button></div></td></tr>; })}</tbody></table></div>
        </>}

        {tab === 'brands' && <BrandManager theme={theme} brands={catalog.brands} onChange={(brands) => setCatalog({ ...catalog, brands })} />}
        {tab === 'categories' && <CategoryManager theme={theme} categories={catalog.categories} products={catalog.products} onView={(id) => { setAdminCategory(id); setTab('products'); }} onChange={(categories) => setCatalog({ ...catalog, categories })} />}
        {tab === 'articles' && <ArticleManager theme={theme} articles={catalog.articles || DEFAULT_ARTICLES} onChange={(articles) => setCatalog({ ...catalog, articles })} />}
        {tab === 'contact' && <ContactManager theme={theme} settings={catalog.settings} analytics={stats} products={catalog.products} onChange={(settings) => setCatalog({ ...catalog, settings, countries: settings.countries || catalog.countries })} />}
      </section>
      {editing && <ProductEditor product={editing} brands={catalog.brands} categories={catalog.categories} availableCountries={availableCountries} theme={theme} onUpload={onUpload} onClose={() => setEditing(null)} onSave={upsertProduct} />}
      {previewOpen && <AdminCatalogPreview catalog={catalog} theme={theme} onClose={() => setPreviewOpen(false)} />}
    </main>
  );
};

const Dashboard = ({ theme, products, brands, categories, analytics, topProducts }: { theme: ThemeColors; products: Product[]; brands: Brand[]; categories: CatalogCategory[]; analytics: CatalogAnalytics; topProducts: [string, number][] }) => <div className="dashboard-grid">
  {[['Kataloq baxışı', analytics.catalogViews], ['Məhsullar', products.length], ['WhatsApp / zəng', `${analytics.contactActions.whatsapp} / ${analytics.contactActions.call}`], ['Şəkilsiz / qaralama', `${products.filter((item) => !(item.image || item.media?.length)).length} / ${products.filter((item) => item.status === 'draft').length}`], ['Yayımda', products.filter((item) => item.status !== 'draft').length], ['Brendlər / Kateqoriyalar', `${brands.length} / ${categories.length}`]].map(([label, value]) => <article key={label} className="stat-card" style={{ background: theme.bgCard, borderColor: theme.border }}><span style={{ color: theme.textMuted }}>{label}</span><strong>{value}</strong></article>)}
  <article className="top-products-card" style={{ background: theme.bgCard, borderColor: theme.border }}><h2>Ən çox baxılan məhsullar</h2>{topProducts.length ? topProducts.map(([id, count], index) => <div key={id} style={{ borderColor: theme.border }}><span>{index + 1}. {products.find((item) => item.id === id)?.title || id}</span><b>{count} baxış</b></div>) : <p style={{ color: theme.textMuted }}>Statistika baxışlar gəldikcə burada görünəcək.</p>}</article>
</div>;

const ContactManager = ({ theme, settings, analytics, products, onChange }: { theme: ThemeColors; settings: CatalogSettings; analytics: CatalogAnalytics; products: Product[]; onChange: (settings: CatalogSettings) => void }) => {
  const ranked = Object.entries(analytics.contactActionsByProduct || {}).map(([id, actions]) => ({ id, ...actions, total: actions.whatsapp + actions.call })).sort((a, b) => b.total - a.total).slice(0, 10);
  const total = analytics.contactActions.whatsapp + analytics.contactActions.call;
  const [newCountry, setNewCountry] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const currentCountries = settings.countries && settings.countries.length ? settings.countries : DEFAULT_COUNTRIES;
  const currentPhones = settings.phoneNumbers && settings.phoneNumbers.length
    ? settings.phoneNumbers
    : settings.phoneNumber ? [settings.phoneNumber] : [];

  const addCountry = () => {
    const trimmed = newCountry.trim();
    if (!trimmed) return;
    if (currentCountries.includes(trimmed)) return setNewCountry('');
    onChange({ ...settings, countries: [...currentCountries, trimmed] });
    setNewCountry('');
  };

  const removeCountry = (countryToRemove: string) => {
    onChange({ ...settings, countries: currentCountries.filter((c) => c !== countryToRemove) });
  };

  const addPhone = () => {
    const trimmed = newPhone.trim();
    if (!trimmed) return;
    if (currentPhones.includes(trimmed)) return setNewPhone('');
    const updated = [...currentPhones, trimmed];
    onChange({ ...settings, phoneNumbers: updated, phoneNumber: updated[0] });
    setNewPhone('');
  };

  const removePhone = (phoneToRemove: string) => {
    const updated = currentPhones.filter((p) => p !== phoneToRemove);
    onChange({ ...settings, phoneNumbers: updated, phoneNumber: updated[0] || '' });
  };

  return <div className="contact-admin-grid">
    {/* Company & Contact Information Card */}
    <article className="manager-card contact-settings-card" style={{ background: theme.bgCard, borderColor: theme.border }}>
      <div><h2>Şirkət, Ünvan və Əlaqə Məlumatları</h2><p style={{ color: theme.textMuted }}>Kataloqun altında və mobil əlaqə düymələrində görünəcək rəsmi məlumatları daxil edin.</p></div>
      <div className="form-grid">
        <label><span>Şirkət Adı</span><input value={settings.companyName || ''} onChange={(e) => onChange({ ...settings, companyName: e.target.value })} placeholder="Sahara Electronics" /></label>
        <label><span><MapPin size={14} /> Şirkət Ünvanı</span><input value={settings.address || ''} onChange={(e) => onChange({ ...settings, address: e.target.value })} placeholder="Bakı şəhəri, Sədərək Ticarət Mərkəzi" /></label>
        <label><span><MessageCircle size={14} /> WhatsApp nömrəsi</span><input inputMode="tel" value={settings.whatsappNumber} onChange={(event) => onChange({ ...settings, whatsappNumber: event.target.value })} placeholder="994501234567" /></label>
        <label><span><Mail size={14} /> E-poçt ünvanı</span><input type="email" value={settings.email || ''} onChange={(e) => onChange({ ...settings, email: e.target.value })} placeholder="info@saharaelectronics.az" /></label>
        <label><span>İş saatları</span><input value={settings.workingHours || ''} onChange={(e) => onChange({ ...settings, workingHours: e.target.value })} placeholder="Bazar ertəsi - Bazar: 09:00 - 18:00" /></label>
        <label><span><Instagram size={14} color="#e1306c" /> Instagram İstifadəçi Adı</span><input value={settings.instagramUsername || ''} onChange={(e) => onChange({ ...settings, instagramUsername: e.target.value })} placeholder="@sahara.electronics" /></label>
        <label><span>Instagram Profil Linki</span><input value={settings.instagramUrl || ''} onChange={(e) => onChange({ ...settings, instagramUrl: e.target.value })} placeholder="https://instagram.com/sahara.electronics" /></label>
        <label><span><Facebook size={14} color="#1877f2" /> Facebook Səhifə / İstifadəçi Adı</span><input value={settings.facebookUsername || ''} onChange={(e) => onChange({ ...settings, facebookUsername: e.target.value })} placeholder="Sahara Electronics" /></label>
        <label><span>Facebook Səhifə Linki</span><input value={settings.facebookUrl || ''} onChange={(e) => onChange({ ...settings, facebookUrl: e.target.value })} placeholder="https://facebook.com/saharaelectronics" /></label>
        <label><span>Google Maps Linki</span><input value={settings.mapUrl || ''} onChange={(e) => onChange({ ...settings, mapUrl: e.target.value })} placeholder="https://maps.google.com/..." /></label>
        <label><span>Ünvan haqqında qeyd</span><input value={settings.locationNote || ''} onChange={(e) => onChange({ ...settings, locationNote: e.target.value })} placeholder="Məişət texnikası satışı və rəsmi zəmanət mərkəzi" /></label>
      </div>

      {/* Multiple Phone Numbers Manager */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Phone size={15} color={theme.primary} /> Əlaqə Telefon Nömrələri (İstədiyiniz qədər əlavə edə bilərsiniz)
        </h3>
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
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: theme.bgSecondary,
                border: `1px solid ${theme.border}`,
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                color: theme.primary,
              }}
            >
              <span>{ph}</span>
              <button
                type="button"
                onClick={() => removePhone(ph)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '2px', display: 'flex' }}
                title="Nömrəni sil"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <small style={{ color: theme.textMuted, display: 'block', marginTop: '12px' }}>Dəyişiklik əvvəlcə qaralamaya yazılır. “Public et” əməliyyatından sonra footerdə, headerdə və mobil düymələrdə yenilənir.</small>
    </article>

    {/* Production Countries Manager Card */}
    <article className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border }}>
      <div><h2><Globe size={16} /> İstehsal Ölkələri İdarəetməsi</h2><p style={{ color: theme.textMuted }}>Məhsul redaktə edərkən seçilə biləcək ölkələr siyahısı. İstədiyiniz yeni ölkəni əlavə edə bilərsiniz.</p></div>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
        {currentCountries.map((country) => (
          <div
            key={country}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            <span>{country}</span>
            <button
              type="button"
              onClick={() => removeCountry(country)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textMuted, padding: '2px', display: 'flex' }}
              title="Ölkəni sil"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </article>

    <section className="contact-stat-row">
      <article className="stat-card whatsapp-stat" style={{ background: theme.bgCard, borderColor: theme.border }}><span>WhatsApp seçimi</span><strong>{analytics.contactActions.whatsapp}</strong><small>{total ? Math.round(analytics.contactActions.whatsapp / total * 100) : 0}%</small></article>
      <article className="stat-card call-stat" style={{ background: theme.bgCard, borderColor: theme.border }}><span>Zəng seçimi</span><strong>{analytics.contactActions.call}</strong><small>{total ? Math.round(analytics.contactActions.call / total * 100) : 0}%</small></article>
    </section>
    <article className="top-products-card" style={{ background: theme.bgCard, borderColor: theme.border }}><h2>Ən çox əlaqə seçilən məhsullar</h2>{ranked.length ? ranked.map((item, index) => <div key={item.id} style={{ borderColor: theme.border }}><span>{index + 1}. {products.find((product) => product.id === item.id)?.title || item.id}</span><b><MessageCircle size={13} /> {item.whatsapp} · <Phone size={13} /> {item.call}</b></div>) : <p style={{ color: theme.textMuted }}>Müştəri seçimləri gəldikcə burada görünəcək.</p>}</article>
  </div>;
};

const ArticleManager = ({ theme, articles, onChange }: { theme: ThemeColors; articles: TechnologyArticle[]; onChange: (value: TechnologyArticle[]) => void }) => {
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
    onChange(articles.map((item, i) => i === index ? { ...item, ...patch } : item));
  };

  const addAdvantage = (artIndex: number) => {
    const art = articles[artIndex];
    const updated = [...(art.advantages || []), { title: 'Yeni üstünlük', desc: 'İzahı buraya yazın' }];
    update(artIndex, { advantages: updated });
  };

  const updateAdvantage = (artIndex: number, advIndex: number, patch: Partial<{ title: string; desc: string }>) => {
    const art = articles[artIndex];
    const updated = (art.advantages || []).map((item, i) => i === advIndex ? { ...item, ...patch } : item);
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
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '13px' }}>Kataloqun mərkəzindəki dinamik karuseldə və yuxarıdakı "i" düyməsində görünəcək texnoloji məlumatları istədiyiniz qədər əlavə edin və idarə edin.</p>
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

          {/* Advantages Manager */}
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

const BrandManager = ({ theme, brands, onChange }: { theme: ThemeColors; brands: Brand[]; onChange: (value: Brand[]) => void }) => {
  const add = () => onChange([...brands, { id: newId('brand'), name: 'Yeni brend', slug: newId('brand'), originCountry: '', manufacturingCountries: [], active: true }]);
  const update = (index: number, patch: Partial<Brand>) => onChange(brands.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <div className="manager-list"><button className="manager-add" onClick={add} style={{ background: theme.primary }}><Plus size={16} /> Brend əlavə et</button>{brands.map((brand, index) => <article key={brand.id} className="manager-card" style={{ background: theme.bgCard, borderColor: theme.border }}><div className="form-grid"><label>Brend adı<input value={brand.name} onChange={(e) => update(index, { name: e.target.value, slug: slugify(e.target.value) || brand.slug })} /></label><label>Mənşə ölkəsi<input value={brand.originCountry} onChange={(e) => update(index, { originCountry: e.target.value })} /></label><label>İstehsal ölkələri (vergüllə)<input value={brand.manufacturingCountries.join(', ')} onChange={(e) => update(index, { manufacturingCountries: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></label><label>Logo yolu<input value={brand.logo || ''} onChange={(e) => update(index, { logo: e.target.value })} placeholder="/media/logo.svg" /></label></div><label>Açıqlama<textarea value={brand.description || ''} onChange={(e) => update(index, { description: e.target.value })} /></label><div className="manager-footer"><div className="manager-checks"><label><input type="checkbox" checked={brand.active} onChange={(e) => update(index, { active: e.target.checked })} /> Aktiv</label><label><input type="checkbox" checked={!!brand.comingSoon} onChange={(e) => update(index, { comingSoon: e.target.checked })} /> Tezliklə</label></div><button onClick={() => window.confirm('Brend silinsin?') && onChange(brands.filter((_, i) => i !== index))}><Trash2 size={15} /> Sil</button></div></article>)}</div>;
};

const CategoryManager = ({ theme, categories, products, onView, onChange }: { theme: ThemeColors; categories: CatalogCategory[]; products: Product[]; onView: (id: string) => void; onChange: (value: CatalogCategory[]) => void }) => {
  const add = () => onChange([...categories, { id: newId('category'), name: 'Yeni kateqoriya', slug: newId('category'), active: true, sortOrder: categories.length }]);
  const update = (index: number, patch: Partial<CatalogCategory>) => onChange(categories.map((item, i) => i === index ? { ...item, ...patch } : item));
  return <div className="manager-list"><button className="manager-add" onClick={add} style={{ background: theme.primary }}><Plus size={16} /> Kateqoriya əlavə et</button>{categories.map((category, index) => <article key={category.id} className="manager-card compact" style={{ background: theme.bgCard, borderColor: theme.border }}><div className="category-manager-title"><div><b>{category.name}</b><span>{products.filter((item) => item.category === category.id).length} məhsul</span></div><button onClick={() => onView(category.id)}><Eye size={14} /> Məhsullara bax</button></div><div className="form-grid"><label>Kateqoriya adı<input value={category.name} onChange={(e) => update(index, { name: e.target.value, slug: slugify(e.target.value) || category.slug })} /></label><label>İkon adı<input value={category.icon || ''} onChange={(e) => update(index, { icon: e.target.value })} placeholder="Layers" /></label><label>Sıra<input type="number" value={category.sortOrder || 0} onChange={(e) => update(index, { sortOrder: Number(e.target.value) })} /></label></div><div className="manager-footer"><label><input type="checkbox" checked={category.active} onChange={(e) => update(index, { active: e.target.checked })} /> Aktiv</label><button onClick={() => window.confirm('Kateqoriya silinsin?') && onChange(categories.filter((_, i) => i !== index))}><Trash2 size={15} /> Sil</button></div></article>)}</div>;
};

const ProductEditor = ({ product: initial, brands, categories, availableCountries, theme, onUpload, onClose, onSave }: { product: Product; brands: Brand[]; categories: CatalogCategory[]; availableCountries: string[]; theme: ThemeColors; onUpload: (file: File) => Promise<ProductMedia>; onClose: () => void; onSave: (value: Product) => void }) => {
  const [product, setProduct] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [customCountryInput, setCustomCountryInput] = useState('');
  const [isAddingCustomCountry, setIsAddingCustomCountry] = useState(false);

  const change = <K extends keyof Product>(key: K, value: Product[K]) => setProduct((current) => ({ ...current, [key]: value }));
  const addMedia = (type: ProductMedia['type']) => change('media', [...(product.media || []), { id: newId('media'), type, url: '', alt: '' }]);
  const updateMedia = (index: number, patch: Partial<ProductMedia>) => change('media', (product.media || []).map((item, i) => i === index ? { ...item, ...patch } : item));
  const addSpec = () => change('specs', [...product.specs, { id: newId('spec'), name: '', value: '', group: 'Əsas' }]);
  const updateSpec = (index: number, patch: Partial<ProductSpecItem>) => change('specs', product.specs.map((item, i) => i === index ? { ...item, ...patch } : item));

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

  return <div className="product-modal-backdrop" onClick={onClose}><div className="product-modal-card" style={{ background: theme.bgCard, borderColor: theme.border }} onClick={(e) => e.stopPropagation()}><header className="product-modal-header" style={{ borderColor: theme.border }}><div><h2>{product.code ? `${product.code} redaktəsi` : 'Yeni məhsul'}</h2><p style={{ color: theme.textMuted }}>Kataloq üçün bütün parametrləri birbaşa buradan doldurun</p></div><button onClick={onClose}><X size={18} /></button></header><div className="product-modal-body"><div className="form-grid"><label>Model kodu *<input value={product.code} onChange={(e) => change('code', e.target.value)} placeholder="ARDO-3000" /></label><label>Məhsul adı *<input value={product.title} onChange={(e) => change('title', e.target.value)} placeholder="ARDO 3000 Aspirator" /></label><label>Brend *<select value={product.brandId || ''} onChange={(e) => change('brandId', e.target.value)}>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label><label>Kateqoriya *<select value={product.category} onChange={(e) => change('category', e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>İstehsal ölkəsi<div style={{ display: 'flex', gap: '6px' }}><select value={product.manufacturingCountry || ''} onChange={(e) => { if (e.target.value === '__custom__') { setIsAddingCustomCountry(true); } else { setIsAddingCustomCountry(false); change('manufacturingCountry', e.target.value); } }} style={{ flex: 1 }}><option value="">Seçilməyib (Göstərilməsin)</option>{availableCountries.map((country) => <option key={country} value={country}>{country}</option>)}<option value="__custom__">+ Başqa ölkə yaz...</option></select></div>{isAddingCustomCountry && <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}><input value={customCountryInput} onChange={(e) => setCustomCountryInput(e.target.value)} placeholder="Ölkə adını daxil edin" /><button type="button" onClick={() => { if (customCountryInput.trim()) { change('manufacturingCountry', customCountryInput.trim()); setIsAddingCustomCountry(false); setCustomCountryInput(''); } }} style={{ background: theme.primary, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Təsdiqlə</button></div>}</label><label>Status<select value={product.status || 'draft'} onChange={(e) => change('status', e.target.value as Product['status'])}><option value="draft">Qaralama (Saytda görünməsin)</option><option value="published">Yayımda (Kataloqda görünsün)</option></select></label><label>Badge mətni<input value={product.badgeText || ''} onChange={(e) => change('badgeText', e.target.value)} placeholder="SABAF Forsunka, İnvertor..." /></label><label>Əsas foto URL<input value={product.image || ''} onChange={(e) => change('image', e.target.value)} placeholder="/media/ardo-3000.png" /></label></div><label>Qısa xülasə<textarea value={product.shortDesc || ''} onChange={(e) => change('shortDesc', e.target.value)} rows={2} /></label><div className="editor-section"><div className="editor-section-head"><h3>Media faylları</h3><label className="upload-btn" style={{ background: theme.primary }}><UploadCloud size={15} /> {uploading ? 'Yüklənir...' : 'Kompüterdən yüklə'}<input type="file" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} /></label><button type="button" onClick={() => addMedia('image')}><Plus size={14} /> Şəkil URL</button><button type="button" onClick={() => addMedia('video')}><Plus size={14} /> Video URL</button></div>{uploadError && <p style={{ color: '#ef4444', fontSize: '12px' }}>{uploadError}</p>}<div className="media-list-grid">{(product.media || []).map((m, i) => <div key={m.id || i} className="media-row-card"><div className="admin-thumb">{m.type === 'video' ? '🎬' : m.url ? <img src={m.url} alt="" /> : '🖼'}</div><input value={m.url} onChange={(e) => updateMedia(i, { url: e.target.value })} placeholder="Media URL" /><input value={m.alt || ''} onChange={(e) => updateMedia(i, { alt: e.target.value })} placeholder="Alt izah" /><button type="button" onClick={() => change('image', m.url)} title="Əsas şəkil et">⭐</button><button type="button" onClick={() => change('media', (product.media || []).filter((_, idx) => idx !== i))} title="Sil"><Trash2 size={14} /></button></div>)}</div></div><div className="editor-section"><div className="editor-section-head"><h3>Texniki xüsusiyyətlər</h3><button type="button" onClick={addSpec}><Plus size={14} /> Yeni parametr</button></div><div className="specs-list-grid">{product.specs.map((spec, i) => <div key={spec.id || i} className="spec-row-card"><input value={spec.name} onChange={(e) => updateSpec(i, { name: e.target.value })} placeholder="Parametr adı" /><input value={spec.value} onChange={(e) => updateSpec(i, { value: e.target.value })} placeholder="Dəyəri" /><input value={spec.description || ''} onChange={(e) => updateSpec(i, { description: e.target.value })} placeholder="İzahı" /><button type="button" onClick={() => change('specs', product.specs.filter((_, idx) => idx !== i))}><Trash2 size={14} /></button></div>)}</div></div></div><footer className="product-modal-footer" style={{ borderColor: theme.border }}><button type="button" onClick={onClose}>İmtina</button><button type="button" onClick={() => { if (!product.code.trim() || !product.title.trim()) return alert('Model kodu və adı mütləqdir'); onSave(product); }} style={{ background: theme.primary, color: '#fff' }}>Yadda saxla</button></footer></div></div>;
};
