import { useCallback } from 'react';
import { Brand, CatalogSettings, Product } from '../types/product';
import { phoneHref, whatsappHref } from '../utils/contact';
import { catalogApi } from '../services/catalogApi';

interface UseContactOptions {
  settings: CatalogSettings;
  brands?: Brand[];
  getProductUrl?: (product: Product) => string;
  showToast: (message: string, type?: 'success' | 'warning') => void;
}

export function useContact({
  settings,
  brands = [],
  getProductUrl,
  showToast,
}: UseContactOptions) {
  const getUrl = useCallback(
    (product: Product) => {
      if (getProductUrl) return getProductUrl(product);
      if (typeof window !== 'undefined') {
        return `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
      }
      return `?product=${encodeURIComponent(product.id)}`;
    },
    [getProductUrl]
  );

  const openWhatsApp = useCallback(
    (product?: Product | null) => {
      if (product) {
        const brand = brands.find((item) => item.id === product.brandId)?.name || '';
        const brandLine = brand ? `\n🏢 Brend: ${brand}` : '';
        const categoryLine = product.categoryName ? `\n🗂 Kateqoriya: ${product.categoryName}` : '';
        const text = `Salam, Sahara Electronics! Bu məhsul haqqında məlumat almaq istəyirəm:\n\n📌 Model: ${product.code}\n🏷 Məhsul: ${product.title}${brandLine}${categoryLine}\n\n🔗 ${getUrl(product)}`;
        const href = whatsappHref(settings?.whatsappNumber, text);
        if (!href) return showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.', 'warning');
        catalogApi.track('contact_whatsapp', product.id);
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        const href = whatsappHref(
          settings?.whatsappNumber,
          'Salam, Sahara Electronics! Saytınızdan yazıram, məsləhət almaq istərdim.'
        );
        if (!href) return showToast('WhatsApp nömrəsi admin paneldə hələ əlavə edilməyib.', 'warning');
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    },
    [brands, getUrl, settings?.whatsappNumber, showToast]
  );

  const openCall = useCallback(
    (productOrPhone?: Product | string) => {
      const phone =
        typeof productOrPhone === 'string'
          ? productOrPhone
          : settings?.phoneNumber || settings?.phoneNumbers?.[0];
      const href = phoneHref(phone);
      if (!href) return showToast('Zəng nömrəsi admin paneldə hələ əlavə edilməyib.', 'warning');
      if (typeof productOrPhone !== 'string' && productOrPhone) {
        catalogApi.track('contact_call', productOrPhone.id);
      }
      window.open(href, '_self');
    },
    [settings?.phoneNumber, settings?.phoneNumbers, showToast]
  );

  const copyLink = useCallback(
    async (target?: Product | string) => {
      const value =
        typeof target === 'string'
          ? target
          : target
            ? getUrl(target)
            : typeof window !== 'undefined'
              ? window.location.href
              : '';
      if (!value) return;

      let copied = false;

      // 1. Try modern Async Clipboard API
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        try {
          await navigator.clipboard.writeText(value);
          copied = true;
        } catch {
          copied = false;
        }
      }

      // 2. Cross-platform mobile fallback (iOS Safari, Android Chrome, webviews)
      if (!copied && typeof document !== 'undefined') {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = value;
          textArea.setAttribute('readonly', '');
          textArea.style.position = 'fixed';
          textArea.style.top = '0';
          textArea.style.left = '0';
          textArea.style.width = '2em';
          textArea.style.height = '2em';
          textArea.style.padding = '0';
          textArea.style.border = 'none';
          textArea.style.outline = 'none';
          textArea.style.boxShadow = 'none';
          textArea.style.background = 'transparent';
          textArea.style.fontSize = '16px'; // Prevents auto-zoom in iOS Safari
          textArea.style.opacity = '0';
          textArea.style.zIndex = '-1';
          document.body.appendChild(textArea);

          textArea.focus();
          textArea.select();
          textArea.setSelectionRange(0, value.length);

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) {
            copied = true;
          }
        } catch {
          copied = false;
        }
      }

      if (copied) {
        showToast('Link kopyalandı!');
      } else {
        showToast('Linki kopyalamaq mümkün olmadı.', 'warning');
      }
    },
    [getUrl, showToast]
  );

  return { openWhatsApp, openCall, copyLink };
}
