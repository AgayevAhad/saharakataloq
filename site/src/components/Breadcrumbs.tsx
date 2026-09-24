import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  const allItems: BreadcrumbItem[] = [
    { label: 'Ana Səhifə', href: '/' },
    ...items.filter((it) => it.label && it.label !== 'Ana Səhifə'),
  ];

  // Generate JSON-LD BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://saharaelectronics.az${item.href}` : undefined,
    })),
  };

  return (
    <nav
      aria-label="Çörək qırıntıları naviqasiyası"
      className={`breadcrumbs-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.35rem',
        fontSize: '0.8125rem',
        color: 'var(--text-muted, #64748b)',
        padding: '0.75rem 0',
        minHeight: '2.5rem',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.35rem',
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isHome = index === 0;

          return (
            <li
              key={`${item.label}-${index}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              {index > 0 && (
                <ChevronRight
                  size={13}
                  aria-hidden="true"
                  style={{ color: 'var(--text-muted, #94a3b8)', flexShrink: 0 }}
                />
              )}
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="breadcrumb-current"
                  style={{
                    color: isLast ? 'var(--text, #0f172a)' : 'inherit',
                    fontWeight: isLast ? 600 : 400,
                    wordBreak: 'break-word',
                  }}
                >
                  {isHome && (
                    <Home
                      size={13}
                      aria-hidden="true"
                      style={{ marginRight: '0.25rem', verticalAlign: '-1px' }}
                    />
                  )}
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  onClick={(e) => {
                    if (item.href?.startsWith('/') && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                      e.preventDefault();
                      window.history.pushState({}, '', item.href);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                  className="breadcrumb-link"
                >
                  {isHome && (
                    <Home
                      size={13}
                      aria-hidden="true"
                      style={{ marginRight: '0.25rem', verticalAlign: '-1px' }}
                    />
                  )}
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
