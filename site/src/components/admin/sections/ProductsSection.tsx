import React from 'react';
import {
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  GripVertical,
  LayoutGrid,
  List,
  Maximize2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { CatalogData, Product } from '../../../types/product';
import { ThemeColors } from '../../../types/theme';
import { ShimmerImage } from '../../ShimmerImage';
import {
  getProductImageCount,
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
    | 'all'
    | 'has-media'
    | 'no-media'
    | 'has-video'
    | 'no-video'
    | 'multi-media'
    | 'single-media';
  setAdminMediaFilter: (
    f:
      | 'all'
      | 'has-media'
      | 'no-media'
      | 'has-video'
      | 'no-video'
      | 'multi-media'
      | 'single-media'
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
  csvFileInputRef: React.RefObject<HTMLInputElement>;
  handleExportExcel: () => void;
  handleExportCsv: () => void;
  handleImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownloadExcelTemplate: () => void;
  handleDownloadCsvTemplate: () => void;
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
  csvFileInputRef,
  handleExportExcel,
  handleExportCsv,
  handleImportFile,
  handleDownloadExcelTemplate,
  handleDownloadCsvTemplate,
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
  return (
    <div>
      <div className="admin-list-actions" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div
          className="admin-search"
          style={{ background: theme.bgCard, borderColor: theme.border }}
        >
          <Search size={15} color={theme.textMuted} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Məhsul adı, kod və ya nişan ilə axtar..."
            style={{ color: theme.text }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Brand Filter */}
          <select
            value={adminBrand}
            onChange={(e) => setAdminBrand(e.target.value)}
            className="admin-category-select"
            title="Brendə görə süzgəc"
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
            className="admin-category-select"
            title="Kateqoriyaya görə süzgəc"
          >
            <option value="all">Bütün kateqoriyalar</option>
            {catalog.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({catalog.products.filter((p) => p.category === c.id).length})
              </option>
            ))}
          </select>

          {/* Media Filter (Videolu / Videosuz / Şəkilli / Şəkilsiz / Çoxşəkilli) */}
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
            className="admin-category-select"
            title="Şəkilli və ya şəkilsiz məhsullara görə süzgəc"
          >
            <option value="all">Bütün Media ({catalog.products.length})</option>
            <option value="has-video">
              🎬 Videolu olanlar (
              {catalog.products.filter((p) => getProductVideoCount(p) > 0).length})
            </option>
            <option value="no-video">
              📹 Videosuz olanlar (
              {catalog.products.filter((p) => getProductVideoCount(p) === 0).length})
            </option>
            <option value="has-media">
              🖼 Medialı olanlar (
              {catalog.products.filter((p) => getProductUniqueMediaCount(p) > 0).length})
            </option>
            <option value="no-media">
              📷 Mediasız olanlar (
              {catalog.products.filter((p) => getProductUniqueMediaCount(p) === 0).length})
            </option>
            <option value="multi-media">
              📸 Çoxmedia (&gt;1) (
              {catalog.products.filter((p) => getProductUniqueMediaCount(p) > 1).length})
            </option>
            <option value="single-media">
              🖼️ Tək media (=1) (
              {catalog.products.filter((p) => getProductUniqueMediaCount(p) === 1).length})
            </option>
          </select>

          {/* Specs Filter */}
          <select
            value={adminSpecsFilter}
            onChange={(e) =>
              setAdminSpecsFilter(e.target.value as 'all' | 'has-specs' | 'no-specs')
            }
            className="admin-category-select"
            title="Texniki göstəricilərə görə süzgəc"
          >
            <option value="all">Bütün Göstəricilər</option>
            <option value="has-specs">
              📊 Göstəricisi olanlar (
              {catalog.products.filter((p) => Boolean(p.specs?.length)).length})
            </option>
            <option value="no-specs">
              ⚠️ Göstəricisi boş olanlar (
              {catalog.products.filter((p) => !p.specs?.length).length})
            </option>
          </select>

          {/* Status Filter */}
          <select
            value={adminStatusFilter}
            onChange={(e) =>
              setAdminStatusFilter(
                e.target.value as 'all' | 'published' | 'draft' | 'modified'
              )
            }
            className="admin-category-select"
            title="Məhsul statusuna görə süzgəc"
          >
            <option value="all">Bütün Statuslar</option>
            <option value="published">
              ✅ Dərc edilmişlər (
              {catalog.products.filter((p) => p.status === 'published').length})
            </option>
            <option value="draft">
              📝 Qaralamalar ({catalog.products.filter((p) => p.status === 'draft').length})
            </option>
            <option value="modified">
              ✏️ Düzəliş edilənlər (
              {
                catalog.products.filter((p) =>
                  isProductModified(
                    p,
                    initialProducts.find((ip) => ip.id === p.id)
                  )
                ).length
              }
              )
            </option>
          </select>

          {/* Price Filter */}
          <select
            value={adminPriceFilter}
            onChange={(e) =>
              setAdminPriceFilter(e.target.value as 'all' | 'has-price' | 'no-price')
            }
            className="admin-category-select"
            title="Qiymətə görə süzgəc"
          >
            <option value="all">Bütün Qiymətlər</option>
            <option value="has-price">
              💰 Qiyməti olanlar (
              {catalog.products.filter((p) => p.price && Number(p.price) > 0).length})
            </option>
            <option value="no-price">
              🏷️ Qiymətsiz olanlar (
              {catalog.products.filter((p) => !p.price || Number(p.price) <= 0).length})
            </option>
          </select>

          {/* Stock Filter */}
          <select
            value={adminStockFilter}
            onChange={(e) =>
              setAdminStockFilter(
                e.target.value as 'all' | 'in_stock' | 'out_of_stock' | 'preorder'
              )
            }
            className="admin-category-select"
            title="Stok vəziyyətinə görə süzgəc"
          >
            <option value="all">Bütün Stok</option>
            <option value="in_stock">
              🟢 Stokda var (
              {
                catalog.products.filter((p) => (p.stockStatus || 'in_stock') === 'in_stock')
                  .length
              }
              )
            </option>
            <option value="out_of_stock">
              🔴 Bitib / Yoxdur (
              {catalog.products.filter((p) => p.stockStatus === 'out_of_stock').length})
            </option>
            <option value="preorder">
              🟡 Ön sifariş (
              {catalog.products.filter((p) => p.stockStatus === 'preorder').length})
            </option>
          </select>

          {/* View Mode Toggle Switch (Table vs Cards) */}
          <div
            className="admin-view-toggle"
            style={{ borderColor: theme.border, background: theme.bgSecondary }}
          >
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
              <List size={14} />
              <span>Siyahı</span>
            </button>
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
              <LayoutGrid size={14} />
              <span>Kartlar</span>
            </button>
          </div>

          {/* Bulk Excel & CSV Buttons */}
          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: `1px solid rgba(56, 189, 248, 0.4)`,
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 750,
              fontSize: '12px',
            }}
            title="Bütün məhsulları Excel (.xlsx) cədvəli kimi endir"
          >
            <FileSpreadsheet size={14} />
            <span>Excel (.xlsx) İxrac</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: theme.bgSecondary,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
            }}
            title="Məhsulları CSV faylı kimi endir"
          >
            <Download size={14} />
            <span>CSV İxrac</span>
          </button>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              padding: '8px 13px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 750,
              fontSize: '12px',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.28)',
            }}
            title="Excel (.xlsx / .xls) və ya CSV faylı ilə məhsulları toplu yüklə"
          >
            <Upload size={14} />
            <span>Excel / CSV İdxal</span>
            <input
              ref={csvFileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadExcelTemplate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              color: '#16a34a',
              border: `1px dashed #16a34a`,
              padding: '8px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 650,
            }}
            title="Nümunə Excel (.xlsx) şablon faylını endir"
          >
            <FileSpreadsheet size={13} />
            <span>Excel Şablonu</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsvTemplate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              color: theme.textMuted,
              border: `1px dashed ${theme.border}`,
              padding: '8px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
            title="Nümunə CSV şablon faylını endir"
          >
            <FileSpreadsheet size={13} />
            <span>CSV Şablonu</span>
          </button>

          <button
            className="manager-add"
            onClick={onNewProduct}
            style={{ background: theme.primary, color: '#fff' }}
          >
            <Plus size={16} /> Yeni Məhsul
          </button>
        </div>
      </div>

      {/* Results count & status overview bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '12px 0 10px',
          padding: '8px 14px',
          background: theme.bgSecondary,
          borderRadius: '8px',
          border: `1px solid ${theme.border}`,
          fontSize: '12px',
          color: theme.textMuted,
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div>
          Göstərilir: <strong style={{ color: theme.text }}>{filtered.length}</strong> /{' '}
          {catalog.products.length} məhsul
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>
            Videolu:{' '}
            <strong style={{ color: '#8b5cf6' }}>
              {catalog.products.filter((p) => getProductVideoCount(p) > 0).length}
            </strong>
          </span>
          <span>
            Şəkilli:{' '}
            <strong style={{ color: '#16a34a' }}>
              {catalog.products.filter((p) => getProductUniqueMediaCount(p) > 0).length}
            </strong>
          </span>
          <span>
            Şəkilsiz:{' '}
            <strong style={{ color: '#ef4444' }}>
              {catalog.products.filter((p) => getProductUniqueMediaCount(p) === 0).length}
            </strong>
          </span>
          <span>
            Göstəricili:{' '}
            <strong style={{ color: '#2563eb' }}>
              {catalog.products.filter((p) => Boolean(p.specs?.length)).length}
            </strong>
          </span>
          <span>
            Göstəricisiz:{' '}
            <strong style={{ color: '#d97706' }}>
              {catalog.products.filter((p) => !p.specs?.length).length}
            </strong>
          </span>
          <span>
            Yayımda:{' '}
            <strong style={{ color: '#16a34a' }}>
              {catalog.products.filter((p) => p.status === 'published').length}
            </strong>
          </span>
          <span>
            Qaralama:{' '}
            <strong style={{ color: '#64748b' }}>
              {catalog.products.filter((p) => p.status === 'draft').length}
            </strong>
          </span>
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
            <Eye size={12} /> Süzgəcdəkiləri Dərc Et ({filtered.length})
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
            <EyeOff size={12} /> Süzgəcdəkiləri Gizlə ({filtered.length})
          </button>
        </div>
      </div>

      {adminViewMode === 'cards' ? (
        <div className="admin-products-cards-grid">
          {filtered.map((product) => {
            const catalogIndex = catalog.products.findIndex((p) => p.id === product.id);
            const brand = catalog.brands.find((b) => b.id === product.brandId);
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
                {/* Card Media Preview */}
                <div
                  className="admin-card-image-wrap"
                  onClick={() => onOpenLightbox(product)}
                  title="Böyütmək və baxmaq üçün klikləyin"
                >
                  {product.image ? (
                    <ShimmerImage
                      src={product.image}
                      alt={product.title}
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
                          background: 'rgba(124, 58, 237, 0.9)',
                          color: '#ffffff',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
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
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
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

                {/* Card Body */}
                <div className="admin-card-body">
                  <div className="admin-card-category">{product.categoryName}</div>
                  <h4
                    className="admin-card-title"
                    title={product.title}
                    style={{ color: theme.text }}
                  >
                    {product.title || 'Adsız məhsul'}
                  </h4>
                  <div className="admin-card-code" style={{ color: theme.textMuted }}>
                    Model:{' '}
                    <strong style={{ color: theme.text }}>{product.code || 'KODSUZ'}</strong>{' '}
                    (№ {catalogIndex + 1})
                  </div>

                  {/* Quick Stats */}
                  <div className="admin-card-stats" style={{ borderColor: theme.border }}>
                    <span className={`admin-card-stat ${specsCount > 0 ? 'good' : 'warn'}`}>
                      📊 {specsCount} parametr
                    </span>
                    <span
                      className={`admin-card-stat ${product.price ? 'price' : 'no-price'}`}
                    >
                      💰{' '}
                      {product.price
                        ? `${product.price} ${product.currency || '₼'}`
                        : 'Qiymətsiz'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="admin-card-actions">
                    <button
                      type="button"
                      className="admin-card-btn edit"
                      onClick={() => onOpenEditProduct(product)}
                      style={{ background: theme.primary, borderColor: theme.primary }}
                      title="Məhsulu redaktə et"
                    >
                      <Pencil size={12} /> Redaktə
                    </button>
                    {isModified && initialProduct && (
                      <button
                        type="button"
                        className="admin-card-btn"
                        onClick={() => onRevertSingleProduct(product.id)}
                        title="Bu məhsulu ilkin dərc olunmuş vəziyyətinə qaytar"
                        style={{
                          background: 'rgba(217, 119, 6, 0.15)',
                          color: '#d97706',
                          border: '1px solid #d97706',
                        }}
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-card-btn duplicate"
                      onClick={() => onDuplicateProduct(product)}
                      title="Nüsxəsini çıxar"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      className={`admin-card-btn toggle ${
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
                          : 'Dərc et (Göstər)'
                      }
                    >
                      {product.status === 'published' ? (
                        <EyeOff size={12} />
                      ) : (
                        <Eye size={12} />
                      )}
                    </button>
                    <button
                      type="button"
                      className="admin-card-btn delete"
                      onClick={() => onRemoveProduct(product.id)}
                      title="Məhsulu sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {!filtered.length && (
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
              {filtered.map((product) => {
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
                          const initialProduct = initialProducts.find(
                            (p) => p.id === product.id
                          );
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
                            const cat = catalog.categories.find(
                              (c) => c.id === e.target.value
                            );
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
                            color:
                              product.status === 'published' ? '#2563eb' : theme.textMuted,
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
                          const initialProduct = initialProducts.find(
                            (p) => p.id === product.id
                          );
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
              {!filtered.length && (
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
