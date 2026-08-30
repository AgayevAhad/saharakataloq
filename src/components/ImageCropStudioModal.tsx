import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, Crop, Target, RotateCw, ZoomIn, ZoomOut, 
  RotateCcw, Sparkles, RefreshCw, Layers, Eye
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

type AspectRatioPreset = 'free' | '1:1' | '4:3' | '3:4' | '16:9';

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
  const [activeMode, setActiveMode] = useState<'crop' | 'focal'>('crop');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('4:3');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Parse initial object-position into X and Y percentages (0-100)
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

  const [focalPoint, setFocalPoint] = useState<{ x: number; y: number }>(() => parsePos(initialObjectPosition));
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>(initialFitMode);

  // Crop Box state relative to natural image dimensions [0 to 1 range]
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  });

  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasPreviewRef = useRef<HTMLCanvasElement>(null);

  // Dragging crop box / handles state
  const [activeDragHandle, setActiveDragHandle] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialRectOnDrag, setInitialRectOnDrag] = useState<typeof cropRect | null>(null);

  // Load Image Dimensions
  useEffect(() => {
    if (!imageUrl) return;
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
      setImageLoaded(true);
      // Initialize center 80% crop
      setCropRect({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 });
    };
  }, [imageUrl]);

  // Adjust crop aspect ratio when preset changes
  useEffect(() => {
    if (aspectRatio === 'free') return;
    let targetRatio = 1;
    if (aspectRatio === '1:1') targetRatio = 1;
    if (aspectRatio === '4:3') targetRatio = 4 / 3;
    if (aspectRatio === '3:4') targetRatio = 3 / 4;
    if (aspectRatio === '16:9') targetRatio = 16 / 9;

    setCropRect((curr) => {
      const imgAspect = imageDimensions.width / (imageDimensions.height || 1);
      let newW = 0.8;
      let newH = 0.8;

      if (targetRatio > imgAspect) {
        newW = 0.85;
        newH = (0.85 * imgAspect) / targetRatio;
      } else {
        newH = 0.85;
        newW = (0.85 * targetRatio) / imgAspect;
      }

      newW = Math.min(0.95, Math.max(0.2, newW));
      newH = Math.min(0.95, Math.max(0.2, newH));

      const newX = Math.max(0, (1 - newW) / 2);
      const newY = Math.max(0, (1 - newH) / 2);

      return { x: newX, y: newY, width: newW, height: newH };
    });
  }, [aspectRatio, imageDimensions]);

  // Render Canvas Crop Preview
  useEffect(() => {
    if (!canvasPreviewRef.current || !imageRef.current || !imageLoaded) return;
    const canvas = canvasPreviewRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const cropX = Math.max(0, cropRect.x * img.naturalWidth);
    const cropY = Math.max(0, cropRect.y * img.naturalHeight);
    const cropW = Math.max(10, cropRect.width * img.naturalWidth);
    const cropH = Math.max(10, cropRect.height * img.naturalHeight);

    canvas.width = cropW;
    canvas.height = cropH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
  }, [cropRect, imageLoaded, imageUrl]);

  // Handle Focal Point Click on Image
  const handleImageFocalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeMode !== 'focal') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    setFocalPoint({ x, y });
  };

  // Dragging crop handles
  const handleMouseDownOnHandle = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDragHandle(handle);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setInitialRectOnDrag({ ...cropRect });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeDragHandle || !initialRectOnDrag || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStartPos.x) / containerRect.width;
    const dy = (e.clientY - dragStartPos.y) / containerRect.height;

    setCropRect(() => {
      let { x, y, width, height } = initialRectOnDrag;
      const minSize = 0.15;

      if (activeDragHandle === 'move') {
        x = Math.max(0, Math.min(1 - width, x + dx));
        y = Math.max(0, Math.min(1 - height, y + dy));
      } else if (activeDragHandle === 'se') {
        width = Math.max(minSize, Math.min(1 - x, width + dx));
        height = Math.max(minSize, Math.min(1 - y, height + dy));
      } else if (activeDragHandle === 'sw') {
        const newX = Math.max(0, Math.min(x + width - minSize, x + dx));
        width = width + (x - newX);
        x = newX;
        height = Math.max(minSize, Math.min(1 - y, height + dy));
      } else if (activeDragHandle === 'ne') {
        const newY = Math.max(0, Math.min(y + height - minSize, y + dy));
        height = height + (y - newY);
        y = newY;
        width = Math.max(minSize, Math.min(1 - x, width + dx));
      } else if (activeDragHandle === 'nw') {
        const newX = Math.max(0, Math.min(x + width - minSize, x + dx));
        width = width + (x - newX);
        x = newX;
        const newY = Math.max(0, Math.min(y + height - minSize, y + dy));
        height = height + (y - newY);
        y = newY;
      }

      return { x, y, width, height };
    });
  }, [activeDragHandle, dragStartPos, initialRectOnDrag]);

  const handleMouseUp = useCallback(() => {
    setActiveDragHandle(null);
    setInitialRectOnDrag(null);
  }, []);

  useEffect(() => {
    if (activeDragHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeDragHandle, handleMouseMove, handleMouseUp]);

  // Save Cropped Image to Server
  const handleSaveCrop = async () => {
    if (!imageRef.current) return;
    setIsSaving(true);
    try {
      const img = imageRef.current;
      const cropCanvas = document.createElement('canvas');
      const ctx = cropCanvas.getContext('2d');
      if (!ctx) throw new Error('Canvas dəstəklənmir');

      const cropX = Math.max(0, Math.round(cropRect.x * img.naturalWidth));
      const cropY = Math.max(0, Math.round(cropRect.y * img.naturalHeight));
      const cropW = Math.max(20, Math.round(cropRect.width * img.naturalWidth));
      const cropH = Math.max(20, Math.round(cropRect.height * img.naturalHeight));

      cropCanvas.width = cropW;
      cropCanvas.height = cropH;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      // Convert canvas to Blob
      const blob = await new Promise<Blob | null>((resolve) =>
        cropCanvas.toBlob(resolve, 'image/jpeg', 0.92)
      );

      if (!blob) throw new Error('Şəkil yaradıla bilmədi');

      let savedUrl = '';
      if (onUpload) {
        const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
        savedUrl = await onUpload(file);
      } else {
        // Direct binary upload to /api/admin/media
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

      await onSaveCroppedImage(savedUrl, `${focalPoint.x}% ${focalPoint.y}%`);
      onClose();
    } catch (err) {
      alert(`Xəta: ${err instanceof Error ? err.message : 'Kəsmə zamanı xəta baş verdi'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Focal Point Position Coordinates
  const handleApplyPositionOnly = () => {
    const formatted = `${focalPoint.x}% ${focalPoint.y}%`;
    onSavePosition(formatted, fitMode);
    onClose();
  };

  if (!isOpen) return null;

  const currentFocalStyle = `${focalPoint.x}% ${focalPoint.y}%`;

  return (
    <div className="crop-studio-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="crop-studio-modal" style={{ background: theme.bgCard, borderColor: theme.border, color: theme.text }}>
        
        {/* Studio Header */}
        <header className="crop-studio-header" style={{ borderBottomColor: theme.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="crop-studio-icon-badge" style={{ background: theme.primary, color: '#fff' }}>
              <Crop size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Şəkil Kəsmə & Vizual Fokus Studiyası</h3>
              <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted }}>
                {productTitle} — Şəkli kəsin, bucağı seçin və real vaxtda baxın
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="crop-mode-tabs" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
            <button
              type="button"
              className={`crop-mode-tab ${activeMode === 'crop' ? 'active' : ''}`}
              onClick={() => setActiveMode('crop')}
            >
              <Crop size={14} />
              <span>✂️ Şəkli Kəs (Crop)</span>
            </button>
            <button
              type="button"
              className={`crop-mode-tab ${activeMode === 'focal' ? 'active' : ''}`}
              onClick={() => setActiveMode('focal')}
            >
              <Target size={14} />
              <span>🎯 Fokus & Duruş (Focal Pin)</span>
            </button>
          </div>

          <button type="button" className="crop-close-btn" onClick={onClose} title="Bağla">
            <X size={18} />
          </button>
        </header>

        {/* Studio Main Workspace */}
        <div className="crop-studio-body">
          
          {/* Left: Interactive Canvas Workspace */}
          <div className="crop-workspace-col">
            <div className="crop-canvas-stage" ref={containerRef}>
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Crop subject"
                className="crop-source-img"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease',
                }}
              />

              {/* MODE 1: VISUAL CROP BOX OVERLAY */}
              {activeMode === 'crop' && (
                <div
                  className="crop-box-overlay"
                  style={{
                    left: `${cropRect.x * 100}%`,
                    top: `${cropRect.y * 100}%`,
                    width: `${cropRect.width * 100}%`,
                    height: `${cropRect.height * 100}%`,
                  }}
                  onMouseDown={(e) => handleMouseDownOnHandle('move', e)}
                >
                  {/* Rule of Thirds Grid Lines */}
                  <div className="crop-grid-line v1" />
                  <div className="crop-grid-line v2" />
                  <div className="crop-grid-line h1" />
                  <div className="crop-grid-line h2" />

                  {/* Corner Resize Handles */}
                  <div className="crop-handle nw" onMouseDown={(e) => handleMouseDownOnHandle('nw', e)} />
                  <div className="crop-handle ne" onMouseDown={(e) => handleMouseDownOnHandle('ne', e)} />
                  <div className="crop-handle sw" onMouseDown={(e) => handleMouseDownOnHandle('sw', e)} />
                  <div className="crop-handle se" onMouseDown={(e) => handleMouseDownOnHandle('se', e)} />
                  
                  <div className="crop-box-badge">
                    {Math.round(cropRect.width * imageDimensions.width)} × {Math.round(cropRect.height * imageDimensions.height)} px
                  </div>
                </div>
              )}

              {/* MODE 2: INTERACTIVE FOCAL POINT TARGET RETICLE */}
              {activeMode === 'focal' && (
                <div className="focal-click-overlay" onClick={handleImageFocalClick}>
                  {/* Draggable Focal Pin */}
                  <div
                    className="focal-target-pin"
                    style={{
                      left: `${focalPoint.x}%`,
                      top: `${focalPoint.y}%`,
                    }}
                  >
                    <div className="focal-reticle-ring" />
                    <div className="focal-reticle-dot" />
                    <span className="focal-coords-badge">X:{focalPoint.x}% Y:{focalPoint.y}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="crop-controls-bar" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
              {activeMode === 'crop' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted }}>Kəsim Nisbəti:</span>
                    {(['free', '1:1', '4:3', '3:4', '16:9'] as AspectRatioPreset[]).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        className={`crop-ratio-btn ${aspectRatio === preset ? 'active' : ''}`}
                        onClick={() => setAspectRatio(preset)}
                      >
                        {preset === 'free' ? 'Sərbəst' : preset}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <button
                      type="button"
                      className="crop-tool-btn"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      title="90° Çevir"
                    >
                      <RotateCw size={14} /> 90°
                    </button>
                    <button
                      type="button"
                      className="crop-tool-btn"
                      onClick={() => { setZoom(1); setRotation(0); setCropRect({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 }); }}
                      title="Sıfırla"
                    >
                      <RefreshCw size={14} /> Sıfırla
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted }}>Sürətli Fokus Nöqtəsi:</span>
                    <button type="button" className="crop-ratio-btn" onClick={() => setFocalPoint({ x: 50, y: 0 })}>⬆ Üst</button>
                    <button type="button" className="crop-ratio-btn" onClick={() => setFocalPoint({ x: 50, y: 50 })}>⏺ Mərkəz</button>
                    <button type="button" className="crop-ratio-btn" onClick={() => setFocalPoint({ x: 50, y: 100 })}>⬇ Alt</button>
                    <button type="button" className="crop-ratio-btn" onClick={() => setFocalPoint({ x: 0, y: 50 })}>⬅ Sol</button>
                    <button type="button" className="crop-ratio-btn" onClick={() => setFocalPoint({ x: 100, y: 50 })}>➡ Sağ</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '11px', color: theme.textMuted }}>Kəsim Rejimi:</span>
                    <select
                      value={fitMode}
                      onChange={(e) => setFitMode(e.target.value as any)}
                      className="crop-select"
                    >
                      <option value="contain">Tam Sığışdır (Contain)</option>
                      <option value="cover">Kartı Doldur (Cover)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right: Real-Time Live Catalog Previews */}
          <div className="crop-preview-col" style={{ borderLeftColor: theme.border }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={15} color={theme.primary} /> Canlı Kataloq Görünüşü
            </h4>

            {/* Preview 1: Product Card Frame (250px x 180px) */}
            <div className="crop-card-preview-box" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
              <span className="crop-preview-label">1. Məhsul Kartı (Əsas Səhifə & Kateqoriya)</span>
              <div className="crop-preview-card-frame" style={{ background: theme.mode === 'dark' ? '#0c101a' : '#f8fafc' }}>
                {activeMode === 'crop' ? (
                  <canvas ref={canvasPreviewRef} className="crop-canvas-preview" />
                ) : (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectPosition: currentFocalStyle,
                      objectFit: fitMode,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Preview 2: Details Modal Frame */}
            <div className="crop-card-preview-box" style={{ background: theme.bgSecondary, borderColor: theme.border, marginTop: '14px' }}>
              <span className="crop-preview-label">2. Məhsul Pəncərəsi (Ətraflı Baxış)</span>
              <div className="crop-preview-modal-frame" style={{ background: theme.mode === 'dark' ? '#0c101a' : '#f8fafc' }}>
                {activeMode === 'crop' ? (
                  <canvas ref={canvasPreviewRef} className="crop-canvas-preview" />
                ) : (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectPosition: currentFocalStyle,
                      objectFit: fitMode,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Summary & Coordinates Card */}
            <div className="crop-info-card" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
              <div><b>Orijinal:</b> {imageDimensions.width} × {imageDimensions.height} px</div>
              <div><b>Mövqe:</b> <code>{currentFocalStyle}</code> ({fitMode})</div>
            </div>
          </div>
        </div>

        {/* Studio Footer with Action Buttons */}
        <footer className="crop-studio-footer" style={{ borderTopColor: theme.border }}>
          <button type="button" className="crop-cancel-btn" onClick={onClose} disabled={isSaving}>
            İmtina
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="crop-focal-apply-btn"
              onClick={handleApplyPositionOnly}
              disabled={isSaving}
              title="Orijinal faylı kəsmədən yalnız duruş mövqeyini yadda saxla"
            >
              <Target size={15} />
              <span>🎯 Mövqeni Tətbiq Et</span>
            </button>

            <button
              type="button"
              className="crop-save-btn"
              onClick={handleSaveCrop}
              disabled={isSaving}
              style={{ background: theme.primary, color: '#fff' }}
              title="Kəsilmiş yeni şəkli serverə yükləyib saxla"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="spin-anim" />
                  <span>Kəsilir & Yüklənir...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>✂️ Kəsilmiş Şəkli Saxla</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
