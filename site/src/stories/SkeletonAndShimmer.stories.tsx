import React from 'react';
import { ShimmerImage } from '../components/ShimmerImage';
import {
  ProductGridSkeleton,
  BrandShowcaseSkeleton,
  BannerHeroSkeleton,
} from '../components/Skeletons';
import { lightTheme } from '../types/theme';

export const ShimmerShowcase = () => (
  <div
    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '24px' }}
  >
    <div style={{ width: '180px', height: '180px', borderRadius: '12px', overflow: 'hidden' }}>
      <ShimmerImage src="/media/ardo_201gc_inox.png" alt="ARDO Model" />
    </div>
    <div style={{ width: '180px', height: '180px', borderRadius: '12px', overflow: 'hidden' }}>
      <ShimmerImage src="/media/SaharaLogo.png" alt="Sahara Logo" />
    </div>
  </div>
);

export const SkeletonShowcase = () => (
  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <BrandShowcaseSkeleton theme={lightTheme} />
    <BannerHeroSkeleton theme={lightTheme} />
    <ProductGridSkeleton count={4} theme={lightTheme} />
  </div>
);
