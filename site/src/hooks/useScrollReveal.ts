import { useEffect } from 'react';

/**
 * useScrollReveal: Lightweight IntersectionObserver hook that adds
 * `.is-revealed` class to all `.scroll-reveal-item` elements as they scroll into view.
 */
export const useScrollReveal = (deps: any[] = []) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      // Fallback if IntersectionObserver is not supported: reveal all immediately
      document.querySelectorAll('.scroll-reveal-item').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.1,
      }
    );

    const elements = document.querySelectorAll('.scroll-reveal-item:not(.is-revealed)');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, deps);
};
