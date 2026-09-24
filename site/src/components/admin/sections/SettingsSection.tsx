import React, { useState } from 'react';
import {
  Globe,
  KeyRound,
  MapPin,
  Palette,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import {
  CatalogSettings,
  Product,
  StoreAddress,
  TechnologyArticle,
} from '../../../types/product';
import { DEFAULT_ADDRESSES, DEFAULT_COUNTRIES, DEFAULT_SETTINGS } from '../../../data/catalog';
import { ThemeColors } from '../../../types/theme';
import { newId, PRESET_COLORS } from '../utils/adminHelpers';

// APPEARANCE MANAGER
export interface AppearanceManagerProps {
  theme: ThemeColors;
  settings: CatalogSettings;
  onChange: (value: CatalogSettings) => void;
}

export const AppearanceManager = ({
  theme,
  settings,
  onChange,
}: AppearanceManagerProps) => {
  const update = (patch: Partial<CatalogSettings>) => {
    onChange({ ...settings, ...patch });
  };

  return (
    <div className="manager-list">
      <article
        className="manager-card"
        style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Palette size={18} color={theme.primary} />
            Saytın Əsas Rəngi və Şrifti
          </h2>
          <p style={{ color: theme.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
            Kataloqda düymələrin, vurğuların və nişanların əsas rəngini seçin.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
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
                border:
                  settings.primaryColor === preset.color
                    ? `2px solid ${preset.color}`
                    : `1px solid ${theme.border}`,
                backgroundColor:
                  settings.primaryColor === preset.color ? `${preset.color}15` : theme.bgSecondary,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                color: theme.text,
              }}
            >
              <span
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: preset.color,
                  display: 'inline-block',
                }}
              />
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
            <select
              value={settings.fontFamily || 'Inter'}
              onChange={(e) => update({ fontFamily: e.target.value })}
            >
              <option value="Inter">Inter & Outfit (Standart Müasir)</option>
              <option value="Roboto">Roboto (Klassik & Dəqiq)</option>
              <option value="Segoe UI">Segoe UI (Sistem Şrifti)</option>
            </select>
          </label>
        </div>
      </article>

      <article
        className="manager-card"
        style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}
      >
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

      <article
        className="manager-card"
        style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
            Düymə Yazıları və Naviqasiya Mətnləri
          </h2>
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

      <article
        className="manager-card"
        style={{ background: theme.bgCard, borderColor: theme.border }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
            Footer və Müəllif Hüquqları Mətnləri
          </h2>
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
export interface ContactManagerProps {
  theme: ThemeColors;
  settings: CatalogSettings;
  analytics: {
    contactActions: { whatsapp: number; call: number };
    contactActionsByProduct?: Record<string, { whatsapp: number; call: number }>;
  };
  products: Product[];
  onChange: (value: CatalogSettings) => void;
}

export const ContactManager = ({
  theme,
  settings,
  analytics,
  products: _products,
  onChange,
}: ContactManagerProps) => {
  const [newPhone, setNewPhone] = useState('');
  const [newCountry, setNewCountry] = useState('');

  const currentPhones =
    settings.phoneNumbers || (settings.phoneNumber ? [settings.phoneNumber] : []);
  const currentCountries =
    settings.countries && settings.countries.length ? settings.countries : DEFAULT_COUNTRIES;

  const currentAddresses: StoreAddress[] =
    settings.addresses && settings.addresses.length
      ? settings.addresses
      : settings.address
        ? [
            {
              id: 'addr-1',
              title: 'Əsas Mağaza',
              address: settings.address,
              mapUrl: settings.mapUrl || '',
              workingHours: settings.workingHours || '',
              note: settings.locationNote || '',
            },
          ]
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
      <article
        className="manager-card"
        style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}
      >
        <h2>Əsas Əlaqə və Şirkət Məlumatları</h2>
        <div className="form-grid" style={{ marginTop: '14px' }}>
          <label>
            <span>Şirkət Adı</span>
            <input
              value={settings.companyName || ''}
              onChange={(e) => update({ companyName: e.target.value })}
              placeholder="Sahara Electronics"
            />
          </label>
          <label>
            <span>WhatsApp Nömrəsi (Beynəlxalq formatda)</span>
            <input
              inputMode="tel"
              value={settings.whatsappNumber || ''}
              onChange={(e) => update({ whatsappNumber: e.target.value })}
              placeholder="994501234567"
            />
          </label>
          <label>
            <span>Əsas Filial Ünvanı (1-ci Ünvan)</span>
            <input
              value={settings.address || ''}
              onChange={(e) => {
                const val = e.target.value;
                const updatedAddrs = currentAddresses.length
                  ? currentAddresses.map((a, i) => (i === 0 ? { ...a, address: val } : a))
                  : [
                      {
                        id: 'addr-1',
                        title: 'Əsas Mağaza',
                        address: val,
                        mapUrl: settings.mapUrl || '',
                      },
                    ];
                update({ address: val, addresses: updatedAddrs });
              }}
              placeholder="Tam ünvan"
            />
          </label>
          <label>
            <span>Email Ünvanı</span>
            <input
              value={settings.email || ''}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="info@saharaelectronics.az"
            />
          </label>
          <label>
            <span>İş Saatları</span>
            <input
              value={settings.workingHours || ''}
              onChange={(e) => update({ workingHours: e.target.value })}
              placeholder="İş saatları"
            />
          </label>
          <label>
            <span>Xəritə Linki (Google Maps)</span>
            <input
              value={settings.mapUrl || ''}
              onChange={(e) => update({ mapUrl: e.target.value })}
              placeholder="Xəritə linki"
            />
          </label>
        </div>

        {/* Multi-Phone Manager */}
        <div
          style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${theme.border}` }}
        >
          <h3 style={{ fontSize: '14px', marginBottom: '8px', color: theme.text }}>
            Əlaqə Zəng Nömrələri
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
            <button
              type="button"
              onClick={addPhone}
              style={{
                background: theme.primary,
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
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
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: theme.textMuted,
                    padding: '2px',
                    display: 'flex',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* MULTIPLE ADDRESSES / SHOWROOMS MANAGER */}
      <article
        className="manager-card"
        style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <MapPin size={18} color={theme.primary} />
              <span>Mağaza və Filial Ünvanları (Çoxsaylı Ünvanlar)</span>
            </h2>
            <p style={{ color: theme.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
              Saytın footer və əlaqə hissəsində görünəcək bütün 1-ci, 2-ci və digər filial/mağaza
              ünvanlarını idarə edin.
            </p>
          </div>
        </div>

        {/* Add / Edit Address Form */}
        <div
          style={{
            background: theme.bgSecondary,
            padding: '14px',
            borderRadius: '10px',
            border: `1px solid ${theme.border}`,
            marginBottom: '16px',
          }}
        >
          <h4
            style={{ margin: '0 0 10px 0', fontSize: '13px', color: theme.text, fontWeight: 750 }}
          >
            {editingAddrId ? '✏️ Ünvanı Redaktə Et' : '➕ Yeni Filial / Ünvan Əlavə Et'}
          </h4>
          <div
            className="form-grid"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}
          >
            <label>
              <span>Filial / Mağaza Adı</span>
              <input
                value={newAddrTitle}
                onChange={(e) => setNewAddrTitle(e.target.value)}
                placeholder="Filial adı"
              />
            </label>
            <label>
              <span>Dəqiq Ünvan</span>
              <input
                value={newAddrText}
                onChange={(e) => setNewAddrText(e.target.value)}
                placeholder="Tam ünvan"
              />
            </label>
            <label>
              <span>Google Maps Linki</span>
              <input
                value={newAddrMapUrl}
                onChange={(e) => setNewAddrMapUrl(e.target.value)}
                placeholder="Xəritə linki"
              />
            </label>
            <label>
              <span>İş Saatları</span>
              <input
                value={newAddrHours}
                onChange={(e) => setNewAddrHours(e.target.value)}
                placeholder="İş saatları"
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <MapPin
                  size={18}
                  color={theme.primary}
                  style={{ flexShrink: 0, marginTop: '2px' }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: theme.text }}>
                    {addr.title || `Filial ${idx + 1}`}{' '}
                    {idx === 0 && (
                      <span style={{ fontSize: '11px', color: theme.primary, fontWeight: 700 }}>
                        (Əsas)
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: theme.textSecondary, marginTop: '2px' }}>
                    {addr.address}
                  </div>
                  {(addr.workingHours || addr.note) && (
                    <div style={{ fontSize: '11px', color: theme.textMuted, marginTop: '2px' }}>
                      {addr.workingHours && `🕒 ${addr.workingHours}`}{' '}
                      {addr.note && `• ${addr.note}`}
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
      <article
        className="manager-card"
        style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}
      >
        <h2>Sosial Şəbəkə Linkləri</h2>
        <div className="form-grid" style={{ marginTop: '14px' }}>
          <label>
            <span>Instagram İstifadəçi Adı</span>
            <input
              value={settings.instagramUsername || ''}
              onChange={(e) => update({ instagramUsername: e.target.value })}
              placeholder="@saharaelectronics.az"
            />
          </label>
          <label>
            <span>Instagram URL Linki</span>
            <input
              value={settings.instagramUrl || ''}
              onChange={(e) => update({ instagramUrl: e.target.value })}
              placeholder="https://instagram.com/saharaelectronics.az"
            />
          </label>
          <label>
            <span>Facebook Hesab Adı</span>
            <input
              value={settings.facebookUsername || ''}
              onChange={(e) => update({ facebookUsername: e.target.value })}
              placeholder="Sahara Electronics"
            />
          </label>
          <label>
            <span>Facebook URL Linki</span>
            <input
              value={settings.facebookUrl || ''}
              onChange={(e) => update({ facebookUrl: e.target.value })}
              placeholder="https://facebook.com/saharaelectronics"
            />
          </label>
        </div>
      </article>

      {/* Countries Manager */}
      <article
        className="manager-card"
        style={{ background: theme.bgCard, borderColor: theme.border, marginBottom: '20px' }}
      >
        <h2>
          <Globe size={16} /> İstehsal Ölkələri Siyahısı
        </h2>
        <div style={{ display: 'flex', gap: '8px', margin: '12px 0' }}>
          <input
            value={newCountry}
            onChange={(e) => setNewCountry(e.target.value)}
            placeholder="Məs: Almaniya, İtaliya, Polşa..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCountry())}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={addCountry}
            style={{
              background: theme.primary,
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={15} /> Əlavə et
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.textMuted,
                  padding: '2px',
                  display: 'flex',
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </article>

      {/* Contact Statistics Summary */}
      <section
        className="contact-stat-row"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        <article
          className="stat-card whatsapp-stat"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <span>WhatsApp seçimi</span>
          <strong style={{ color: '#16a34a', fontSize: '24px' }}>
            {analytics.contactActions.whatsapp}
          </strong>
        </article>
        <article
          className="stat-card call-stat"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <span>Zəng seçimi</span>
          <strong style={{ color: '#2563eb', fontSize: '24px' }}>
            {analytics.contactActions.call}
          </strong>
        </article>
      </section>
    </div>
  );
};

// ARTICLE MANAGER
export interface ArticleManagerProps {
  theme: ThemeColors;
  articles: TechnologyArticle[];
  onChange: (value: TechnologyArticle[]) => void;
}

export const ArticleManager = ({
  theme,
  articles,
  onChange,
}: ArticleManagerProps) => {
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
    const updated = [
      ...(art.advantages || []),
      { title: 'Yeni üstünlük', desc: 'İzahı buraya yazın' },
    ];
    update(artIndex, { advantages: updated });
  };

  const updateAdvantage = (
    artIndex: number,
    advIndex: number,
    patch: Partial<{ title: string; desc: string }>
  ) => {
    const art = articles[artIndex];
    const updated = (art.advantages || []).map((item, i) =>
      i === advIndex ? { ...item, ...patch } : item
    );
    update(artIndex, { advantages: updated });
  };

  const removeAdvantage = (artIndex: number, advIndex: number) => {
    const art = articles[artIndex];
    const updated = (art.advantages || []).filter((_, i) => i !== advIndex);
    update(artIndex, { advantages: updated });
  };

  return (
    <div className="manager-list">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px 0' }}>
            Texnologiyalar və "i" Məlumat Bələdçisi
          </h2>
          <p style={{ color: theme.textMuted, margin: 0, fontSize: '13px' }}>
            Kataloqun karuselində və başlıqdakı "i" pəncərəsində görünəcək texnologiya məqalələri.
          </p>
        </div>
        <button
          className="manager-add"
          onClick={add}
          style={{
            background: theme.primary,
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 750,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Plus size={16} /> Yeni Texnologiya Əlavə Et
        </button>
      </div>

      {articles.map((article, index) => (
        <article
          key={article.id}
          className="manager-card"
          style={{
            background: theme.bgCard,
            borderColor: theme.border,
            marginBottom: '20px',
            padding: '20px',
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
          }}
        >
          <div className="form-grid">
            <label>
              <span>Texnologiya Başlığı</span>
              <input
                value={article.title}
                onChange={(e) => update(index, { title: e.target.value })}
              />
            </label>
            <label>
              <span>Qısa İzah / Xülasə</span>
              <input
                value={article.subtitle}
                onChange={(e) => update(index, { subtitle: e.target.value })}
              />
            </label>
            <label>
              <span>Xüsusi Nişan (Badge)</span>
              <input
                value={article.badge || ''}
                onChange={(e) => update(index, { badge: e.target.value })}
                placeholder="Məs: ⚡ Qənaət və Səssiz"
              />
            </label>
            <label>
              <span>İkon Tipi</span>
              <select
                value={article.icon || 'Zap'}
                onChange={(e) => update(index, { icon: e.target.value })}
              >
                <option value="Zap">Zap (İldırım / İnvertor)</option>
                <option value="Flame">Flame (Alov / Sabaf Qaz)</option>
                <option value="Wind">Wind (Külək / 3D Konveksiya)</option>
                <option value="ShieldCheck">ShieldCheck (Təhlükəsizlik)</option>
              </select>
            </label>
          </div>

          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: theme.text }}>
                4 Əsas Üstünlük və İzahları
              </h4>
              <button
                type="button"
                onClick={() => addAdvantage(index)}
                style={{
                  background: theme.bgSecondary,
                  border: `1px solid ${theme.border}`,
                  color: theme.text,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                + Üstünlük əlavə et
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(article.advantages || []).map((adv, aIdx) => (
                <div
                  key={aIdx}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    backgroundColor: theme.bgSecondary,
                    padding: '8px 12px',
                    borderRadius: '8px',
                  }}
                >
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
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: theme.textMuted,
                      padding: '4px',
                    }}
                    title="Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div
            className="manager-footer"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '14px',
              paddingTop: '10px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              <input
                type="checkbox"
                checked={article.active !== false}
                onChange={(e) => update(index, { active: e.target.checked })}
              />
              <b>Kataloqda və Karuseldə Aktivdir</b>
            </label>
            <button
              onClick={() =>
                window.confirm('Bu texnologiya məlumatı silinsin?') &&
                onChange(articles.filter((_, i) => i !== index))
              }
              style={{
                background: 'none',
                border: `1px solid ${theme.border}`,
                color: '#ef4444',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Trash2 size={15} /> Sil
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

// SECURITY PASSWORD MANAGER
export interface SecurityManagerProps {
  theme: ThemeColors;
  oldPassword: string;
  setOldPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordUpdating: boolean;
  onChangePassword: (e: React.FormEvent) => void;
}

export const SecurityManager = ({
  theme,
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordUpdating,
  onChangePassword,
}: SecurityManagerProps) => {
  return (
    <article
      className="manager-card"
      style={{ background: theme.bgCard, borderColor: theme.border, maxWidth: '540px' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: '18px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <KeyRound size={18} color={theme.primary} />
          Admin Giriş Şifrəsini Dəyişdir
        </h2>
        <p style={{ color: theme.textMuted, fontSize: '13px', margin: '4px 0 0 0' }}>
          Admin panelə daxil olmaq üçün istifadə edilən təhlükəsiz şifrəni birbaşa buradan
          yeniləyə bilərsiniz.
        </p>
      </div>

      <form onSubmit={onChangePassword} style={{ display: 'grid', gap: '14px' }}>
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
  );
};
