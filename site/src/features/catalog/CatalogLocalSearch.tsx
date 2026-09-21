import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Clock3, Search, X } from 'lucide-react';
import { Brand, CatalogCategory, Product } from '../../types/product';
import { ThemeColors } from '../../types/theme';

const HISTORY_KEY = 'sahara_catalog_search_history_v1';
const HISTORY_LIMIT = 8;

interface CatalogLocalSearchProps {
  value: string;
  onChange: (value: string) => void;
  products: Product[];
  categories: CatalogCategory[];
  brands: Brand[];
  theme: ThemeColors;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase('az');

export const CatalogLocalSearch: React.FC<CatalogLocalSearchProps> = ({
  value,
  onChange,
  products,
  categories,
  brands,
  theme,
}) => {
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (Array.isArray(stored)) {
        setHistory(
          stored.filter((item): item is string => typeof item === 'string').slice(0, HISTORY_LIMIT)
        );
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!focused) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setFocused(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [focused]);

  const suggestions = useMemo(() => {
    const query = normalize(value);
    if (!query) return history.map((label) => ({ label, type: 'history' as const }));

    const matches = [
      ...products
        .filter((product) =>
          [product.title, product.code, product.modelCode]
            .filter(Boolean)
            .some((field) => normalize(String(field)).includes(query))
        )
        .map((product) => ({ label: product.title, type: 'product' as const })),
      ...categories
        .filter((category) => normalize(category.name).includes(query))
        .map((category) => ({ label: category.name, type: 'category' as const })),
      ...brands
        .filter((brand) => normalize(brand.name).includes(query))
        .map((brand) => ({ label: brand.name, type: 'brand' as const })),
    ];
    const seen = new Set<string>();
    return matches
      .filter((item) => {
        const key = normalize(item.label);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [value, products, categories, brands, history]);

  const remember = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory((current) => {
      const next = [
        trimmed,
        ...current.filter((item) => normalize(item) !== normalize(trimmed)),
      ].slice(0, HISTORY_LIMIT);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const select = (term: string) => {
    onChange(term);
    remember(term);
    setFocused(false);
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {}
  };

  return (
    <div className="catalog-page-search" ref={rootRef}>
      <Search size={16} className="catalog-local-search-icon" aria-hidden="true" />
      <input
        type="search"
        aria-label="Kataloq daxilində axtarış"
        aria-autocomplete="list"
        aria-expanded={focused && suggestions.length > 0}
        autoComplete="off"
        placeholder="Model və ya xüsusiyyət axtar..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            remember(value);
            setFocused(false);
          } else if (event.key === 'Escape') {
            setFocused(false);
          }
        }}
        style={{
          borderColor: focused ? theme.primary : theme.border,
          backgroundColor: theme.mode === 'dark' ? theme.bgCard : '#ffffff',
          color: theme.text,
        }}
      />
      {value && (
        <button
          type="button"
          className="catalog-local-search-clear"
          aria-label="Kataloq axtarışını təmizlə"
          onClick={() => onChange('')}
        >
          <X size={15} />
        </button>
      )}
      {focused && suggestions.length > 0 && (
        <div
          className="catalog-local-search-suggestions"
          role="listbox"
          aria-label="Axtarış təklifləri"
        >
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.type}-${suggestion.label}`}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(suggestion.label)}
            >
              {suggestion.type === 'history' ? <Clock3 size={15} /> : <Search size={15} />}
              <span>{suggestion.label}</span>
            </button>
          ))}
          {!value && history.length > 0 && (
            <button
              type="button"
              className="catalog-local-search-history-clear"
              onClick={clearHistory}
            >
              Axtarış tarixçəsini sil
            </button>
          )}
        </div>
      )}
    </div>
  );
};
