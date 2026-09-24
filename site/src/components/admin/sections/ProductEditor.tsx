import React, { useState } from 'react';
import {
  Crop,
  GripVertical,
  Plus,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { Brand, CatalogCategory, Product, ProductMedia, ProductSpecItem } from '../../../types/product';
import { ThemeColors } from '../../../types/theme';
import { ShimmerImage } from '../../ShimmerImage';
import { ImageCropStudioModal } from '../../ImageCropStudioModal';
import { calculateCompletenessScore } from '../../../utils/completenessScorer';
import { newId } from '../utils/adminHelpers';

const COMMON_SPEC_SUGGESTIONS = [
  'Növ',
  'İş rejimi',
  'Məhsuldarlıq',
  'İdarəetmə növü',
  'Sürət sayı',
  'Korpusun materialı',
  'En',
  'Hava kanalının diametri',
  'Səs səviyyəsi',
  'Ölçülər (H × E × D)',
  'Rəng',
  'Qaz nəzarəti',
  'SABAF forsunkalar',
  'Enerji sinfi',
  'Həcm',
  'Qril',
  'Taymer',
];

export interface ProductEditorProps {
  product: Product;
  brands: Brand[];
  categories: CatalogCategory[];
  availableCountries: string[];
  theme: ThemeColors;
  onUpload: (file: File) => Promise<ProductMedia>;
  onClose: () => void;
  onSave: (value: Product) => void;
  onQuickCreateCategory?: (prodId: string) => void;
  onQuickCreateBrand?: (prodId: string) => void;
  onOpenLightbox?: (prod: Product, mediaIndex: number) => void;
}

// PRODUCT EDITOR MODAL
export const ProductEditor = ({
  product: initial,
  brands,
  categories,
  availableCountries,
  theme,
  onUpload,
  onClose,
  onSave,
  onQuickCreateCategory,
  onQuickCreateBrand,
  onOpenLightbox,
}: ProductEditorProps) => {
  const [product, setProduct] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [customCountryInput, setCustomCountryInput] = useState('');
  const [isAddingCustomCountry, setIsAddingCustomCountry] = useState(false);

  // Drag & drop / position reordering state for media
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);
  const [dropTargetMediaIndex, setDropTargetMediaIndex] = useState<number | null>(null);
  const [mediaDropPosition, setMediaDropPosition] = useState<'before' | 'after' | null>(null);

  // Visual Crop & Focal Studio state
  const [cropStudioTarget, setCropStudioTarget] = useState<{
    mediaIndex: number;
    imageUrl: string;
    objectPosition?: string;
    fitMode?: 'contain' | 'cover';
  } | null>(null);

  const change = <K extends keyof Product>(key: K, value: Product[K]) =>
    setProduct((current) => ({ ...current, [key]: value }));

  const addMedia = (type: ProductMedia['type']) => {
    const list = [...(product.media || []), { id: newId('media'), type, url: '', alt: '' }];
    setProduct((curr) => ({
      ...curr,
      media: list,
      gallery: list.map((m) => m.url).filter(Boolean),
    }));
  };

  const updateMedia = (index: number, patch: Partial<ProductMedia>) => {
    setProduct((curr) => {
      const list = (curr.media || []).map((item, i) =>
        i === index ? { ...item, ...patch } : item
      );
      const firstImg =
        list.find((m) => m.type === 'image' && m.url)?.url || list[0]?.url || curr.image;
      return {
        ...curr,
        media: list,
        image: index === 0 && patch.url ? patch.url : firstImg,
        gallery: list.map((m) => m.url).filter(Boolean),
      };
    });
  };

  const moveMediaToPosition = (fromIndex: number, targetPosition1Indexed: number) => {
    setProduct((current) => {
      const list = [...(current.media || [])];
      if (!list.length) return current;
      const targetIdx = Math.max(0, Math.min(list.length - 1, targetPosition1Indexed - 1));
      if (fromIndex === targetIdx || fromIndex < 0 || fromIndex >= list.length) return current;
      const [moved] = list.splice(fromIndex, 1);
      list.splice(targetIdx, 0, moved);

      const firstMedia = list[0];
      const firstImg =
        firstMedia?.type === 'video'
          ? firstMedia.poster ||
            list.find((m) => m.type === 'image' && m.url)?.url ||
            firstMedia.url ||
            current.image
          : list.find((m) => m.type === 'image' && m.url)?.url || list[0]?.url || current.image;
      const gallery = list.map((m) => m.url).filter(Boolean);

      return {
        ...current,
        media: list,
        image: firstImg,
        gallery,
      };
    });
  };

  const setPrimaryMedia = (index: number) => {
    moveMediaToPosition(index, 1);
  };

  const handleMediaDragStart = (index: number, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedMediaIndex(index);
  };

  const handleMediaDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedMediaIndex === null || draggedMediaIndex === index) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? 'before' : 'after';
    setDropTargetMediaIndex(index);
    setMediaDropPosition(pos);
  };

  const handleMediaDrop = (targetIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedMediaIndex === null || draggedMediaIndex === targetIndex) {
      setDraggedMediaIndex(null);
      setDropTargetMediaIndex(null);
      setMediaDropPosition(null);
      return;
    }
    const finalPos =
      draggedMediaIndex < targetIndex
        ? mediaDropPosition === 'before'
          ? targetIndex
          : targetIndex + 1
        : mediaDropPosition === 'before'
          ? targetIndex + 1
          : targetIndex + 2;
    moveMediaToPosition(draggedMediaIndex, finalPos);
    setDraggedMediaIndex(null);
    setDropTargetMediaIndex(null);
    setMediaDropPosition(null);
  };

  const handleMediaDragEnd = () => {
    setDraggedMediaIndex(null);
    setDropTargetMediaIndex(null);
    setMediaDropPosition(null);
  };

  const addSpec = () =>
    change('specs', [...product.specs, { id: newId('spec'), name: '', value: '', group: 'Əsas' }]);

  const updateSpec = (index: number, patch: Partial<ProductSpecItem>) =>
    change(
      'specs',
      product.specs.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const uploaded = await onUpload(file);
      const updatedMedia = [...(product.media || []), uploaded];
      const firstImg = !product.image && uploaded.type === 'image' ? uploaded.url : product.image;
      setProduct((curr) => ({
        ...curr,
        image: firstImg || uploaded.url,
        media: updatedMedia,
        gallery: updatedMedia.map((m) => m.url).filter(Boolean),
      }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Media yüklənmədi');
    } finally {
      setUploading(false);
    }
  };

  const discountPercent =
    product.price && product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  const resolveFriendlyMediaName = (m: ProductMedia, index: number): string => {
    if (
      m.originalName &&
      !m.originalName.startsWith('/uploads/') &&
      !/^mti[a-z0-9]/i.test(m.originalName)
    ) {
      return m.originalName;
    }
    if (m.url && !m.url.startsWith('/uploads/')) {
      try {
        const clean = decodeURIComponent(m.url.split('?')[0]);
        const parts = clean.split('/');
        const last = parts[parts.length - 1] || '';
        if (last && !/^mti[a-z0-9]/i.test(last)) {
          return last;
        }
      } catch {}
    }
    const codePart = (product.code || product.title || 'Məhsul').trim();
    return index === 0 ? `${codePart}.jpg` : `${codePart} (${index + 1}).jpg`;
  };

  const completeness = calculateCompletenessScore(product);

  return (
    <div className="product-modal-backdrop" onClick={onClose}>
      <div
        className="product-modal-card"
        style={{ background: theme.bgCard, borderColor: theme.border, maxWidth: '920px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="product-modal-header" style={{ borderColor: theme.border }}>
          <div>
            <h2>{product.code ? `${product.code} redaktəsi` : 'Yeni məhsul'}</h2>
            <p style={{ color: theme.textMuted }}>
              Kataloq üçün bütün parametrləri birbaşa buradan doldurun
            </p>
          </div>
          <button onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="product-modal-body">
          {/* PIM v2 CONTENT COMPLETENESS BAR */}
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.15)',
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: theme.text }}>
                PIM v2 Məlumat Dolğunluğu:{' '}
                <span
                  style={{
                    color:
                      completeness.score >= 80
                        ? '#10b981'
                        : completeness.score >= 50
                          ? '#f59e0b'
                          : '#ef4444',
                  }}
                >
                  {completeness.score}%
                </span>
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  background: completeness.isPublishable
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'rgba(245, 158, 11, 0.15)',
                  color: completeness.isPublishable ? '#10b981' : '#f59e0b',
                  fontWeight: 600,
                }}
              >
                {completeness.isPublishable
                  ? '✅ Dərc üçün Hazırdır'
                  : '⚠️ Qaralama / Tamamlanmalıdır'}
              </span>
            </div>
            <div
              style={{
                height: '6px',
                width: '100%',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.1)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${completeness.score}%`,
                  borderRadius: '3px',
                  background:
                    completeness.score >= 80
                      ? '#10b981'
                      : completeness.score >= 50
                        ? '#f59e0b'
                        : '#ef4444',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            {completeness.missingFields.length > 0 && (
              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: theme.textMuted }}>
                Çatışmayan sahələr:{' '}
                <span style={{ color: '#f59e0b' }}>{completeness.missingFields.join(', ')}</span>
              </div>
            )}
          </div>

          <div className="form-grid">
            <label>
              <span>Model kodu *</span>
              <input
                value={product.code}
                onChange={(e) => change('code', e.target.value)}
                placeholder="Məs: ARDO-HD60"
              />
            </label>
            <label>
              <span>Məhsul adı *</span>
              <input
                value={product.title}
                onChange={(e) => change('title', e.target.value)}
                placeholder="Məs: ARDO 60 sm İnox Aspirator"
              />
            </label>
            <label>
              <span>Brend *</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={product.brandId || ''}
                  onChange={(e) => change('brandId', e.target.value)}
                  style={{ flex: 1 }}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onQuickCreateBrand?.(product.id)}
                  style={{
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    padding: '0 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '11px',
                  }}
                  title="Yeni Brend Yarat"
                >
                  + Yeni
                </button>
              </div>
            </label>
            <label>
              <span>Kateqoriya *</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <select
                  value={product.category}
                  onChange={(e) => change('category', e.target.value)}
                  style={{ flex: 1 }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => onQuickCreateCategory?.(product.id)}
                  style={{
                    background: theme.bgSecondary,
                    border: `1px solid ${theme.border}`,
                    color: theme.text,
                    padding: '0 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '11px',
                  }}
                  title="Yeni Kateqoriya Yarat"
                >
                  + Yeni
                </button>
              </div>
            </label>

            {/* Price & Discount Fields */}
            <label>
              <span>Qiymət ({product.currency || '₼'})</span>
              <input
                type="number"
                value={product.price !== undefined ? product.price : ''}
                onChange={(e) =>
                  change('price', e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="Məs: 450"
              />
            </label>
            <label>
              <span>Köhnə Qiymət (Endirim üçün)</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={product.oldPrice !== undefined ? product.oldPrice : ''}
                  onChange={(e) =>
                    change('oldPrice', e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="Məs: 520"
                  style={{ flex: 1 }}
                />
                {discountPercent && (
                  <span
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                    }}
                  >
                    -{discountPercent}%
                  </span>
                )}
              </div>
            </label>

            {/* Campaign Badge & Badge Color */}
            <label>
              <span>Kampaniya Nişanı (Badge)</span>
              <input
                value={product.badgeText || ''}
                onChange={(e) =>
                  setProduct((current) => ({ ...current, badgeText: e.target.value, isNew: false }))
                }
                placeholder="Məs: Yeni Model, Endirim, Top Model, Kreditlə..."
              />
            </label>
            <label>
              <span>Nişan Rəngi</span>
              <select
                value={product.badgeColor || 'red'}
                onChange={(e) => change('badgeColor', e.target.value as Product['badgeColor'])}
              >
                <option value="red">Qırmızı (Sahara Red)</option>
                <option value="green">Yaşıl (Yeni / Eko)</option>
                <option value="blue">Göy (Xüsusi Təklif)</option>
                <option value="amber">Kəhrəba Qızılı (Top Model)</option>
                <option value="purple">Bənövşəyi (Premium)</option>
              </select>
            </label>

            {/* Stock & Country */}
            <label>
              <span>Stok Vəziyyəti</span>
              <select
                value={product.stockStatus || 'in_stock'}
                onChange={(e) => change('stockStatus', e.target.value as Product['stockStatus'])}
              >
                <option value="in_stock">Anbarda Mövcuddur</option>
                <option value="preorder">Sifarişlə Gətirilir</option>
                <option value="out_of_stock">Müvəqqəti Bitib</option>
              </select>
            </label>

            <label>
              <span>İstehsal ölkəsi</span>
              <select
                value={product.manufacturingCountry || ''}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsAddingCustomCountry(true);
                  } else {
                    setIsAddingCustomCountry(false);
                    change('manufacturingCountry', e.target.value);
                  }
                }}
              >
                <option value="">Seçilməyib</option>
                {availableCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
                <option value="__custom__">+ Başqa ölkə daxil et...</option>
              </select>
              {isAddingCustomCountry && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                  <input
                    value={customCountryInput}
                    onChange={(e) => setCustomCountryInput(e.target.value)}
                    placeholder="Ölkə adını daxil edin"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customCountryInput.trim()) {
                        change('manufacturingCountry', customCountryInput.trim());
                        setIsAddingCustomCountry(false);
                        setCustomCountryInput('');
                      }
                    }}
                    style={{
                      background: theme.primary,
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    Təsdiqlə
                  </button>
                </div>
              )}
            </label>

            <label>
              <span>Status</span>
              <select
                value={product.status || 'draft'}
                onChange={(e) => change('status', e.target.value as Product['status'])}
              >
                <option value="draft">Qaralama (Kataloqda gizli)</option>
                <option value="published">Yayımda (Kataloqda açıq)</option>
              </select>
            </label>

            <label>
              <span>Əsas foto URL</span>
              <input
                value={product.image || ''}
                onChange={(e) => change('image', e.target.value)}
                placeholder="/media/products/ardo-1.jpg"
              />
            </label>
          </div>

          <label style={{ marginTop: '14px' }}>
            <span>Qısa xülasə və məlumat</span>
            <textarea
              value={product.shortDesc || ''}
              onChange={(e) => change('shortDesc', e.target.value)}
              rows={2}
              placeholder="Məhsul haqqında qısa xülasə..."
            />
          </label>

          <label style={{ marginTop: '14px' }}>
            <span>Ətraflı Təsvir (Məhsul Detalı səhifəsində "Təsvir" bölməsi üçün)</span>
            <textarea
              value={product.description || ''}
              onChange={(e) => change('description', e.target.value)}
              rows={4}
              placeholder="Məhsulun xüsusiyyətləri, istifadəsi və üstünlükləri haqqında ətraflı təsvir mətni..."
            />
          </label>

          {/* Media Manager */}
          <div className="editor-section" style={{ marginTop: '16px' }}>
            <div className="editor-section-head">
              <h3>Media faylları (Hover şəkil və videoları)</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <label
                  className="upload-btn"
                  style={{ background: theme.primary, cursor: 'pointer' }}
                >
                  <UploadCloud size={15} /> {uploading ? 'Yüklənir...' : 'Kompüterdən yüklə'}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ display: 'none' }}
                  />
                </label>
                <button type="button" onClick={() => addMedia('image')}>
                  <Plus size={14} /> Şəkil URL
                </button>
                <button type="button" onClick={() => addMedia('video')}>
                  <Plus size={14} /> Video URL
                </button>
              </div>
            </div>
            {uploadError && <p style={{ color: '#ef4444', fontSize: '12px' }}>{uploadError}</p>}
            <div className="media-list-grid">
              {(product.media || []).map((m, i) => {
                const isDragging = draggedMediaIndex === i;
                const isDropTarget = dropTargetMediaIndex === i;
                const dropClass =
                  isDropTarget && mediaDropPosition ? `drop-${mediaDropPosition}` : '';
                const isPrimary = i === 0;

                return (
                  <div
                    key={m.id || i}
                    draggable
                    onDragStart={(e) => handleMediaDragStart(i, e)}
                    onDragOver={(e) => handleMediaDragOver(i, e)}
                    onDrop={(e) => handleMediaDrop(i, e)}
                    onDragEnd={handleMediaDragEnd}
                    className={`media-row-card ${isPrimary ? 'is-primary' : ''} ${isDragging ? 'dragging' : ''} ${dropClass}`}
                  >
                    {/* Drag Handle */}
                    <div className="media-drag-handle" title="Tutub sürüşdürərək sıranı dəyişin">
                      <GripVertical size={16} />
                    </div>

                    {/* Sequence Number Input & Label */}
                    <div
                      className="media-seq-box"
                      title="Sıra nömrəsi (Daxil edib dərhal sıranı dəyişə bilərsiniz)"
                    >
                      <span>Sıra</span>
                      <input
                        type="number"
                        min={1}
                        max={(product.media || []).length}
                        value={i + 1}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) moveMediaToPosition(i, val);
                        }}
                        className="media-seq-input"
                      />
                    </div>

                    {/* Thumbnail Preview with Lightbox trigger */}
                    <div
                      className="admin-thumb"
                      onClick={() => onOpenLightbox?.(product, i)}
                      title="Böyüdüb baxmaq üçün klikləyin"
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {m.type === 'video' ? (
                        <div
                          style={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#0f172a',
                          }}
                        >
                          {m.poster ? (
                            <ShimmerImage
                              src={m.poster}
                              alt={m.alt || ''}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : m.url ? (
                            <video
                              src={m.url}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              muted
                              playsInline
                            />
                          ) : null}
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              right: '2px',
                              background: 'rgba(124, 58, 237, 0.95)',
                              color: '#fff',
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '1px 4px',
                              borderRadius: '3px',
                            }}
                          >
                            🎬 Video
                          </span>
                        </div>
                      ) : m.url ? (
                        <ShimmerImage
                          src={m.url}
                          alt={m.alt || ''}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectPosition: m.objectPosition || 'center',
                            objectFit: (m.fitMode || 'contain') as any,
                          }}
                        />
                      ) : (
                        '🖼'
                      )}
                    </div>

                    {/* Media File Info & Inputs */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        flex: 1,
                        minWidth: '240px',
                      }}
                    >
                      {/* Original / Clean Filename Badge & Code Match Indicator */}
                      {(() => {
                        const friendlyName = resolveFriendlyMediaName(m, i);
                        const currentCode = (product.code || '')
                          .trim()
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '');
                        const fname = friendlyName.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const matches = Boolean(
                          currentCode &&
                          (fname.includes(currentCode) || currentCode.includes(fname))
                        );

                        return (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '11px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ fontWeight: 750, color: theme.textSecondary }}>
                              📁 {m.type === 'video' ? 'Video Fayl:' : 'Şəkil Faylı:'}
                            </span>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                background: theme.bgSecondary,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: `1px solid ${theme.border}`,
                                fontSize: '11px',
                                color: m.type === 'video' ? '#8b5cf6' : theme.primary,
                                fontWeight: 700,
                                maxWidth: '260px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={friendlyName}
                            >
                              {friendlyName}
                            </span>
                            {/* Name match check indicator */}
                            {matches && (
                              <span
                                style={{
                                  background: 'rgba(34, 197, 94, 0.15)',
                                  color: '#16a34a',
                                  border: '1px solid rgba(34, 197, 94, 0.3)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                }}
                                title="Media faylının adı məhsulun model kodu ilə tam uyğundur"
                              >
                                ✓ Kodla uyğundur
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Inputs Row: URL + Original Name + Alt text */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <input
                          value={m.url}
                          onChange={(e) => updateMedia(i, { url: e.target.value })}
                          placeholder={
                            m.type === 'video'
                              ? 'Video URL (/media/products/videos/...)'
                              : 'Şəkil URL (/media/products/...)'
                          }
                          title="Faylın serverdəki tam URL yolu"
                          style={{ flex: 1, minWidth: '140px' }}
                        />
                        {m.type === 'video' && (
                          <input
                            value={m.poster || ''}
                            onChange={(e) => updateMedia(i, { poster: e.target.value })}
                            placeholder="Video posteri URL (/media/...)"
                            title="Video Qapaq Şəkili (Poster URL)"
                            style={{ flex: 1, minWidth: '140px' }}
                          />
                        )}
                        <input
                          value={m.originalName || resolveFriendlyMediaName(m, i)}
                          onChange={(e) => updateMedia(i, { originalName: e.target.value })}
                          placeholder="Orijinal fayl adı (Məs: 604B.jpg)"
                          title="Orijinal fayl adı / mənbə adı qeydi"
                          style={{ width: '180px' }}
                        />
                        <input
                          value={m.alt || ''}
                          onChange={(e) => updateMedia(i, { alt: e.target.value })}
                          placeholder="Alt izahı (Təsvir)"
                          title="Media təsviri (Alt text)"
                          style={{ width: '130px' }}
                        />
                      </div>
                    </div>

                    {/* Status Badge & Make Primary Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isPrimary ? (
                        <span
                          className="media-status-pill primary"
                          style={
                            m.type === 'video'
                              ? {
                                  background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                                  color: '#fff',
                                }
                              : undefined
                          }
                          title={
                            m.type === 'video'
                              ? 'Bu video kataloqda hərəkətli qapaq videosu olaraq görünür'
                              : 'Bu foto kataloqda əsas kart şəkili olaraq görünür'
                          }
                        >
                          {m.type === 'video' ? '🎬 #1 Əsas Video (Qapaq)' : '⭐ #1 Əsas'}
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="media-make-primary-btn"
                          onClick={() => setPrimaryMedia(i)}
                          title={
                            m.type === 'video'
                              ? 'Bu videonu 1-ci sıraya keçirərək Kataloq Qapaq Videosu et'
                              : 'Bu fotonu 1-ci sıraya keçirərək Əsas Şəkil et'
                          }
                          style={
                            m.type === 'video'
                              ? { borderColor: '#8b5cf6', color: '#8b5cf6' }
                              : undefined
                          }
                        >
                          {m.type === 'video' ? '🎬 1-ci / Qapaq et' : '⭐ 1-ci et'}
                        </button>
                      )}
                    </div>

                    {/* Up / Down Move Step Arrows */}
                    <div className="media-order-arrows">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => moveMediaToPosition(i, i)}
                        title="1 pillə yuxarı keçir"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={i === (product.media || []).length - 1}
                        onClick={() => moveMediaToPosition(i, i + 2)}
                        title="1 pillə aşağı keçir"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Delete Button */}
                    <button
                      type="button"
                      className="del-btn"
                      onClick={() => {
                        const remaining = (product.media || []).filter((_, idx) => idx !== i);
                        const firstImg =
                          remaining.find((item) => item.type === 'image' && item.url)?.url ||
                          remaining[0]?.url ||
                          '';
                        setProduct((curr) => ({
                          ...curr,
                          media: remaining,
                          image: firstImg,
                          gallery: remaining.map((item) => item.url).filter(Boolean),
                        }));
                      }}
                      title="Bu media faylını sil"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Position & Alignment Control Sub-Row */}
                    <div className="media-pos-row">
                      <div className="media-pos-label">
                        <span>🎯 Şəkilin duruşu:</span>
                      </div>

                      {/* Visual Crop & Focal Studio Launcher Button */}
                      {m.type !== 'video' && m.url && (
                        <button
                          type="button"
                          className="crop-open-studio-btn"
                          onClick={() =>
                            setCropStudioTarget({
                              mediaIndex: i,
                              imageUrl: m.url,
                              objectPosition: m.objectPosition || 'center',
                              fitMode: m.fitMode || 'contain',
                            })
                          }
                          title="Şəkli vizual kəsin, nisbətini seçin və fokusunu interaktiv studiyada tənzimləyin"
                        >
                          <Crop size={13} />
                          <span>✂️ Vizual Kəs & Tənzimlə</span>
                        </button>
                      )}

                      {/* 9-Dot Visual Quick Alignment Picker */}
                      <div
                        className="media-pos-grid-picker"
                        title="Tez mövqe seçimi (9 nöqtəli fokus)"
                      >
                        {[
                          { pos: 'top-left', icon: '↖', label: 'Yuxarı Sol' },
                          { pos: 'top', icon: '⬆', label: 'Üst / Yuxarı' },
                          { pos: 'top-right', icon: '↗', label: 'Yuxarı Sağ' },
                          { pos: 'left', icon: '⬅', label: 'Sol' },
                          { pos: 'center', icon: '⏺', label: 'Mərkəz (Orta)' },
                          { pos: 'right', icon: '➡', label: 'Sağ' },
                          { pos: 'bottom-left', icon: '↙', label: 'Aşağı Sol' },
                          { pos: 'bottom', icon: '⬇', label: 'Alt / Aşağı' },
                          { pos: 'bottom-right', icon: '↘', label: 'Aşağı Sağ' },
                        ].map((btn) => (
                          <button
                            key={btn.pos}
                            type="button"
                            className={`media-pos-dot ${(m.objectPosition || 'center') === btn.pos ? 'active' : ''}`}
                            onClick={() => updateMedia(i, { objectPosition: btn.pos })}
                            title={btn.label}
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>

                      {/* Position Select Dropdown */}
                      <select
                        value={m.objectPosition || 'center'}
                        onChange={(e) => updateMedia(i, { objectPosition: e.target.value })}
                        className="media-pos-select"
                        title="Duruş mövqeyini dəqiqləşdirin"
                      >
                        <option value="center">⏺ Mərkəz (Orta)</option>
                        <option value="top">⬆ Üst (Yuxarı fokus)</option>
                        <option value="bottom">⬇ Alt (Aşağı fokus)</option>
                        <option value="left">⬅ Sol fokus</option>
                        <option value="right">➡ Sağ fokus</option>
                        <option value="top-left">↖ Yuxarı-Sol</option>
                        <option value="top-right">↗ Yuxarı-Sağ</option>
                        <option value="bottom-left">↙ Aşağı-Sol</option>
                        <option value="bottom-right">↘ Aşağı-Sağ</option>
                      </select>

                      {/* Fit Mode Select Dropdown */}
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginLeft: 'auto',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'rgba(127,127,127,0.85)',
                            fontWeight: 600,
                          }}
                        >
                          Görünüş:
                        </span>
                        <select
                          value={m.fitMode || 'contain'}
                          onChange={(e) => updateMedia(i, { fitMode: e.target.value as any })}
                          className="media-fit-select"
                          title="Kəsim / sığışdırma rejimi"
                        >
                          <option value="contain">🖼 Tam sığışdır (Contain)</option>
                          <option value="cover">📐 Kartı doldur (Cover)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Specs Manager with Quick Suggestion Chips */}
          <div className="editor-section" style={{ marginTop: '16px' }}>
            <div className="editor-section-head">
              <div>
                <h3>Texniki göstəricilər (Parametrlər)</h3>
                <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted }}>
                  "Ardo xüsusiyyətlər_yoxlanılıb" şablonuna uyğun parametr açarları
                </p>
              </div>
              <button type="button" onClick={addSpec}>
                <Plus size={14} /> Yeni parametr
              </button>
            </div>

            {/* Quick Spec Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0' }}>
              <span style={{ fontSize: '11px', color: theme.textMuted, alignSelf: 'center' }}>
                Sürətli əlavə:
              </span>
              {COMMON_SPEC_SUGGESTIONS.map((specName) => {
                const isAdded = product.specs.some(
                  (s) => s.name.trim().toLowerCase() === specName.toLowerCase()
                );
                return (
                  <button
                    key={specName}
                    type="button"
                    onClick={() => {
                      if (!isAdded) {
                        change('specs', [
                          ...product.specs,
                          { id: newId('spec'), name: specName, value: '', group: 'Əsas' },
                        ]);
                      }
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: isAdded ? 'rgba(37, 99, 235, 0.15)' : theme.bgSecondary,
                      color: isAdded ? '#2563eb' : theme.text,
                      border: `1px solid ${theme.border}`,
                      cursor: 'pointer',
                      fontWeight: isAdded ? 700 : 500,
                    }}
                  >
                    {isAdded ? '✓ ' : '+ '} {specName}
                  </button>
                );
              })}
            </div>

            <div className="specs-list-grid">
              {product.specs.map((spec, i) => (
                <div key={spec.id || i} className="spec-row-card">
                  <input
                    value={spec.name}
                    onChange={(e) => updateSpec(i, { name: e.target.value })}
                    placeholder="Parametr adı (Məs: Növ, İş rejimi, Güc...)"
                    style={{ fontWeight: 650 }}
                  />
                  <input
                    value={spec.value}
                    onChange={(e) => updateSpec(i, { value: e.target.value })}
                    placeholder="Dəyəri (Məs: Skoruslu, 1200 m³/saat, 52x27 sm...)"
                  />
                  <input
                    value={spec.description || ''}
                    onChange={(e) => updateSpec(i, { description: e.target.value })}
                    placeholder="Əlavə izah (istəyə görə)"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      change(
                        'specs',
                        product.specs.filter((_, idx) => idx !== i)
                      )
                    }
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="product-modal-footer" style={{ borderColor: theme.border }}>
          <button type="button" onClick={onClose}>
            İmtina
          </button>
          <button
            type="button"
            onClick={() => {
              if (!product.code.trim() || !product.title.trim())
                return alert('Model kodu və adı mütləqdir');
              const firstImg =
                (product.media || []).find((m) => m.type === 'image' && m.url)?.url ||
                product.media?.[0]?.url ||
                product.image;
              const gallery = (product.media || []).map((m) => m.url).filter(Boolean);
              onSave({
                ...product,
                image: firstImg,
                gallery: gallery.length ? gallery : [firstImg].filter(Boolean),
              });
            }}
            style={{ background: theme.primary, color: '#fff' }}
          >
            Yadda saxla
          </button>
        </footer>

        {/* INTERACTIVE VISUAL CROP & FOCAL POSITION STUDIO MODAL */}
        {cropStudioTarget && (
          <ImageCropStudioModal
            isOpen={true}
            imageUrl={cropStudioTarget.imageUrl}
            initialObjectPosition={cropStudioTarget.objectPosition || 'center'}
            initialFitMode={cropStudioTarget.fitMode || 'contain'}
            productTitle={product.title}
            theme={theme}
            onClose={() => setCropStudioTarget(null)}
            onSavePosition={(pos, fit) => {
              updateMedia(cropStudioTarget.mediaIndex, { objectPosition: pos, fitMode: fit });
              if (cropStudioTarget.mediaIndex === 0) {
                setProduct((curr) => ({ ...curr, imagePosition: pos, imageFit: fit }));
              }
            }}
            onSaveCroppedImage={(newUrl, pos) => {
              updateMedia(cropStudioTarget.mediaIndex, {
                url: newUrl,
                objectPosition: pos || 'center',
              });
              if (cropStudioTarget.mediaIndex === 0) {
                setProduct((curr) => ({
                  ...curr,
                  image: newUrl,
                  imagePosition: pos || 'center',
                }));
              }
            }}
            onUpload={async (file) => {
              const media = await onUpload(file);
              return media.url;
            }}
          />
        )}
      </div>
    </div>
  );
};
