import React, { useMemo, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { CatalogData, Product } from '../types/product';
import { ThemeColors } from '../types/theme';
import { BrandShowcase } from './BrandShowcase';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';

export const AdminCatalogPreview: React.FC<{ catalog: CatalogData; theme: ThemeColors; onClose: () => void }> = ({ catalog, theme, onClose }) => {
  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [selected, setSelected] = useState<Product | null>(null);
  const products = useMemo(() => catalog.products.filter((item) => (category === 'all' || item.category === category) && (brand === 'all' || item.brandId === brand)), [catalog.products, category, brand]);
  return <div className="admin-preview-overlay" style={{ background: theme.bg }}>
    <header style={{ background: theme.bgCard, borderColor: theme.border }}><div><span><Eye size={15} /> QARALAMA ÖNİZLƏMƏSİ</span><h2 style={{ color: theme.text }}>Public kataloqda belə görünəcək</h2><p style={{ color: theme.textMuted }}>Bu görünüş hələ müştərilərə göstərilmir.</p></div><button onClick={onClose} style={{ color: theme.text }}><X /> Bağla</button></header>
    <main>
      <BrandShowcase brands={catalog.brands} products={catalog.products} theme={theme} onSelect={setBrand} />
      <div className="preview-filters no-scrollbar">{[{ id: 'all', name: 'Bütün məhsullar' }, ...catalog.categories].map((item) => <button key={item.id} className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)} style={{ '--preview-primary': theme.primary, borderColor: theme.border, color: category === item.id ? '#fff' : theme.textSecondary, background: category === item.id ? theme.primary : theme.bgCard } as React.CSSProperties}>{item.name}</button>)}</div>
      <section className="product-grid-container">{products.map((product) => { const productBrand = catalog.brands.find((item) => item.id === product.brandId); return <ProductCard key={product.id} product={product} brandName={productBrand?.name} brandOrigin={productBrand?.originCountry ? `${productBrand.originCountry} brendi` : ''} theme={theme} onSelect={setSelected} onShare={() => {}} onWhatsApp={() => {}} onCall={() => {}} onCopyLink={() => {}} />; })}</section>
    </main>
    <ProductDetailModal product={selected} brand={catalog.brands.find((item) => item.id === selected?.brandId)} theme={theme} visible={!!selected} onClose={() => setSelected(null)} onShare={() => {}} onWhatsApp={() => {}} onCall={() => {}} onCopyLink={() => {}} />
  </div>;
};
