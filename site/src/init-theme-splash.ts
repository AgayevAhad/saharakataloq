// Immediate theme synchronization before first render to prevent layout flashes
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('sahara_theme_mode');
    const theme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.add('theme-' + theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#0d0f14' : '#f8fafc');
    }
  } catch {
    // Ignore localStorage access errors
  }
}

// Fallback timer to guarantee splash dismissal even if network/rendering is slow
if (typeof window !== 'undefined') {
  const dismissSplashFallback = () => {
    if ((window as any).__hold_splash_for_test) return;
    const splash = document.getElementById('app-splash-screen');
    if (splash && !splash.classList.contains('splash-fade-out')) {
      splash.classList.add('splash-fade-out');
      setTimeout(() => {
        if (splash.parentNode) splash.parentNode.removeChild(splash);
      }, 550);
    }
  };

  if (document.readyState === 'complete') {
    setTimeout(dismissSplashFallback, 3000);
  } else {
    window.addEventListener('load', () => {
      setTimeout(dismissSplashFallback, 3000);
    });
  }
}
