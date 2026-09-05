import React, { useRef, useEffect, useCallback } from 'react';

interface UseHorizontalScrollOptions {
  activeSelector?: string;
  activeDependency?: any;
}

export function useHorizontalScroll<T extends HTMLElement = HTMLDivElement>(
  options?: UseHorizontalScrollOptions
) {
  const containerRef = useRef<T>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  // Auto-scroll active item into view on dependency change or initial mount
  useEffect(() => {
    if (!options?.activeSelector || !containerRef.current) return;
    const container = containerRef.current;
    const activeEl = container.querySelector(options.activeSelector) as HTMLElement | null;
    if (activeEl) {
      const containerWidth = container.clientWidth;
      const elementLeft = activeEl.offsetLeft;
      const elementWidth = activeEl.clientWidth;
      const targetScrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, [options?.activeDependency, options?.activeSelector]);

  // Center clicked element into full view with adjacent hidden items visible
  const scrollItemIntoView = useCallback((e?: React.MouseEvent | HTMLElement | null) => {
    const el = (e && 'currentTarget' in e ? (e.currentTarget as HTMLElement) : e) as HTMLElement | null;
    if (!el || !containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const elementLeft = el.offsetLeft;
    const elementWidth = el.clientWidth;
    const targetScrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth',
    });
  }, []);

  // Mouse Drag / Grab to Scroll Handlers for Desktop & Trackpads
  const onMouseDown = useCallback((e: React.MouseEvent<T>) => {
    const el = containerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    if (!isDraggingRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const onMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return {
    containerRef,
    scrollItemIntoView,
    hasMoved: () => hasMovedRef.current,
    dragProps: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
  };
}
