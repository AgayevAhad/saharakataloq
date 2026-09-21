import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

type FocusCandidate = {
  onFocusChange: (focused: boolean) => void;
  visible: boolean;
  distanceFromCenter: number;
};

const candidates = new Map<Element, FocusCandidate>();
let observer: IntersectionObserver | null = null;
let focusedElement: Element | null = null;

const isMobileLayout = () =>
  typeof window !== 'undefined' &&
  (typeof window.matchMedia === 'function'
    ? window.matchMedia('(max-width: 768px)').matches
    : window.innerWidth <= 768);

function chooseFocusedCard() {
  let next: Element | null = null;
  let nearest = Infinity;

  if (isMobileLayout()) {
    candidates.forEach((candidate, element) => {
      if (candidate.visible && candidate.distanceFromCenter < nearest) {
        next = element;
        nearest = candidate.distanceFromCenter;
      }
    });
  }

  if (focusedElement === next) return;
  candidates.get(focusedElement as Element)?.onFocusChange(false);
  focusedElement = next;
  candidates.get(next as Element)?.onFocusChange(true);
}

function getObserver() {
  if (observer || typeof IntersectionObserver === 'undefined') return observer;

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const candidate = candidates.get(entry.target);
        if (!candidate) return;
        candidate.visible = entry.isIntersecting;
        candidate.distanceFromCenter = Math.abs(
          (entry.boundingClientRect.top + entry.boundingClientRect.bottom) / 2 -
            (entry.rootBounds
              ? (entry.rootBounds.top + entry.rootBounds.bottom) / 2
              : window.innerHeight / 2)
        );
      });
      chooseFocusedCard();
    },
    { rootMargin: '-47% 0px -47% 0px', threshold: 0.01 }
  );
  window.addEventListener('resize', chooseFocusedCard, { passive: true });
  return observer;
}

/** One observer and one active card for the catalog and home product grids. */
export function useCenteredMobileCard(ref: RefObject<HTMLElement>) {
  const [isMobileFocused, setIsMobileFocused] = useState(false);

  useEffect(() => {
    const element = ref.current;
    const currentObserver = getObserver();
    if (!element || !currentObserver) return;

    candidates.set(element, {
      onFocusChange: setIsMobileFocused,
      visible: false,
      distanceFromCenter: Infinity,
    });
    currentObserver.observe(element);

    return () => {
      currentObserver.unobserve?.(element);
      candidates.delete(element);
      if (focusedElement === element) focusedElement = null;
      chooseFocusedCard();
      if (candidates.size === 0) {
        currentObserver.disconnect();
        observer = null;
        window.removeEventListener('resize', chooseFocusedCard);
      }
    };
  }, [ref]);

  return isMobileFocused;
}
