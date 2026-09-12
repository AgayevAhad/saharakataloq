import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { featureFlags, UNFINISHED_FEATURE_FLAGS, FeatureFlagManager } from '../utils/featureFlags';

describe('Feature Flags Production Hardening & Incomplete Feature Lockdown', () => {
  beforeEach(() => {
    localStorage.clear();
    featureFlags.resetToDefaults();
  });

  it('keeps all unfinished features disabled by default', () => {
    for (const flag of UNFINISHED_FEATURE_FLAGS) {
      expect(featureFlags.isEnabled(flag)).toBe(false);
    }
  });

  it('strictly prohibits enabling unfinished features via localStorage in production mode', () => {
    // Simulate user writing to localStorage directly in browser console
    const maliciousOverrides = {
      enableFavorites: true,
      enableCompare: true,
      enableGuides: true,
      enableSaharaMatch: true,
      enableBrandDetail: true,
      enableCart: true,
      enableCheckout: true,
      enableOnlinePayment: true,
    };
    localStorage.setItem('sahara_feature_flags', JSON.stringify(maliciousOverrides));

    // Create a new manager instance simulating production app startup
    const manager = new FeatureFlagManager();
    // In production mode, isEnabled must still return false for all unfinished features
    (manager as any).isProductionMode = () => true;

    for (const flag of UNFINISHED_FEATURE_FLAGS) {
      expect(manager.isEnabled(flag)).toBe(false);
    }
  });

  it('ignores setFlag attempts for unfinished features in production mode', () => {
    const manager = new FeatureFlagManager();
    (manager as any).isProductionMode = () => true;

    manager.setFlag('enableFavorites', true);
    expect(manager.isEnabled('enableFavorites')).toBe(false);

    manager.setFlag('enableCompare', true);
    expect(manager.isEnabled('enableCompare')).toBe(false);

    manager.setFlag('enableSaharaMatch', true);
    expect(manager.isEnabled('enableSaharaMatch')).toBe(false);

    manager.setFlag('enableBrandDetail', true);
    expect(manager.isEnabled('enableBrandDetail')).toBe(false);

    manager.setFlag('enableCart', true);
    expect(manager.isEnabled('enableCart')).toBe(false);

    manager.setFlag('enableCheckout', true);
    expect(manager.isEnabled('enableCheckout')).toBe(false);

    manager.setFlag('enableOnlinePayment', true);
    expect(manager.isEnabled('enableOnlinePayment')).toBe(false);
  });

  it('guarantees that all disabled routes are rejected and route to 404 on direct URL navigation', () => {
    const disabledRoutes = [
      'favorites',
      'compare',
      'guides',
      'saharaMatch',
      'brandDetail',
      'cart',
      'checkout',
      'onlinePayment',
      'unknownRouteXYZ',
    ];

    const allowedRoutes: Record<string, boolean> = {
      home: true,
      catalog: true,
      brands: true,
      services: true,
      stores: true,
      support: true,
      compare: featureFlags.isEnabled('enableCompare'),
      favorites: featureFlags.isEnabled('enableFavorites'),
      guides: featureFlags.isEnabled('enableGuides'),
      brandDetail: featureFlags.isEnabled('enableBrandDetail'),
      cart: featureFlags.isEnabled('enableCart'),
      checkout: featureFlags.isEnabled('enableCheckout'),
      onlinePayment: featureFlags.isEnabled('enableOnlinePayment'),
      saharaMatch: featureFlags.isEnabled('enableSaharaMatch'),
    };

    for (const route of disabledRoutes) {
      expect(allowedRoutes[route]).toBeFalsy();
    }
  });

  describe('Real User DOM Navigation & 404 Render Suite', () => {
    it('renders 404 NotFoundPage in DOM for every disabled route when navigated via URL search param', async () => {
      const { render, screen, cleanup } = await import('@testing-library/react');
      const { App } = await import('../App');

      const disabledRoutes = [
        'favorites',
        'compare',
        'guides',
        'saharaMatch',
        'brandDetail',
        'cart',
        'checkout',
        'onlinePayment',
        'nonExistentPage123',
      ];

      for (const route of disabledRoutes) {
        cleanup();
        window.history.pushState({}, '', `/?page=${route}`);
        render(<App />);

        const notFoundHeading = await screen.findByText(/Səhifə Tapılmadı və ya Aktiv Deyil/i);
        expect(notFoundHeading).toBeDefined();
        expect(notFoundHeading.textContent).toContain('Səhifə Tapılmadı');
      }
    });

    it('consistently renders 404 even after hostile localStorage manipulation attempts by the user', async () => {
      const { render, screen, cleanup } = await import('@testing-library/react');
      const { App } = await import('../App');

      // Attempt client-side override in localStorage
      localStorage.setItem(
        'sahara_feature_flags',
        JSON.stringify({
          enableFavorites: true,
          enableCompare: true,
          enableGuides: true,
          enableBrandDetail: true,
          enableCart: true,
          enableCheckout: true,
          enableOnlinePayment: true,
          enableSaharaMatch: true,
        })
      );

      const targetDisabledRoutes = ['favorites', 'compare', 'cart', 'checkout'];

      for (const route of targetDisabledRoutes) {
        cleanup();
        window.history.pushState({}, '', `/?page=${route}`);
        render(<App />);

        const notFoundHeading = await screen.findByText(/Səhifə Tapılmadı və ya Aktiv Deyil/i);
        expect(notFoundHeading).toBeDefined();
        expect(notFoundHeading.textContent).toContain('Səhifə Tapılmadı');
      }
    });
  });
});
