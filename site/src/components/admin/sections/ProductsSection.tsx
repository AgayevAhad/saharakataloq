import React, { useMemo, useState } from 'react';
import {
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  LayoutGrid,
  List,
  Maximize2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Tag,
  Trash2,
  Zap,
} from 'lucide-react';
import { CatalogData, Product } from '../../../types/product';
import { ThemeColors } from '../../../types/theme';
import { ShimmerImage } from '../../ShimmerImage';
import {
  getProductUniqueMediaCount,
  getProductVideoCount,
  isProductModified,
} from '../utils/adminHelpers';

export interface ProductsSectionProps {
  theme: ThemeColors;
  catalog: CatalogData;
  initialProducts: Product[];
  query: string;
  setQuery: (q: string) => void;
  adminBrand: string;
  setAdminBrand: (b: string) => void;
  adminCategory: string;
  setAdminCategory: (c: string) => void;
  adminMediaFilter:
    'all' | 'has-media' | 'no-media' | 'has-video' | 'no-video' | 'multi-media' | 'single-media';
  setAdminMediaFilter: (
    f: 'all' | 'has-media' | 'no-media' | 'has-video' | 'no-video' | 'multi-media' | 'single-media'
  ) => void;
  adminSpecsFilter: 'all' | 'has-specs' | 'no-specs';
  setAdminSpecsFilter: (f: 'all' | 'has-specs' | 'no-specs') => void;
  adminStatusFilter: 'all' | 'published' | 'draft' | 'modified';
  setAdminStatusFilter: (f: 'all' | 'published' | 'draft' | 'modified') => void;
  adminPriceFilter: 'all' | 'has-price' | 'no-price';
  setAdminPriceFilter: (f: 'all' | 'has-price' | 'no-price') => void;
  adminStockFilter: 'all' | 'in_stock' | 'out_of_stock' | 'preorder';
  setAdminStockFilter: (f: 'all' | 'in_stock' | 'out_of_stock' | 'preorder') => void;
  adminViewMode: 'table' | 'cards';
  setAdminViewMode: (v: 'table' | 'cards') => void;
  filtered: Product[];
  handleBulkSetStatus: (
    type:
      | 'no-media-draft'
      | 'has-media-pub'
      | 'has-specs-pub'
      | 'no-specs-draft'
      | 'current-filter-pub'
      | 'current-filter-draft'
  ) => void;
  onNewProduct: () => void;
  onOpenEditProduct: (p: Product) => void;
  onRevertSingleProduct: (productId: string) => void;
  onDuplicateProduct: (p: Product) => void;
  onRemoveProduct: (productId: string) => void;
  onUpdateProductInline: (productId: string, patch: Partial<Product>) => void;
  onOpenLightbox: (p: Product) => void;
  onMoveProductToPosition: (fromIndex: number, targetPos: number) => void;
  onDragStart: (index: number, e: React.DragEvent) => void;
  onDragOver: (index: number, e: React.DragEvent) => void;
  onDrop: (index: number, e: React.DragEvent) => void;
  onDragEnd: () => void;
  draggedIndex: number | null;
  dropTargetIndex: number | null;
  dropPosition: 'above' | 'below' | null;
  onQuickCreateCategoryRequest?: (productId: string) => void;
  onQuickCreateBrandRequest?: (productId: string) => void;
}

export const ProductsSection = ({
  theme,
  catalog,
  initialProducts,
  query,
  setQuery,
  adminBrand,
  setAdminBrand,
  adminCategory,
  setAdminCategory,
  adminMediaFilter,
  setAdminMediaFilter,
  adminSpecsFilter,
  setAdminSpecsFilter,
  adminStatusFilter,
  setAdminStatusFilter,
  adminPriceFilter,
  setAdminPriceFilter,
  adminStockFilter,
  setAdminStockFilter,
  adminViewMode,
  setAdminViewMode,
  filtered,
  handleBulkSetStatus,
  onNewProduct,
  onOpenEditProduct,
  onRevertSingleProduct,
  onDuplicateProduct,
  onRemoveProduct,
  onUpdateProductInline,
  onOpenLightbox,
  onMoveProductToPosition,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggedIndex,
  dropTargetIndex,
  dropPosition,
  onQuickCreateCategoryRequest,
  onQuickCreateBrandRequest,
}: ProductsSectionProps) => {
  const [isRandomOrder, setIsRandomOrder] = useState<boolean>(false);
  const [randomSeed, setRandomSeed] = useState<number>(0);

  const handleToggleRandom = () => {
    if (!isRandomOrder) {
      setIsRandomOrder(true);
      setRandomSeed(Date.now());
    } else {
      setRandomSeed(Date.now());
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setAdminBrand('all');
    setAdminCategory('all');
    setAdminMediaFilter('all');
    setAdminSpecsFilter('all');
    setAdminStatusFilter('all');
    setAdminPriceFilter('all');
    setAdminStockFilter('all');
    setIsRandomOrder(false);
  };

  const displayedProducts = useMemo(() => {
    if (!isRandomOrder) return filtered;
    return [...filtered].sort((a, b) => {
      const hashA =
        (a.id + randomSeed).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 997;
      const hashB =
        (b.id + randomSeed).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 997;
      return hashA - hashB;
    });
  }, [filtered, isRandomOrder, randomSeed]);

  // Counts for interactive filter pills
  const videoCount = useMemo(
    () => catalog.products.filter((p) => getProductVideoCount(p) > 0).length,
    [catalog.products]
  );
  const mediaCount = useMemo(
    () => catalog.products.filter((p) => getProductUniqueMediaCount(p) > 0).length,
    [catalog.products]
  );
  const noMediaCount = useMemo(
    () => catalog.products.filter((p) => getProductUniqueMediaCount(p) === 0).length,
    [catalog.products]
  );
  const specsCount = useMemo(
    () => catalog.products.filter((p) => Boolean(p.specs?.length)).length,
    [catalog.products]
  );
  const noSpecsCount = useMemo(
    () => catalog.products.filter((p) => !p.specs?.length).length,
    [catalog.products]
  );
  const pubCount = useMemo(
    () => catalog.products.filter((p) => p.status === 'published').length,
    [catalog.products]
  );
  const draftCount = useMemo(
    () => catalog.products.filter((p) => p.status === 'draft').length,
    [catalog.products]
  );
  const modCount = useMemo(
    () =>
      catalog.products.filter((p) =>
        isProductModified(
          p,
          initialProducts.find((ip) => ip.id === p.id)
        )
      ).length,
    [catalog.products, initialProducts]
  );
  const priceCount = useMemo(
    () => catalog.products.filter((p) => p.price && Number(p.price) > 0).length,
    [catalog.products]
  );
  const noPriceCount = useMemo(
    () => catalog.products.filter((p) => !p.price || Number(p.price) <= 0).length,
    [catalog.products]
  );

  const isAllFilterActive =
    adminMediaFilter === 'all' &&
    adminSpecsFilter === 'all' &&
    adminStatusFilter === 'all' &&
    adminPriceFilter === 'all' &&
    adminBrand === 'all' &&
    adminCategory === 'all' &&
    adminStockFilter === 'all' &&
    !query &&
    !isRandomOrder;

  return (
    <div>
      {/* Top Search (Compact on left) & Right-aligned Controls Toolbar strictly 1 unified row */}
      <div
        className="admin-list-actions admin-products-top-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          gap: '8px',
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        <div
          className="admin-search"
          style={{
            background: theme.bgCard,
            borderColor: theme.border,
            flex: '0 0 200px',
            minWidth: '160px',
            maxWidth: '220px',
          }}
        >
          <Search size={14} color={theme.textMuted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Model, kod və ya adla axtar..."
            style={{ color: theme.text, fontSize: '12px' }}
          />
        </div>

        <div
          className="admin-toolbar-controls"
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            flexWrap: 'nowrap',
            flexShrink: 0,
            justifyContent: 'flex-end',
          }}
        >
          {/* Brand Filter */}
          <select
            value={adminBrand}
            onChange={(e) => setAdminBrand(e.target.value)}
            className="admin-category-select admin-compact-select"
            title="Brendə görə süzgəc"
            style={{ maxWidth: '125px' }}
          >
            <option value="all">Bütün brendlər ({catalog.brands.length})</option>
            {catalog.brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({catalog.products.filter((p) => p.brandId === b.id).length})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={adminCategory}
            onChange={(e) => setAdminCategory(e.target.value)}
            className="admin-category-select admin-compact-select"
            title="Kateqoriyaya görə süzgəc"
            style={{ maxWidth: '125px' }}
          >
            <option value="all">Bütün kateqoriyalar</option>
            {catalog.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({catalog.products.filter((p) => p.category === c.id).length})
              </option>
            ))}
          </select>

          {/* Media Filter */}
          <select
            value={adminMediaFilter}
            onChange={(e) =>
              setAdminMediaFilter(
                e.target.value as
                  | 'all'
                  | 'has-media'
                  | 'no-media'
                  | 'has-video'
                  | 'no-video'
                  | 'multi-media'
                  | 'single-media'
              )
            }
            className="admin-category-select admin-compact-select"
            title="Şəkilli və ya şəkilsiz məhsullara görə süzgəc"
            style={{ maxWidth: '115px' }}
          >
            <option value="all">Bütün Media ({catalog.products.length})</option>
            <option value="has-video">🎬 Videolu ({videoCount})</option>
            <option value="no-video">📹 Videosuz ({catalog.products.length - videoCount})</option>
            <option value="has-media">🖼 Medialı ({mediaCount})</option>
            <option value="no-media">📷 Mediasız ({noMediaCount})</option>
            <option value="multi-media">
              📸 Çoxmedia (
              {catalog.products.filter((p) => getProductUniqueMediaCount(p) > 1).length})
            </option>
            <option value="single-media">
              🖼️ Tək media (
              {catalog.products.filter((p) => getProductUniqueMediaCount(p) === 1).length})
            </option>
          </select>

          {/* Specs Filter */}
          <select
            value={adminSpecsFilter}
            onChange={(e) =>
              setAdminSpecsFilter(e.target.value as 'all' | 'has-specs' | 'no-specs')
            }
            className="admin-category-select admin-compact-select"
            title="Texniki göstəricilərə görə süzgəc"
            style={{ maxWidth: '110px' }}
          >
            <option value="all">Göstəricilər</option>
            <option value="has-specs">📊 Var ({specsCount})</option>
            <option value="no-specs">⚠️ Boş ({noSpecsCount})</option>
          </select>

          {/* Status Filter */}
          <select
            value={adminStatusFilter}
            onChange={(e) =>
              setAdminStatusFilter(e.target.value as 'all' | 'published' | 'draft' | 'modified')
            }
            className="admin-category-select admin-compact-select"
            title="Məhsul statusuna görə süzgəc"
            style={{ maxWidth: '110px' }}
          >
            <option value="all">Statuslar</option>
            <option value="published">✅ Dərc ({pubCount})</option>
            <option value="draft">📝 Qaralama ({draftCount})</option>
            <option value="modified">✏️ Düzəliş ({modCount})</option>
          </select>

          {/* Price Filter */}
          <select
            value={adminPriceFilter}
            onChange={(e) =>
              setAdminPriceFilter(e.target.value as 'all' | 'has-price' | 'no-price')
            }
            className="admin-category-select admin-compact-select"
            title="Qiymətə görə süzgəc"
            style={{ maxWidth: '105px' }}
          >
            <option value="all">Qiymət</option>
            <option value="has-price">💰 Qiymətli ({priceCount})</option>
            <option value="no-price">🏷️ Qiymətsiz ({noPriceCount})</option>
          </select>

          {/* Stock Filter */}
          <select
            value={adminStockFilter}
            onChange={(e) =>
              setAdminStockFilter(
                e.target.value as 'all' | 'in_stock' | 'out_of_stock' | 'preorder'
              )
            }
            className="admin-category-select admin-compact-select"
            title="Stok vəziyyətinə görə süzgəc"
            style={{ maxWidth: '105px' }}
          >
            <option value="all">Stok</option>
            <option value="in_stock">
              🟢 Var (
              {catalog.products.filter((p) => (p.stockStatus || 'in_stock') === 'in_stock').length})
            </option>
            <option value="out_of_stock">
              🔴 Yoxdur ({catalog.products.filter((p) => p.stockStatus === 'out_of_stock').length})
            </option>
            <option value="preorder">
              🟡 Ön sifariş ({catalog.products.filter((p) => p.stockStatus === 'preorder').length})
            </option>
          </select>

          {/* Random / Shuffle Order Button */}
          <button
            type="button"
            className={`admin-random-btn ${isRandomOrder ? 'active' : ''}`}
            onClick={handleToggleRandom}
            title={
              isRandomOrder
                ? 'Təsadüfi sıranı yenidən qarışdır'
                : 'Məhsulları təsadüfi ardıcıllıqla göstər (Random)'
            }
          >
            <Shuffle size={13} />
            <span>{isRandomOrder ? 'Qarışdırıldı' : 'Təsadüfi'}</span>
          </button>

          {/* View Mode Toggle Switch (Table vs Cards) */}
          <div
            className="admin-view-toggle"
            style={{ borderColor: theme.border, background: theme.bgSecondary }}
          >
            <button
              type="button"
              className={`admin-view-btn ${adminViewMode === 'cards' ? 'active' : ''}`}
              style={{
                background: adminViewMode === 'cards' ? theme.primary : 'transparent',
                color: adminViewMode === 'cards' ? '#ffffff' : theme.textMuted,
              }}
              onClick={() => setAdminViewMode('cards')}
              title="Kart / Vitrin görünüşü"
            >
              <LayoutGrid size={13} />
              <span>Kartlar</span>
            </button>
            <button
              type="button"
              className={`admin-view-btn ${adminViewMode === 'table' ? 'active' : ''}`}
              style={{
                background: adminViewMode === 'table' ? theme.primary : 'transparent',
                color: adminViewMode === 'table' ? '#ffffff' : theme.textMuted,
              }}
              onClick={() => setAdminViewMode('table')}
              title="Sıra / Cədvəl görünüşü"
            >
              <List size={13} />
              <span>Siyahı</span>
            </button>
          </div>

          {/* Create New Product Button */}
          <button
            className="manager-add"
            onClick={onNewProduct}
            style={{
              background: theme.primary,
              color: '#fff',
              padding: '8px 13px',
              borderRadius: '8px',
              fontSize: '12px',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} /> Yeni Məhsul
          </button>
        </div>
      </div>

      {/* Interactive Quick Filter Chips Strip ("GÖSTƏRİLİR" SECTION) */}
      <div
        className="admin-filter-chips-bar"
        style={{
          background: theme.bgSecondary,
          borderColor: theme.border,
          color: theme.textMuted,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Göstərilir:</span>
          <strong style={{ color: theme.text, fontSize: '13px' }}>
            {displayedProducts.length}
          </strong>
          <span>/ {catalog.products.length} məhsul</span>
        </div>

        <div className="admin-filter-chips-list">
          {/* Hamısı chip */}
          <button
            type="button"
            className={`admin-filter-chip ${isAllFilterActive ? 'active' : ''}`}
            onClick={handleResetFilters}
            title="Bütün filtrləri sıfırla və hamısını göstər"
          >
            Hamısı ({catalog.products.length})
          </button>

          {/* Videolu chip */}
          <button
            type="button"
            className={`admin-filter-chip ${adminMediaFilter === 'has-video' ? 'active purple' : ''}`}
            onClick={() =>
              setAdminMediaFilter(adminMediaFilter === 'has-video' ? 'all' : 'has-video')
            }
            title="Yalnız video çarxı olan məhsulları filtrlə"
          >
            🎬 Videolu ({videoCount})
          </button>

          {/* Şəkilli chip */}
          <button
            type="button"
            className={`admin-filter-chip ${adminMediaFilter === 'has-media' ? 'active green' : ''}`}
            onClick={() =>
              setAdminMediaFilter(adminMediaFilter === 'has-media' ? 'all' : 'has-media')
            }
            title="Yalnız şəkli olan məhsulları filtrlə"
          >
            🖼 Medialı ({mediaCount})
          </button>

          {/* Şəkilsiz chip */}
          <button
            type="button"
            className={`admin-filter-chip ${adminMediaFilter === 'no-media' ? 'active' : ''}`}
            onClick={() =>
              setAdminMediaFilter(adminMediaFilter === 'no-media' ? 'all' : 'no-media')
            }
            title="Şəkilsiz məhsulları filtrlə"
          >
            📷 Şəkilsiz ({noMediaCount})
          </button>

          {/* Göstəricili chip */}
          <button
            type="button"
            className={`admin-filter-chip ${adminSpecsFilter === 'has-specs' ? 'active blue' : ''}`}
            onClick={() =>
              setAdminSpecsFilter(adminSpecsFilter === 'has-specs' ? 'all' : 'has-specs')
            }
            title="Texniki parametrləri olan məhsulları filtrlə"
          >
            📊 Göstəricili ({specsCount})
          </button>

          {/* Göstəricisiz chip */}
          <button
            type="button"
            className={`admin-filter-chip ${adminSpecsFilter === 'no-specs' ? 'active amber' : ''}`}
            onClick={() =>
              setAdminSpecsFilter(adminSpecsFilter === 'no-specs' ? 'all' : 'no-specs')
            }
            title="Texniki parametrləri boş olan məhsulları filtrlə"
          >
            ⚠️ Göstəricisiz ({noSpecsCount})
          </button>

          {/* Yayımda chip */}
          <button
            type="button"
            className={`admin-filter-chip ${adminStatusFilter === 'published' ? 'active green' : ''}`}
            onClick={() =>
              setAdminStatusFilter(adminStatusFilter === 'published' ? 'all' : 'published')
            }
            title="Dərc edilmiş aktiv məhsulları filtrlə"
          >
            ✅ Yayımda ({pubCount})
          </button>

          {/* Qaralama chip */}
          <button
            type="button"
            className={`admin-filter-chip ${adminStatusFilter === 'draft' ? 'active' : ''}`}
            onClick={() => setAdminStatusFilter(adminStatusFilter === 'draft' ? 'all' : 'draft')}
            title="Qaralama halında olan məhsulları filtrlə"
          >
            📝 Qaralama ({draftCount})
          </button>

          {/* Düzəliş chip */}
          {modCount > 0 && (
            <button
              type="button"
              className={`admin-filter-chip ${adminStatusFilter === 'modified' ? 'active amber' : ''}`}
              onClick={() =>
                setAdminStatusFilter(adminStatusFilter === 'modified' ? 'all' : 'modified')
              }
              title="Düzəliş edilmiş məhsulları filtrlə"
            >
              ✏️ Düzəliş ({modCount})
            </button>
          )}

          {/* Qiymətli chip */}
          <button
            type="button"
            className={`admin-filter-chip ${adminPriceFilter === 'has-price' ? 'active blue' : ''}`}
            onClick={() =>
              setAdminPriceFilter(adminPriceFilter === 'has-price' ? 'all' : 'has-price')
            }
            title="Qiyməti olan məhsulları filtrlə"
          >
            💰 Qiymətli ({priceCount})
          </button>

          {/* Qiymətsiz chip */}
          <button
            type="button"
            className={`admin-filter-chip ${adminPriceFilter === 'no-price' ? 'active' : ''}`}
            onClick={() =>
              setAdminPriceFilter(adminPriceFilter === 'no-price' ? 'all' : 'no-price')
            }
            title="Qiymətsiz (Sorğu ilə) olan məhsulları filtrlə"
          >
            🏷️ Qiymətsiz ({noPriceCount})
          </button>

          {/* Təsadüfi chip */}
          <button
            type="button"
            className={`admin-filter-chip ${isRandomOrder ? 'active purple' : ''}`}
            onClick={handleToggleRandom}
            title="Təsadüfi düzülüşü aktivləşdir / yenidən qarışdır"
          >
            🎲 Təsadüfi {isRandomOrder ? '(Aktiv)' : ''}
          </button>
        </div>
      </div>

      {/* Bulk Visibility Actions Toolbar */}
      <div
        className="admin-bulk-actions-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          marginBottom: '16px',
          padding: '10px 14px',
          background: theme.bgCard,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: theme.textMuted,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Zap size={14} color={theme.primary} />
            Toplu Görünüş Əməliyyatları:
          </span>

          {/* 1. Şəkilsizləri Gizlə */}
          <button
            type="button"
            onClick={() => handleBulkSetStatus('no-media-draft')}
            title="Şəkli olmayan bütün məhsulları qaralamaya keçir (gizlə)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 11px',
              borderRadius: '6px',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🚫 Şəkilsizləri Dərcdən Çıxar (Gizlə)
          </button>

          {/* 2. Şəkilliləri Dərc Et */}
          <button
            type="button"
            onClick={() => handleBulkSetStatus('has-media-pub')}
            title="Şəkli olan bütün məhsulları canlı yayıma burax (dərc et)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 11px',
              borderRadius: '6px',
              background: 'rgba(22, 163, 74, 0.12)',
              color: '#16a34a',
              border: '1px solid rgba(22, 163, 74, 0.25)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🖼️ Şəkilliləri Dərc Et
          </button>

          {/* 3. Göstəricisi Olanları Dərc Et */}
          <button
            type="button"
            onClick={() => handleBulkSetStatus('has-specs-pub')}
            title="Texniki parametrləri olan məhsulları dərc et"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 11px',
              borderRadius: '6px',
              background: 'rgba(37, 99, 235, 0.12)',
              color: '#2563eb',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            📊 Parametrliləri Dərc Et
          </button>

          {/* 4. Göstəricisi Olmayanları Gizlə */}
          <button
            type="button"
            onClick={() => handleBulkSetStatus('no-specs-draft')}
            title="Texniki parametrləri boş olan məhsulları qaralamaya keçir"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 11px',
              borderRadius: '6px',
              background: 'rgba(217, 119, 6, 0.12)',
              color: '#d97706',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ⚠️ Parametrsizləri Dərcdən Çıxar
          </button>
        </div>

        {/* Filtered Subset Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => handleBulkSetStatus('current-filter-pub')}
            title="Hazırda ekranda görünən bütün filtirlənmiş məhsulları dərc et"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: theme.primary,
              color: '#ffffff',
              border: 'none',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Eye size={12} /> Süzgəcdəkiləri Dərc Et ({displayedProducts.length})
          </button>

          <button
            type="button"
            onClick={() => handleBulkSetStatus('current-filter-draft')}
            title="Hazırda ekranda görünən bütün filtirlənmiş məhsulları qaralamaya keçir (gizlə)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: theme.bgSecondary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <EyeOff size={12} /> Süzgəcdəkiləri Gizlə ({displayedProducts.length})
          </button>
        </div>
      </div>

      {/* PRODUCT LIST (CARDS VIEW VS TABLE VIEW) */}
      {adminViewMode === 'cards' ? (
        <div className="admin-products-cards-grid">
          {displayedProducts.map((product) => {
            const catalogIndex = catalog.products.findIndex((p) => p.id === product.id);
            const brand = catalog.brands.find((b) => b.id === product.brandId);
            const categoryObj = catalog.categories.find((c) => c.id === product.category);
            const mediaCount = getProductUniqueMediaCount(product);
            const specsCount = product.specs?.length || 0;
            const initialProduct = initialProducts.find((p) => p.id === product.id);
            const isModified = isProductModified(product, initialProduct);

            return (
              <div
                key={product.id}
                className="admin-product-card"
                style={{ background: theme.bgCard, borderColor: theme.border }}
              >
                {/* 1. Card Media Stage (215px Crisp Containment with ShimmerImage & Badges) */}
                <div
                  className="admin-card-image-wrap"
                  onClick={() => onOpenLightbox(product)}
                  title="Böyütmək və şəkillərə tam baxmaq üçün klikləyin"
                >
                  {product.image ? (
                    <ShimmerImage
                      src={product.image}
                      alt={product.title}
                      cropRect={product.cropRect || product.media?.[0]?.cropRect}
                      className="admin-card-img"
                      style={{
                        objectPosition: product.imagePosition || 'center',
                        objectFit: (product.imageFit || 'contain') as any,
                      }}
                    />
                  ) : (
                    <div className="admin-card-no-img">📷 Şəkilsiz</div>
                  )}
                  <div className="admin-card-badges">
                    <span className="admin-card-brand-badge">
                      {brand?.name || product.brandId.toUpperCase()}
                    </span>
                    <span
                      className={`admin-card-status-badge ${
                        product.status === 'published' ? 'published' : 'draft'
                      }`}
                    >
                      {product.status === 'published' ? 'Dərc edilib' : 'Qaralama'}
                    </span>
                    {product.media?.some((m) => m.type === 'video') && (
                      <span
                        className="admin-card-video-badge"
                        style={{
                          background: 'rgba(124, 58, 237, 0.92)',
                          color: '#ffffff',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontSize: '9.5px',
                          fontWeight: 800,
                          boxShadow: '0 2px 6px rgba(124, 58, 237, 0.4)',
                        }}
                        title="Bu məhsulun video çarxı var"
                      >
                        🎬 Video
                      </span>
                    )}
                    {isModified && (
                      <span
                        style={{
                          background: '#d97706',
                          color: '#ffffff',
                          padding: '3px 7px',
                          borderRadius: '6px',
                          fontSize: '9.5px',
                          fontWeight: 800,
                        }}
                        title="Bu məhsulda redaktə və ya kəsim dəyişikliyi var"
                      >
                        ✏️ Düzəliş
                      </span>
                    )}
                  </div>
                  {mediaCount > 1 && (
                    <span className="admin-card-media-count">
                      {product.media?.some((m) => m.type === 'video')
                        ? `🎬 ${mediaCount} media`
                        : `🖼 ${mediaCount} foto`}
                    </span>
                  )}
                </div>

                {/* 2. Card Body (Matching exact catalog ProductCard typography and spacing) */}
                <div className="admin-card-body">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                    }}
                  >
                    <span className="admin-card-category">
                      {product.categoryName || categoryObj?.name || product.category}
                    </span>
                    <span className="admin-card-code" style={{ fontWeight: 700 }}>
                      № {catalogIndex + 1}
                    </span>
                  </div>

                  <h4
                    className="admin-card-title"
                    title={product.title}
                    style={{ color: theme.text }}
                  >
                    {product.title || 'Adsız məhsul'}
                  </h4>

                  <div className="admin-card-code" style={{ color: theme.textMuted }}>
                    Model: <strong style={{ color: theme.text }}>{product.code || 'KODSUZ'}</strong>
                  </div>

                  {/* Specs summary pills */}
                  {specsCount > 0 ? (
                    <div className="admin-card-specs-row">
                      {product.specs?.slice(0, 3).map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="admin-card-spec-pill"
                          style={{ borderColor: theme.border }}
                          title={`${s.name}: ${s.value}`}
                        >
                          {s.name}: <strong>{s.value}</strong>
                        </span>
                      ))}
                      {specsCount > 3 && (
                        <span className="admin-card-spec-pill" style={{ opacity: 0.7 }}>
                          +{specsCount - 3} parametr
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#d97706',
                        fontStyle: 'italic',
                        margin: '2px 0',
                      }}
                    >
                      ⚠️ Xüsusiyyətlər qeyd edilməyib
                    </div>
                  )}

                  {/* Price and Stock Status Row */}
                  <div className="admin-card-price-row">
                    {product.price && Number(product.price) > 0 ? (
                      <span className="admin-card-price-val">
                        {Number(product.price).toLocaleString('az-AZ')} {product.currency || '₼'}
                      </span>
                    ) : (
                      <span className="admin-card-price-none">Qiymət: Sorğu ilə (Qiymətsiz)</span>
                    )}

                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 750,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background:
                          product.stockStatus === 'out_of_stock'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : product.stockStatus === 'preorder'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(22, 163, 74, 0.12)',
                        color:
                          product.stockStatus === 'out_of_stock'
                            ? '#ef4444'
                            : product.stockStatus === 'preorder'
                              ? '#f59e0b'
                              : '#16a34a',
                      }}
                    >
                      {product.stockStatus === 'out_of_stock'
                        ? 'Bitib'
                        : product.stockStatus === 'preorder'
                          ? 'Ön sifariş'
                          : 'Stokda'}
                    </span>
                  </div>
                </div>

                {/* 3. Attached Thin Bottom Action Strip (Separated by a thin top line) */}
                <div className="admin-card-actions-strip" style={{ borderColor: theme.border }}>
                  <button
                    type="button"
                    className="admin-card-action-btn edit"
                    onClick={() => onOpenEditProduct(product)}
                    style={{ background: theme.primary, borderColor: theme.primary }}
                    title="Redaktə et"
                  >
                    <Pencil size={12} /> Redaktə
                  </button>

                  <button
                    type="button"
                    className={`admin-card-action-btn price-toggle`}
                    onClick={() => {
                      if (product.price && Number(product.price) > 0) {
                        onUpdateProductInline(product.id, { price: 0 });
                      } else {
                        const val = prompt('Məhsul üçün qiymət daxil edin (AZN):', '100');
                        if (val && !isNaN(Number(val))) {
                          onUpdateProductInline(product.id, { price: Number(val) });
                        }
                      }
                    }}
                    title={product.price ? 'Qiyməti sıfırla (Qiymətsiz et)' : 'Qiymət təyin et'}
                  >
                    <Tag size={12} /> {product.price ? 'Qiymətli' : 'Qiymətsiz'}
                  </button>

                  <button
                    type="button"
                    className={`admin-card-action-btn pub-toggle ${
                      product.status === 'published' ? 'to-draft' : 'to-pub'
                    }`}
                    onClick={() =>
                      onUpdateProductInline(product.id, {
                        status: product.status === 'published' ? 'draft' : 'published',
                      })
                    }
                    title={
                      product.status === 'published'
                        ? 'Qaralamaya keçir (Gizlə)'
                        : 'Dərc et (Yayımda göstər)'
                    }
                  >
                    {product.status === 'published' ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{product.status === 'published' ? 'Dərc' : 'Qaralama'}</span>
                  </button>

                  {isModified && initialProduct && (
                    <button
                      type="button"
                      className="admin-card-action-btn"
                      onClick={() => onRevertSingleProduct(product.id)}
                      title="Bu məhsulu ilkin dərc olunmuş vəziyyətinə qaytar"
                      style={{
                        background: 'rgba(217, 119, 6, 0.15)',
                        color: '#d97706',
                        borderColor: '#d97706',
                      }}
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="admin-card-action-btn delete"
                    onClick={() => onRemoveProduct(product.id)}
                    title="Məhsulu sil"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
          {!displayedProducts.length && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px 20px',
                color: theme.textMuted,
                background: theme.bgCard,
                border: `1px solid ${theme.border}`,
                borderRadius: '14px',
              }}
            >
              Axtarış və filtrlərə uyğun heç bir məhsul tapılmadı.
            </div>
          )}
        </div>
      ) : (
        <div
          className="admin-table-wrap"
          style={{ borderColor: theme.border, background: theme.bgCard }}
        >
          <table>
            <thead>
              <tr style={{ borderBottomColor: theme.border }}>
                <th style={{ width: '80px' }}>Sıra (№)</th>
                <th style={{ width: '56px' }}>Foto</th>
                <th>Model Kodu</th>
                <th>Məhsul Adı</th>
                <th>Kateqoriya</th>
                <th>Brend</th>
                <th>Qiymət</th>
                <th>Nişan (Badge)</th>
                <th>Status & Stok</th>
                <th style={{ textAlign: 'right' }}>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map((product) => {
                const catalogIndex = catalog.products.findIndex((p) => p.id === product.id);
                const isDragging = draggedIndex === catalogIndex;
                const isDropTarget = dropTargetIndex === catalogIndex;
                const dropClass = isDropTarget && dropPosition ? `drop-${dropPosition}` : '';

                return (
                  <tr
                    key={product.id}
                    draggable
                    onDragStart={(e) => onDragStart(catalogIndex, e)}
                    onDragOver={(e) => onDragOver(catalogIndex, e)}
                    onDrop={(e) => onDrop(catalogIndex, e)}
                    onDragEnd={onDragEnd}
                    className={`drag-row ${isDragging ? 'dragging' : ''} ${dropClass}`}
                    style={{ borderBottomColor: theme.border }}
                  >
                    {/* Drag Handle & Sequence input */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span
                          className="drag-handle"
                          title="Mouse ilə tutub sıranı dəyişmək üçün sürüşdürün"
                        >
                          <GripVertical size={16} />
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={catalog.products.length}
                          defaultValue={catalogIndex + 1}
                          key={`seq-${catalogIndex}-${catalog.products.length}`}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) onMoveProductToPosition(catalogIndex, val);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val = parseInt((e.target as HTMLInputElement).value, 10);
                              if (!isNaN(val)) onMoveProductToPosition(catalogIndex, val);
                            }
                          }}
                          className="seq-badge-input"
                          title="Sıra nömrəsini daxil edib Enter basın"
                        />
                      </div>
                    </td>

                    {/* Thumbnail with Lightbox click & Multi-image badge */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                          className="admin-prod-thumb"
                          onClick={() => onOpenLightbox(product)}
                          title="Böyütmək və baxmaq üçün klikləyin"
                          style={{ cursor: 'pointer' }}
                        >
                          {product.image ? (
                            <ShimmerImage
                              src={product.image}
                              alt={product.title}
                              cropRect={product.cropRect || product.media?.[0]?.cropRect}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            '🖼'
                          )}
                        </div>
                        {product.media?.some((m) => m.type === 'video') && (
                          <span
                            className="admin-video-badge"
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: 'rgba(124, 58, 237, 0.15)',
                              color: '#8b5cf6',
                              border: '1px solid rgba(124, 58, 237, 0.3)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              whiteSpace: 'nowrap',
                              cursor: 'pointer',
                            }}
                            onClick={() => onOpenLightbox(product)}
                            title="Bu məhsulda video mövcuddur"
                          >
                            🎬 Video
                          </span>
                        )}
                        {(() => {
                          const mediaCount = getProductUniqueMediaCount(product);
                          return mediaCount > 1 ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                background: 'rgba(127,127,127,0.15)',
                                color: theme.textMuted,
                                padding: '2px 5px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                              }}
                              onClick={() => onOpenLightbox(product)}
                              title={`${mediaCount} foto/media mövcuddur`}
                            >
                              +{mediaCount - 1}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>

                    {/* Model Code */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong className="admin-code">{product.code || '—'}</strong>
                        {(() => {
                          const initialProduct = initialProducts.find((p) => p.id === product.id);
                          const isModified = isProductModified(product, initialProduct);
                          return isModified ? (
                            <span
                              style={{
                                background: 'rgba(217, 119, 6, 0.15)',
                                color: '#d97706',
                                border: '1px solid #d97706',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                                whiteSpace: 'nowrap',
                              }}
                              title="Bu məhsulda redaktə və ya kəsim dəyişikliyi var"
                            >
                              ✏️ Düzəliş
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>

                    {/* Product Title */}
                    <td>
                      <span className="admin-title" title={product.title}>
                        {product.title}
                      </span>
                    </td>

                    {/* Inline Category Select + On the fly create */}
                    <td>
                      <select
                        value={product.category}
                        onChange={(e) => {
                          if (e.target.value === '__new_category__') {
                            onQuickCreateCategoryRequest?.(product.id);
                          } else {
                            const cat = catalog.categories.find((c) => c.id === e.target.value);
                            onUpdateProductInline(product.id, {
                              category: e.target.value,
                              categoryName: cat?.name || product.categoryName,
                            });
                          }
                        }}
                        className="inline-table-select"
                        style={{ background: theme.bgSecondary, borderColor: theme.border }}
                      >
                        {catalog.categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        <option value="__new_category__">+ Yeni Kateqoriya Yarat...</option>
                      </select>
                    </td>

                    {/* Inline Brand Select + On the fly create */}
                    <td>
                      <select
                        value={product.brandId || 'ardo'}
                        onChange={(e) => {
                          if (e.target.value === '__new_brand__') {
                            onQuickCreateBrandRequest?.(product.id);
                          } else {
                            onUpdateProductInline(product.id, { brandId: e.target.value });
                          }
                        }}
                        className="inline-table-select"
                        style={{ background: theme.bgSecondary, borderColor: theme.border }}
                      >
                        {catalog.brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                        <option value="__new_brand__">+ Yeni Brend Yarat...</option>
                      </select>
                    </td>

                    {/* Inline Price Fast Edit */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          defaultValue={product.price ?? ''}
                          placeholder="Qiymət"
                          key={`price-${product.id}-${product.price}`}
                          onBlur={(e) => {
                            const val =
                              e.target.value === '' ? undefined : parseFloat(e.target.value);
                            onUpdateProductInline(product.id, { price: val });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const val =
                                (e.target as HTMLInputElement).value === ''
                                  ? undefined
                                  : parseFloat((e.target as HTMLInputElement).value);
                              onUpdateProductInline(product.id, { price: val });
                            }
                          }}
                          className="inline-table-input"
                          style={{ width: '80px' }}
                        />
                        <span style={{ fontSize: '11px', color: theme.textMuted }}>
                          {product.currency || '₼'}
                        </span>
                      </div>
                    </td>

                    {/* Badge */}
                    <td>
                      {product.badgeText ? (
                        <span
                          className="admin-badge"
                          style={{
                            background:
                              product.badgeColor === 'red'
                                ? '#dc2626'
                                : product.badgeColor === 'green'
                                  ? '#16a34a'
                                  : product.badgeColor === 'blue'
                                    ? '#2563eb'
                                    : '#d97706',
                            color: '#ffffff',
                          }}
                        >
                          {product.badgeText}
                        </span>
                      ) : (
                        <span style={{ color: theme.textMuted }}>—</span>
                      )}
                    </td>

                    {/* Inline Status & Stock Fast Edit */}
                    <td>
                      <div style={{ display: 'grid', gap: '4px' }}>
                        <select
                          value={product.status || 'published'}
                          onChange={(e) =>
                            onUpdateProductInline(product.id, {
                              status: e.target.value as 'published' | 'draft',
                            })
                          }
                          className="inline-table-select"
                          style={{
                            background:
                              product.status === 'published'
                                ? 'rgba(37, 99, 235, 0.12)'
                                : 'rgba(127,127,127,0.12)',
                            color: product.status === 'published' ? '#2563eb' : theme.textMuted,
                            fontWeight: 750,
                          }}
                        >
                          <option value="published">Yayımda</option>
                          <option value="draft">Qaralama</option>
                        </select>
                        <select
                          value={product.stockStatus || 'in_stock'}
                          onChange={(e) =>
                            onUpdateProductInline(product.id, {
                              stockStatus: e.target.value as Product['stockStatus'],
                            })
                          }
                          className="inline-table-select"
                          style={{
                            background:
                              product.stockStatus === 'in_stock'
                                ? 'rgba(22, 163, 74, 0.12)'
                                : product.stockStatus === 'out_of_stock'
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : 'rgba(217, 119, 6, 0.12)',
                            color:
                              product.stockStatus === 'in_stock'
                                ? '#16a34a'
                                : product.stockStatus === 'out_of_stock'
                                  ? '#ef4444'
                                  : '#d97706',
                            fontWeight: 700,
                          }}
                        >
                          <option value="in_stock">Stokda var</option>
                          <option value="out_of_stock">Bitib (Yoxdur)</option>
                          <option value="preorder">Ön sifariş</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => onOpenLightbox(product)}
                          title="Şəkilləri və videoları böyüdüb izlə"
                          style={{
                            background: 'transparent',
                            color: '#0ea5e9',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Maximize2 size={15} />
                        </button>
                        <button
                          onClick={() => onDuplicateProduct(product)}
                          title="Nüsxəsini çıxar"
                          style={{
                            background: 'transparent',
                            color: theme.textMuted,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Copy size={15} />
                        </button>
                        {(() => {
                          const initialProduct = initialProducts.find((p) => p.id === product.id);
                          const isModified = isProductModified(product, initialProduct);
                          return isModified && initialProduct ? (
                            <button
                              type="button"
                              onClick={() => onRevertSingleProduct(product.id)}
                              title="Bu məhsulu ilkin dərc olunmuş vəziyyətinə qaytar"
                              style={{
                                background: 'transparent',
                                color: '#d97706',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <RotateCcw size={15} />
                            </button>
                          ) : null;
                        })()}
                        <button
                          onClick={() => onOpenEditProduct(product)}
                          title="Redaktə et"
                          style={{
                            background: 'transparent',
                            color: theme.primary,
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => onRemoveProduct(product.id)}
                          title="Sil"
                          style={{
                            background: 'transparent',
                            color: '#ef4444',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!displayedProducts.length && (
                <tr>
                  <td
                    colSpan={10}
                    style={{ textAlign: 'center', padding: '30px', color: theme.textMuted }}
                  >
                    Axtarışa uyğun məhsul tapılmadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
