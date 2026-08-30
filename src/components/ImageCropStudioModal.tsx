import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, Crop, Target, RotateCw, ZoomIn, ZoomOut, 
  RefreshCw, Eye, Move, Maximize2, Sparkles, AlertCircle
} from 'lucide-react';
import { ThemeColors } from '../types/theme';

export interface ImageCropStudioModalProps {
  isOpen: boolean;
  imageUrl: string;
  initialObjectPosition?: string;
  initialFitMode?: 'contain' | 'cover';
  productTitle?: string;
  theme: ThemeColors;
  onClose: () => void;
  onSavePosition: (objectPosition: string, fitMode: 'contain' | 'cover') => void;
  onSaveCroppedImage: (newImageUrl: string, objectPosition?: string) => Promise<void> | void;
  onUpload?: (file: File) => Promise<string>;
}

export const ImageCropStudioModal: React.FC<ImageCropStudioModalProps> = ({
  isOpen,
  imageUrl,
  initialObjectPosition = 'center',
  initialFitMode = 'contain',
  productTitle = 'Məhsul Şəkli',
  theme,
  onClose,
  onSavePosition,
  onSaveCroppedImage,
  onUpload,
}) => {
  // Parse initial position into percentages [0-100]
  const parsePos = (posStr: string): { x: number; y: number } => {
    const s = posStr.trim().toLowerCase();
    if (s === 'top') return { x: 50, y: 0 };
    if (s === 'bottom') return { x: 50, y: 100 };
    if (s === 'left') return { x: 0, y: 50 };
    if (s === 'right') return { x: 100, y: 50 };
    if (s === 'top-left') return { x: 0, y: 0 };
    if (s === 'top-right') return { x: 100, y: 0 };
    if (s === 'bottom-left') return { x: 0, y: 100 };
    if (s === 'bottom-right') return { x: 100, y: 100 };
    if (s === 'center') return { x: 50, y: 50 };

    const parts = s.split(/\s+/);
    if (parts.length === 2) {
      const px = parseFloat(parts[0]);
      const py = parseFloat(parts[1]);
      return {
        x: isNaN(px) ? 50 : Math.max(0, Math.min(100, px)),
        y: isNaN(py) ? 50 : Math.max(0, Math.min(100, py)),
      };
    }
    return { x: 50, y: 50 };
  };

  const [focal, setFocal] = useState<{ x: number; y: number }>(() => parsePos(initialObjectPosition));
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>(initialFitMode);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [activeFrameType, setActiveFrameType] = useState<'card' | 'modal'>('card');

  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [loaded, setLoaded] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageUrl) return;
    setLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImageSize({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
      setLoaded(true);
    };
  }, [imageUrl]);

  // Handle Dragging / Panning directly inside frame
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStart.x) / rect.width;
    const deltaY = (e.clientY - dragStart.y) / rect.height;

    // Moving mouse left should shift focus right, moving mouse up should shift focus down
    setFocal((curr) => ({
      x: Math.max(0, Math.min(100, Number((curr.x - deltaX * 100).toFixed(1)))),
      y: Math.max(0, Math.min(100, Number((curr.y - deltaY * 100).toFixed(1)))),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Touch drag support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1 || !frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const deltaX = (e.touches[0].clientX - dragStart.x) / rect.width;
    const deltaY = (e.touches[0].clientY - dragStart.y) / rect.height;

    setFocal((curr) => ({
      x: Math.max(0, Math.min(100, Number((curr.x - deltaX * 100).toFixed(1)))),
      y: Math.max(0, Math.min(100, Number((curr.y - deltaY * 100).toFixed(1)))),
    }));
    setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // Wheel zoom inside frame
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((curr) => Math.max(1, Math.min(3, Number((curr + delta).toFixed(2)))));
  };

  // Reset to original full view
  const handleReset = () => {
    setFocal({ x: 50, y: 50 });
    setFitMode('contain');
    setZoom(1);
  };

  // Save non-destructive visual positioning
  const handleSaveFocalPosition = () => {
    const formatted = `${focal.x}% ${focal.y}%`;
    onSavePosition(formatted, fitMode);
    onClose();
  };

  // Pixel-perfect WYSIWYG Canvas Crop Export
  const handleExportCroppedImage = async () => {
    if (!imageRef.current || !frameRef.current) return;
    setIsSaving(true);
    try {
      const img = imageRef.current;
      const frame = frameRef.current;
      const frameRect = frame.getBoundingClientRect();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas dəstəklənmir');

      const targetW = 800;
      const targetH = Math.round((800 * frameRect.height) / frameRect.width);
      canvas.width = targetW;
      canvas.height = targetH;

      ctx.fillStyle = theme.mode === 'dark' ? '#0c101a' : '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);

      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const imgAspect = natW / natH;
      const frameAspect = targetW / targetH;

      let drawW = targetW * zoom;
      let drawH = targetH * zoom;

      if (fitMode === 'contain') {
        if (imgAspect > frameAspect) {
          drawW = targetW * zoom;
          drawH = (targetW / imgAspect) * zoom;
        } else {
          drawH = targetH * zoom;
          drawW = (targetH * imgAspect) * zoom;
        }
      } else {
        // cover
        if (imgAspect > frameAspect) {
          drawH = targetH * zoom;
          drawW = (targetH * imgAspect) * zoom;
        } else {
          drawW = targetW * zoom;
          drawH = (targetW / imgAspect) * zoom;
        }
      }

      const offsetX = (targetW - drawW) * (focal.x / 100);
      const offsetY = (targetH - drawH) * (focal.y / 100);

      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92)
      );

      if (!blob) throw new Error('Şəkil kəsilə bilmədi');

      let savedUrl = '';
      if (onUpload) {
        const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
        savedUrl = await onUpload(file);
      } else {
        const res = await fetch('/api/admin/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'image/jpeg',
            'X-Media-Alt': productTitle || 'Kəsilmiş şəkil',
          },
          body: blob,
        });
        if (!res.ok) throw new Error('Yüklənmə uğursuz oldu');
        const data = await res.json();
        savedUrl = data.url;
      }

      await onSaveCroppedImage(savedUrl, 'center');
      onClose();
    } catch (err) {
      alert(`Xəta: ${err instanceof Error ? err.message : 'Kəsmə zamanı xəta baş verdi'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentFocalStyle = `${focal.x}% ${focal.y}%`;

  return (
    <div className="crop-studio-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="crop-studio-modal" style={{ background: theme.bgCard, borderColor: theme.border, color: theme.text, maxWidth: '1000px' }}>
        
        {/* Header */}
        <header className="crop-studio-header" style={{ borderBottomColor: theme.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="crop-studio-icon-badge" style={{ background: theme.primary, color: '#fff' }}>
              <Maximize2 size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Məhsul Şəkli Canlı Kart Duruşu & Kəsim Studiyası</h3>
              <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted }}>
                {productTitle} — Şəkli çərçivə içində tutub sürüşdürün (Pan & Drag) və dəqiq görünüşü seçin
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Frame View Toggle */}
            <div className="crop-mode-tabs" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
              <button
                type="button"
                className={`crop-mode-tab ${activeFrameType === 'card' ? 'active' : ''}`}
                onClick={() => setActiveFrameType('card')}
                title="Kataloq kartı proporsiyası"
              >
                🎴 Kataloq Kartı
              </button>
              <button
                type="button"
                className={`crop-mode-tab ${activeFrameType === 'modal' ? 'active' : ''}`}
                onClick={() => setActiveFrameType('modal')}
                title="Məhsul detalları pəncərəsi proporsiyası"
              >
                🔍 Detal Pəncərəsi
              </button>
            </div>

            <button type="button" className="crop-close-btn" onClick={onClose} title="Bağla">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Main Body */}
        <div className="crop-studio-body" style={{ gridTemplateColumns: '1fr 340px' }}>
          
          {/* Left: WYSIWYG Interactive Frame */}
          <div className="crop-workspace-col">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: theme.textMuted,
                padding: '0 4px',
              }}
            >
              <span>🖱 <b>Şəkli tutub sürüşdürərək</b> istədiyiniz hissəyə fokuslayın</span>
              <span>🔍 Mövqe: <b>X:{focal.x}% Y:{focal.y}%</b> | Miqyas: <b>{Math.round(zoom * 100)}%</b></span>
            </div>

            {/* Live Interactive Framing Container */}
            <div
              className="crop-canvas-stage"
              style={{
                height: activeFrameType === 'card' ? '380px' : '420px',
                maxHeight: '440px',
                background: '#090d16',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* WYSIWYG Frame Box */}
              <div
                ref={frameRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onWheel={handleWheel}
                style={{
                  width: activeFrameType === 'card' ? '380px' : '460px',
                  height: activeFrameType === 'card' ? '280px' : '320px',
                  maxWidth: '92%',
                  maxHeight: '90%',
                  borderRadius: '12px',
                  border: '2px solid #38bdf8',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 8px 30px rgba(0,0,0,0.8)',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  background: theme.mode === 'dark' ? '#0c101a' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  userSelect: 'none',
                }}
                title="Şəkli tutub hər tərəfə sürüşdürün"
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Subject"
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: fitMode,
                    objectPosition: currentFocalStyle,
                    transform: `scale(${zoom})`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease',
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />

                {/* Framing Reticle Center Indicator */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '16px',
                    height: '16px',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }}
                />

                {/* Badge Overlay */}
                <div className="crop-box-badge" style={{ bottom: '8px', left: '8px' }}>
                  {activeFrameType === 'card' ? '🎴 Kataloq Kart Görünüşü' : '🔍 Detal Pəncərəsi'}
                </div>
              </div>
            </div>

            {/* Interactive Alignment & Zoom Bar */}
            <div className="crop-controls-bar" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted }}>Sürətli Bucaq:</span>
                <button type="button" className={`crop-ratio-btn ${focal.y === 0 ? 'active' : ''}`} onClick={() => setFocal({ x: 50, y: 0 })}>⬆ Üst</button>
                <button type="button" className={`crop-ratio-btn ${focal.x === 50 && focal.y === 50 ? 'active' : ''}`} onClick={() => setFocal({ x: 50, y: 50 })}>⏺ Mərkəz</button>
                <button type="button" className={`crop-ratio-btn ${focal.y === 100 ? 'active' : ''}`} onClick={() => setFocal({ x: 50, y: 100 })}>⬇ Alt</button>
                <button type="button" className={`crop-ratio-btn ${focal.x === 0 ? 'active' : ''}`} onClick={() => setFocal({ x: 0, y: 50 })}>⬅ Sol</button>
                <button type="button" className={`crop-ratio-btn ${focal.x === 100 ? 'active' : ''}`} onClick={() => setFocal({ x: 100, y: 50 })}>➡ Sağ</button>
              </div>

              {/* Zoom Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <button type="button" className="crop-tool-btn" onClick={() => setZoom((z) => Math.max(1, z - 0.2))} disabled={zoom <= 1} title="Kiçilt">
                  <ZoomOut size={13} />
                </button>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ width: '80px', accentColor: theme.primary }}
                />
                <button type="button" className="crop-tool-btn" onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} disabled={zoom >= 2.5} title="Böyüt">
                  <ZoomIn size={13} />
                </button>
                <button type="button" className="crop-tool-btn" onClick={handleReset} title="Orijinal vəziyyətə sıfırla">
                  <RefreshCw size={13} /> Sıfırla
                </button>
              </div>
            </div>
          </div>

          {/* Right: Settings, Explanations & Live Card Previews */}
          <div className="crop-preview-col" style={{ borderLeftColor: theme.border }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={15} color={theme.primary} /> Canlı Kart Görünüşü
            </h4>

            {/* Fit Mode Selector */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: theme.textMuted, display: 'block', marginBottom: '4px' }}>
                Görünüş Rejimi (Kəsim / Sığışdırma):
              </label>
              <select
                value={fitMode}
                onChange={(e) => setFitMode(e.target.value as any)}
                className="crop-select"
                style={{ width: '100%', padding: '7px 10px', fontSize: '12px' }}
              >
                <option value="contain">🖼 Tam Sığışdır (Heç bir tərəfi kəsilməsin)</option>
                <option value="cover">📐 Kartı Doldur & Bucaq Seç (Cover)</option>
              </select>
            </div>

            {/* Preview Mini Card */}
            <div className="crop-card-preview-box" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
              <span className="crop-preview-label">Kataloq Kartı (Real Ölçü):</span>
              <div className="crop-preview-card-frame" style={{ background: theme.mode === 'dark' ? '#0c101a' : '#f8fafc', height: '150px' }}>
                <img
                  src={imageUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectPosition: currentFocalStyle,
                    objectFit: fitMode,
                    transform: `scale(${zoom})`,
                    transition: 'all 0.1s ease',
                  }}
                />
              </div>
            </div>

            {/* Informational Guidance */}
            <div className="crop-info-card" style={{ background: theme.bgSecondary, borderColor: theme.border, fontSize: '11.5px', marginTop: '10px' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', color: '#38bdf8', marginBottom: '6px' }}>
                <Sparkles size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span><b>Tövsiyə olunan:</b> "🎯 Mövqeni Yadda Saxla" seçimi orijinal şəkli korlamır, kartda şəklin yalnız istədiyiniz bucağını göstərir.</span>
              </div>
              <div style={{ color: theme.textMuted }}>
                • Orijinal Ölçü: <b>{imageSize.width} × {imageSize.height} px</b><br />
                • Duruş Koordinatı: <code>{currentFocalStyle}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="crop-studio-footer" style={{ borderTopColor: theme.border }}>
          <button type="button" className="crop-cancel-btn" onClick={onClose} disabled={isSaving}>
            İmtina
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="crop-save-btn"
              onClick={handleExportCroppedImage}
              disabled={isSaving}
              style={{ background: 'transparent', border: `1px solid ${theme.border}`, color: theme.text }}
              title="Çərçivədə gördüyünüz sahəni yeni kəsilmiş şəkil faylı olaraq saxla"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="spin-anim" />
                  <span>Kəsilir...</span>
                </>
              ) : (
                <>
                  <Crop size={14} />
                  <span>✂️ Kəsib Yeni Şəkil Et</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="crop-focal-apply-btn"
              onClick={handleSaveFocalPosition}
              disabled={isSaving}
              style={{ background: theme.primary, color: '#ffffff', border: 'none', padding: '9px 20px', fontWeight: 800 }}
              title="Orijinal faylı kəsmədən dəqiq kart duruşunu saxla"
            >
              <Check size={16} />
              <span>🎯 Mövqeni Yadda Saxla</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
