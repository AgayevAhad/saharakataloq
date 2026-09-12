/**
 * Sahara Electronics — Background Isolation Manager
 * Applies `inert` and `aria-hidden="true"` to background content when modals or drawers open,
 * handles nested overlays seamlessly, and restores previous states upon dismissal.
 */

interface OverlayEntry {
  id: string;
  element: HTMLElement;
}

const overlayStack: OverlayEntry[] = [];
let savedBackgroundState: Map<HTMLElement, { inert: boolean; ariaHidden: string | null }> | null =
  null;

function getBackgroundSiblings(activeBackdrop: HTMLElement): HTMLElement[] {
  const siblings = new Set<HTMLElement>();
  let current: HTMLElement | null = activeBackdrop;

  while (current && current !== document.body && current !== document.documentElement) {
    const parent: HTMLElement | null = current.parentElement;
    if (parent) {
      Array.from(parent.children).forEach((child) => {
        if (
          child instanceof HTMLElement &&
          child !== current &&
          !child.contains(activeBackdrop) &&
          !activeBackdrop.contains(child)
        ) {
          siblings.add(child);
        }
      });
    }
    current = parent;
  }

  return Array.from(siblings);
}

export function pushOverlay(id: string, backdropElement: HTMLElement) {
  if (overlayStack.length === 0) {
    // First overlay opening — save background state
    savedBackgroundState = new Map();
    const backgroundSiblings = getBackgroundSiblings(backdropElement);

    backgroundSiblings.forEach((el) => {
      savedBackgroundState?.set(el, {
        inert: (el as HTMLElement & { inert?: boolean }).inert || false,
        ariaHidden: el.getAttribute('aria-hidden'),
      });

      // Set background as inert and hidden from screen readers
      (el as HTMLElement & { inert?: boolean }).inert = true;
      el.setAttribute('aria-hidden', 'true');
    });
  } else {
    // Nested overlay: isolate the previous overlay underneath
    const previous = overlayStack[overlayStack.length - 1];
    if (previous && previous.element) {
      (previous.element as HTMLElement & { inert?: boolean }).inert = true;
      previous.element.setAttribute('aria-hidden', 'true');
    }
  }

  overlayStack.push({ id, element: backdropElement });
}

export function popOverlay(id: string) {
  const index = overlayStack.findIndex((entry) => entry.id === id);
  if (index === -1) return;

  overlayStack.splice(index, 1);

  if (overlayStack.length === 0) {
    // No more overlays: restore original background state
    if (savedBackgroundState) {
      savedBackgroundState.forEach((state, el) => {
        if (document.body.contains(el)) {
          (el as HTMLElement & { inert?: boolean }).inert = state.inert;
          if (state.ariaHidden === null) {
            el.removeAttribute('aria-hidden');
          } else {
            el.setAttribute('aria-hidden', state.ariaHidden);
          }
        }
      });
      savedBackgroundState = null;
    }
  } else {
    // Restore the top overlay that is now active
    const currentTop = overlayStack[overlayStack.length - 1];
    if (currentTop && currentTop.element) {
      (currentTop.element as HTMLElement & { inert?: boolean }).inert = false;
      currentTop.element.removeAttribute('aria-hidden');
    }
  }
}

export function isTopOverlay(id: string): boolean {
  if (overlayStack.length === 0) return true;
  return overlayStack[overlayStack.length - 1].id === id;
}

export function getOverlayStackCount(): number {
  return overlayStack.length;
}
