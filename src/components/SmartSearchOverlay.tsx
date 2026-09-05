import React, { useMemo } from 'react';
import { Search, ChevronRight, Sparkles } from 'lucide-react';
import { Brand, CatalogCategory, Product, ProductCategory } from '../types/product';
import { ThemeColors } from '../types/theme';

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
  onSelectCategory: (category: ProductCategory) => void;
  onSelectBrand: (brand: string) => void;
  onSelectProduct?: (product: Product) => void;
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
}) => {
  const [hoveredItem, setHoveredItem] = React.useState<SuggestionItem | null>(null);
  const [hoveredCategoryId, setHoveredCategoryId] = React.useState<string | null>(null);

  const needle = searchQuery.trim().toLocaleLowerCase('az');

  // Reset hover state when query changes or overlay closes
  React.useEffect(() => {
    setHoveredItem(null);
    setHoveredCategoryId(null);
  }, [searchQuery, visible]);

  // 1. Dynamic multi-brand suggestions (up to 9 items on desktop, 5 on mobile)
  const suggestions: SuggestionItem[] = useMemo(() => {
    if (!products.length && !categories.length) return [];

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
      // 1. Matching Categories
      categories.forEach((cat) => {
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

      // 2. Matching Brands
      brands.forEach((brand) => {
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

      // 3. Matching Products (Title, Code, Brand, Category, Specs)
      products.forEach((prod) => {
        const titleMatch = prod.title.toLocaleLowerCase('az').includes(needle);
        const codeMatch = prod.code.toLocaleLowerCase('az').includes(needle);
        const specMatch = prod.specs?.some(
          (s) => s.value.toLocaleLowerCase('az').includes(needle) || s.name.toLocaleLowerCase('az').includes(needle)
        );

        if (titleMatch || codeMatch || specMatch) {
          const brandObj = brands.find((b) => b.id === prod.brandId);
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
      // Default curated multi-brand smart suggestions across active brands and categories
      const activeBrandNames = brands.filter((b) => b.active).map((b) => b.name);
      
      // Top products from each active brand
      const featuredLotus = products.find((p) => p.brandId === 'lotus' || p.title.toLowerCase().includes('lotus'));
      const featuredArdo = products.find((p) => p.brandId === 'ardo' || p.title.toLowerCase().includes('ardo'));

      if (featuredLotus) {
        addSuggestion({
          id: `featured-lotus`,
          displayText: featuredLotus.title,
          queryValue: featuredLotus.code || featuredLotus.title,
          type: 'product',
          product: featuredLotus,
        });
      }

      if (featuredArdo) {
        addSuggestion({
          id: `featured-ardo`,
          displayText: featuredArdo.title,
          queryValue: featuredArdo.code || featuredArdo.title,
          type: 'product',
          product: featuredArdo,
        });
      }

      // Add popular category keywords
      categories.slice(0, 4).forEach((cat) => {
        addSuggestion({
          id: `default-cat-${cat.id}`,
          displayText: cat.name,
          queryValue: cat.name,
          type: 'category',
          categoryId: cat.id,
        });
      });

      // Technology & feature highlights
      ['Sabaf qaz odluqları', 'Inverter mühərrik', 'Touch control hava qızdırıcı'].forEach((kw, idx) => {
        addSuggestion({
          id: `kw-${idx}`,
          displayText: kw,
          queryValue: kw,
          type: 'keyword',
        });
      });

      // Add remaining products to reach 9 suggestions
      products.slice(0, 9).forEach((p) => {
        addSuggestion({
          id: `p-fill-${p.id}`,
          displayText: p.title,
          queryValue: p.code || p.title,
          type: 'product',
          product: p,
        });
      });
    }

    return items;
  }, [needle, products, categories, brands]);

  // 2. Dynamic Preview & Popular Products (Right column - updates on hover or default query)
  const displayedProducts: Product[] = useMemo(() => {
    if (!products.length) return [];

    // A. If a suggestion item is hovered with mouse
    if (hoveredItem) {
      if (hoveredItem.type === 'product' && hoveredItem.product) {
        const hoveredProd = hoveredItem.product;
        // Find a complementary related product (same category or another brand)
        const complementary = products.find(
          (p) => p.id !== hoveredProd.id && (p.category === hoveredProd.category || p.brandId !== hoveredProd.brandId)
        );
        return complementary ? [hoveredProd, complementary] : [hoveredProd];
      }

      if (hoveredItem.type === 'category' && hoveredItem.categoryId) {
        const catProducts = products.filter((p) => p.category === hoveredItem.categoryId);
        if (catProducts.length > 0) return catProducts.slice(0, 2);
      }

      if (hoveredItem.type === 'brand' && hoveredItem.brandId) {
        const brandProducts = products.filter((p) => p.brandId === hoveredItem.brandId);
        if (brandProducts.length > 0) return brandProducts.slice(0, 2);
      }

      if (hoveredItem.type === 'keyword') {
        const kw = hoveredItem.displayText.toLowerCase();
        const kwProducts = products.filter((p) =>
          `${p.title} ${p.code} ${p.categoryName} ${p.specs?.map((s) => s.value).join(' ')}`
            .toLowerCase()
            .includes(kw)
        );
        if (kwProducts.length > 0) return kwProducts.slice(0, 2);
      }
    }

    // B. If a category pill at bottom is hovered
    if (hoveredCategoryId) {
      const catProducts = products.filter((p) => p.category === hoveredCategoryId);
      if (catProducts.length > 0) return catProducts.slice(0, 2);
    }

    // C. Default active query matching or default popular products
    if (needle) {
      const matches = products.filter((p) =>
        `${p.code} ${p.title} ${p.categoryName}`.toLocaleLowerCase('az').includes(needle)
      );
      if (matches.length > 0) {
        return matches.slice(0, 2);
      }
    }

    // Default multi-brand popular selection: 1 Lotus, 1 Ardo (or 2 top products with images & prices)
    const lotusProduct = products.find((p) => (p.brandId === 'lotus' || p.title.toLowerCase().includes('lotus')) && (p.image || p.media?.length));
    const ardoProduct = products.find((p) => (p.brandId === 'ardo' || p.title.toLowerCase().includes('ardo')) && (p.image || p.media?.length));

    const selection: Product[] = [];
    if (lotusProduct) selection.push(lotusProduct);
    if (ardoProduct && ardoProduct.id !== lotusProduct?.id) selection.push(ardoProduct);

    if (selection.length < 2) {
      products.forEach((p) => {
        if (!selection.some((item) => item.id === p.id) && selection.length < 2) {
          selection.push(p);
        }
      });
    }

    return selection;
  }, [hoveredItem, hoveredCategoryId, needle, products]);

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
      const catObj = categories.find((c) => c.id === hoveredCategoryId);
      if (catObj) return `${catObj.name} məhsulları`;
    }
    return 'Populyar məhsullar';
  }, [hoveredItem, hoveredCategoryId, categories]);

  // 3. Active Categories for Bottom Section
  const activeCategories = useMemo(() => {
    return categories.filter((cat) => cat.active !== false).slice(0, 8);
  }, [categories]);

  if (!visible) return null;

  const handleSuggestionClick = (item: SuggestionItem) => {
    if (item.type === 'category' && item.categoryId) {
      onSelectCategory(item.categoryId);
      onSelectBrand('all');
      onClose();
      setTimeout(() => {
        document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else if (item.type === 'brand' && item.brandId) {
      onSelectBrand(item.brandId);
      onSelectCategory('all');
      onClose();
      setTimeout(() => {
        document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
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
    setTimeout(() => {
      document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const handleCategoryPillClick = (catId: string) => {
    onSelectCategory(catId);
    onSelectBrand('all');
    onClose();
    setTimeout(() => {
      document.querySelector('.catalog-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div
      className="smart-search-overlay"
      role="listbox"
      aria-label="Ağıllı axtarış paneli"
      style={{
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderColor: theme.border,
        boxShadow: isDarkMode ? '0 24px 60px rgba(0, 0, 0, 0.65)' : '0 24px 60px rgba(0, 0, 0, 0.16)',
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
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
                <Search className="smart-search-item-icon" size={15} color={hoveredItem?.id === item.id ? theme.primary : theme.textMuted} />
                <span className="smart-search-item-text">
                  <HighlightedQueryText
                    text={item.displayText}
                    query={searchQuery}
                    highlightColor={theme.primary}
                  />
                </span>
                {item.categoryName && (
                  <span className="smart-search-item-cat-badge" style={{ color: theme.textMuted }}>
                    {item.categoryName}
                  </span>
                )}
              </button>
            ))}

            {suggestions.length === 0 && (
              <div className="smart-search-empty" style={{ color: theme.textMuted }}>
                Axtarışa uyğun nəticə tapılmadı.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Popular / Recommended / Hovered Products */}
        <div className="smart-search-right-col" style={{ borderLeftColor: theme.border }}>
          <div className="smart-search-section-header popular-header">
            <span className="smart-search-section-title" style={{ color: theme.textMuted }}>
              {rightSectionTitle}
            </span>
            <button
              type="button"
              className="smart-search-show-all-btn"
              onClick={handleShowAll}
              style={{ color: theme.text, borderColor: theme.border }}
            >
              <span>Hamısını göstər</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="smart-search-products-grid">
            {displayedProducts.map((prod) => {
              const prodImg = prod.image || prod.media?.find((m) => m.type === 'image')?.url || '';
              const brandObj = brands.find((b) => b.id === prod.brandId);

              return (
                <div
                  key={prod.id}
                  className="smart-search-product-card"
                  onClick={() => handleProductCardClick(prod)}
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(248, 250, 252, 0.8)',
                    borderColor: theme.border,
                  }}
                >
                  <div className="smart-search-img-box" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}>
                    {prodImg ? (
                      <img
                        src={prodImg}
                        alt={prod.title}
                        loading="lazy"
                        className="smart-search-prod-img"
                      />
                    ) : (
                      <div className="smart-search-placeholder-img">
                        <Sparkles size={24} color={theme.primary} />
                      </div>
                    )}
                    {brandObj && (
                      <span className="smart-search-brand-tag" style={{ backgroundColor: theme.primary, color: '#fff' }}>
                        {brandObj.name}
                      </span>
                    )}
                  </div>

                  <div className="smart-search-card-info">
                    <h4 className="smart-search-card-title" style={{ color: theme.text }} title={prod.title}>
                      {prod.title}
                    </h4>

                    <div className="smart-search-price-row">
                      {prod.price !== undefined ? (
                        <span className="smart-search-price" style={{ color: '#dc2626' }}>
                          {prod.price} {prod.currency || '₼'}
                        </span>
                      ) : (
                        <span className="smart-search-contact-price" style={{ color: theme.primary }}>
                          Qiymət üçün əlaqə
                        </span>
                      )}
                      {prod.oldPrice && prod.oldPrice > (prod.price || 0) && (
                        <span className="smart-search-old-price" style={{ color: theme.textMuted }}>
                          {prod.oldPrice} ₼
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Section: Categories */}
      {activeCategories.length > 0 && (
        <div className="smart-search-categories-section" style={{ borderTopColor: theme.border }}>
          <span className="smart-search-section-title" style={{ color: theme.textMuted }}>
            Kateqoriyalar
          </span>
          <div className="smart-search-categories-row no-scrollbar">
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`smart-search-category-pill ${hoveredCategoryId === cat.id ? 'is-hovered' : ''}`}
                onClick={() => handleCategoryPillClick(cat.id)}
                onMouseEnter={() => setHoveredCategoryId(cat.id)}
                onMouseLeave={() => setHoveredCategoryId(null)}
                style={{
                  backgroundColor: hoveredCategoryId === cat.id ? 'rgba(220, 38, 38, 0.12)' : (isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.9)'),
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
    </div>
  );
};
