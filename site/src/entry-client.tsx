import './init-theme-splash';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

declare global {
  interface Window {
    __SAHARA_INITIAL_DATA__?: any;
  }
}

const rootElement = document.getElementById('root');

if (rootElement) {
  let initialData = window.__SAHARA_INITIAL_DATA__;
  try {
    const dataScript = document.getElementById('__SAHARA_DATA__');
    if (dataScript && dataScript.textContent) {
      initialData = JSON.parse(dataScript.textContent);
    }
  } catch {}

  const isHydratable = rootElement.hasChildNodes() && rootElement.innerHTML.trim().length > 0;

  const appElement = (
    <React.StrictMode>
      <ErrorBoundary>
        <App initialData={initialData} />
      </ErrorBoundary>
    </React.StrictMode>
  );

  if (isHydratable && !window.location.pathname.startsWith('/AdministratorNT')) {
    ReactDOM.hydrateRoot(rootElement, appElement);
  } else {
    ReactDOM.createRoot(rootElement).render(appElement);
  }
}
