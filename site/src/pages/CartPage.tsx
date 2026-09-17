import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Phone,
  Tag,
  Sparkles,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { Product, CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { ShimmerImage } from '../components/ShimmerImage';
import { WhatsAppIcon } from '../components/WhatsAppIcon';
import { ProductCard } from '../components/ProductCard';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartPageProps {
  cartItems: CartItem[];
  allProducts: Product[];
  settings?: CatalogSettings;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onNavigate: (route: string, param?: string) => void;
  onSelectProduct: (product: Product) => void;
  onWhatsAppCheckout: (cartItems: CartItem[], total: number, promoCode?: string) => void;
  onCall: (phone?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cartItems,
  allProducts,
  settings,
  theme,
  themeMode,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigate,
  onSelectProduct,
  onWhatsAppCheckout,
  onCall,
}) => {
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Subtotal calculation
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price = typeof item.product.price === 'number' ? item.product.price : 0;
      return sum + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    return Math.round((subtotal * appliedPromo.percent) / 100);
  }, [subtotal, appliedPromo]);

  const total = Math.max(0, subtotal - discountAmount);
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Apply promo code
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = promoCodeInput.trim().toUpperCase();
    if (!cleanCode) return;

    if (cleanCode === 'SAHARA10' || cleanCode === 'SAHARA') {
      setAppliedPromo({ code: cleanCode, percent: 10 });
      setPromoError(null);
    } else if (cleanCode === 'BAKU5' || cleanCode === 'BAKU') {
      setAppliedPromo({ code: cleanCode, percent: 5 });
      setPromoError(null);
    } else {
      setPromoError('Daxil edilən promo kod etibarsızdır.');
    }
  };

  const recommendedProducts = useMemo(() => {
    const inCartIds = new Set(cartItems.map((i) => i.product.id));
    return allProducts.filter((p) => p.status !== 'draft' && !inCartIds.has(p.id)).slice(0, 4);
  }, [allProducts, cartItems]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('az-AZ', { minimumFractionDigits: 0 }).format(amount);

  return (
    <div
      className="cart-page-wrapper"
      style={{
        minHeight: '100vh',
        padding: '24px 0 80px',
        backgroundColor: theme.bg,
      }}
    >
      <div className="catalog-container" style={{ padding: '0 clamp(16px, 4vw, 56px)' }}>
        {/* Page Breadcrumb / Back Action */}
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

        {/* Page Title & Counter */}
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
              <span>Səbətim</span>
              {totalItemCount > 0 && (
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
                  {totalItemCount} məhsul
                </span>
              )}
            </h1>
            <p style={{ fontSize: '13.5px', color: theme.textMuted, margin: '6px 0 0 0' }}>
              Seçilmiş məişət texnikası modelləri, rəsmi zəmanət və operativ sifariş xülasəsi.
            </p>
          </div>

          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
              }}
            >
              <Trash2 size={15} />
              <span>Səbəti təmizlə</span>
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          /* Empty Cart State */
          <div
            className="empty-cart-card"
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              borderRadius: '24px',
              backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : '#ffffff',
              border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              maxWidth: '680px',
              margin: '0 auto 64px',
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
              <ShoppingCart size={40} />
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: theme.text, margin: '0 0 10px' }}>
              Səbətiniz hazırda boşdur
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: theme.textMuted,
                maxWidth: '420px',
                margin: '0 auto 28px',
                lineHeight: 1.5,
              }}
            >
              Kataloqumuza keçid edərək ARDO, Lotus və digər rəsmi brendlərimizin ən yeni modellərini seçib səbətə əlavə edə bilərsiniz.
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
                transition: 'transform 0.15s ease',
              }}
            >
              <span>Kataloqa baxın</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Active Cart with Items Grid */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '28px',
              alignItems: 'start',
            }}
          >
            {/* Left 8 Cols: Cart Items List */}
            <div
              className="cart-items-column"
              style={{
                gridColumn: 'span 12',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Free Delivery Milestone Progress Banner */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '14px',
                  backgroundColor: themeMode === 'dark' ? 'rgba(21, 128, 61, 0.15)' : '#f0fdf4',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(34, 197, 94, 0.25)' : '#bbf7d0'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Truck size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: themeMode === 'dark' ? '#4ade80' : '#15803d' }}>
                    Təbriklər! Sifarişinizə pulsuz çatdırılma daxildir
                  </div>
                  <div style={{ fontSize: '12px', color: theme.textMuted }}>
                    Bütün rəsmi Sahara sifarişləri qapınıza qədər tam təhlükəsiz və sığortalı çatdırılır.
                  </div>
                </div>
              </div>

              {/* Items Card List */}
              {cartItems.map(({ product, quantity }) => {
                const itemPrice = typeof product.price === 'number' ? product.price : 0;
                const itemOldPrice = typeof product.oldPrice === 'number' ? product.oldPrice : 0;
                const rowTotal = itemPrice * quantity;
                const coverImage = product.image || (product.images && product.images[0]) || '';

                return (
                  <div
                    key={product.id}
                    className="cart-item-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      padding: '16px 20px',
                      borderRadius: '16px',
                      backgroundColor: themeMode === 'dark' ? '#1e293b' : '#ffffff',
                      border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                      boxShadow: themeMode === 'dark' ? 'none' : '0 4px 16px rgba(0,0,0,0.03)',
                      flexWrap: 'wrap',
                    }}
                  >
                    {/* Thumbnail */}
                    <div
                      onClick={() => onSelectProduct(product)}
                      style={{
                        width: '84px',
                        height: '84px',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {coverImage ? (
                        <ShimmerImage
                          src={coverImage}
                          alt={product.title}
                          containerStyle={{ width: '100%', height: '100%' }}
                          style={{ objectFit: 'contain' }}
                          spinnerSize={14}
                        />
                      ) : (
                        <ShoppingCart size={24} color={theme.textMuted} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#e31e24',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {product.brandName || product.brandId || 'Orijinal'}
                        </span>
                        {product.modelCode && (
                          <span style={{ fontSize: '11.5px', fontWeight: 600, color: theme.textMuted }}>
                            • {product.modelCode}
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => onSelectProduct(product)}
                        style={{
                          fontSize: '14.5px',
                          fontWeight: 800,
                          color: theme.text,
                          margin: '0 0 6px',
                          cursor: 'pointer',
                        }}
                      >
                        {product.title}
                      </h3>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#16a34a',
                            backgroundColor: themeMode === 'dark' ? 'rgba(22, 163, 74, 0.15)' : '#dcfce7',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>Rəsmi 2 il zəmanət</span>
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f1f5f9',
                        padding: '4px 8px',
                        borderRadius: '10px',
                        border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Sayı azalt"
                        title="Azalt"
                        onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme.text,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Minus size={14} />
                      </button>

                      <span
                        style={{
                          minWidth: '24px',
                          textAlign: 'center',
                          fontWeight: 800,
                          fontSize: '13.5px',
                          color: theme.text,
                        }}
                      >
                        {quantity}
                      </span>

                      <button
                        type="button"
                        aria-label="Sayı artır"
                        title="Artır"
                        onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme.text,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign: 'right', minWidth: '100px' }}>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: theme.text }}>
                        {formatPrice(rowTotal)} ₼
                      </div>
                      {itemOldPrice > itemPrice && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: theme.textMuted,
                            textDecoration: 'line-through',
                          }}
                        >
                          {formatPrice(itemOldPrice * quantity)} ₼
                        </div>
                      )}
                      {quantity > 1 && (
                        <div style={{ fontSize: '11px', color: theme.textMuted }}>
                          {formatPrice(itemPrice)} ₼ / ədəd
                        </div>
                      )}
                    </div>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      aria-label={`${product.title} səbətdən sil`}
                      title="Məhsulu sil"
                      onClick={() => onRemoveItem(product.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.textMuted,
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right 4 Cols: Sticky Order Summary & Direct Checkout Card */}
            <div
              className="cart-summary-column"
              style={{
                gridColumn: 'span 12',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  backgroundColor: themeMode === 'dark' ? '#1e293b' : '#ffffff',
                  border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                  boxShadow: themeMode === 'dark' ? 'none' : '0 8px 24px rgba(0,0,0,0.04)',
                }}
              >
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: theme.text,
                    margin: '0 0 18px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Sifariş Xülasəsi
                </h3>

                {/* Subtotal rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: theme.text }}>
                    <span style={{ color: theme.textMuted }}>Məhsulların cəmi ({totalItemCount} ədəd)</span>
                    <span style={{ fontWeight: 700 }}>{formatPrice(subtotal)} ₼</span>
                  </div>

                  {appliedPromo && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: '#16a34a' }}>
                      <span>Promo Endirimi ({appliedPromo.code} -{appliedPromo.percent}%)</span>
                      <span style={{ fontWeight: 700 }}>-{formatPrice(discountAmount)} ₼</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: theme.text }}>
                    <span style={{ color: theme.textMuted }}>Rəsmi Çatdırılma</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>Pulsuz</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', color: theme.text }}>
                    <span style={{ color: theme.textMuted }}>Rəsmi İstehsalçı Zəmanəti</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>Daxildir</span>
                  </div>
                </div>

                <div style={{ height: '1px', backgroundColor: themeMode === 'dark' ? 'rgba(255,255,255,0.08)' : '#e2e8f0', margin: '14px 0' }} />

                {/* Promo code form */}
                <form onSubmit={handleApplyPromo} style={{ marginBottom: '18px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Promo kod (məs: SAHARA10)"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value);
                        setPromoError(null);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '10px',
                        backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                        border: `1px solid ${promoError ? '#ef4444' : themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`,
                        color: theme.text,
                        fontSize: '13px',
                        fontWeight: 600,
                        outline: 'none',
                        textTransform: 'uppercase',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '10px 16px',
                        borderRadius: '10px',
                        backgroundColor: themeMode === 'dark' ? '#334155' : '#e2e8f0',
                        color: theme.text,
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Tətbiq et
                    </button>
                  </div>
                  {promoError && (
                    <div style={{ fontSize: '11.5px', color: '#ef4444', marginTop: '6px' }}>
                      {promoError}
                    </div>
                  )}
                  {appliedPromo && (
                    <div style={{ fontSize: '11.5px', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
                      ✓ {appliedPromo.code} kodu ilə 10% endirim tətbiq edildi!
                    </div>
                  )}
                </form>

                {/* Total row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 800, color: theme.text }}>Yekun Məbləğ</span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#e31e24' }}>
                      {formatPrice(total)} ₼
                    </span>
                    <div style={{ fontSize: '11.5px', color: theme.textMuted }}>
                      ƏDV daxildir
                    </div>
                  </div>
                </div>

                {/* Main WhatsApp Direct Order CTA */}
                <button
                  type="button"
                  onClick={() => onWhatsAppCheckout(cartItems, total, appliedPromo?.code)}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: '14px',
                    backgroundColor: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(21, 128, 61, 0.35)',
                    marginBottom: '10px',
                    transition: 'transform 0.15s ease, background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#166534')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
                >
                  <WhatsAppIcon size={18} color="#ffffff" />
                  <span>WhatsApp ilə Sifariş Et</span>
                </button>

                {/* Secondary Call Order CTA */}
                <button
                  type="button"
                  onClick={() => onCall()}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                    color: theme.text,
                    border: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.15)' : '#cbd5e1'}`,
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Phone size={15} />
                  <span>Zənglə Sifarişi Rəsmiləşdir</span>
                </button>

                {/* Trust Badges */}
                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: theme.textMuted }}>
                    <ShieldCheck size={16} color="#16a34a" />
                    <span>Rəsmi istehsalçı zəmanəti və orijinal sertifikat</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: theme.textMuted }}>
                    <Truck size={16} color="#0284c7" />
                    <span>Bakı və regionlara operativ təhlükəsiz çatdırılma</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Products Carousel / Grid */}
        {recommendedProducts.length > 0 && (
          <div style={{ marginTop: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: theme.text, margin: 0 }}>
                  Tövsiyə Olunan Modellər
                </h2>
                <p style={{ fontSize: '13px', color: theme.textMuted, margin: '4px 0 0' }}>
                  Səbətinizə uyğun gələ biləcək ən çox bəyənilən modellər
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#e31e24',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Hamısına bax</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="product-grid-container">
              {recommendedProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  theme={theme}
                  onSelect={onSelectProduct}
                  onShare={() => {}}
                  onWhatsApp={() => onWhatsAppCheckout([{ product: prod, quantity: 1 }], prod.price || 0)}
                  onCall={() => onCall()}
                  onCopyLink={() => {}}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
