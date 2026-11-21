export function initScrollSpy(): void {
  const navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-jump-link]'));
  if (navLinks.length === 0) return;

  const sections = navLinks
    .map((link) => {
      const hash = link.getAttribute('href');
      if (!hash || !hash.startsWith('#')) return null;
      const el = document.querySelector<HTMLElement>(hash);
      return el ? { id: hash.slice(1), el, link } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (sections.length === 0) return;

  const setActive = (activeId: string): void => {
    for (const item of sections) {
      if (item.id === activeId) {
        item.link.setAttribute('aria-current', 'location');
      } else {
        item.link.removeAttribute('aria-current');
      }
    }
  };

  if (!('IntersectionObserver' in window)) return;

  const visibleIds = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.getAttribute('id');
        if (!id) continue;
        if (entry.isIntersecting) {
          visibleIds.add(id);
        } else {
          visibleIds.delete(id);
        }
      }

      for (const item of sections) {
        if (visibleIds.has(item.id)) {
          setActive(item.id);
          return;
        }
      }
    },
    {
      rootMargin: '-20% 0px -65% 0px',
      threshold: 0,
    },
  );

  for (const item of sections) {
    observer.observe(item.el);
  }
}

initScrollSpy();
