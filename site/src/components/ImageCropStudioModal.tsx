import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Crop, RefreshCw, Eye, Wand2 } from 'lucide-react';
import { ThemeColors } from '../types/theme';
import { calculateCropFrameTransform, ShimmerImage } from './ShimmerImage';

export interface NormalizedRect {
  x: number; // 0 to 1
  y: number; // 0 to 1
  w: number; // 0 to 1
  h: number; // 0 to 1
}

export interface ImageCropStudioModalProps {
  isOpen: boolean;
  imageUrl: string;
  originalImageUrl?: string;
  initialCropRect?: NormalizedRect;
  initialObjectPosition?: string;
  productTitle?: string;
  theme: ThemeColors;
  onClose: () => void;
  onSaveCroppedImage: (
    newImageUrl: string,
    objectPosition?: string,
    cropRect?: NormalizedRect,
    originalUrl?: string
  ) => Promise<void> | void;
  onUpload?: (file: File) => Promise<string>;
}

type AspectRatioPreset = 'free' | '1:1' | '4:3' | '3:4' | '16:9';

export const CATALOG_CARD_PREVIEW_SIZE = { width: 339, height: 339 } as const;

const clampCropRect = (value?: NormalizedRect): NormalizedRect => {
  if (!value) return { x: 0, y: 0, w: 1, h: 1 };
  const w = Math.max(0.1, Math.min(1, Number.isFinite(value.w) ? value.w : 1));
  const h = Math.max(0.1, Math.min(1, Number.isFinite(value.h) ? value.h : 1));
  const x = Math.max(0, Math.min(1 - w, Number.isFinite(value.x) ? value.x : 0));
  const y = Math.max(0, Math.min(1 - h, Number.isFinite(value.y) ? value.y : 0));
  return { x, y, w, h };
};

export const ImageCropStudioModal: React.FC<ImageCropStudioModalProps> = ({
  isOpen,
  imageUrl,
  originalImageUrl,
  initialCropRect,
  initialObjectPosition = 'center',
  productTitle = 'Məhsul Şəkli',
  theme,
  onClose,
  onSaveCroppedImage,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatioPreset>('free');
  const [isSaving, setIsSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });

  // Normalized crop rectangle [0..1] relative to the natural image
  const [crop, setCrop] = useState<NormalizedRect>(() => {
    if (initialCropRect && initialCropRect.w > 0 && initialCropRect.h > 0) {
      return clampCropRect(initialCropRect);
    }
    return { x: 0, y: 0, w: 1, h: 1 };
  });

  // Dragging state
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ clientX: 0, clientY: 0 });
  const [cropOnDragStart, setCropOnDragStart] = useState<NormalizedRect>({
    x: 0,
    y: 0,
    w: 1,
    h: 1,
  });

  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalPreviewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Rendered image bounds inside stage { left, top, width, height }
  const [renderedBounds, setRenderedBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });

  // Load Image and set initial bounds
  useEffect(() => {
    const srcToLoad = originalImageUrl || imageUrl;
    if (!srcToLoad) return;
    setLoaded(false);
    const img = new Image();
    img.src = srcToLoad;
    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      setImageSize({ width: w, height: h });
      setLoaded(true);
      setCrop(
        initialCropRect && initialCropRect.w > 0 && initialCropRect.h > 0
          ? clampCropRect(initialCropRect)
          : { x: 0, y: 0, w: 1, h: 1 }
      );
    };
  }, [imageUrl, originalImageUrl, initialCropRect, initialObjectPosition]);

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

      const naturalWidth = imgRef.current.naturalWidth;
      const naturalHeight = imgRef.current.naturalHeight;
      const analysisScale = Math.min(1, 1024 / Math.max(naturalWidth, naturalHeight));
      const w = Math.max(1, Math.round(naturalWidth * analysisScale));
      const h = Math.max(1, Math.round(naturalHeight * analysisScale));
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

      let minX = w,
        minY = h,
        maxX = 0,
        maxY = 0;

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

    const renderPreview = (
      canvas: HTMLCanvasElement | null,
      targetWidth: number,
      targetHeight: number
    ) => {
      if (!canvas) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(targetWidth * pixelRatio);
      canvas.height = Math.round(targetHeight * pixelRatio);
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetHeight}px`;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, targetWidth, targetHeight);
      const transform = calculateCropFrameTransform(crop, natW, natH, targetWidth, targetHeight);
      if (!transform) return;
      context.save();
      context.beginPath();
      context.rect(0, 0, targetWidth, targetHeight);
      context.clip();
      context.drawImage(img, transform.left, transform.top, transform.width, transform.height);
      context.restore();
    };

    renderPreview(
      previewCanvasRef.current,
      CATALOG_CARD_PREVIEW_SIZE.width,
      CATALOG_CARD_PREVIEW_SIZE.height
    );
    renderPreview(modalPreviewCanvasRef.current, 280, 104);
  }, [crop, loaded, imageSize]);

  // Handle mouse, pen and touch with one pointer-event path.
  const handleHandlePointerDown = (handle: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setActiveHandle(handle);
    setDragStart({ clientX: e.clientX, clientY: e.clientY });
    setCropOnDragStart({ ...crop });
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeHandle || !renderedBounds.width || !renderedBounds.height) return;
      e.preventDefault();

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

        return clampCropRect({ x, y, w, h });
      });
    },
    [activeHandle, dragStart, cropOnDragStart, renderedBounds]
  );

  const handlePointerUp = useCallback(() => {
    setActiveHandle(null);
  }, []);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener('pointermove', handlePointerMove, { passive: false });
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [activeHandle, handlePointerMove, handlePointerUp]);

  // Save Visual Framing / Crop to Product
  const handleSaveFraming = async () => {
    setIsSaving(true);
    try {
      if (!imgRef.current || !loaded) {
        onClose();
        return;
      }

      const focalX = Math.round((crop.x + crop.w / 2) * 100);
      const focalY = Math.round((crop.y + crop.h / 2) * 100);
      const computedPosition = `${focalX}% ${focalY}%`;

      const originalSourceUrl = originalImageUrl || imageUrl;

      if (onSaveCroppedImage) {
        await onSaveCroppedImage(originalSourceUrl, computedPosition, crop, originalSourceUrl);
      }
      onClose();
    } catch (err) {
      alert(`Xəta: ${err instanceof Error ? err.message : 'Düzənləmə zamanı xəta baş verdi'}`);
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
    <div
      className="crop-studio-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="crop-studio-modal"
        data-crop-rect={JSON.stringify(crop)}
        style={{
          background: theme.bgCard,
          borderColor: theme.border,
          color: theme.text,
          maxWidth: '1080px',
        }}
      >
        {/* Studio Header */}
        <header className="crop-studio-header" style={{ borderBottomColor: theme.border }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              className="crop-studio-icon-badge"
              style={{ background: theme.primary, color: '#fff' }}
            >
              <Crop size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{productTitle}</h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Auto Trim Magic Button */}
            <button
              type="button"
              className="crop-focal-apply-btn"
              onClick={handleAutoTrimWhite}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#0284c7',
                borderColor: 'rgba(56, 189, 248, 0.4)',
                padding: '6px 12px',
                fontSize: '12px',
              }}
              title="Məhsulu avtomatik aşkar edib görünüş mərkəzinə gətirir"
            >
              <Wand2 size={14} />
              <span>🪄 Avtomatik Fokusla</span>
            </button>

            <button type="button" className="crop-close-btn" onClick={onClose} title="Bağla">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Studio Body */}
        <div className="crop-studio-body">
          {/* Left Column: Interactive Visual Cropper Canvas */}
          <div className="crop-workspace-col">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                fontSize: '11.5px',
                color: theme.textMuted,
              }}
            >
              <span>
                Fokus Sahəsi:{' '}
                <b>
                  {cropPixelDimensions.w} × {cropPixelDimensions.h} px
                </b>
              </span>
            </div>

            {/* Stage */}
            <div
              className="crop-canvas-stage"
              ref={stageRef}
              style={{
                background: '#090d16',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                touchAction: 'none',
              }}
            >
              <ShimmerImage
                ref={imgRef}
                src={imageUrl}
                alt="Source"
                className="crop-source-img"
                onLoad={updateRenderedBounds}
                containerStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  opacity: loaded ? 1 : 0,
                  transition: 'opacity 0.25s ease-in-out',
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
                  onPointerDown={(e) => handleHandlePointerDown('move', e)}
                >
                  {/* Grid 3x3 */}
                  <div className="crop-grid-line v1" />
                  <div className="crop-grid-line v2" />
                  <div className="crop-grid-line h1" />
                  <div className="crop-grid-line h2" />

                  {/* Corner Handles */}
                  <div
                    className="crop-handle nw"
                    onPointerDown={(e) => handleHandlePointerDown('nw', e)}
                    title="Yuxarı-Sol künc"
                  />
                  <div
                    className="crop-handle ne"
                    onPointerDown={(e) => handleHandlePointerDown('ne', e)}
                    title="Yuxarı-Sağ künc"
                  />
                  <div
                    className="crop-handle sw"
                    onPointerDown={(e) => handleHandlePointerDown('sw', e)}
                    title="Aşağı-Sol künc"
                  />
                  <div
                    className="crop-handle se"
                    onPointerDown={(e) => handleHandlePointerDown('se', e)}
                    title="Aşağı-Sağ künc"
                  />

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
                    onPointerDown={(e) => handleHandlePointerDown('n', e)}
                    title="Üstdən görünməyəcək sahəni seçin"
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
                    onPointerDown={(e) => handleHandlePointerDown('s', e)}
                    title="Altdan görünməyəcək sahəni seçin"
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
                    onPointerDown={(e) => handleHandlePointerDown('w', e)}
                    title="Soldan görünməyəcək sahəni seçin"
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
                    onPointerDown={(e) => handleHandlePointerDown('e', e)}
                    title="Sağdan görünməyəcək sahəni seçin"
                  />

                  <div className="crop-box-badge">
                    👁 {cropPixelDimensions.w} × {cropPixelDimensions.h} px
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div
              className="crop-controls-bar"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: theme.textMuted }}>
                  Görünüş Nisbəti:
                </span>
                {(['free', '1:1', '4:3', '3:4', '16:9'] as AspectRatioPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`crop-ratio-btn ${aspectRatio === preset ? 'active' : ''}`}
                    onClick={() => applyAspectRatio(preset)}
                  >
                    {preset === 'free' ? '🎯 Sərbəst Düzənləmə' : preset}
                  </button>
                ))}
              </div>

              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}
              >
                <button
                  type="button"
                  className="crop-tool-btn"
                  onClick={() => {
                    setCrop({ x: 0, y: 0, w: 1, h: 1 });
                    setAspectRatio('free');
                  }}
                  title="Görünüş sahəsini tam orijinal ölçüyə qaytar"
                >
                  <RefreshCw size={13} /> Sıfırla (Bütün Şəkil)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Live Catalog Card & Modal Previews */}
          <div className="crop-preview-col" style={{ borderLeftColor: theme.border }}>
            <h4
              style={{
                margin: '0 0 10px 0',
                fontSize: '12.5px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Eye size={15} color={theme.primary} /> Canlı Kataloq Nəticəsi
            </h4>

            {/* Preview 1: Product Card Frame */}
            <div
              className="crop-card-preview-box"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <span className="crop-preview-label">1. Əsas Səhifə & Kataloq Kartı:</span>
              <div
                className="crop-preview-card-frame"
                style={{
                  background: '#ffffff',
                  height: 'auto',
                  aspectRatio: `${CATALOG_CARD_PREVIEW_SIZE.width} / ${CATALOG_CARD_PREVIEW_SIZE.height}`,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <canvas
                  ref={previewCanvasRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'fill',
                  }}
                />
              </div>
            </div>

            {/* Preview 2: Detail Modal Frame */}
            <div
              className="crop-card-preview-box"
              style={{ background: theme.bgSecondary, borderColor: theme.border, marginTop: '8px' }}
            >
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
            <div
              className="crop-info-card"
              style={{
                background: theme.bgSecondary,
                borderColor: theme.border,
                marginTop: '8px',
                fontSize: '11.5px',
              }}
            >
              <div>
                <b>Orijinal Şəkil:</b> {imageSize.width} × {imageSize.height} px
              </div>
              <div>
                <b>Seçilmiş Fokus Sahəsi:</b>{' '}
                <code>
                  {cropPixelDimensions.w} × {cropPixelDimensions.h} px
                </code>
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
              onClick={handleSaveFraming}
              disabled={isSaving}
              style={{
                background: theme.primary,
                color: '#ffffff',
                border: 'none',
                padding: '9px 24px',
                fontWeight: 800,
              }}
              title="Seçilmiş görünüş fokusunu saxlayır və məhsula tətbiq edir"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={15} className="spin-anim" />
                  <span>Düzənlənir & Tətbiq Edilir...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>✓ Düzənləməni Saxla & Məhsula Tətbiq Et</span>
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
