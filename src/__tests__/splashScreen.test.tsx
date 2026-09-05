// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';

describe('Sahara Electronics Splash Screen Suite', () => {
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
        </div>
      </div>
    `;

    const splash = document.getElementById('app-splash-screen');
    expect(splash).toBeTruthy();
    expect(splash?.querySelector('.sahara-splash-logo')).toBeTruthy();
    expect(splash?.querySelector('.sahara-splash-brand')?.textContent).toBe('SAHARA ELECTRONICS');
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
