/** A short, decorative confirmation that never blocks the actual state update. */
const animateProductToHeaderTarget = (
  source: HTMLElement,
  imageUrl: string | undefined,
  targetSelector: string
) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = [...document.querySelectorAll<HTMLElement>(targetSelector)].find((item) => {
    const rect = item.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
  if (!target) return;

  const media =
    source
      .closest('.product-card, .featured-product-card')
      ?.querySelector<HTMLElement>('.product-card-media, .featured-product-img-box') ||
    document.querySelector<HTMLElement>('.product-detail-main-stage');
  const from = (media || source).getBoundingClientRect();
  const to = target.getBoundingClientRect();
  const size = 64;
  const flyer = document.createElement('div');
  flyer.className = 'cart-flight-item';
  flyer.setAttribute('aria-hidden', 'true');
  flyer.style.left = `${from.left + from.width / 2 - size / 2}px`;
  flyer.style.top = `${from.top + from.height / 2 - size / 2}px`;
  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = '';
    flyer.append(image);
  } else {
    flyer.textContent = 'S';
  }
  document.body.append(flyer);

  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const animation = flyer.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
      {
        transform: `translate(${dx * 0.55}px, ${dy * 0.3 - 55}px) scale(.76)`,
        opacity: 1,
        offset: 0.55,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(.15)`, opacity: 0.25, offset: 1 },
    ],
    { duration: 680, easing: 'cubic-bezier(.22,.68,.13,1)', fill: 'forwards' }
  );
  animation.finished
    .catch(() => undefined)
    .finally(() => {
      flyer.remove();
      target.classList.add('cart-target-pulse');
      window.setTimeout(() => target.classList.remove('cart-target-pulse'), 500);
    });
};

export const animateProductToCart = (source: HTMLElement, imageUrl?: string) =>
  animateProductToHeaderTarget(source, imageUrl, '[data-cart-target]');

export const animateProductToFavorites = (source: HTMLElement, imageUrl?: string) =>
  animateProductToHeaderTarget(source, imageUrl, '[data-favorite-target]');
