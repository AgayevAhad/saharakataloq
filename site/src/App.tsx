import React from 'react';
import { BrowserRouter, useInRouterContext } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { SiteApp } from './apps/SiteApp';
import { CatalogApp } from './apps/CatalogApp';
import { RouteName, resolveRouteFromPath, ROUTE_TO_PATH } from './types/routes';

export type { RouteName };
export { resolveRouteFromPath, ROUTE_TO_PATH };

export interface AppProps {
  initialRoute?: string;
  initialData?: any;
  isSsr?: boolean;
}

export const getAppMode = (): 'catalog' | 'site' => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode') || params.get('app_mode');
    if (modeParam) {
      const lower = modeParam.toLowerCase();
      if (lower.startsWith('catalog') || lower.includes('catalog')) {
        return 'catalog';
      }
      if (lower.startsWith('site') || lower.includes('site')) {
        return 'site';
      }
    }

    const fullSearch = window.location.search.toLowerCase();
    const fullPath = window.location.pathname.toLowerCase();
    const fullHash = window.location.hash.toLowerCase();
    if (
      fullSearch.includes('mode=catalog') ||
      fullPath.includes('mode=catalog') ||
      fullSearch.includes('catalog') ||
      fullPath.startsWith('/catalog') ||
      fullHash.includes('catalog')
    ) {
      return 'catalog';
    }
  }

  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_APP_MODE === 'catalog') {
      return 'catalog';
    }
    if (import.meta.env.VITE_APP_MODE === 'site') {
      return 'site';
    }
  }

  return 'site';
};

const AppContent: React.FC<AppProps> = (props) => {
  const mode = getAppMode();

  if (mode === 'catalog') {
    return <CatalogApp {...props} />;
  }

  return <SiteApp {...props} />;
};

const RouterWrapper: React.FC<{
  initialRoute?: string;
  isSsr?: boolean;
  children: React.ReactNode;
}> = ({ initialRoute, isSsr, children }) => {
  try {
    const inRouter = useInRouterContext();
    if (inRouter) {
      return <>{children}</>;
    }
  } catch {}

  if (isSsr || typeof window === 'undefined') {
    return <StaticRouter location={initialRoute || '/'}>{children}</StaticRouter>;
  }

  return <BrowserRouter>{children}</BrowserRouter>;
};

export const App: React.FC<AppProps> = (props) => {
  return (
    <RouterWrapper initialRoute={props.initialRoute} isSsr={props.isSsr}>
      <AppContent {...props} />
    </RouterWrapper>
  );
};

export default App;
