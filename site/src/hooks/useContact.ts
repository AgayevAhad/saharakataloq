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
      try {
        await navigator.clipboard.writeText(value);
        showToast('Link kopyalandı!');
      } catch {
        showToast('Linki kopyalamaq mümkün olmadı.', 'warning');
      }
    },
    [getUrl, showToast]
  );

  return { openWhatsApp, openCall, copyLink };
}
