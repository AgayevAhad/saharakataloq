import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Search, ChevronRight, X, Loader2, ArrowRight } from 'lucide-react';
import { Brand, CatalogCategory, Product, ProductCategory } from '../types/product';
import { ThemeColors, DESIGN_TOKENS } from '../types/theme';
import { ShimmerImage } from './ShimmerImage';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { pushOverlay, popOverlay, isTopOverlay } from '../utils/backgroundIsolation';

interface SmartSearchOverlayProps {
  visible: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose: () => void;
  products: Product[];
  categories: CatalogCategory[];
  brands: Brand[];
  theme: ThemeColors;
  isDarkMode: boolean;
  onSelectCategory: (category: ProductCategory | string) => void;
  onSelectBrand: (brand: string) => void;
  onSelectProduct?: (product: Product) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  isLoading?: boolean;
  inline?: boolean;
  embeddedInHeader?: boolean;
}

interface SuggestionItem {
  id: string;
  displayText: string;
  queryValue: string;
  categoryName?: string;
  brandName?: string;
  type: 'product' | 'category' | 'brand' | 'keyword';
  product?: Product;
  categoryId?: string;
  brandId?: string;
}

// Highlight matching search terms while keeping exact case of original text
const HighlightedQueryText: React.FC<{ text: string; query: string; highlightColor: string }> = ({
  text,
  query,
  highlightColor,
}) => {
  const trimmed = query.trim();
  if (!trimmed) {
    return <span>{text}</span>;
  }

  const normalizedText = text.toLocaleLowerCase('az');
  const normalizedQuery = trimmed.toLocaleLowerCase('az');
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return <span>{text}</span>;
  }

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + trimmed.length);
  const after = text.slice(matchIndex + trimmed.length);

  return (
    <span>
      {before}
      <strong style={{ color: highlightColor, fontWeight: 800 }}>{match}</strong>
      {after}
    </span>
  );
};

export const SmartSearchOverlay: React.FC<SmartSearchOverlayProps> = ({
  visible,
  searchQuery,
  onSearchChange,
  onClose,
  products,
  categories,
  brands,
  theme,
  isDarkMode,
  onSelectCategory,
  onSelectBrand,
  onSelectProduct,
  triggerRef,
  isLoading = false,
  inline = false,
  embeddedInHeader = false,
}) => {
  const [hoveredItem, setHoveredItem] = useState<SuggestionItem | null>(null);
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  const {
    containerRef: searchCatRef,
    scrollItemIntoView,
    dragProps,
    hasMoved,
  } = useHorizontalScroll({
    activeSelector: '.smart-search-category-pill.is-hovered',
    activeDependency: hoveredCategoryId,
  });

  const needle = searchQuery.trim().toLocaleLowerCase('az');

  // Filter only published and active items (strictly no draft products in public search)
  const publishedProducts = useMemo(() => {
    return products.filter((p) => {
      const isDraft = (p as { status?: string }).status === 'draft';
      const isPublished = (p as { published?: boolean }).published !== false;
      return !isDraft && isPublished;
    });
  }, [products]);

  const activeBrands = useMemo(() => {
    return brands.filter((b) => b.active !== false);
  }, [brands]);

  const activeCategories = useMemo(() => {
    return categories.filter((cat) => cat.active !== false);
  }, [categories]);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Focus trap, autofocus, and Escape handler
  useEffect(() => {
    if (!visible || inline) return;

    // Save previous active element to return focus on close
    previouslyFocusedElementRef.current =
      (document.activeElement as HTMLElement) || triggerRef?.current || null;

    const instanceId = 'smart-search-dialog';
    const overlayEl = modalRef.current;
    if (overlayEl) {
      pushOverlay(instanceId, overlayEl);
    }

    // Autofocus input
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTopOverlay(instanceId)) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      // Focus trap within modal
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      popOverlay(instanceId);

      // Return focus to trigger or previous element
      const target = triggerRef?.current || previouslyFocusedElementRef.current;
      if (target && typeof target.focus === 'function') {
        target.focus();
      }
    };
  }, [visible, triggerRef, inline]);

  // Reset hover state when query changes or overlay closes
  useEffect(() => {
    setHoveredItem(null);
    setHoveredCategoryId(null);
  }, [searchQuery, visible]);

  // 1. Dynamic multi-brand suggestions from all active published products and categories
  const suggestions: SuggestionItem[] = useMemo(() => {
    if (!publishedProducts.length && !activeCategories.length) return [];

    const items: SuggestionItem[] = [];
    const seenTexts = new Set<string>();

    const addSuggestion = (item: SuggestionItem) => {
      const key = item.displayText.toLocaleLowerCase('az');
      if (!seenTexts.has(key) && items.length < 12) {
        seenTexts.add(key);
        items.push(item);
      }
    };

    if (needle) {
      // A. Matching Categories
      activeCategories.forEach((cat) => {
        if (cat.name.toLocaleLowerCase('az').includes(needle)) {
          addSuggestion({
            id: `cat-${cat.id}`,
            displayText: cat.name,
            queryValue: cat.name,
            type: 'category',
            categoryId: cat.id,
          });
        }
      });

      // B. Matching Brands
      activeBrands.forEach((brand) => {
        if (brand.name.toLocaleLowerCase('az').includes(needle)) {
          addSuggestion({
            id: `brand-${brand.id}`,
            displayText: `${brand.name} texnikası`,
            queryValue: brand.name,
            type: 'brand',
            brandId: brand.id,
          });
        }
      });

      // C. Matching Products (Title, Code, Brand, Category, Specs, Highlights)
      publishedProducts.forEach((prod) => {
        const titleMatch = prod.title.toLocaleLowerCase('az').includes(needle);
        const codeMatch = prod.code ? prod.code.toLocaleLowerCase('az').includes(needle) : false;
        const catMatch = prod.categoryName
          ? prod.categoryName.toLocaleLowerCase('az').includes(needle)
          : false;
        const specMatch = prod.specs?.some(
          (s) =>
            s.value.toLocaleLowerCase('az').includes(needle) ||
            s.name.toLocaleLowerCase('az').includes(needle)
        );
        const highlightMatch = prod.highlights?.some((h) =>
          h.toLocaleLowerCase('az').includes(needle)
        );

        if (titleMatch || codeMatch || catMatch || specMatch || highlightMatch) {
          const brandObj = activeBrands.find((b) => b.id === prod.brandId);
          addSuggestion({
            id: `prod-${prod.id}`,
            displayText: prod.title,
            queryValue: prod.code || prod.title,
            categoryName: prod.categoryName,
            brandName: brandObj?.name,
            type: 'product',
            product: prod,
          });
        }
      });
    } else {
      // Default dynamic suggestions across all active brands that have published products
      activeBrands.forEach((brand) => {
        const brandProd = publishedProducts.find((p) => p.brandId === brand.id);
        if (brandProd) {
          addSuggestion({
            id: `brand-top-${brand.id}`,
            displayText: brandProd.title,
            queryValue: brandProd.code || brandProd.title,
            categoryName: brandProd.categoryName,
            brandName: brand.name,
            type: 'product',
            product: brandProd,
          });
        }
      });

      // Add popular active categories
      activeCategories.slice(0, 4).forEach((cat) => {
        addSuggestion({
          id: `default-cat-${cat.id}`,
          displayText: cat.name,
          queryValue: cat.name,
          type: 'category',
          categoryId: cat.id,
        });
      });

      // Dynamic keyword highlights derived from published products
      const allHighlights = Array.from(
        new Set(
          publishedProducts
            .flatMap((p) => p.highlights || [])
            .filter((h) => typeof h === 'string' && h.trim().length > 0)
        )
      );

      allHighlights.slice(0, 3).forEach((hl) => {
        const matchingProd = publishedProducts.find((p) => p.highlights?.includes(hl));
        if (matchingProd) {
          addSuggestion({
            id: `hl-${hl}`,
            displayText: `${hl} texnologiyalı modellər`,
            queryValue: hl,
            type: 'keyword',
            product: matchingProd,
          });
        }
      });

      // Fill up to 9 items from remaining published products
      publishedProducts.forEach((p) => {
        if (items.length < 9) {
          const brandObj = activeBrands.find((b) => b.id === p.brandId);
          addSuggestion({
            id: `p-fill-${p.id}`,
            displayText: p.title,
            queryValue: p.code || p.title,
            categoryName: p.categoryName,
            brandName: brandObj?.name,
            type: 'product',
            product: p,
          });
        }
      });
    }

    return items;
  }, [needle, publishedProducts, activeCategories, activeBrands]);

  // 2. Dynamic Preview & Popular Products (Right column)
  const displayedProducts: Product[] = useMemo(() => {
    if (!publishedProducts.length) return [];

    // A. If a suggestion item is hovered
    if (hoveredItem) {
      if (hoveredItem.type === 'product' && hoveredItem.product) {
        const hoveredProd = hoveredItem.product;
        const complementary = publishedProducts.find(
          (p) =>
            p.id !== hoveredProd.id &&
            (p.category === hoveredProd.category || p.brandId !== hoveredProd.brandId)
        );
        return complementary ? [hoveredProd, complementary] : [hoveredProd];
      }

      if (hoveredItem.type === 'category' && hoveredItem.categoryId) {
        const catProducts = publishedProducts.filter((p) => p.category === hoveredItem.categoryId);
        if (catProducts.length > 0) return catProducts.slice(0, 2);
      }

      if (hoveredItem.type === 'brand' && hoveredItem.brandId) {
        const brandProducts = publishedProducts.filter((p) => p.brandId === hoveredItem.brandId);
        if (brandProducts.length > 0) return brandProducts.slice(0, 2);
      }

      if (hoveredItem.type === 'keyword') {
        if (hoveredItem.product) {
          const related = publishedProducts.find(
            (p) => p.id !== hoveredItem.product!.id && p.category === hoveredItem.product!.category
          );
          return related ? [hoveredItem.product, related] : [hoveredItem.product];
        }
      }
    }

    // B. If a category pill at bottom is hovered
    if (hoveredCategoryId) {
      const catProducts = publishedProducts.filter((p) => p.category === hoveredCategoryId);
      if (catProducts.length > 0) return catProducts.slice(0, 2);
    }

    // C. When typing a query, match published products
    if (needle) {
      const matches = publishedProducts.filter((p) =>
        `${p.code || ''} ${p.title} ${p.categoryName || ''}`
          .toLocaleLowerCase('az')
          .includes(needle)
      );
      if (matches.length > 0) {
        return matches.slice(0, 2);
      }
    }

    // D. Default multi-brand selection: take 1 item from distinct active brands
    const selection: Product[] = [];
    activeBrands.forEach((brand) => {
      if (selection.length < 2) {
        const item = publishedProducts.find((p) => p.brandId === brand.id);
        if (item && !selection.some((s) => s.id === item.id)) {
          selection.push(item);
        }
      }
    });

    // If still less than 2, fill from first published products
    if (selection.length < 2) {
      publishedProducts.forEach((p) => {
        if (!selection.some((item) => item.id === p.id) && selection.length < 2) {
          selection.push(p);
        }
      });
    }

    return selection;
  }, [hoveredItem, hoveredCategoryId, needle, publishedProducts, activeBrands]);

  // Section title for right column
  const rightSectionTitle = useMemo(() => {
    if (hoveredItem) {
      if (hoveredItem.type === 'product' && hoveredItem.product) {
        return hoveredItem.product.title;
      }
      if (hoveredItem.type === 'category') {
        return `${hoveredItem.displayText} məhsulları`;
      }
      if (hoveredItem.type === 'brand') {
        return `${hoveredItem.displayText}`;
      }
      return `${hoveredItem.displayText} nəticələri`;
    }
    if (hoveredCategoryId) {
      const catObj = activeCategories.find((c) => c.id === hoveredCategoryId);
      if (catObj) return `${catObj.name} məhsulları`;
    }
    return 'Populyar məhsullar';
  }, [hoveredItem, hoveredCategoryId, activeCategories]);

  // Bottom Section: Categories
  const categoryPills = useMemo(() => {
    return activeCategories.slice(0, 8);
  }, [activeCategories]);

  const handleSuggestionClick = (item: SuggestionItem) => {
    if (item.type === 'category' && item.categoryId) {
      onSelectCategory(item.categoryId);
      onSelectBrand('all');
      onClose();
    } else if (item.type === 'brand' && item.brandId) {
      onSelectBrand(item.brandId);
      onSelectCategory('all');
      onClose();
    } else if (item.product && onSelectProduct) {
      onSelectProduct(item.product);
      onClose();
    } else {
      onSearchChange(item.queryValue);
      onClose();
    }
  };

  const handleProductCardClick = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      onSearchChange(product.code || product.title);
    }
    onClose();
  };

  const handleShowAll = () => {
    onSelectBrand('all');
    onSelectCategory('all');
    onClose();
  };

  const handleCategoryPillClick = (catId: string) => {
    onSelectCategory(catId);
    onSelectBrand('all');
    onClose();
  };

  const handleClear = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const renderDropdownBody = () => (
    <>
      {/* Top 2-Column Section */}
      <div className="smart-search-main-grid">
        {/* Left Column: Search Suggestions / Keywords */}
        <div className="smart-search-left-col">
          <div className="smart-search-section-header">
            <span className="smart-search-section-title" style={{ color: theme.textMuted }}>
              Axtarış üzrə nəticə
            </span>
          </div>

          <div className="smart-search-suggestions-list">
            {suggestions.slice(0, 9).map((item, idx) => (
              <button
                key={item.id}
                type="button"
                className={`smart-search-item ${idx >= 5 ? 'hide-on-mobile' : ''} ${hoveredItem?.id === item.id ? 'is-hovered' : ''}`}
                onClick={() => handleSuggestionClick(item)}
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{ color: theme.text }}
              >
                <div className="smart-search-item-left">
                  <Search
                    size={14}
                    className="smart-search-item-icon"
                    style={{ color: theme.textMuted }}
                  />
                  <span className="smart-search-item-text">
                    <HighlightedQueryText
                      text={item.displayText}
                      query={searchQuery}
                      highlightColor={theme.primary}
                    />
                  </span>
                </div>
                {item.categoryName && (
                  <span className="smart-search-item-badge" style={{ color: theme.textMuted }}>
                    {item.categoryName}
                  </span>
                )}
                <ChevronRight
                  size={13}
                  className="smart-search-item-arrow"
                  style={{ color: theme.textMuted }}
                />
              </button>
            ))}

            {suggestions.length === 0 && (
              <div className="smart-search-empty" style={{ color: theme.textMuted }}>
                Axtarışa uyğun nəticə tapılmadı.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Popular / Recommended / Hovered Products (NO PRICES) */}
        <div className="smart-search-right-col" style={{ borderLeftColor: theme.border }}>
          <div className="smart-search-section-header popular-header">
            <span className="smart-search-section-title" style={{ color: theme.textMuted }}>
              {rightSectionTitle}
            </span>
            <button
              type="button"
              className="smart-search-show-all-btn"
              onClick={handleShowAll}
              style={{ color: theme.primary }}
            >
              <span>Hamısını göstər</span>
              <ChevronRight size={12} />
            </button>
          </div>

          <div className="smart-search-products-grid">
            {displayedProducts.map((prod) => {
              const prodImg =
                prod.image ||
                prod.gallery?.find((g) => Boolean(g)) ||
                prod.media?.find((m) => m.type === 'image')?.url ||
                '';
              const brandObj = activeBrands.find((b) => b.id === prod.brandId);

              return (
                <div
                  key={prod.id}
                  className="smart-search-product-card"
                  onClick={() => handleProductCardClick(prod)}
                  style={{
                    backgroundColor: isDarkMode
                      ? 'rgba(30, 41, 59, 0.6)'
                      : 'rgba(248, 250, 252, 0.8)',
                    borderColor: theme.border,
                  }}
                >
                  <div
                    className="smart-search-img-box"
                    style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}
                  >
                    {prodImg ? (
                      <ShimmerImage
                        src={prodImg}
                        alt={prod.title}
                        loading="lazy"
                        objectFit="contain"
                        spinnerSize={18}
                        containerStyle={{ width: '100%', height: '100%' }}
                        className="smart-search-prod-img"
                      />
                    ) : (
                      <div className="smart-search-placeholder-img">
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background:
                              'linear-gradient(135deg, rgba(220,38,38,0.1), rgba(220,38,38,0.05))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{ fontSize: '16px', fontWeight: 800, color: theme.primary }}
                          >
                            {brandObj?.name?.slice(0, 1) || 'S'}
                          </span>
                        </div>
                      </div>
                    )}
                    {brandObj && (
                      <span
                        className="smart-search-brand-tag"
                        style={{ backgroundColor: theme.primary, color: '#fff' }}
                      >
                        {brandObj.name}
                      </span>
                    )}
                  </div>

                  <div className="smart-search-card-info">
                    <h4
                      className="smart-search-card-title"
                      style={{ color: theme.text }}
                      title={prod.title}
                    >
                      {prod.title}
                    </h4>

                    {prod.categoryName && (
                      <span className="smart-search-card-cat" style={{ color: theme.textMuted }}>
                        {prod.categoryName}
                      </span>
                    )}

                    <div className="smart-search-card-action">
                      <span
                        style={{
                          color: theme.primary,
                          fontWeight: 700,
                          fontSize: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Ətraflı bax <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Categories */}
      {categoryPills.length > 0 && (
        <div className="smart-search-categories-section" style={{ borderTopColor: theme.border }}>
          <span className="smart-search-section-title" style={{ color: theme.textMuted }}>
            Kateqoriyalar
          </span>
          <div
            ref={searchCatRef}
            {...dragProps}
            className="smart-search-categories-row no-scrollbar"
            style={{ cursor: 'grab' }}
          >
            {categoryPills.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`smart-search-category-pill ${hoveredCategoryId === cat.id ? 'is-hovered' : ''}`}
                onClick={(e) => {
                  if (hasMoved()) return;
                  scrollItemIntoView(e);
                  handleCategoryPillClick(cat.id);
                }}
                onMouseEnter={() => setHoveredCategoryId(cat.id)}
                onMouseLeave={() => setHoveredCategoryId(null)}
                style={{
                  backgroundColor:
                    hoveredCategoryId === cat.id
                      ? 'rgba(220, 38, 38, 0.12)'
                      : isDarkMode
                        ? 'rgba(30, 41, 59, 0.7)'
                        : 'rgba(241, 245, 249, 0.9)',
                  borderColor: hoveredCategoryId === cat.id ? theme.primary : theme.border,
                  color: hoveredCategoryId === cat.id ? theme.primary : theme.text,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (!visible) return null;

  if (embeddedInHeader) {
    return (
      <div
        ref={modalRef}
        className="smart-search-overlay smart-search-inline-dropdown smart-search-embedded-panel"
        role="region"
        aria-label="Axtarış paneli"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '920px',
          margin: '0 auto',
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRadius: 0,
          border: 'none',
          color: theme.text,
          boxShadow: 'none',
          overflow: 'hidden',
          padding: '4px 0 14px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {renderDropdownBody()}
      </div>
    );
  }

  if (inline) {
    return (
      <div
        ref={modalRef}
        className="smart-search-overlay smart-search-inline-dropdown"
        role="region"
        aria-label="Axtarış paneli"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          width: '100%',
          maxWidth: '100%',
          zIndex: DESIGN_TOKENS.zIndex.modal + 2,
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.90)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          borderRadius: '0 0 20px 20px',
          border: '1px solid #e31e24',
          borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
          color: theme.text,
          boxShadow: isDarkMode
            ? '0 24px 60px rgba(0, 0, 0, 0.85)'
            : '0 24px 60px rgba(0, 0, 0, 0.18)',
          overflow: 'hidden',
          animation: 'smartSearchSlideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {renderDropdownBody()}
      </div>
    );
  }

  return (
    <div
      className="smart-search-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: DESIGN_TOKENS.zIndex.modal,
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '10px 16px',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div
        ref={modalRef}
        className="smart-search-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Ağıllı axtarış paneli"
        style={{
          width: '100%',
          maxWidth: '920px',
          backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(226, 232, 240, 0.85)'}`,
          color: theme.text,
          boxShadow: isDarkMode
            ? '0 24px 60px rgba(0, 0, 0, 0.75)'
            : '0 24px 60px rgba(0, 0, 0, 0.14)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Real Input Header Bar with Red Focus & Red Indicators */}
        <div
          className="smart-search-input-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 18px',
            borderBottom: `1px solid ${theme.border}`,
            position: 'relative',
          }}
        >
          <div
            className={`smart-search-input-wrapper ${isInputFocused ? 'is-focused' : ''}`}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)',
              border: isInputFocused ? '1px solid #e31e24' : `1px solid ${theme.border}`,
              borderRadius: '999px',
              padding: '9px 16px',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              boxShadow: isInputFocused ? '0 0 0 1px rgba(227, 30, 36, 0.15)' : 'none',
            }}
          >
            <Search
              size={18}
              style={{
                color: searchQuery.trim().length > 0 ? '#e31e24' : (theme.textMuted || '#94a3b8'),
                transition: 'color 0.2s ease',
                flexShrink: 0,
              }}
            />

            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Model, kateqoriya və ya xüsusiyyət axtarın..."
              aria-label="Ağıllı axtarış sahəsi"
              className="smart-search-native-input"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: theme.text,
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'inherit',
                width: '100%',
              }}
            />

            {/* Right side: Red spinning loader when typing or loading */}
            {(searchQuery.trim().length > 0 || isLoading) && (
              <Loader2
                size={16}
                className="img-spin"
                style={{
                  color: '#e31e24',
                  animation: 'imgSpinAnim 0.8s linear infinite',
                  flexShrink: 0,
                }}
                aria-label="Axtarılır..."
              />
            )}

            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Axtarışı təmizlə"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '2px',
                  color: theme.textMuted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Axtarış pəncərəsini bağla"
            className="smart-search-close-btn"
            style={{
              background: isDarkMode ? '#1e293b' : '#f1f5f9',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              padding: '8px 12px',
              color: theme.text,
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <span>Bağla</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 5px',
                borderRadius: '4px',
                backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
                color: theme.textMuted,
              }}
            >
              ESC
            </span>
          </button>
        </div>

        {renderDropdownBody()}
      </div>
    </div>
  );
};
