import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  FileText,
  FolderPlus,
  Lock,
  LogOut,
  MessageCircle,
  Palette,
  Phone,
  Power,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  Sparkles,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AdminPayload, catalogApi } from '../../services/catalogApi';
import {
  Brand,
  CatalogAnalytics,
  CatalogCategory,
  CatalogData,
  Product,
  ProductMedia,
} from '../../types/product';
import { DEFAULT_COUNTRIES } from '../../data/catalog';
import { ThemeColors } from '../../types/theme';
import { SaharaLogo } from '../SaharaLogo';
import { ShimmerImage } from '../ShimmerImage';
import { AdminCatalogPreview } from '../AdminCatalogPreview';
import { BrandRailStudio } from '../BrandRailStudio';
import { NavigationManager } from '../NavigationManager';
import { AdminSupportInbox } from '../AdminSupportInbox';
import {
  emptyProduct,
  getProductUniqueMediaUrls,
  getProductUniqueMediaCount,
  getProductVideoCount,
  isProductModified,
  newId,
  slugify,
} from './utils/adminHelpers';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { ProductsSection } from './sections/ProductsSection';
import { ProductEditor } from './sections/ProductEditor';
import { BrandsSection } from './sections/BrandsSection';
import { CategoriesSection } from './sections/CategoriesSection';
import { SnapshotsSection } from './sections/SnapshotsSection';
import { LogsSection } from './sections/LogsSection';
import {
  AppearanceManager,
  ArticleManager,
  ContactManager,
  SecurityManager,
} from './sections/SettingsSection';
import {
  downloadFile,
  exportProductsToCsv,
  generateCsvTemplate,
  importProductsFromCsv,
} from '../../utils/csv';
import {
  downloadExcelFile,
  exportProductsToExcel,
  generateExcelTemplate,
  importProductsFromExcel,
} from '../../utils/excel';

export type AdminMode = 'site' | 'catalog' | 'all';

export interface AdminShellProps {
  initial: AdminPayload;
  theme: ThemeColors;
  mode?: AdminMode;
  onSave: (catalog: CatalogData) => Promise<void>;
  onPublish: (catalog: CatalogData) => Promise<void>;
  onUpload: (file: File) => Promise<ProductMedia>;
  onLogout: () => Promise<void>;
  showToast: (message: string) => void;
}

export type Tab =
  | 'dashboard'
  | 'products'
  | 'brands'
  | 'brand_rail'
  | 'categories'
  | 'navigation'
  | 'appearance'
  | 'articles'
  | 'contact'
  | 'support_chat'
  | 'snapshots'
  | 'logs'
  | 'security';

export const AdminShell: React.FC<AdminShellProps> = ({
  initial,
  theme,
  mode: initialMode,
  onSave,
  onPublish,
  onUpload,
  onLogout,
  showToast,
}) => {
  const [catalog, setCatalog] = useState<CatalogData>(initial);
  const [activeMode, setActiveMode] = useState<AdminMode>(() => {
    if (initialMode) return initialMode;
    if (typeof window !== 'undefined') {
      const search = window.location.search || '';
      const path = window.location.pathname || '';
      if (search.includes('mode=catalog') || path.includes('mode=catalog') || search.includes('catalog')) {
        return 'catalog';
      }
      if (search.includes('mode=site') || path.includes('mode=site')) {
        return 'site';
      }
    }
    return 'all';
  });
  const [tab, setTab] = useState<Tab>(() => {
    if (initialMode === 'catalog') return 'products';
    if (typeof window !== 'undefined') {
      const search = window.location.search || '';
      const path = window.location.pathname || '';
      if (search.includes('mode=catalog') || path.includes('mode=catalog') || search.includes('catalog')) {
        return 'products';
      }
    }
    return 'dashboard';
  });
  const [query, setQuery] = useState('');
  const [adminBrand, setAdminBrand] = useState<string>('all');
  const [adminCategory, setAdminCategory] = useState<string>('all');
  const [adminMediaFilter, setAdminMediaFilter] = useState<
    'all' | 'has-media' | 'no-media' | 'has-video' | 'no-video' | 'multi-media' | 'single-media'
  >('all');
  const [adminSpecsFilter, setAdminSpecsFilter] = useState<'all' | 'has-specs' | 'no-specs'>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<
    'all' | 'published' | 'draft' | 'modified'
  >('all');
  const [adminPriceFilter, setAdminPriceFilter] = useState<'all' | 'has-price' | 'no-price'>('all');
  const [adminStockFilter, setAdminStockFilter] = useState<
    'all' | 'in_stock' | 'out_of_stock' | 'preorder'
  >('all');
  const [adminViewMode, setAdminViewMode] = useState<'table' | 'cards'>('table');
  const [completeness, _setCompleteness] = useState<'all' | 'missing-media' | 'missing-specs' | 'draft'>('all');
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingProductEtag, setEditingProductEtag] = useState<string | null>(null);
  const [conflictModalData, setConflictModalData] = useState<{
    message: string;
    currentProduct: Product;
    currentEtag: string;
    attemptedProduct: Product;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const handleRevertSingleProduct = (productId: string) => {
    const orig = initial.products.find((p) => p.id === productId);
    if (!orig) {
      showToast('İlkin məhsul məlumatı tapılmadı');
      return;
    }
    setCatalog((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId ? JSON.parse(JSON.stringify(orig)) : p
      ),
    }));
    showToast(`"${orig.code || orig.title}" ilkin halına qaytarıldı.`);
  };

  const handleBulkSetStatus = (
    target:
      | 'no-media-draft'
      | 'has-media-pub'
      | 'has-media-draft'
      | 'has-specs-pub'
      | 'no-specs-draft'
      | 'current-filter-pub'
      | 'current-filter-draft'
  ) => {
    let affectedCount = 0;
    setCatalog((prev) => {
      const updatedProducts = prev.products.map((p) => {
        const mediaCount = getProductUniqueMediaCount(p);
        const hasSpecs = Boolean(p.specs && p.specs.length > 0);
        let newStatus = p.status;

        if (target === 'no-media-draft' && mediaCount === 0 && p.status !== 'draft') {
          newStatus = 'draft';
          affectedCount++;
        } else if (target === 'has-media-pub' && mediaCount > 0 && p.status !== 'published') {
          newStatus = 'published';
          affectedCount++;
        } else if (target === 'has-media-draft' && mediaCount > 0 && p.status !== 'draft') {
          newStatus = 'draft';
          affectedCount++;
        } else if (target === 'has-specs-pub' && hasSpecs && p.status !== 'published') {
          newStatus = 'published';
          affectedCount++;
        } else if (target === 'no-specs-draft' && !hasSpecs && p.status !== 'draft') {
          newStatus = 'draft';
          affectedCount++;
        } else if (target === 'current-filter-pub') {
          const isCurrentFiltered = filtered.some((fp) => fp.id === p.id);
          if (isCurrentFiltered && p.status !== 'published') {
            newStatus = 'published';
            affectedCount++;
          }
        } else if (target === 'current-filter-draft') {
          const isCurrentFiltered = filtered.some((fp) => fp.id === p.id);
          if (isCurrentFiltered && p.status !== 'draft') {
            newStatus = 'draft';
            affectedCount++;
          }
        }

        return newStatus !== p.status ? { ...p, status: newStatus } : p;
      });

      return { ...prev, products: updatedProducts };
    });

    const messages: Record<string, string> = {
      'no-media-draft': `${affectedCount} şəkilsiz məhsul dərcdən çıxarıldı (qaralamaya keçirildi).`,
      'has-media-pub': `${affectedCount} şəkilli məhsul canlı yayıma buraxıldı (dərc edildi).`,
      'has-media-draft': `${affectedCount} şəkilli məhsul qaralamaya keçirildi.`,
      'has-specs-pub': `${affectedCount} texniki göstəricisi olan məhsul dərc edildi.`,
      'no-specs-draft': `${affectedCount} texniki göstəricisi olmayan məhsul dərcdən çıxarıldı.`,
      'current-filter-pub': `Süzgəcdəki ${affectedCount} məhsul dərc edildi.`,
      'current-filter-draft': `Süzgəcdəki ${affectedCount} məhsul qaralamaya keçirildi.`,
    };

    showToast?.(messages[target] || `${affectedCount} məhsulun statusu yeniləndi.`);
  };

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  // Drag & Drop reorder state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

  // Lightbox zoom & media viewer state
  const [lightbox, setLightbox] = useState<{
    productTitle: string;
    productCode: string;
    media: Array<{
      url: string;
      type?: 'image' | 'video';
      alt?: string;
      objectPosition?: string;
      fitMode?: string;
    }>;
    currentIndex: number;
  } | null>(null);
  const [adminZoomScale, setAdminZoomScale] = useState(1);
  const [adminPan, setAdminPan] = useState({ x: 0, y: 0 });
  const [isAdminDragging, setIsAdminDragging] = useState(false);
  const [adminDragStart, setAdminDragStart] = useState({ x: 0, y: 0 });

  // On-the-fly Category & Brand creation modal
  const [quickModal, setQuickModal] = useState<{
    type: 'category' | 'brand';
    targetProductId?: string;
  } | null>(null);
  const [quickName, setQuickName] = useState('');
  const [quickSlug, setQuickSlug] = useState('');
  const [quickOriginCountry, setQuickOriginCountry] = useState('İtaliya');

  // Analytics filtering state
  const [analyticsRange, setAnalyticsRange] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [analyticsStats, setAnalyticsStats] = useState<CatalogAnalytics>(
    initial.analytics || {
      catalogViews: 0,
      productViews: {},
      contactActions: { whatsapp: 0, call: 0 },
      contactActionsByProduct: {},
    }
  );
  const [_analyticsLoading, setAnalyticsLoading] = useState(false);

  const loadFilteredAnalytics = useCallback(
    async (range: string, from?: string, to?: string) => {
      setAnalyticsLoading(true);
      try {
        const data = await catalogApi.getFilteredAnalytics(range, from, to);
        setAnalyticsStats(data);
      } catch {
        showToast('Statistika yüklənərkən xəta baş verdi');
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [showToast]
  );

  const handleSelectPeriod = (rangeId: string) => {
    setAnalyticsRange(rangeId);
    if (rangeId !== 'custom') {
      loadFilteredAnalytics(rangeId);
    }
  };

  // Catalog Status (Active / Maintenance) state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [maintenanceInputMessage, setMaintenanceInputMessage] = useState(
    catalog.settings?.maintenanceMessage ||
      'Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik.'
  );
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleToggleCatalogStatus = async (newActive: boolean) => {
    setStatusUpdating(true);
    try {
      const res = await catalogApi.toggleCatalogStatus(
        newActive,
        maintenanceInputMessage,
        initial.csrfToken
      );
      setCatalog((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          catalogActive: res.active,
          maintenanceMessage: res.message,
        },
      }));
      setStatusModalOpen(false);
      showToast(
        res.active
          ? 'Kataloq ictimai yayıma açıldı (Aktiv).'
          : 'Kataloq fəaliyyəti dayandırıldı (Profilaktika).'
      );
    } catch (err) {
      showToast(`Status xətası: ${err instanceof Error ? err.message : 'Uğursuz oldu'}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const SUPPORTED_CATALOG_BRAND_IDS = useMemo(() => ['ardo', 'artel', 'lotus'], []);

  const modeCatalog = useMemo(() => {
    if (activeMode === 'catalog') {
      const catProducts = catalog.products.filter((p) =>
        SUPPORTED_CATALOG_BRAND_IDS.includes((p.brandId || '').toLowerCase())
      );
      const catBrands = catalog.brands.filter((b) =>
        SUPPORTED_CATALOG_BRAND_IDS.includes(b.id.toLowerCase())
      );
      const catCategoryIds = new Set(catProducts.map((p) => p.category));
      const catCategories = catalog.categories.filter((c) => catCategoryIds.has(c.id));
      return {
        ...catalog,
        products: catProducts,
        brands: catBrands.length ? catBrands : catalog.brands,
        categories: catCategories.length ? catCategories : catalog.categories,
      };
    }
    return catalog;
  }, [catalog, activeMode, SUPPORTED_CATALOG_BRAND_IDS]);

  const availableCountries = useMemo(() => {
    const list = new Set<string>();
    (modeCatalog.settings?.countries || DEFAULT_COUNTRIES).forEach((c) => list.add(c));
    modeCatalog.brands.forEach((b) => {
      if (b.originCountry) list.add(b.originCountry);
      (b.manufacturingCountries || []).forEach((c) => list.add(c));
    });
    modeCatalog.products.forEach((p) => {
      if (p.manufacturingCountry) list.add(p.manufacturingCountry);
    });
    return Array.from(list);
  }, [modeCatalog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sourceProducts =
      activeMode === 'catalog'
        ? catalog.products.filter((p) =>
            SUPPORTED_CATALOG_BRAND_IDS.includes((p.brandId || '').toLowerCase())
          )
        : catalog.products;

    return sourceProducts.filter((p) => {
      const matchQuery =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        (p.badgeText || '').toLowerCase().includes(q) ||
        (p.shortDesc || '').toLowerCase().includes(q);

      const matchCategory = adminCategory === 'all' || p.category === adminCategory;
      const matchBrand = adminBrand === 'all' || p.brandId === adminBrand;

      const mediaCount = getProductUniqueMediaCount(p);
      const videoCount = getProductVideoCount(p);

      let matchMedia = true;
      if (adminMediaFilter === 'has-media') matchMedia = mediaCount > 0;
      else if (adminMediaFilter === 'no-media') matchMedia = mediaCount === 0;
      else if (adminMediaFilter === 'has-video') matchMedia = videoCount > 0;
      else if (adminMediaFilter === 'no-video') matchMedia = videoCount === 0;
      else if (adminMediaFilter === 'multi-media') matchMedia = mediaCount > 1;
      else if (adminMediaFilter === 'single-media') matchMedia = mediaCount === 1;

      let matchSpecs = true;
      if (adminSpecsFilter === 'has-specs') matchSpecs = Boolean(p.specs && p.specs.length > 0);
      else if (adminSpecsFilter === 'no-specs') matchSpecs = !p.specs || p.specs.length === 0;

      let matchStatus = true;
      if (adminStatusFilter === 'published') matchStatus = p.status === 'published';
      else if (adminStatusFilter === 'draft') matchStatus = p.status === 'draft';
      else if (adminStatusFilter === 'modified') {
        const orig = initial.products.find((ip) => ip.id === p.id);
        matchStatus = isProductModified(p, orig);
      }

      let matchPrice = true;
      if (adminPriceFilter === 'has-price') matchPrice = Boolean(p.price && Number(p.price) > 0);
      else if (adminPriceFilter === 'no-price')
        matchPrice = !p.price || Number(p.price) <= 0;

      let matchStock = true;
      if (adminStockFilter !== 'all') {
        const pStock = p.stockStatus || 'in_stock';
        matchStock = pStock === adminStockFilter;
      }

      let matchCompleteness = true;
      if (completeness === 'missing-media') matchCompleteness = !p.image && !p.gallery?.length;
      if (completeness === 'missing-specs') matchCompleteness = !p.specs?.length;
      if (completeness === 'draft') matchCompleteness = p.status === 'draft';

      return (
        matchQuery &&
        matchCategory &&
        matchBrand &&
        matchMedia &&
        matchSpecs &&
        matchStatus &&
        matchPrice &&
        matchStock &&
        matchCompleteness
      );
    });
  }, [
    activeMode,
    adminBrand,
    adminCategory,
    adminMediaFilter,
    adminPriceFilter,
    adminSpecsFilter,
    adminStatusFilter,
    adminStockFilter,
    catalog.products,
    completeness,
    initial.products,
    query,
    SUPPORTED_CATALOG_BRAND_IDS,
  ]);

  // Executive Dashboard Stats
  const totalCatalogViews = analyticsStats?.catalogViews || 0;
  const totalProductViews = useMemo(
    () => Object.values(analyticsStats?.productViews || {}).reduce((a, b) => a + b, 0),
    [analyticsStats?.productViews]
  );
  const totalWhatsApp = analyticsStats.contactActions?.whatsapp || 0;
  const totalCalls = analyticsStats.contactActions?.call || 0;
  const totalInquiries = totalWhatsApp + totalCalls;
  const conversionRate =
    totalCatalogViews > 0 ? ((totalInquiries / totalCatalogViews) * 100).toFixed(1) : '0.0';

  const categoryDistribution = useMemo(() => {
    const total = catalog.products.length || 1;
    return catalog.categories
      .map((c) => {
        const count = catalog.products.filter((p) => p.category === c.id).length;
        const percent = Math.round((count / total) * 100);
        return { id: c.id, name: c.name, count, percent };
      })
      .sort((a, b) => b.count - a.count);
  }, [catalog.categories, catalog.products]);

  const brandDistribution = useMemo(() => {
    const total = catalog.products.length || 1;
    return catalog.brands
      .map((b) => {
        const count = catalog.products.filter((p) => p.brandId === b.id).length;
        const percent = Math.round((count / total) * 100);
        return { id: b.id, name: b.name, count, percent };
      })
      .sort((a, b) => b.count - a.count);
  }, [catalog.brands, catalog.products]);

  const topRankedProducts = useMemo(() => {
    return [...catalog.products]
      .map((p) => {
        const views = analyticsStats.productViews?.[p.id] || 0;
        const wa = analyticsStats.contactActionsByProduct?.[p.id]?.whatsapp || 0;
        const call = analyticsStats.contactActionsByProduct?.[p.id]?.call || 0;
        const inq = wa + call;
        const ctr = views > 0 ? ((inq / views) * 100).toFixed(1) : '0.0';
        return { product: p, views, wa, call, inq, ctr };
      })
      .sort((a, b) => b.views - a.views || b.inq - a.inq)
      .slice(0, 10);
  }, [catalog.products, analyticsStats.productViews, analyticsStats.contactActionsByProduct]);

  // Reordering & Drag-Drop Methods
  const moveProductToPosition = (fromIndex: number, targetPos1Based: number) => {
    if (isNaN(targetPos1Based) || targetPos1Based < 1) return;
    const targetIdx = Math.max(0, Math.min(catalog.products.length - 1, targetPos1Based - 1));
    if (fromIndex === targetIdx) return;

    setCatalog((prev) => {
      const list = [...prev.products];
      const [item] = list.splice(fromIndex, 1);
      list.splice(targetIdx, 0, item);
      return { ...prev, products: list };
    });
    showToast(`Məhsul #${targetIdx + 1} sırasına keçirildi.`);
  };

  const handleDragStart = (index: number, e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'above' : 'below';
    setDropTargetIndex(index);
    setDropPosition(pos);
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      setDropPosition(null);
      return;
    }

    setCatalog((prev) => {
      const list = [...prev.products];
      const [item] = list.splice(draggedIndex, 1);
      const insertAt =
        dropPosition === 'below'
          ? draggedIndex < index
            ? index
            : index + 1
          : draggedIndex < index
            ? index - 1
            : index;
      const safeInsert = Math.max(0, Math.min(list.length, insertAt));
      list.splice(safeInsert, 0, item);
      return { ...prev, products: list };
    });

    showToast('Məhsulların sırası yeniləndi.');
    setDraggedIndex(null);
    setDropTargetIndex(null);
    setDropPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
    setDropPosition(null);
  };

  // Inline fast update
  const updateProductInline = (id: string, patch: Partial<Product>) => {
    setCatalog((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...patch, updatedAt: new Date().toISOString() };
        if (patch.category) {
          const cat = prev.categories.find((c) => c.id === patch.category);
          if (cat) updated.categoryName = cat.name;
        }
        return updated;
      }),
    }));
    showToast('Məhsul məlumatı yeniləndi.');
  };

  // Open Lightbox
  const openProductLightbox = (product: Product, initialMediaIndex = 0) => {
    const uniqueUrls = getProductUniqueMediaUrls(product);
    const mediaItems: Array<{
      url: string;
      type?: 'image' | 'video';
      alt?: string;
      objectPosition?: string;
      fitMode?: string;
    }> = [];

    uniqueUrls.forEach((url) => {
      const matchMedia = product.media?.find((m) => m.url === url);
      mediaItems.push({
        url,
        type: matchMedia?.type || 'image',
        alt: matchMedia?.alt || product.title,
        objectPosition: matchMedia?.objectPosition || product.imagePosition || 'center',
        fitMode: matchMedia?.fitMode || product.imageFit || 'contain',
      });
    });

    if (!mediaItems.length) {
      mediaItems.push({
        url: '/media/brands/ardo-logo.png',
        type: 'image',
        alt: product.title,
        objectPosition: 'center',
        fitMode: 'contain',
      });
    }

    setAdminZoomScale(1);
    setAdminPan({ x: 0, y: 0 });
    setIsAdminDragging(false);
    setLightbox({
      productTitle: product.title,
      productCode: product.code,
      media: mediaItems,
      currentIndex: Math.max(0, Math.min(mediaItems.length - 1, initialMediaIndex)),
    });
  };

  // On-the-fly Category & Brand creation
  const handleCreateQuickItem = () => {
    if (!quickModal || !quickName.trim()) return;
    const name = quickName.trim();
    const slug = quickSlug.trim() || slugify(name);
    const id = slug || newId(quickModal.type);

    if (quickModal.type === 'category') {
      const exists = catalog.categories.some(
        (c) => c.id === id || c.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) {
        alert('Bu adda kateqoriya artıq mövcuddur.');
        return;
      }
      const newCat: CatalogCategory = { id, name, slug, active: true };
      setCatalog((prev) => ({
        ...prev,
        categories: [...prev.categories, newCat],
        products: quickModal.targetProductId
          ? prev.products.map((p) =>
              p.id === quickModal.targetProductId ? { ...p, category: id, categoryName: name } : p
            )
          : prev.products,
      }));
      if (editing && editing.id === quickModal.targetProductId) {
        setEditing((prev) => (prev ? { ...prev, category: id, categoryName: name } : null));
      }
      showToast(`"${name}" kateqoriyası yaradıldı.`);
    } else {
      const exists = catalog.brands.some(
        (b) => b.id === id || b.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) {
        alert('Bu adda brend artıq mövcuddur.');
        return;
      }
      const newBrand: Brand = {
        id,
        name,
        slug,
        originCountry: quickOriginCountry || 'İtaliya',
        manufacturingCountries: [quickOriginCountry || 'İtaliya'],
        active: true,
        logo: '/media/brands/ardo-logo.png',
      };
      setCatalog((prev) => ({
        ...prev,
        brands: [...prev.brands, newBrand],
        products: quickModal.targetProductId
          ? prev.products.map((p) =>
              p.id === quickModal.targetProductId ? { ...p, brandId: id } : p
            )
          : prev.products,
      }));
      if (editing && editing.id === quickModal.targetProductId) {
        setEditing((prev) => (prev ? { ...prev, brandId: id } : null));
      }
      showToast(`"${name}" brendi yaradıldı.`);
    }

    setQuickModal(null);
    setQuickName('');
    setQuickSlug('');
  };

  const persist = async () => {
    setSaving(true);
    try {
      await onSave(catalog);
      showToast('Dəyişikliklər qaralama olaraq saxlanıldı.');
    } catch (e) {
      showToast(`Xəta: ${e instanceof Error ? e.message : 'Saxlamaq olmadı'}`);
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setSaving(true);
    try {
      await onPublish(catalog);
      showToast('Kataloq uğurla canlıda yeniləndi!');
    } catch (e) {
      showToast(`Xəta: ${e instanceof Error ? e.message : 'Public etmək olmadı'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditProduct = async (product: Product) => {
    setEditing(product);
    try {
      const res = await catalogApi.getProduct(product.id);
      if (res?.product) {
        setEditing(res.product);
        setEditingProductEtag(res.etag || null);
      }
    } catch {
      setEditingProductEtag(null);
    }
  };

  const upsertProduct = async (item: Product) => {
    const categoryName =
      catalog.categories.find((c) => c.id === item.category)?.name || item.categoryName;
    const clean = { ...item, categoryName, updatedAt: new Date().toISOString() };
    const exists = catalog.products.some((p) => p.id === clean.id);

    if (exists && editingProductEtag) {
      try {
        const res = await catalogApi.updateProduct(clean.id, clean, {
          ifMatch: editingProductEtag,
          csrfToken: initial.csrfToken,
        });
        if (res?.product) {
          setCatalog((prev) => ({
            ...prev,
            products: prev.products.map((p) => (p.id === clean.id ? res.product : p)),
          }));
          setEditing(null);
          setEditingProductEtag(null);
          showToast(`"${clean.code || clean.title}" uğurla yeniləndi.`);
          return;
        }
      } catch (err: any) {
        if (err?.status === 412 || err?.data?.error === 'PRODUCT_VERSION_CONFLICT') {
          setConflictModalData({
            message: err.data?.message || 'Bu məhsul başqa sessiyada yenilənib.',
            currentProduct: err.data?.currentProduct || clean,
            attemptedProduct: clean,
            currentEtag: err.data?.currentEtag || '',
          });
          return;
        }
        showToast(`Məhsulu yeniləmək mümkün olmadı: ${err.message}`);
        return;
      }
    }

    setCatalog((prev) => ({
      ...prev,
      products: exists
        ? prev.products.map((p) => (p.id === clean.id ? clean : p))
        : [clean, ...prev.products],
    }));
    setEditing(null);
    setEditingProductEtag(null);
    showToast(
      exists
        ? `"${clean.code || clean.title}" yeniləndi.`
        : `"${clean.code || clean.title}" əlavə edildi.`
    );
  };

  const duplicateProduct = (p: Product) => {
    const copy: Product = {
      ...structuredClone(p),
      id: newId('product'),
      code: `${p.code}-KOPYA`,
      title: `${p.title} (Nüsxə)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setCatalog((prev) => ({ ...prev, products: [copy, ...prev.products] }));
    showToast(`"${p.code}" məhsulunun nüsxəsi yaradıldı.`);
  };

  const removeProduct = async (id: string) => {
    if (!window.confirm('Bu məhsulu silmək istədiyinizdən əminsiniz?')) return;
    const prod = catalog.products.find((p) => p.id === id);
    if (prod) {
      try {
        let etag = editingProductEtag;
        if (!etag) {
          const fresh = await catalogApi.getProduct(id);
          etag = fresh.etag;
        }
        if (etag) {
          await catalogApi.deleteProduct(id, {
            ifMatch: etag,
            csrfToken: initial.csrfToken,
          });
        }
      } catch (err: any) {
        if (err?.status === 412) {
          showToast('Silinmə xətası: versiya uyğunsuzluğu.');
          return;
        }
      }
    }
    setCatalog((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
    showToast('Məhsul silindi.');
  };

  // CSV Export
  const handleExportCsv = () => {
    try {
      const csvContent = exportProductsToCsv(modeCatalog.products, modeCatalog.categories, modeCatalog.brands);
      downloadFile(
        csvContent,
        `sahara-${activeMode === 'catalog' ? 'kataloq' : 'sayt'}-mehsullar-${new Date().toISOString().slice(0, 10)}.csv`
      );
      showToast('Məhsullar CSV formatında endirildi.');
    } catch (e) {
      showToast(`İxrac xətası: ${e instanceof Error ? e.message : 'Uğursuz oldu'}`);
    }
  };

  // Excel Export (.xlsx)
  const handleExportExcel = () => {
    try {
      const buffer = exportProductsToExcel(modeCatalog.products, modeCatalog.categories, modeCatalog.brands);
      downloadExcelFile(
        buffer,
        `sahara-${activeMode === 'catalog' ? 'kataloq' : 'sayt'}-mehsullar-${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      showToast('Məhsullar Excel (.xlsx) formatında endirildi.');
    } catch (e) {
      showToast(`İxrac xətası: ${e instanceof Error ? e.message : 'Uğursuz oldu'}`);
    }
  };

  // CSV Template Download
  const handleDownloadCsvTemplate = () => {
    const templateContent = generateCsvTemplate();
    downloadFile(templateContent, 'sahara-kataloq-sablon.csv');
    showToast('Nümunə CSV şablonu endirildi.');
  };

  // Excel Template Download (.xlsx)
  const handleDownloadExcelTemplate = () => {
    try {
      const buffer = generateExcelTemplate();
      downloadExcelFile(buffer, 'sahara-kataloq-sablon.xlsx');
      showToast('Nümunə Excel (.xlsx) şablonu endirildi.');
    } catch (e) {
      showToast(`Şablon xətası: ${e instanceof Error ? e.message : 'Uğursuz oldu'}`);
    }
  };

  // File Import (Supports .xlsx, .xls, and .csv)
  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const isExcel =
        file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      let imported: Product[] = [];
      let errors: string[] = [];

      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const result = importProductsFromExcel(buffer, catalog.categories, catalog.brands);
        imported = result.products;
        errors = result.errors;
      } else {
        const text = await file.text();
        const result = importProductsFromCsv(text, catalog.categories, catalog.brands);
        imported = result.products;
        errors = result.errors;
      }

      if (errors.length > 0) {
        alert(`Bəzi xətalar baş verdi:\n${errors.slice(0, 6).join('\n')}`);
      }
      if (imported.length === 0) {
        showToast('Fayldan heç bir məhsul oxuna bilmədi.');
        return;
      }

      setCatalog((prev) => {
        const existingMap = new Map(prev.products.map((p) => [p.code.toLowerCase(), p]));
        for (const p of imported) {
          existingMap.set(p.code.toLowerCase(), p);
        }
        return { ...prev, products: Array.from(existingMap.values()) };
      });

      showToast(
        `${imported.length} məhsul (${isExcel ? 'Excel' : 'CSV'}) uğurla idxal edildi və qaralamaya əlavə olundu.`
      );
    } catch (err) {
      showToast(`İdxal xətası: ${err instanceof Error ? err.message : 'Fayl oxunmadı'}`);
    } finally {
      if (csvFileInputRef.current) csvFileInputRef.current.value = '';
    }
  };

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) return showToast('Zəhmət olmasa köhnə şifrəni daxil edin');
    if (!newPassword || newPassword.length < 6)
      return showToast('Yeni şifrə ən azı 6 simvoldan ibarət olmalıdır');
    if (newPassword !== confirmPassword)
      return showToast('Yeni şifrə ilə təsdiq şifrəsi eyni deyil');

    setPasswordUpdating(true);
    try {
      await catalogApi.changePassword(oldPassword, newPassword, initial.csrfToken);
      showToast('Admin şifrəsi uğurla yeniləndi!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(`Xəta: ${err instanceof Error ? err.message : 'Şifrə dəyişdirilə bilmədi'}`);
    } finally {
      setPasswordUpdating(false);
    }
  };

  const catalogTabs: Array<[Tab, string, React.ReactNode]> = [
    ['products', 'Məhsullar (Modellər)', <Boxes size={17} />],
    ['categories', 'Kateqoriyalar', <FolderPlus size={17} />],
    ['brands', 'Brendlər', <Building2 size={17} />],
    ['brand_rail', 'Brend Lenti', <Sparkles size={17} />],
    ['articles', 'Texnologiyalar (i)', <Zap size={17} />],
    ['snapshots', 'Bərpa & Nüsxələr', <RotateCcw size={17} />],
  ];

  const siteTabs: Array<[Tab, string, React.ReactNode]> = [
    ['dashboard', 'Sayt Statistikası', <BarChart3 size={17} />],
    ['navigation', 'Naviqasiya (CMS)', <Compass size={17} />],
    ['appearance', 'Görünüş & Mətnlər', <Palette size={17} />],
    ['contact', 'Əlaqə & Filiallar', <Phone size={17} />],
    ['support_chat', 'Müştəri Çatı', <MessageCircle size={17} />],
    ['logs', 'Loglama (Audit)', <FileText size={17} />],
    ['security', 'Təhlükəsizlik & Şifrə', <Lock size={17} />],
  ];

  const allTabs: Array<[Tab, string, React.ReactNode]> = [
    ['dashboard', 'Sayt Statistikası', <BarChart3 size={17} />],
    ['products', 'Məhsullar (Modellər)', <Boxes size={17} />],
    ['brands', 'Brendlər', <Building2 size={17} />],
    ['brand_rail', 'Brend Lenti', <Sparkles size={17} />],
    ['categories', 'Kateqoriyalar', <FolderPlus size={17} />],
    ['navigation', 'Naviqasiya (CMS)', <Compass size={17} />],
    ['appearance', 'Görünüş & Mətnlər', <Palette size={17} />],
    ['articles', 'Texnologiyalar (i)', <Zap size={17} />],
    ['contact', 'Əlaqə & Filiallar', <Phone size={17} />],
    ['support_chat', 'Müştəri Çatı', <MessageCircle size={17} />],
    ['snapshots', 'Bərpa & Nüsxələr', <RotateCcw size={17} />],
    ['logs', 'Loglama (Audit)', <FileText size={17} />],
    ['security', 'Təhlükəsizlik & Şifrə', <Lock size={17} />],
  ];

  const handleSwitchMode = (newMode: 'site' | 'catalog') => {
    setActiveMode(newMode);
    if (newMode === 'catalog') {
      if (!catalogTabs.some(([id]) => id === tab)) {
        setTab('products');
      }
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('mode', 'catalog');
        window.history.pushState({}, '', url.toString());
      }
    } else {
      if (!siteTabs.some(([id]) => id === tab)) {
        setTab('dashboard');
      }
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('mode');
        window.history.pushState({}, '', url.toString());
      }
    }
  };

  const currentTabs =
    activeMode === 'catalog'
      ? catalogTabs
      : activeMode === 'site'
        ? siteTabs
        : allTabs;

  return (
    <div className="admin-shell" style={{ color: theme.text, background: theme.bg }}>
      <aside
        className="admin-sidebar"
        style={{ background: theme.bgCard, borderColor: theme.border }}
      >
        <a href={activeMode === 'catalog' ? '/?mode=catalog' : '/'} className="admin-brand" title={activeMode === 'catalog' ? 'Kataloqa qayıt' : 'Sayta qayıt'}>
          <SaharaLogo className="admin-login-logo" isDark={theme.mode === 'dark'} />
        </a>

        {/* MODE SWITCHER (Sayt CMS vs Kataloq PIM) */}
        <div
          className="admin-mode-switch-box"
          style={{
            margin: '10px 12px 14px',
            background: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            padding: '4px',
            borderRadius: '12px',
            display: 'flex',
            gap: '4px',
            border: `1px solid ${theme.border}`,
          }}
        >
          <button
            type="button"
            className={`admin-mode-btn ${activeMode === 'site' ? 'is-active' : ''}`}
            onClick={() => handleSwitchMode('site')}
            style={{
              flex: 1,
              padding: '8px 4px',
              fontSize: '11.5px',
              fontWeight: activeMode === 'site' ? '700' : '600',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              background: activeMode === 'site' ? (theme.primary || '#dc2626') : 'transparent',
              color: activeMode === 'site' ? '#ffffff' : theme.textMuted,
              boxShadow: activeMode === 'site' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title="Rəsmi Sayt və CMS İdarəetməsi (/AdministratorNT)"
          >
            <Compass size={14} />
            <span>Sayt (CMS)</span>
          </button>
          <button
            type="button"
            className={`admin-mode-btn ${activeMode === 'catalog' ? 'is-active' : ''}`}
            onClick={() => handleSwitchMode('catalog')}
            style={{
              flex: 1,
              padding: '8px 4px',
              fontSize: '11.5px',
              fontWeight: activeMode === 'catalog' ? '700' : '600',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              background: activeMode === 'catalog' ? (theme.primary || '#dc2626') : 'transparent',
              color: activeMode === 'catalog' ? '#ffffff' : theme.textMuted,
              boxShadow: activeMode === 'catalog' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title="Məhsul Kataloqu və PIM İdarəetməsi (/?mode=catalog/AdministratorNT)"
          >
            <Boxes size={14} />
            <span>Kataloq (PIM)</span>
          </button>
        </div>

        <nav>
          {currentTabs.map(([id, label, icon]) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                className={isActive ? 'active' : ''}
                onClick={() => setTab(id)}
                style={{
                  backgroundColor: isActive ? theme.primary || '#dc2626' : 'transparent',
                  color: isActive ? '#ffffff' : theme.text,
                  fontWeight: isActive ? 750 : 600,
                }}
              >
                {icon}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <button
          className="admin-logout"
          onClick={onLogout}
          style={{
            color: theme.mode === 'dark' ? '#f87171' : '#b91c1c',
            borderColor: theme.border,
          }}
        >
          <LogOut size={16} />
          <span>Çıxış et</span>
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-toolbar" style={{ borderColor: theme.border }}>
          <div className="admin-toolbar-title-wrap">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                className="admin-mode-badge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  backgroundColor:
                    activeMode === 'catalog'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  color: activeMode === 'catalog' ? '#10b981' : theme.primary || '#ef4444',
                  border: `1px solid ${
                    activeMode === 'catalog'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : 'rgba(239, 68, 68, 0.3)'
                  }`,
                }}
              >
                {activeMode === 'catalog' ? <Boxes size={13} /> : <Compass size={13} />}
                {activeMode === 'catalog' ? 'Məhsul Kataloqu (PIM)' : 'Rəsmi Sayt (CMS)'}
              </span>
            </div>
            <h1>
              {activeMode === 'catalog'
                ? 'Məhsul Kataloqu İdarəetmə Paneli'
                : 'Rəsmi Sayt İdarəetmə Paneli'}
            </h1>
            <p style={{ color: theme.textMuted }}>
              {activeMode === 'catalog'
                ? 'Məhsul modellərini, şəkilləri, kateqoriyaları, brendləri və texniki xüsusiyyətləri idarə edin'
                : 'Saytın menyularını, görünüş və rənglərini, mağaza filiallarını, müştəri çatını və təhlükəsizliyi idarə edin'}
            </p>
          </div>
          <div className="admin-toolbar-actions">
            <button
              className={`catalog-status-toggle-btn ${catalog.settings?.catalogActive !== false ? 'is-active' : 'is-paused'}`}
              onClick={() => setStatusModalOpen(true)}
              title="Kataloqun fəaliyyət statusunu dəyiş"
            >
              <Power size={15} />
              <span>
                {catalog.settings?.catalogActive !== false
                  ? activeMode === 'site'
                    ? 'Sayt: Aktiv'
                    : 'Kataloq: Yayımda'
                  : activeMode === 'site'
                    ? 'Sayt: Profilaktika'
                    : 'Kataloq: Profilaktika'}
              </span>
            </button>
            <button
              className="admin-preview-btn"
              onClick={() => {
                if (activeMode === 'catalog') {
                  setPreviewOpen(true);
                } else {
                  window.open('/', '_blank', 'noopener,noreferrer');
                }
              }}
              style={{
                background: theme.bgSecondary,
                borderColor: theme.border,
                color: theme.text,
              }}
              title={activeMode === 'catalog' ? 'Kataloqu canlı önbaxışda aç' : 'Rəsmi saytı yeni tabda aç'}
            >
              <Eye size={16} />
              <span>{activeMode === 'catalog' ? 'Kataloq Önbaxış' : 'Canlı Sayta Bax'}</span>
            </button>
            <button
              onClick={persist}
              disabled={saving}
              style={{ background: theme.bgCard, borderColor: theme.border, color: theme.text }}
            >
              {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
              <span>Qaralamanı saxla</span>
            </button>
            <button
              onClick={publish}
              disabled={saving}
              style={{ background: theme.primary, color: '#fff' }}
            >
              {saving ? <RefreshCw size={16} className="spin" /> : <Rocket size={16} />}
              <span>Canlıya Burax</span>
            </button>
          </div>
        </header>

        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {tab === 'dashboard' && (
          <AnalyticsSection
            theme={theme}
            catalog={modeCatalog}
            analyticsRange={analyticsRange}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onSelectPeriod={handleSelectPeriod}
            onApplyCustomDate={(start, end) => {
              setCustomStartDate(start);
              setCustomEndDate(end);
              loadFilteredAnalytics('custom', start, end);
            }}
            onCloseCustomDate={() => {
              setAnalyticsRange('all');
              loadFilteredAnalytics('all');
            }}
            totalCatalogViews={totalCatalogViews}
            totalProductViews={totalProductViews}
            totalWhatsApp={totalWhatsApp}
            totalCalls={totalCalls}
            totalInquiries={totalInquiries}
            conversionRate={conversionRate}
            categoryDistribution={categoryDistribution}
            brandDistribution={brandDistribution}
            topRankedProducts={topRankedProducts}
            onOpenProductLightbox={(p) => openProductLightbox(p)}
          />
        )}

        {/* TAB 2: PRODUCTS */}
        {tab === 'products' && (
          <ProductsSection
            theme={theme}
            catalog={modeCatalog}
            initialProducts={initial.products}
            query={query}
            setQuery={setQuery}
            adminBrand={adminBrand}
            setAdminBrand={setAdminBrand}
            adminCategory={adminCategory}
            setAdminCategory={setAdminCategory}
            adminMediaFilter={adminMediaFilter}
            setAdminMediaFilter={setAdminMediaFilter}
            adminSpecsFilter={adminSpecsFilter}
            setAdminSpecsFilter={setAdminSpecsFilter}
            adminStatusFilter={adminStatusFilter}
            setAdminStatusFilter={setAdminStatusFilter}
            adminPriceFilter={adminPriceFilter}
            setAdminPriceFilter={setAdminPriceFilter}
            adminStockFilter={adminStockFilter}
            setAdminStockFilter={setAdminStockFilter}
            adminViewMode={adminViewMode}
            setAdminViewMode={setAdminViewMode}
            filtered={filtered}
            csvFileInputRef={csvFileInputRef as React.RefObject<HTMLInputElement>}
            handleExportExcel={handleExportExcel}
            handleExportCsv={handleExportCsv}
            handleImportFile={handleImportFile}
            handleDownloadExcelTemplate={handleDownloadExcelTemplate}
            handleDownloadCsvTemplate={handleDownloadCsvTemplate}
            handleBulkSetStatus={handleBulkSetStatus}
            onNewProduct={() => setEditing(emptyProduct(modeCatalog.brands, modeCatalog.categories))}
            onOpenEditProduct={(p) => handleOpenEditProduct(p)}
            onRevertSingleProduct={handleRevertSingleProduct}
            onDuplicateProduct={duplicateProduct}
            onRemoveProduct={removeProduct}
            onUpdateProductInline={updateProductInline}
            onOpenLightbox={(p) => openProductLightbox(p)}
            onMoveProductToPosition={moveProductToPosition}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            draggedIndex={draggedIndex}
            dropTargetIndex={dropTargetIndex}
            dropPosition={dropPosition}
            onQuickCreateCategoryRequest={(prodId) =>
              setQuickModal({ type: 'category', targetProductId: prodId })
            }
            onQuickCreateBrandRequest={(prodId) =>
              setQuickModal({ type: 'brand', targetProductId: prodId })
            }
          />
        )}

        {/* TAB 3: BRANDS & BRAND REGISTRY STUDIO */}
        {tab === 'brands' && (
          <BrandsSection
            theme={theme}
            csrfToken={initial.csrfToken}
            showToast={showToast}
            onQuickOpenBrandRail={() => setTab('brand_rail')}
          />
        )}

        {/* TAB 3.5: BRAND RAIL STUDIO */}
        {tab === 'brand_rail' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <BrandRailStudio theme={theme} csrfToken={initial.csrfToken} showToast={showToast} />
          </div>
        )}

        {/* TAB 4: CATEGORIES & CATEGORY TREE */}
        {tab === 'categories' && (
          <CategoriesSection
            theme={theme}
            csrfToken={initial.csrfToken}
            onViewCategoryProducts={(catId) => {
              setAdminCategory(catId);
              setTab('products');
            }}
          />
        )}

        {/* TAB NAVIGATION: CMS MENUS */}
        {tab === 'support_chat' && (
          <AdminSupportInbox theme={theme} csrfToken={initial.csrfToken} />
        )}
        {tab === 'navigation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <NavigationManager theme={theme} csrfToken={initial.csrfToken} showToast={showToast} />
          </div>
        )}

        {/* TAB 5: APPEARANCE & TEXTS */}
        {tab === 'appearance' && (
          <AppearanceManager
            theme={theme}
            settings={catalog.settings}
            onChange={(settings) => setCatalog((p) => ({ ...p, settings }))}
          />
        )}

        {/* TAB 6: ARTICLES & INVERTER GUIDE */}
        {tab === 'articles' && (
          <ArticleManager
            theme={theme}
            articles={catalog.articles || []}
            onChange={(articles) => setCatalog((p) => ({ ...p, articles }))}
          />
        )}

        {/* TAB 7: CONTACT & SOCIAL */}
        {tab === 'contact' && (
          <ContactManager
            theme={theme}
            settings={catalog.settings}
            analytics={analyticsStats}
            products={catalog.products}
            onChange={(settings) => setCatalog((p) => ({ ...p, settings }))}
          />
        )}

        {/* TAB 8: SNAPSHOTS & RESTORE */}
        {tab === 'snapshots' && (
          <SnapshotsSection
            theme={theme}
            csrfToken={initial.csrfToken}
            showToast={showToast}
            onRestore={(restored) => setCatalog(restored)}
          />
        )}

        {/* TAB 9: AUDIT & SYSTEM LOGS */}
        {tab === 'logs' && (
          <LogsSection
            theme={theme}
            csrfToken={initial.csrfToken}
            showToast={showToast}
          />
        )}

        {/* TAB 10: SECURITY & PASSWORD */}
        {tab === 'security' && (
          <SecurityManager
            theme={theme}
            oldPassword={oldPassword}
            setOldPassword={setOldPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            passwordUpdating={passwordUpdating}
            onChangePassword={handleChangePassword}
          />
        )}
      </main>

      {/* CATALOG STATUS & MAINTENANCE MODAL */}
      {statusModalOpen && (
        <div className="admin-status-modal-backdrop" onClick={() => setStatusModalOpen(false)}>
          <div
            className="admin-status-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ background: theme.bgCard, borderColor: theme.border }}
          >
            <header className="admin-status-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background:
                      catalog.settings?.catalogActive !== false
                        ? 'rgba(22, 163, 74, 0.12)'
                        : 'rgba(217, 119, 6, 0.12)',
                    color: catalog.settings?.catalogActive !== false ? '#16a34a' : '#d97706',
                  }}
                >
                  <Power size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                    Kataloq Fəaliyyət Statusu
                  </h3>
                  <span style={{ fontSize: '12px', color: theme.textMuted }}>
                    Kataloqu ictimai yayımda saxlayın və ya profilaktikaya keçirin
                  </span>
                </div>
              </div>
              <button
                onClick={() => setStatusModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.textMuted,
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </header>

            <div className="admin-status-modal-body">
              <div className="status-choice-grid">
                <button
                  type="button"
                  className={`status-choice-card ${catalog.settings?.catalogActive !== false ? 'selected active-choice' : ''}`}
                  onClick={() => handleToggleCatalogStatus(true)}
                  disabled={statusUpdating}
                >
                  <div
                    className="status-choice-icon"
                    style={{ background: 'rgba(22, 163, 74, 0.15)', color: '#16a34a' }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="status-choice-text">
                    <strong>🟢 Yayımda (Aktiv)</strong>
                    <p>Bütün ziyarətçilər və müştərilər kataloqu normal izləyə bilər.</p>
                  </div>
                </button>

                <button
                  type="button"
                  className={`status-choice-card ${catalog.settings?.catalogActive === false ? 'selected paused-choice' : ''}`}
                  onClick={() => handleToggleCatalogStatus(false)}
                  disabled={statusUpdating}
                >
                  <div
                    className="status-choice-icon"
                    style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#d97706' }}
                  >
                    <AlertTriangle size={24} />
                  </div>
                  <div className="status-choice-text">
                    <strong>🟡 Dayandırılıb (Profilaktika)</strong>
                    <p>
                      Müştərilərə profilaktik yenilənmə ekranı göstərilir. Admin panel işlək qalır.
                    </p>
                  </div>
                </button>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  Profilaktika Bildirişi (Ziyarətçilərə görünən mesaj):
                </label>
                <textarea
                  value={maintenanceInputMessage}
                  onChange={(e) => setMaintenanceInputMessage(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    background: theme.bgSecondary,
                    color: theme.text,
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="Kataloqda profilaktik yenilənmə aparılır. Tezliklə xidmətinizdəyik."
                />
              </div>
            </div>

            <footer className="admin-status-modal-footer" style={{ borderColor: theme.border }}>
              <button
                type="button"
                onClick={() => setStatusModalOpen(false)}
                style={{
                  background: theme.bgSecondary,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                }}
              >
                Bağla
              </button>
              <button
                type="button"
                onClick={() =>
                  handleToggleCatalogStatus(
                    catalog.settings?.catalogActive === false ? false : true
                  )
                }
                disabled={statusUpdating}
                style={{ background: theme.primary, color: '#fff', border: 'none' }}
              >
                {statusUpdating ? 'Yenilənir...' : 'Mesajı & Statusu Saxla'}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* PRODUCT EDITOR MODAL */}
      {editing && (
        <ProductEditor
          product={editing}
          brands={catalog.brands}
          categories={catalog.categories}
          availableCountries={availableCountries}
          theme={theme}
          onUpload={onUpload}
          onClose={() => setEditing(null)}
          onSave={upsertProduct}
          onQuickCreateCategory={(prodId) =>
            setQuickModal({ type: 'category', targetProductId: prodId })
          }
          onQuickCreateBrand={(prodId) => setQuickModal({ type: 'brand', targetProductId: prodId })}
          onOpenLightbox={(prod, idx) => openProductLightbox(prod, idx)}
        />
      )}

      {/* VERSION CONFLICT MODAL (HTTP 412) */}
      {conflictModalData && (
        <div
          className="admin-modal-backdrop"
          data-testid="conflict-modal"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 150,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: theme.bgCard,
              border: '1px solid #ef4444',
              borderRadius: '12px',
              maxWidth: '550px',
              width: '100%',
              padding: '1.5rem',
              color: theme.text,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <AlertTriangle color="#ef4444" size={24} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ef4444' }}>
                Versiya Konflikti Aşkarlanmışdır (HTTP 412)
              </h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: theme.textMuted, marginBottom: '1rem' }}>
              {conflictModalData.message}
            </p>
            <div
              style={{
                background: 'rgba(0,0,0,0.25)',
                padding: '0.75rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
              }}
            >
              <div>
                <strong>Serverdəki Cari Versiya:</strong>{' '}
                {conflictModalData.currentProduct?.version ?? 1}
              </div>
              <div>
                <strong>Serverdəki Qiymət:</strong>{' '}
                {conflictModalData.currentProduct?.price
                  ? `${conflictModalData.currentProduct.price} ₼`
                  : 'Qiymətsiz'}
              </div>
              <div>
                <strong>Sizin Redaktəniz:</strong>{' '}
                {conflictModalData.attemptedProduct?.price
                  ? `${conflictModalData.attemptedProduct.price} ₼`
                  : 'Qiymətsiz'}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                data-testid="conflict-accept-server-btn"
                onClick={() => {
                  setCatalog((prev) => ({
                    ...prev,
                    products: prev.products.map((p) =>
                      p.id === conflictModalData.currentProduct.id
                        ? conflictModalData.currentProduct
                        : p
                    ),
                  }));
                  setEditing(conflictModalData.currentProduct);
                  setEditingProductEtag(conflictModalData.currentEtag || null);
                  setConflictModalData(null);
                  showToast('Serverdəki ən son versiya qəbul edildi.');
                }}
              >
                Server Versiyasını Qəbul Et
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                data-testid="conflict-overwrite-btn"
                onClick={() => {
                  setEditingProductEtag(conflictModalData.currentEtag);
                  const toSave = { ...conflictModalData.attemptedProduct };
                  setConflictModalData(null);
                  upsertProduct(toSave);
                }}
              >
                Yenidən Saxla (Üzərinə Yaz)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE PREVIEW MODAL */}
      {previewOpen && (
        <AdminCatalogPreview
          catalog={catalog}
          theme={theme}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      {/* LIGHTBOX ZOOM & MULTI-MEDIA VIEWER WITH INTERACTIVE PAN & DRAG */}
      {lightbox && (
        <div className="admin-lightbox-backdrop" onClick={() => setLightbox(null)}>
          <div className="admin-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <header className="admin-lightbox-header">
              <div>
                <h3>{lightbox.productTitle}</h3>
                <span>
                  Model: <b>{lightbox.productCode}</b> | Media: {lightbox.currentIndex + 1} /{' '}
                  {lightbox.media.length}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {lightbox.media[lightbox.currentIndex]?.type !== 'video' && (
                  <div
                    className="zoom-floating-controls"
                    style={{ position: 'static', padding: '4px 8px' }}
                  >
                    <button
                      type="button"
                      className="zoom-btn"
                      onClick={() =>
                        setAdminZoomScale((prev) => {
                          const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
                          if (next === 1) setAdminPan({ x: 0, y: 0 });
                          return next;
                        })
                      }
                      disabled={adminZoomScale <= 1}
                      title="Kiçilt (-)"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="zoom-scale-pill">{Math.round(adminZoomScale * 100)}%</span>
                    <button
                      type="button"
                      className="zoom-btn"
                      onClick={() =>
                        setAdminZoomScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))))
                      }
                      disabled={adminZoomScale >= 4}
                      title="Böyüt (+)"
                    >
                      <ZoomIn size={16} />
                    </button>
                    {adminZoomScale > 1 && (
                      <button
                        type="button"
                        className="zoom-btn reset-btn"
                        onClick={() => {
                          setAdminZoomScale(1);
                          setAdminPan({ x: 0, y: 0 });
                        }}
                        title="1x Sıfırla"
                      >
                        1x Sıfırla
                      </button>
                    )}
                  </div>
                )}
                <button
                  className="admin-lightbox-close-btn"
                  onClick={() => setLightbox(null)}
                  title="Bağla"
                >
                  <X size={20} />
                </button>
              </div>
            </header>

            <div
              className={`admin-lightbox-viewer-box zoom-pan-container ${adminZoomScale > 1 ? 'is-zoomed' : ''} ${isAdminDragging ? 'is-dragging' : ''}`}
              onMouseDown={(e) => {
                if (adminZoomScale <= 1) return;
                setIsAdminDragging(true);
                setAdminDragStart({ x: e.clientX, y: e.clientY });
              }}
              onMouseMove={(e) => {
                if (!isAdminDragging || adminZoomScale <= 1) return;
                const dx = e.clientX - adminDragStart.x;
                const dy = e.clientY - adminDragStart.y;
                setAdminPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
                setAdminDragStart({ x: e.clientX, y: e.clientY });
              }}
              onMouseUp={() => setIsAdminDragging(false)}
              onMouseLeave={() => setIsAdminDragging(false)}
              onTouchStart={(e) => {
                if (adminZoomScale <= 1 || e.touches.length !== 1) return;
                setIsAdminDragging(true);
                setAdminDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
              }}
              onTouchMove={(e) => {
                if (!isAdminDragging || adminZoomScale <= 1) return;
                const dx = e.touches[0].clientX - adminDragStart.x;
                const dy = e.touches[0].clientY - adminDragStart.y;
                setAdminPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
                setAdminDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
              }}
              onTouchEnd={() => setIsAdminDragging(false)}
              onWheel={(e) => {
                const delta = e.deltaY < 0 ? 0.25 : -0.25;
                setAdminZoomScale((prev) => {
                  const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(2))));
                  if (next === 1) setAdminPan({ x: 0, y: 0 });
                  return next;
                });
              }}
              onDoubleClick={() => {
                setAdminZoomScale((prev) => {
                  if (prev === 1) return 2;
                  setAdminPan({ x: 0, y: 0 });
                  return 1;
                });
              }}
            >
              {lightbox.media[lightbox.currentIndex]?.type === 'video' ? (
                <video
                  src={lightbox.media[lightbox.currentIndex]?.url}
                  controls
                  autoPlay
                  className="admin-lightbox-video"
                />
              ) : (
                <ShimmerImage
                  src={lightbox.media[lightbox.currentIndex]?.url}
                  alt={lightbox.media[lightbox.currentIndex]?.alt || lightbox.productTitle}
                  draggable={false}
                  className="admin-lightbox-img"
                  style={{
                    objectPosition:
                      lightbox.media[lightbox.currentIndex]?.objectPosition || 'center',
                    objectFit: (lightbox.media[lightbox.currentIndex]?.fitMode || 'contain') as any,
                    transform: `translate(${adminPan.x}px, ${adminPan.y}px) scale(${adminZoomScale})`,
                    transition: isAdminDragging
                      ? 'none'
                      : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    userSelect: 'none',
                  }}
                />
              )}

              {adminZoomScale > 1 && (
                <div className="zoom-pan-hint" style={{ bottom: '12px' }}>
                  🖱 Tutub sürüşdürərək hər tərəfə baxın
                </div>
              )}

              {lightbox.media.length > 1 && (
                <>
                  <button
                    className="admin-lightbox-nav-btn admin-lightbox-nav-prev"
                    onClick={() => {
                      setAdminZoomScale(1);
                      setAdminPan({ x: 0, y: 0 });
                      setLightbox((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentIndex:
                                (prev.currentIndex - 1 + prev.media.length) % prev.media.length,
                            }
                          : null
                      );
                    }}
                    title="Əvvəlki media"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    className="admin-lightbox-nav-btn admin-lightbox-nav-next"
                    onClick={() => {
                      setAdminZoomScale(1);
                      setAdminPan({ x: 0, y: 0 });
                      setLightbox((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentIndex: (prev.currentIndex + 1) % prev.media.length,
                            }
                          : null
                      );
                    }}
                    title="Növbəti media"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>

            {lightbox.media.length > 1 && (
              <div className="admin-lightbox-thumbs">
                {lightbox.media.map((m, idx) => (
                  <button
                    key={idx}
                    className={`admin-lightbox-thumb-btn ${idx === lightbox.currentIndex ? 'active' : ''}`}
                    onClick={() => {
                      setAdminZoomScale(1);
                      setAdminPan({ x: 0, y: 0 });
                      setLightbox((prev) => (prev ? { ...prev, currentIndex: idx } : null));
                    }}
                  >
                    {m.type === 'video' ? (
                      <span>🎬</span>
                    ) : (
                      <ShimmerImage
                        src={m.url}
                        alt=""
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: m.objectPosition || 'center',
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK CATEGORY / BRAND CREATION MODAL */}
      {quickModal && (
        <div className="quick-create-backdrop" onClick={() => setQuickModal(null)}>
          <div
            className="quick-create-card"
            style={{ background: theme.bgCard, borderColor: theme.border, color: theme.text }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{quickModal.type === 'category' ? 'Yeni Kateqoriya Yarat' : 'Yeni Brend Yarat'}</h3>
            <p style={{ color: theme.textMuted }}>
              Məhsul redaktəsindən çıxmadan yeni{' '}
              {quickModal.type === 'category' ? 'kateqoriyanı' : 'brendi'} dərhal yaradın.
            </p>

            <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 700 }}>
              <span>{quickModal.type === 'category' ? 'Kateqoriya Adı *' : 'Brend Adı *'}</span>
              <input
                value={quickName}
                onChange={(e) => {
                  setQuickName(e.target.value);
                  if (!quickSlug || quickSlug === slugify(quickName)) {
                    setQuickSlug(slugify(e.target.value));
                  }
                }}
                placeholder={
                  quickModal.type === 'category' ? 'Məs: Qabyuyan Maşınlar' : 'Məs: ARDO, Bosch...'
                }
                autoFocus
                style={{
                  background: theme.bgSecondary,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  padding: '9px 12px',
                  borderRadius: '8px',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 700 }}>
              <span>URL / Slug</span>
              <input
                value={quickSlug}
                onChange={(e) => setQuickSlug(e.target.value)}
                placeholder="qabyuyan-masinlar"
                style={{
                  background: theme.bgSecondary,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  padding: '9px 12px',
                  borderRadius: '8px',
                }}
              />
            </label>

            {quickModal.type === 'brand' && (
              <label style={{ display: 'grid', gap: '5px', fontSize: '12px', fontWeight: 700 }}>
                <span>Mənşə Ölkəsi</span>
                <input
                  value={quickOriginCountry}
                  onChange={(e) => setQuickOriginCountry(e.target.value)}
                  placeholder="İtaliya, Türkiyə..."
                  style={{
                    background: theme.bgSecondary,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    padding: '9px 12px',
                    borderRadius: '8px',
                  }}
                />
              </label>
            )}

            <div className="quick-create-actions">
              <button
                type="button"
                onClick={() => setQuickModal(null)}
                style={{
                  background: theme.bgSecondary,
                  color: theme.text,
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  cursor: 'pointer',
                }}
              >
                İmtina
              </button>
              <button
                type="button"
                onClick={handleCreateQuickItem}
                disabled={!quickName.trim()}
                style={{
                  background: theme.primary,
                  color: '#ffffff',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 750,
                }}
              >
                Yarat və Təyin et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
