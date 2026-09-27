import React, { useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Headphones,
  FileText,
  ShieldCheck,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { CatalogSettings, StoreAddress } from '../types/product';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from './WhatsAppIcon';
import { phoneHref, whatsappHref } from '../utils/contact';

export type CatalogInfoTab = 'about' | 'stores' | 'support' | 'terms' | 'privacy';

export interface CatalogInfoModalProps {
  isOpen: boolean;
  activeTab: CatalogInfoTab;
  onClose: () => void;
  onSelectTab: (tab: CatalogInfoTab) => void;
  settings: CatalogSettings;
  theme: ThemeColors;
}

export const CatalogInfoModal: React.FC<CatalogInfoModalProps> = ({
  isOpen,
  activeTab,
  onClose,
  onSelectTab,
  settings,
  theme,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDark = theme.mode === 'dark';
  const waHref = whatsappHref(settings?.whatsappNumber, 'Salam, Sahara Electronics!');
  const phoneList =
    Array.isArray(settings?.phoneNumbers) && settings.phoneNumbers.length
      ? settings.phoneNumbers.filter(Boolean)
      : settings?.phoneNumber
        ? [settings.phoneNumber]
        : [];

  const addressList: StoreAddress[] =
    settings?.addresses && settings.addresses.length > 0
      ? settings.addresses
      : settings?.address
        ? [
            {
              id: 'primary',
              title: 'Əsas Filial',
              address: settings.address,
              mapUrl: settings.mapUrl,
              workingHours: settings.workingHours,
              note: settings.locationNote,
            },
          ]
        : [
            {
              id: 'sederek',
              title: 'Sədərək TM Filialı',
              address: 'Bakı şəhəri, Sədərək TM, Şirniyyat bazarı ilə üzbəüz, Mağaza №14',
              workingHours: 'Hər gün: 09:00 - 18:00',
              note: 'Rəsmi distribütor mağazası',
            },
          ];

  const tabs: { id: CatalogInfoTab; label: string; icon: React.ReactNode }[] = [
    { id: 'about', label: 'Haqqımızda', icon: <Building2 size={16} /> },
    { id: 'stores', label: 'Mağazalar', icon: <MapPin size={16} /> },
    { id: 'support', label: 'Əlaqə və Dəstək', icon: <Headphones size={16} /> },
    { id: 'terms', label: 'İstifadə şərtləri', icon: <FileText size={16} /> },
    { id: 'privacy', label: 'Məxfilik siyasəti', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div
      className="catalog-info-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        className="catalog-info-modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          color: theme.text,
          width: '100%',
          maxWidth: '760px',
          maxHeight: '88vh',
          borderRadius: '20px',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px 24px',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <h3
              style={{
                fontSize: '19px',
                fontWeight: 800,
                color: theme.text,
                margin: 0,
                fontFamily: 'Outfit, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: '#e31e24' }}>Sahara Electronics</span>
              <span
                style={{ fontSize: '14px', fontWeight: 500, color: theme.textMuted || '#94a3b8' }}
              >
                / Məlumat Mərkəzi
              </span>
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Bağla"
            style={{
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.text,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Strip */}
        <div
          className="catalog-info-tabs-strip"
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            overflowX: 'auto',
            borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9'}`,
            backgroundColor: isDark ? '#0b1120' : '#f8fafc',
          }}
        >
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTab(t.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#e31e24' : 'transparent',
                  color: isActive ? '#ffffff' : theme.textMuted || '#64748b',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            lineHeight: 1.6,
          }}
        >
          {/* TAB 1: Haqqımızda */}
          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#e31e24',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                <Sparkles size={18} />
                <span>Rəsmi Distribütorluq və Keyfiyyət Təminatı</span>
              </div>

              <p style={{ color: theme.text, fontSize: '14.5px', margin: 0 }}>
                {settings?.aboutText ||
                  'Sahara Electronics — ARDO, Lotus və Artel kimi qabaqcıl beynəlxalq brendlərin Azərbaycanda rəsmi təmsilçisi və etibarlı partnyorudur. İllərdir ki, keyfiyyətli məişət texnikası, zərif dizaynlı soba və bişirmə panelləri, güclü aspiratorlar və premium iqlim texnikasını istehlakçılarımıza rəsmi zəmanətlə təqdim edirik.'}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginTop: '10px',
                }}
              >
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '13.5px',
                      color: theme.text,
                      marginBottom: '4px',
                    }}
                  >
                    İtaliya & Avropa Standartı
                  </div>
                  <div style={{ fontSize: '12.5px', color: theme.textMuted || '#64748b' }}>
                    SABAF ocaq başlıqları, inverter mühərriklər və A++ enerji səmərəliliyi.
                  </div>
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '13.5px',
                      color: theme.text,
                      marginBottom: '4px',
                    }}
                  >
                    Rəsmi Servis və Zəmanət
                  </div>
                  <div style={{ fontSize: '12.5px', color: theme.textMuted || '#64748b' }}>
                    Bütün modellər üçün rəsmi zəmanət talonu və operativ texniki xidmət.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Mağazalar */}
          {activeTab === 'stores' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: theme.textMuted || '#64748b', fontSize: '13.5px', margin: 0 }}>
                Məhsullarla canlı tanış olmaq və peşəkar konsultasiya almaq üçün rəsmi
                mağazalarımıza yaxınlaşa bilərsiniz:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {addressList.map((addr, idx) => (
                  <div
                    key={addr.id || idx}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: '14.5px',
                          color: '#e31e24',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <MapPin size={16} />
                        <span>{addr.title || `Filial ${idx + 1}`}</span>
                      </div>

                      {addr.mapUrl && (
                        <a
                          href={addr.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#e31e24',
                            textDecoration: 'none',
                          }}
                        >
                          <span>Xəritədə bax</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>

                    <div style={{ fontSize: '13.5px', color: theme.text }}>{addr.address}</div>

                    {(addr.workingHours || settings?.workingHours) && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: theme.textMuted || '#64748b',
                        }}
                      >
                        <Clock size={13} />
                        <span>{addr.workingHours || settings.workingHours}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Əlaqə və Dəstək */}
          {activeTab === 'support' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <p style={{ color: theme.text, fontSize: '14px', margin: 0 }}>
                {settings?.supportText ||
                  'Məhsul seçimi, texniki parametrlər və ya sifarişlə bağlı hər hansı sualınız olarsa, birbaşa əlaqə kanallarımız vasitəsilə bizimlə əlaqə saxlaya bilərsiniz:'}
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '12px',
                }}
              >
                {waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      backgroundColor: 'rgba(22, 163, 74, 0.08)',
                      border: '1px solid rgba(22, 163, 74, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textDecoration: 'none',
                      color: '#16a34a',
                    }}
                  >
                    <WhatsAppIcon size={24} color="#16a34a" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>WhatsApp ilə Yazın</div>
                      <div style={{ fontSize: '12px', color: theme.textMuted || '#64748b' }}>
                        {settings?.whatsappNumber || 'Canlı operativ əlaqə'}
                      </div>
                    </div>
                  </a>
                )}

                {phoneList.map((ph, idx) => (
                  <a
                    key={idx}
                    href={phoneHref(ph)}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textDecoration: 'none',
                      color: theme.text,
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#e31e24',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Phone size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>Telefon Zəngi</div>
                      <div style={{ fontSize: '12.5px', color: theme.textMuted || '#64748b' }}>
                        {ph}
                      </div>
                    </div>
                  </a>
                ))}

                {settings?.email && (
                  <a
                    href={`mailto:${settings.email}`}
                    style={{
                      padding: '16px',
                      borderRadius: '14px',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textDecoration: 'none',
                      color: theme.text,
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Mail size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>E-Poçt Dəstəyi</div>
                      <div style={{ fontSize: '12.5px', color: theme.textMuted || '#64748b' }}>
                        {settings.email}
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: İstifadə Şərtləri */}
          {activeTab === 'terms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: theme.text }}>
                Kataloqdan İstifadə və Məhsul Qaydaları
              </div>

              <p style={{ color: theme.text, fontSize: '14px', margin: 0 }}>
                {settings?.termsText ||
                  'Sahara Electronics kataloqundakı bütün məhsul parametrləri, texniki xüsusiyyətlər və qiymətlər rəsmi istehsalçı məlumatları əsasında mütəmadi olaraq yenilənir. Kataloq üzərindən seçilmiş məhsullarla bağlı ətraflı məlumat və rəsmi sifariş üçün birbaşa mağazalarımıza müraciət edə və ya WhatsApp xidməti ilə əlaqə saxlaya bilərsiniz.'}
              </p>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '13px',
                    color: theme.textMuted || '#64748b',
                  }}
                >
                  <CheckCircle2
                    size={16}
                    color="#16a34a"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <span>
                    Kataloqda nümayiş olunan bütün məhsullar orijinal və rəsmi sertifikatlıdır.
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '13px',
                    color: theme.textMuted || '#64748b',
                  }}
                >
                  <CheckCircle2
                    size={16}
                    color="#16a34a"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <span>
                    Texniki parametrlər istehsalçının rəsmi laboratoriya testlərinə uyğundur.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Məxfilik Siyasəti */}
          {activeTab === 'privacy' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontWeight: 800, fontSize: '15px', color: theme.text }}>
                Fərdi Məlumatların Məxfiliyi və Təhlükəsizlik
              </div>

              <p style={{ color: theme.text, fontSize: '14px', margin: 0 }}>
                {settings?.privacyText ||
                  'Sahara Electronics müştərilərin fərdi məlumatlarının məxfiliyinə və təhlükəsizliyinə yüksək məsuliyyətlə yanaşır. Bizimlə paylaşılan əlaqə nömrələri və sorğular yalnız müştəri xidmətinin keyfiyyətini artırmaq və rəsmi təklifləri çatdırmaq məqsədilə istifadə olunur.'}
              </p>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '13px',
                    color: theme.textMuted || '#64748b',
                  }}
                >
                  <CheckCircle2
                    size={16}
                    color="#16a34a"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <span>
                    Şəxsi məlumatlar heç bir üçüncü tərəfə ötürülmür və kommersiya məqsədilə
                    satılmır.
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    fontSize: '13px',
                    color: theme.textMuted || '#64748b',
                  }}
                >
                  <CheckCircle2
                    size={16}
                    color="#16a34a"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <span>
                    Sorğular və əlaqə nömrələri şifrələnmiş təhlükəsiz kanallarla idarə olunur.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
