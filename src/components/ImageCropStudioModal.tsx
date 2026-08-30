import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, Crop, Target, RotateCw, ZoomIn, ZoomOut, 
  RefreshCw, Eye, Move, Maximize2, Sparkles, Wand2,
  ChevronDown, Layers, HelpCircle
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

interface NormalizedRect {
  x: number; // 0 to 1
  y: number; // 0 to 1
  w: number; // 0 to 1
  h: number; // 0 to 1
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
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('free');
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });

  // Normalized crop rectangle [0..1] relative to the natural image
  const [crop, setCrop] = useState<NormalizedRect>({ x: 0, y: 0, w: 1, h: 1 });

  // Dragging state
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0 });
  const [cropOnDragStart, setCropOnDragStart] = useState<NormalizedRect>({ x: 0, y: 0, w: 1, h: 1 });

  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalPreviewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Rendered image bounds inside stage { left, top, width, height }
  const [renderedBounds, setRenderedBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // Load Image and set initial bounds
  useEffect(() => {
    if (!imageUrl) return;
    setLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      setImageSize({ width: w, height: h });
      setLoaded(true);
      // Initialize full crop or default 95%
      setCrop({ x: 0, y: 0, w: 1, h: 1 });
    };
  }, [imageUrl]);

  // Recalculate rendered bounds on window resize or load
  const updateRenderedBounds = useCallback(() => {
    if (!stageRef.current || !imgRef.current || !loaded) return;
    const stage = stageRef.current.getBoundingClientRect();
    const stageW = stage.width;
    const stageH = stage.height;
    const imgAspect = imageSize.width / (imageSize.height || 1);
    const stageAspect = stageW / (stageH || 1);

    let renderW = stageW;
    let renderH = stageH;
    let renderL = 0;
    let renderT = 0;

    if (imgAspect > stageAspect) {
      renderW = stageW;
      renderH = stageW / imgAspect;
      renderT = (stageH - renderH) / 2;
    } else {
      renderH = stageH;
      renderW = stageH * imgAspect;
      renderL = (stageW - renderW) / 2;
    }

    setRenderedBounds({ left: renderL, top: renderT, width: renderW, height: renderH });
  }, [loaded, imageSize]);

  useEffect(() => {
    updateRenderedBounds();
    window.addEventListener('resize', updateRenderedBounds);
    return () => window.removeEventListener('resize', updateRenderedBounds);
  }, [updateRenderedBounds]);

  // Auto-Trim Excessive White/Light Background (Wand feature)
  const handleAutoTrimWhite = () => {
    if (!imgRef.current || !loaded) return;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = imgRef.current.naturalWidth;
      const h = imgRef.current.naturalHeight;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(imgRef.current, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      const isWhiteOrTransparent = (idx: number) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        if (a < 15) return true;
        // Background threshold (near white)
        return r > 240 && g > 240 && b > 240;
      };

      let minX = w, minY = h, maxX = 0, maxY = 0;

      for (let y = 0; y < h; y += 4) {
        for (let x = 0; x < w; x += 4) {
          const idx = (y * w + x) * 4;
          if (!isWhiteOrTransparent(idx)) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (maxX > minX && maxY > minY) {
        // Add 4% padding
        const padX = Math.round((maxX - minX) * 0.04);
        const padY = Math.round((maxY - minY) * 0.04);

        const cropX = Math.max(0, (minX - padX) / w);
        const cropY = Math.max(0, (minY - padY) / h);
        const cropW = Math.min(1 - cropX, (maxX - minX + padX * 2) / w);
        const cropH = Math.min(1 - cropY, (maxY - minY + padY * 2) / h);

        setCrop({ x: cropX, y: cropY, w: cropW, h: cropH });
      }
    } catch (err) {
      console.warn('Auto trim failed (CORS or canvas issue)', err);
    }
  };

  // Adjust aspect ratio when preset changes
  const applyAspectRatio = (preset: AspectRatioPreset) => {
    setAspectRatio(preset);
    if (preset === 'free') return;

    let targetRatio = 1;
    if (preset === '1:1') targetRatio = 1;
    if (preset === '4:3') targetRatio = 4 / 3;
    if (preset === '3:4') targetRatio = 3 / 4;
    if (preset === '16:9') targetRatio = 16 / 9;

    setCrop((curr) => {
      const imgAspect = imageSize.width / (imageSize.height || 1);
      let newW = curr.w;
      let newH = (curr.w * imgAspect) / targetRatio;

      if (newH > 1) {
        newH = 1;
        newW = (1 * targetRatio) / imgAspect;
      }
      newW = Math.min(1, Math.max(0.15, newW));
      newH = Math.min(1, Math.max(0.15, newH));

      const newX = Math.max(0, Math.min(1 - newW, curr.x));
      const newY = Math.max(0, Math.min(1 - newH, curr.y));

      return { x: newX, y: newY, w: newW, h: newH };
    });
  };

  // Render Real-Time Canvas Previews
  useEffect(() => {
    if (!imgRef.current || !loaded) return;
    const img = imgRef.current;
    const natW = img.naturalWidth || imageSize.width;
    const natH = img.naturalHeight || imageSize.height;

    const cropX = Math.max(0, Math.round(crop.x * natW));
    const cropY = Math.max(0, Math.round(crop.y * natH));
    const cropW = Math.max(10, Math.round(crop.w * natW));
    const cropH = Math.max(10, Math.round(crop.h * natH));

    // Render Preview 1: Product Card Canvas
    if (previewCanvasRef.current) {
      const cardCanvas = previewCanvasRef.current;
      const ctx = cardCanvas.getContext('2d');
      if (ctx) {
        cardCanvas.width = cropW;
        cardCanvas.height = cropH;
        ctx.clearRect(0, 0, cropW, cropH);
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      }
    }

    // Render Preview 2: Modal Canvas
    if (modalPreviewCanvasRef.current) {
      const modalCanvas = modalPreviewCanvasRef.current;
      const ctx2 = modalCanvas.getContext('2d');
      if (ctx2) {
        modalCanvas.width = cropW;
        modalCanvas.height = cropH;
        ctx2.clearRect(0, 0, cropW, cropH);
        ctx2.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      }
    }
  }, [crop, loaded, imageSize]);

  // Handle Dragging Crop Box & Handles
  const handleHandleMouseDown = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveHandle(handle);
    setDragStart({ clientX: e.clientX, clientY: e.clientY });
    setCropOnDragStart({ ...crop });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeHandle || !renderedBounds.width || !renderedBounds.height) return;

    const dxNorm = (e.clientX - dragStart.clientX) / renderedBounds.width;
    const dyNorm = (e.clientY - dragStart.clientY) / renderedBounds.height;

    setCrop(() => {
      let { x, y, w, h } = cropOnDragStart;
      const minSize = 0.1;

      if (activeHandle === 'move') {
        x = Math.max(0, Math.min(1 - w, x + dxNorm));
        y = Math.max(0, Math.min(1 - h, y + dyNorm));
      } else if (activeHandle === 'n') {
        // Drag top edge down/up
        const newY = Math.max(0, Math.min(y + h - minSize, y + dyNorm));
        h = h + (y - newY);
        y = newY;
      } else if (activeHandle === 's') {
        // Drag bottom edge
        h = Math.max(minSize, Math.min(1 - y, h + dyNorm));
      } else if (activeHandle === 'w') {
        // Drag left edge
        const newX = Math.max(0, Math.min(x + w - minSize, x + dxNorm));
        w = w + (x - newX);
        x = newX;
      } else if (activeHandle === 'e') {
        // Drag right edge
        w = Math.max(minSize, Math.min(1 - x, w + dxNorm));
      } else if (activeHandle === 'nw') {
        const newX = Math.max(0, Math.min(x + w - minSize, x + dxNorm));
        w = w + (x - newX);
        x = newX;
        const newY = Math.max(0, Math.min(y + h - minSize, y + dyNorm));
        h = h + (y - newY);
        y = newY;
      } else if (activeHandle === 'ne') {
        w = Math.max(minSize, Math.min(1 - x, w + dxNorm));
        const newY = Math.max(0, Math.min(y + h - minSize, y + dyNorm));
        h = h + (y - newY);
        y = newY;
      } else if (activeHandle === 'se') {
        w = Math.max(minSize, Math.min(1 - x, w + dxNorm));
        h = Math.max(minSize, Math.min(1 - y, h + dyNorm));
      } else if (activeHandle === 'sw') {
        const newX = Math.max(0, Math.min(x + w - minSize, x + dxNorm));
        w = w + (x - newX);
        x = newX;
        h = Math.max(minSize, Math.min(1 - y, h + dyNorm));
      }

      return { x, y, w, h };
    });
  }, [activeHandle, dragStart, cropOnDragStart, renderedBounds]);

  const handleMouseUp = useCallback(() => {
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [activeHandle, handleMouseMove, handleMouseUp]);

  // Save Cropped Result to Backend Server & Product
  const handleSaveCroppedImage = async () => {
    if (!imgRef.current) return;
    setIsSaving(true);
    try {
      const img = imgRef.current;
      const natW = img.naturalWidth || imageSize.width;
      const natH = img.naturalHeight || imageSize.height;

      const cropX = Math.max(0, Math.round(crop.x * natW));
      const cropY = Math.max(0, Math.round(crop.y * natH));
      const cropW = Math.max(20, Math.round(crop.w * natW));
      const cropH = Math.max(20, Math.round(crop.h * natH));

      const canvas = document.createElement('canvas');
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas dəstəklənmir');

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.94)
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

  // Calculate pixel position of crop box inside stage
  const cropBoxPixelStyle = {
    left: `${renderedBounds.left + crop.x * renderedBounds.width}px`,
    top: `${renderedBounds.top + crop.y * renderedBounds.height}px`,
    width: `${crop.w * renderedBounds.width}px`,
    height: `${crop.h * renderedBounds.height}px`,
  };

  const cropPixelDimensions = {
    w: Math.round(crop.w * imageSize.width),
    h: Math.round(crop.h * imageSize.height),
  };

  return (
    <div className="crop-studio-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="crop-studio-modal" style={{ background: theme.bgCard, borderColor: theme.border, color: theme.text, maxWidth: '1080px' }}>
        
        {/* Studio Header */}
        <header className="crop-studio-header" style={{ borderBottomColor: theme.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="crop-studio-icon-badge" style={{ background: theme.primary, color: '#fff' }}>
              <Crop size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Dəqiq Şəkil Kəsmə & Çərçivələmə Studiyası</h3>
              <p style={{ margin: 0, fontSize: '11px', color: theme.textMuted }}>
                {productTitle} — Artıq ağ sahələri kəsin, məhsulu mərkəzləşdirin və canlı baxın
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Auto Trim Magic Button */}
            <button
              type="button"
              className="crop-focal-apply-btn"
              onClick={handleAutoTrimWhite}
              style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#0284c7', borderColor: 'rgba(56, 189, 248, 0.4)', padding: '6px 12px', fontSize: '12px' }}
              title="Şəklin ətrafındakı artıq ağ/boş sahələri avtomatik kəsib məhsulu mərkəzə salır"
            >
              <Wand2 size={14} />
              <span>🪄 Ağ Sahələri Avtomatik Kəs</span>
            </button>

            <button type="button" className="crop-close-btn" onClick={onClose} title="Bağla">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Studio Body */}
        <div className="crop-studio-body" style={{ gridTemplateColumns: '1fr 340px' }}>
          
          {/* Left Column: Interactive Visual Cropper Canvas */}
          <div className="crop-workspace-col">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: theme.textMuted }}>
              <span>📐 <b>Mavi çərçivənin kənarlarını tutub sürüşdürün</b> (Yuxarıdakı ağ sahəni aşağı çəkərək kəsin)</span>
              <span>Kəsim Ölçüsü: <b>{cropPixelDimensions.w} × {cropPixelDimensions.h} px</b></span>
            </div>

            {/* Stage */}
            <div
              className="crop-canvas-stage"
              ref={stageRef}
              style={{
                height: '430px',
                background: '#090d16',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
              }}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="Source"
                className="crop-source-img"
                onLoad={updateRenderedBounds}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />

              {/* Pixel-Accurate Crop Box Overlay */}
              {loaded && renderedBounds.width > 0 && (
                <div
                  className="crop-box-overlay"
                  style={{
                    ...cropBoxPixelStyle,
                    position: 'absolute',
                    border: '2px solid #38bdf8',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                    cursor: activeHandle === 'move' ? 'grabbing' : 'move',
                    boxSizing: 'border-box',
                    zIndex: 20,
                  }}
                  onMouseDown={(e) => handleHandleMouseDown('move', e)}
                >
                  {/* Grid 3x3 */}
                  <div className="crop-grid-line v1" />
                  <div className="crop-grid-line v2" />
                  <div className="crop-grid-line h1" />
                  <div className="crop-grid-line h2" />

                  {/* Corner Handles */}
                  <div className="crop-handle nw" onMouseDown={(e) => handleHandleMouseDown('nw', e)} title="Yuxarı-Sol künc" />
                  <div className="crop-handle ne" onMouseDown={(e) => handleHandleMouseDown('ne', e)} title="Yuxarı-Sağ künc" />
                  <div className="crop-handle sw" onMouseDown={(e) => handleHandleMouseDown('sw', e)} title="Aşağı-Sol künc" />
                  <div className="crop-handle se" onMouseDown={(e) => handleHandleMouseDown('se', e)} title="Aşağı-Sağ künc" />

                  {/* Edge Handles for easy Top/Bottom/Side trimming */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '32px',
                      height: '10px',
                      background: '#38bdf8',
                      borderRadius: '4px',
                      cursor: 'ns-resize',
                    }}
                    onMouseDown={(e) => handleHandleMouseDown('n', e)}
                    title="Üst ağ sahəni aşağı çəkərək kəsin"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '32px',
                      height: '10px',
                      background: '#38bdf8',
                      borderRadius: '4px',
                      cursor: 'ns-resize',
                    }}
                    onMouseDown={(e) => handleHandleMouseDown('s', e)}
                    title="Alt tərəfi kəsin"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '32px',
                      background: '#38bdf8',
                      borderRadius: '4px',
                      cursor: 'ew-resize',
                    }}
                    onMouseDown={(e) => handleHandleMouseDown('w', e)}
                    title="Sol tərəfi kəsin"
                  />
                  <div
                    style={{
                      position: 'absolute',
                      right: '-6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '10px',
                      height: '32px',
                      background: '#38bdf8',
                      borderRadius: '4px',
                      cursor: 'ew-resize',
                    }}
                    onMouseDown={(e) => handleHandleMouseDown('e', e)}
                    title="Sağ tərəfi kəsin"
                  />

                  <div className="crop-box-badge">
                    ✂️ {cropPixelDimensions.w} × {cropPixelDimensions.h} px
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="crop-controls-bar" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted }}>Kəsim Nisbəti:</span>
                {(['free', '1:1', '4:3', '3:4', '16:9'] as AspectRatioPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`crop-ratio-btn ${aspectRatio === preset ? 'active' : ''}`}
                    onClick={() => applyAspectRatio(preset)}
                  >
                    {preset === 'free' ? '✂️ Sərbəst Kəsim' : preset}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="crop-tool-btn"
                  onClick={() => {
                    setCrop({ x: 0, y: 0, w: 1, h: 1 });
                    setAspectRatio('free');
                  }}
                  title="Kəsimi tam orijinal şəkildə sıfırla"
                >
                  <RefreshCw size={13} /> Sıfırla (Bütün Şəkil)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Live Catalog Card & Modal Previews */}
          <div className="crop-preview-col" style={{ borderLeftColor: theme.border }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '12.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={15} color={theme.primary} /> Canlı Kataloq Nəticəsi
            </h4>

            {/* Preview 1: Product Card Frame */}
            <div className="crop-card-preview-box" style={{ background: theme.bgSecondary, borderColor: theme.border }}>
              <span className="crop-preview-label">1. Əsas Səhifə & Kataloq Kartı:</span>
              <div
                className="crop-preview-card-frame"
                style={{
                  background: theme.mode === 'dark' ? '#0c101a' : '#f8fafc',
                  height: '160px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))',
                  }}
                />
              </div>
            </div>

            {/* Preview 2: Detail Modal Frame */}
            <div className="crop-card-preview-box" style={{ background: theme.bgSecondary, borderColor: theme.border, marginTop: '8px' }}>
              <span className="crop-preview-label">2. Məhsul Detalları Pəncərəsi:</span>
              <div
                className="crop-preview-modal-frame"
                style={{
                  background: theme.mode === 'dark' ? '#0c101a' : '#f8fafc',
                  height: '130px',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <canvas
                  ref={modalPreviewCanvasRef}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
            </div>

            {/* Dimensions Info Box */}
            <div className="crop-info-card" style={{ background: theme.bgSecondary, borderColor: theme.border, marginTop: '8px', fontSize: '11.5px' }}>
              <div><b>Orijinal Şəkil:</b> {imageSize.width} × {imageSize.height} px</div>
              <div><b>Yeni Kəsilmiş Ölçü:</b> <code>{cropPixelDimensions.w} × {cropPixelDimensions.h} px</code></div>
              <div style={{ color: '#22c55e', fontWeight: 700, marginTop: '4px' }}>
                ✓ Sağ və sol kənarlar heç bir təhrif olmadan tam saxlanılır.
              </div>
            </div>
          </div>
        </div>

        {/* Studio Footer */}
        <footer className="crop-studio-footer" style={{ borderTopColor: theme.border }}>
          <button type="button" className="crop-cancel-btn" onClick={onClose} disabled={isSaving}>
            İmtina
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="crop-save-btn"
              onClick={handleSaveCroppedImage}
              disabled={isSaving}
              style={{ background: theme.primary, color: '#ffffff', border: 'none', padding: '9px 24px', fontWeight: 800 }}
              title="Kəsilmiş şəkli saxlayır və məhsulun şəkli olaraq təyin edir"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="spin-anim" />
                  <span>Kəsilir & Yadda Saxlanılır...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>✂️ Kəsilmiş Şəkli Saxla & Məhsula Tətbiq Et</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
