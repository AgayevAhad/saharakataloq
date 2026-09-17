import React, { useState, useMemo } from 'react';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Share2,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import { Product, CatalogSettings, CatalogCategory } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ProductCard } from '../components/ProductCard';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

export interface FavoritesPageProps {
  favoriteIds: string[];
  allProducts: Product[];
  categories: CatalogCategory[];
  settings?: CatalogSettings;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onToggleFavorite: (product: Product) => void;
  onClearFavorites: () => void;
  onAddToCart: (product: Product) => void;
  onAddAllToCart: (products: Product[]) => void;
  onSelectProduct: (product: Product) => void;
  onWhatsApp: (product: Product | null) => void;
  onCall: (phone?: string) => void;
  onShare: (product: Product | null) => void;
  onCopyLink: (product: Product) => void;
  onNavigate: (route: string, param?: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  favoriteIds,
  allProducts,
  categories,
  settings: _settings,
  theme,
  themeMode,
  onToggleFavorite,
  onClearFavorites,
  onAddToCart,
  onAddAllToCart,
  onSelectProduct,
  onWhatsApp,
  onCall,
  onShare,
  onCopyLink,
  onNavigate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filtered favorite products
  const favoriteProducts = useMemo(() => {
    const favSet = new Set(favoriteIds);
    return allProducts.filter((p) => favSet.has(p.id) && p.status !== 'draft');
  }, [favoriteIds, allProducts]);

  // Available categories within favorites
  const availableCategories = useMemo(() => {
    const catIds = new Set(favoriteProducts.map((p) => p.category).filter(Boolean));
    return categories.filter((c) => catIds.has(c.id));
  }, [favoriteProducts, categories]);

  // Displayed products based on category filter
  const displayedProducts = useMemo(() => {
    if (selectedCategory === 'all') return favoriteProducts;
    return favoriteProducts.filter((p) => p.category === selectedCategory);
  }, [favoriteProducts, selectedCategory]);

  const handleShareWishlistWhatsApp = () => {
    if (favoriteProducts.length === 0) return;
    const lines = favoriteProducts.map(
      (p, i) => `${i + 1}. ${p.title} (${p.modelCode || ''}) - ${p.price || 0} ₼`
    );
    const text = `Salam, Sahara Electronics-də bəyəndiyim məhsullar siyahısı:\n\n${lines.join('\n')}\n\nZəhmət olmasa bu modellərin mövcudluğu və çatdırılması barədə məlumat verərdiniz.`;
    const url = `https://wa.me/994502047700?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="favorites-page-wrapper"
      style={{
        minHeight: '100vh',
        padding: '24px 0 80px',
        backgroundColor: theme.bg,
      }}
    >
      <div className="catalog-container" style={{ padding: '0 clamp(16px, 4vw, 56px)' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            style={{
              background: 'transparent',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
              borderRadius: '10px',
              padding: '8px 14px',
              color: theme.text,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: themeMode === 'dark' ? '#1e293b' : '#ffffff',
            }}
          >
            <ArrowLeft size={15} />
            <span>Kataloqa qayıt</span>
          </button>
        </div>

        {/* Header Bar with Action Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(24px, 3.5vw, 36px)',
                fontWeight: 900,
                color: theme.text,
                margin: 0,
                letterSpacing: '-0.02em',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <span>Bəyəndiyim Məhsullar</span>
              {favoriteProducts.length > 0 && (
                <span
                  style={{
                    fontSize: '13.5px',
                    fontWeight: 800,
                    backgroundColor: '#e31e24',
                    color: '#ffffff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                  }}
                >
                  {favoriteProducts.length} model
                </span>
              )}
            </h1>
            <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '6px 0 0 0' }}>
              Bəyəndiyiniz bütün modellər burada saxlanılır. İstədiyiniz vaxt səbətə ata və ya WhatsApp ilə göndərə bilərsiniz.
            </p>
          </div>

          {favoriteProducts.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => onAddAllToCart(favoriteProducts)}
                style={{
                  backgroundColor: '#e31e24',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(227, 30, 36, 0.35)',
                }}
              >
                <ShoppingCart size={15} />
                <span>Hamısını Səbətə At</span>
              </button>

              <button
                type="button"
                onClick={handleShareWishlistWhatsApp}
                style={{
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <WhatsAppIcon size={15} color="#ffffff" />
                <span>WhatsApp ilə Paylaş</span>
              </button>

              <button
                type="button"
                onClick={onClearFavorites}
                style={{
                  background: 'transparent',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: '#ef4444',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Trash2 size={15} />
                <span>Təmizlə</span>
              </button>
            </div>
          )}
        </div>

        {favoriteProducts.length === 0 ? (
          /* Empty Favorites View */
          <div
            className="empty-favorites-card"
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              borderRadius: '24px',
              backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              maxWidth: '680px',
              margin: '0 auto',
              boxShadow: themeMode === 'dark' ? 'none' : '0 10px 30px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: themeMode === 'dark' ? 'rgba(227, 30, 36, 0.15)' : '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#e31e24',
              }}
            >
              <Heart size={40} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 10px' }}>
              Bəyəndiyiniz məhsul hələ yoxdur
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: theme.textMuted,
                maxWidth: '440px',
                margin: '0 auto 28px',
                lineHeight: 1.5,
              }}
            >
              Məhsul kartlarında olan qəlb ❤️ ikonuna toxunaraq sevdiyiniz modelləri bu siyahıya əlavə edə bilərsiniz.
            </p>

            <button
              type="button"
              onClick={() => onNavigate('catalog')}
              style={{
                backgroundColor: '#e31e24',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '14px 32px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(227, 30, 36, 0.35)',
              }}
            >
              <span>Kataloqa keçin</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <div>
            {/* Category Filter Pills (if > 1 category present in favorites) */}
            {availableCategories.length > 1 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  overflowX: 'auto',
                  paddingBottom: '12px',
                  marginBottom: '24px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    backgroundColor: selectedCategory === 'all' ? '#e31e24' : themeMode === 'dark' ? '#1e293b' : '#ffffff',
                    color: selectedCategory === 'all' ? '#ffffff' : theme.text,
                    border: `1px solid ${selectedCategory === 'all' ? '#e31e24' : themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <LayoutGrid size={14} />
                  <span>Hamısı ({favoriteProducts.length})</span>
                </button>

                {availableCategories.map((c) => {
                  const count = favoriteProducts.filter((p) => p.category === c.id).length;
                  const isSelected = selectedCategory === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        backgroundColor: isSelected ? '#e31e24' : themeMode === 'dark' ? '#1e293b' : '#ffffff',
                        color: isSelected ? '#ffffff' : theme.text,
                        border: `1px solid ${isSelected ? '#e31e24' : themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{c.name} ({count})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Product Grid */}
            <div className="product-grid-container">
              {displayedProducts.map((product) => (
                <div key={product.id} style={{ position: 'relative' }}>
                  <ProductCard
                    product={product}
                    theme={theme}
                    onSelect={onSelectProduct}
                    onShare={onShare}
                    onWhatsApp={onWhatsApp}
                    onCall={onCall}
                    onCopyLink={onCopyLink}
                  />
                  {/* Quick Remove Floating Button */}
                  <button
                    type="button"
                    title="Bəyənilənlərdən çıxart"
                    aria-label={`${product.title} bəyənilənlərdən çıxart`}
                    onClick={() => onToggleFavorite(product)}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239, 68, 68, 0.9)',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    <Heart size={16} fill="#ffffff" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
