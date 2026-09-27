import './init-theme-splash';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App, getAppMode } from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './styles/index.css';

declare global {
  interface Window {
    __SAHARA_INITIAL_DATA__?: any;
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  let initialData = typeof window !== 'undefined' ? window.__SAHARA_INITIAL_DATA__ : undefined;
  try {
    const dataScript = document.getElementById('__SAHARA_DATA__');
    if (dataScript && dataScript.textContent) {
      initialData = JSON.parse(dataScript.textContent);
    }
  } catch {}

  const currentMode = typeof window !== 'undefined' ? getAppMode() : 'site';
  const isHydratable =
    rootElement.hasChildNodes() &&
    rootElement.innerHTML.trim().length > 0 &&
    currentMode === 'site' &&
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/AdministratorNT');

  const appElement = (
    <React.StrictMode>
      <ErrorBoundary>
        <App initialData={initialData} />
      </ErrorBoundary>
    </React.StrictMode>
  );

  if (isHydratable) {
    ReactDOM.hydrateRoot(rootElement, appElement);
  } else {
    rootElement.innerHTML = '';
    ReactDOM.createRoot(rootElement).render(appElement);
  }
}
