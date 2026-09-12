import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { App } from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export interface RenderContext {
  url: string;
  data?: any;
  title?: string;
  description?: string;
  canonicalUrl?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function render(url: string, context: RenderContext = { url }) {
  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <ErrorBoundary>
        <App initialRoute={url} initialData={context.data} isSsr={true} />
      </ErrorBoundary>
    </React.StrictMode>
  );

  const title = context.title || 'Sahara Electronics — Rəsmi Məişət Texnikası Kataloqu';
  const description =
    context.description ||
    'Sahara Electronics — ARDO, Lotus, Artel və digər rəsmi məişət texnikası brendlərinin tam kataloq və xüsusiyyət platforması.';
  const canonical = context.canonicalUrl || `https://saharaelectronics.az${url.split('?')[0]}`;

  const breadcrumbsList = context.breadcrumbs || [{ label: 'Ana Səhifə', href: '/' }];
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbsList.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://saharaelectronics.az${item.href}` : undefined,
    })),
  };

  const headTags = `
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonical}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:type" content="website">
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  `;

  return {
    html,
    headTags,
    initialData: context.data,
  };
}
