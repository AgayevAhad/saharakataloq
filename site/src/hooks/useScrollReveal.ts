import { useEffect } from 'react';

export const SCROLL_REVEAL_OBSERVER_OPTIONS: IntersectionObserverInit = {
  // Prepare the next row before it reaches the viewport. The old negative
  // bottom margin made users scroll into an empty/blurred row first.
  rootMargin: '120px 0px 180px 0px',
  threshold: 0.01,
};

/**
 * useScrollReveal: Lightweight IntersectionObserver hook that adds
 * `.is-revealed` class to all `.scroll-reveal-item` elements as they scroll into view.
 */
export const useScrollReveal = (deps: any[] = [], selector = '.scroll-reveal-item') => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const revealImmediately = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        el.classList.add('is-revealed');
        el.dataset.revealed = 'true';
        el.style.setProperty('--reveal-order', '0');
      });
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      revealImmediately();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          (entry.target as HTMLElement).dataset.revealed = 'true';
          observer.unobserve(entry.target);
        }
      });
    }, SCROLL_REVEAL_OBSERVER_OPTIONS);

    const watched = new WeakSet<HTMLElement>();
    const watch = (el: HTMLElement) => {
      if (watched.has(el) || el.classList.contains('is-revealed') || el.dataset.revealed === 'true')
        return;
      watched.add(el);
      const group = el.parentElement?.querySelectorAll(':scope > .scroll-reveal-item');
      const rawGroupIndex = group ? Array.from(group).indexOf(el) : 0;
      // Stagger only a compact visual group. Never let a long page generate
      // multi-second delays for items near the end of a product list.
      const revealOrder = Math.min(Math.max(0, rawGroupIndex), 4);
      el.style.setProperty('--reveal-order', String(revealOrder));
      observer.observe(el);
    };

    document.querySelectorAll<HTMLElement>(selector).forEach(watch);
    // Catalog data and route sections may mount after the first effect. Observe
    // only added subtrees, so those sections cannot remain opacity: 0 forever.
    const additions = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.matches(selector)) watch(node);
          node.querySelectorAll<HTMLElement>(selector).forEach(watch);
        }
      }
    });
    additions.observe(document.body, { childList: true, subtree: true });

    return () => {
      additions.disconnect();
      observer.disconnect();
    };
  }, [...deps, selector]);
};
