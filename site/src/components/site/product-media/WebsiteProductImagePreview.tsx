import React, { useEffect, useState } from 'react';
import { ShimmerImage } from '../../ShimmerImage';
import { WebsiteProductMedia } from './WebsiteProductMedia';
import {
  WEBSITE_PRODUCT_IMAGE_PREVIEW_MANIFEST_URL,
  WebsiteProductImageManifest,
} from './websiteProductImageManifest';

interface WebsiteProductImagePreviewProps {
  themeMode: 'light' | 'dark';
}

export const WebsiteProductImagePreview: React.FC<WebsiteProductImagePreviewProps> = ({
  themeMode,
}) => {
  const [manifest, setManifest] = useState<WebsiteProductImageManifest | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(WEBSITE_PRODUCT_IMAGE_PREVIEW_MANIFEST_URL, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
        return response.json();
      })
      .then((data: WebsiteProductImageManifest) => setManifest(data))
      .catch((reason) => {
        if (reason?.name !== 'AbortError') {
          setError('Test manifesti yüklənmədi. Əvvəl media:enhance:test əmrini başladın.');
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <section
      className="site-product-media-preview"
      data-website-image-enhancement-preview
      aria-labelledby="site-product-media-preview-title"
    >
      <div className="site-product-media-preview__header">
        <div>
          <span className="site-product-media-preview__eyebrow">Website-only test rejimi</span>
          <h1 id="site-product-media-preview-title">Məhsul şəkli müqayisəsi</h1>
          <p>Solda toxunulmamış original, sağda isə review gözləyən şəffaf variant göstərilir.</p>
        </div>
        {manifest && (
          <span className="site-product-media-preview__summary">
            {manifest.successCount}/{manifest.entryCount} emal olundu
          </span>
        )}
      </div>

      {error && <div className="site-product-media-preview__notice">{error}</div>}
      {!manifest && !error && (
        <div className="site-product-media-preview__notice" role="status">
          Test nəticələri yüklənir…
        </div>
      )}

      <div className="site-product-media-preview__grid">
        {manifest?.entries.map((entry) => (
          <article className="site-product-media-preview__card" key={entry.productId}>
            <div className="site-product-media-preview__title-row">
              <div>
                <strong>{entry.modelCode}</strong>
                <span>{entry.label}</span>
              </div>
              <span className={`site-product-media-preview__status is-${entry.reviewStatus}`}>
                {entry.reviewStatus}
              </span>
            </div>

            <div className="site-product-media-preview__comparison">
              <figure>
                <div className="site-product-media-preview__original">
                  <ShimmerImage src={entry.sourceImage} alt={`${entry.modelCode} original`} />
                </div>
                <figcaption>Original</figcaption>
              </figure>
              <figure>
                <WebsiteProductMedia
                  originalSrc={entry.sourceImage}
                  alt={`${entry.modelCode} şəffaf variant`}
                  metadata={entry}
                  themeMode={themeMode}
                  enabled
                  allowUnreviewed
                />
                <figcaption>Transparent · {entry.productTone}</figcaption>
              </figure>
            </div>

            {!entry.processingSucceeded && (
              <div className="site-product-media-preview__error">Emal uğursuz oldu.</div>
            )}
            {entry.quality?.qualityWarnings && entry.quality.qualityWarnings.length > 0 && (
              <div className="site-product-media-preview__warning">
                Avtomatik yoxlama: {entry.quality.qualityWarnings.join(', ')}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};

export default WebsiteProductImagePreview;
