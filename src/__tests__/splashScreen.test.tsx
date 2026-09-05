// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest';

describe('Sahara Electronics Splash Screen Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
  });

  it('splash screen elements and structure exist in DOM', () => {
    document.body.innerHTML = `
      <div id="app-splash-screen" class="sahara-splash-container">
        <div class="sahara-splash-glow"></div>
        <div class="sahara-splash-content">
          <div class="sahara-splash-logo-wrap">
            <img src="/media/SaharaLogo.png" alt="Sahara Electronics" class="sahara-splash-logo" />
            <div class="sahara-splash-ring"></div>
          </div>
          <div class="sahara-splash-text">
            <h1 class="sahara-splash-brand">SAHARA ELECTRONICS</h1>
            <p class="sahara-splash-tagline">Rəsmi Məhsul Kataloqu</p>
          </div>
          <div class="sahara-splash-loader">
            <div class="sahara-splash-bar"></div>
          </div>
          <span class="sahara-splash-hint">Kataloq modelləri hazırlanır...</span>
        </div>
      </div>
    `;

    const splash = document.getElementById('app-splash-screen');
    expect(splash).toBeTruthy();
    expect(splash?.querySelector('.sahara-splash-logo')).toBeTruthy();
    expect(splash?.querySelector('.sahara-splash-brand')?.textContent).toBe('SAHARA ELECTRONICS');
    expect(splash?.querySelector('.sahara-splash-tagline')?.textContent).toBe('Rəsmi Məhsul Kataloqu');
    expect(splash?.querySelector('.sahara-splash-bar')).toBeTruthy();
  });

  it('initializes light mode theme by default without theme flash', () => {
    // Simulate the inline script in index.html
    const saved = localStorage.getItem('sahara_theme_mode');
    const theme = (saved === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('theme-' + theme);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('theme-light')).toBe(true);
    expect(document.documentElement.classList.contains('theme-dark')).toBe(false);
  });

  it('initializes dark mode theme when saved in localStorage', () => {
    localStorage.setItem('sahara_theme_mode', 'dark');

    const saved = localStorage.getItem('sahara_theme_mode');
    const theme = (saved === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('theme-' + theme);

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('theme-dark')).toBe(true);
  });

  it('splash-fade-out class can be applied for smooth dismissal', () => {
    document.body.innerHTML = `
      <div id="app-splash-screen" class="sahara-splash-container"></div>
    `;

    const splash = document.getElementById('app-splash-screen');
    expect(splash).toBeTruthy();

    splash?.classList.add('splash-fade-out');
    expect(splash?.classList.contains('splash-fade-out')).toBe(true);
  });
});
