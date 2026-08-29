import React, { useState, useEffect } from 'react';
import { X, Zap, VolumeX, ShieldCheck, Thermometer, Flame, Wind, CheckCircle2 } from 'lucide-react';
import { TechnologyArticle } from '../types/product';
import { ThemeColors } from '../types/theme';

interface InverterInfoModalProps {
  theme: ThemeColors;
  visible: boolean;
  onClose: () => void;
  articles?: TechnologyArticle[];
  initialArticleId?: string | null;
}

const getAdvantageIcon = (idx: number, iconName?: string, color?: string) => {
  switch (idx) {
    case 0:
      return <Zap size={18} color={color || '#ef4444'} />;
    case 1:
      return <VolumeX size={18} color="#0284c7" />;
    case 2:
      return <ShieldCheck size={18} color="#16a34a" />;
    case 3:
      return <Thermometer size={18} color="#ec4899" />;
    default:
      return <CheckCircle2 size={18} color={color || '#ef4444'} />;
  }
};

export const InverterInfoModal: React.FC<InverterInfoModalProps> = ({
  theme,
  visible,
  onClose,
  articles = [],
  initialArticleId,
}) => {
  const activeArticles = articles.filter((a) => a.active !== false);
  const [selectedId, setSelectedId] = useState<string>(activeArticles[0]?.id || 'art-inverter');

  useEffect(() => {
    if (initialArticleId && activeArticles.some((a) => a.id === initialArticleId)) {
      setSelectedId(initialArticleId);
    } else if (activeArticles.length > 0 && !activeArticles.some((a) => a.id === selectedId)) {
      setSelectedId(activeArticles[0].id);
    }
  }, [initialArticleId, activeArticles, selectedId]);

  if (!visible) return null;

  const currentArticle = activeArticles.find((a) => a.id === selectedId) || activeArticles[0];

  return (
    <div
      className="modal-backdrop-anim"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100dvh',
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(8px, 2.5vw, 16px)',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog-anim"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '94dvh',
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: '18px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: theme.mode === 'dark' ? '0 25px 50px -12px rgba(0, 0, 0, 0.85)' : '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: theme.bgSecondary,
            borderBottom: `1px solid ${theme.border}`,
            flexShrink: 0,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <Zap size={20} color={theme.primary} style={{ flexShrink: 0 }} />
            <h2
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 'clamp(14px, 3.5vw, 17px)',
                fontWeight: 800,
                color: theme.text,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Məişət Texnikası & Texnologiya Bələdçisi
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: theme.bgCard,
              border: `1px solid ${theme.border}`,
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: theme.text,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            aria-label="Bağla"
          >
            <X size={18} />
          </button>
        </div>

        {/* Dynamic Category/Article Chips if multiple articles */}
        {activeArticles.length > 1 && (
          <div
            className="no-scrollbar"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              padding: '10px 16px',
              backgroundColor: theme.bgSecondary,
              borderBottom: `1px solid ${theme.border}`,
              flexShrink: 0,
            }}
          >
            {activeArticles.map((art) => {
              const isSelected = art.id === selectedId;
              return (
                <button
                  key={art.id}
                  onClick={() => setSelectedId(art.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    border: `1px solid ${isSelected ? theme.primary : theme.border}`,
                    backgroundColor: isSelected ? theme.primary : theme.bgCard,
                    color: isSelected ? '#ffffff' : theme.textSecondary,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {art.title.split(' ')[0]} {art.badge ? `(${art.badge})` : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: 'clamp(14px, 3vw, 20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {currentArticle ? (
            <>
              {/* Article Main Box */}
              <div
                style={{
                  backgroundColor: theme.bgSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: '12px',
                  padding: 'clamp(12px, 3vw, 16px)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <h3
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: 'clamp(15px, 3.5vw, 18px)',
                      fontWeight: 800,
                      color: theme.primary,
                      margin: 0,
                    }}
                  >
                    {currentArticle.title}
                  </h3>
                  {currentArticle.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: theme.badgeBg,
                        color: theme.badgeText,
                        border: `1px solid ${theme.primaryLight}`,
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {currentArticle.badge}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 'clamp(12px, 3vw, 13px)',
                    lineHeight: '20px',
                    color: theme.textSecondary,
                    margin: 0,
                  }}
                >
                  {currentArticle.subtitle}
                </p>
              </div>

              {/* Advantages List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(currentArticle.advantages || []).map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      backgroundColor: theme.bgCard,
                      border: `1px solid ${theme.border}`,
                      padding: 'clamp(10px, 2.5vw, 14px)',
                      borderRadius: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: theme.badgeBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {getAdvantageIcon(idx, currentArticle.icon, theme.primary)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: theme.text,
                          margin: '0 0 3px 0',
                        }}
                      >
                        {item.title}
                      </h4>
                      <p
                        style={{
                          fontSize: '12px',
                          lineHeight: '18px',
                          color: theme.textSecondary,
                          margin: 0,
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p style={{ color: theme.textMuted }}>Məlumat mövcud deyil.</p>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: theme.bgSecondary,
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              backgroundColor: theme.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Bağla
          </button>
        </div>
      </div>
    </div>
  );
};
