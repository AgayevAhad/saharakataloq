import { useCallback, useEffect, useRef } from 'react';

/** Gives the mobile search panel its own Back entry without changing the route. */
export function useMobileSearchHistory(isOpen: boolean, onDismiss: () => void) {
  const entryIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !isOpen ||
      (typeof window.matchMedia === 'function'
        ? !window.matchMedia('(max-width: 768px)').matches
        : window.innerWidth > 768)
    )
      return;
    const entryId = `sahara-search-${Date.now()}`;
    entryIdRef.current = entryId;
    window.history.pushState(
      { ...(window.history.state || {}), saharaSearchEntry: entryId },
      '',
      window.location.href
    );

    const onPopState = () => {
      entryIdRef.current = null;
      onDismiss();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isOpen, onDismiss]);

  return useCallback(
    (afterClose?: () => void) => {
      const ownsEntry =
        entryIdRef.current && window.history.state?.saharaSearchEntry === entryIdRef.current;
      entryIdRef.current = null;
      onDismiss();
      if (ownsEntry) {
        if (afterClose) window.addEventListener('popstate', afterClose, { once: true });
        window.history.back();
      } else {
        afterClose?.();
      }
    },
    [onDismiss]
  );
}
