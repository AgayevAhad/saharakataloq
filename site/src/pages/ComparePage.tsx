import React, { useState } from 'react';
import { Scale, Trash2, ArrowRight, EyeOff, Eye } from 'lucide-react';
import { Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { Button } from '../components/ui/Button';
import { ShimmerImage } from '../components/ShimmerImage';

interface ComparePageProps {
  comparisonProducts: Product[];
  theme: ThemeColors;
  onRemoveFromCompare: (productId: string) => void;
  onClearCompare: () => void;
  onSelectProduct: (product: Product) => void;
  onNavigate: (route: string) => void;
}

export const ComparePage: React.FC<ComparePageProps> = ({
  comparisonProducts,
  theme,
  onRemoveFromCompare,
  onClearCompare,
  onSelectProduct,
  onNavigate,
}) => {
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  if (comparisonProducts.length === 0) {
    return (
      <div
        className="catalog-container"
        style={{
          padding: '48px 16px',
          textAlign: 'center',
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            color: theme.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <Scale size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, marginBottom: '8px' }}>
          Müqayisə Siyahısı Boşdur
        </h2>
        <p
          style={{
            fontSize: '14px',
            color: theme.textMuted,
            maxWidth: '440px',
            marginBottom: '24px',
          }}
        >
          Məhsul kartlarındakı tərəzi ikonuna klikləyərək istənilən modelləri bura əlavə edib
          texniki fərqləri müqayisə edə bilərsiniz.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate('catalog')}
          rightIcon={<ArrowRight size={16} />}
        >
          Məhsullara Bax
        </Button>
      </div>
    );
  }

  // Collect all unique spec names across all products
  const allSpecNames = Array.from(
    new Set(comparisonProducts.flatMap((p) => (p.specs || []).map((s) => s.name)))
  );

  // Filter specs if onlyDifferences is active
  const displayedSpecs = onlyDifferences
    ? allSpecNames.filter((specName) => {
        const values = comparisonProducts.map((p) => {
          const spec = (p.specs || []).find((s) => s.name === specName);
          return spec ? spec.value : '-';
        });
        return new Set(values).size > 1;
      })
    : allSpecNames;

  return (
    <div className="catalog-container" style={{ padding: '24px 16px 48px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: theme.text, margin: 0 }}>
            Məhsul Müqayisəsi ({comparisonProducts.length} Model)
          </h1>
          <p style={{ fontSize: '13px', color: theme.textMuted, margin: '4px 0 0 0' }}>
            Texniki parametrlər, güc və ölçü fərqlərini dəqiqliklə görün
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOnlyDifferences((prev) => !prev)}
            leftIcon={onlyDifferences ? <Eye size={14} /> : <EyeOff size={14} />}
          >
            {onlyDifferences ? 'Bütün Parametrləri Göstər' : 'Yalnız Fərqləri Göstər'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCompare}
            leftIcon={<Trash2 size={14} />}
          >
            Siyahını Təmizlə
          </Button>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div
        style={{
          overflowX: 'auto',
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`,
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            minWidth: '600px',
          }}
        >
          <thead>
            <tr style={{ borderBottom: `2px solid ${theme.border}` }}>
              <th
                style={{
                  padding: '16px',
                  width: '220px',
                  color: theme.textMuted,
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                Xüsusiyyətlər
              </th>
              {comparisonProducts.map((p) => (
                <th key={p.id} style={{ padding: '16px', minWidth: '200px', verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: theme.primary }}>
                        {p.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveFromCompare(p.id)}
                        aria-label="Sil"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: theme.textMuted,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <ShimmerImage
                      src={p.image || '/media/placeholder.png'}
                      alt={p.title}
                      style={{
                        width: '100%',
                        height: '110px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                      }}
                    />

                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: theme.text,
                        lineHeight: 1.2,
                      }}
                    >
                      {p.title}
                    </div>

                    <Button size="sm" variant="primary" onClick={() => onSelectProduct(p)}>
                      Ətraflı Bax
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr
              style={{
                borderBottom: `1px solid ${theme.border}`,
                backgroundColor:
                  theme.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              }}
            >
              <td
                style={{
                  padding: '12px 16px',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: theme.text,
                }}
              >
                İstehsal Ölkəsi
              </td>
              {comparisonProducts.map((p) => (
                <td
                  key={p.id}
                  style={{ padding: '12px 16px', fontSize: '13px', color: theme.text }}
                >
                  {p.manufacturingCountry || '-'}
                </td>
              ))}
            </tr>

            {displayedSpecs.map((specName) => (
              <tr key={specName} style={{ borderBottom: `1px solid ${theme.border}` }}>
                <td
                  style={{
                    padding: '12px 16px',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: theme.textMuted,
                  }}
                >
                  {specName}
                </td>
                {comparisonProducts.map((p) => {
                  const spec = (p.specs || []).find((s) => s.name === specName);
                  return (
                    <td
                      key={p.id}
                      style={{
                        padding: '12px 16px',
                        fontSize: '13px',
                        color: theme.text,
                        fontWeight: 500,
                      }}
                    >
                      {spec?.value || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
