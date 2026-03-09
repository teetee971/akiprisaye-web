/**
 * useScrollReveal
 *
 * Uses IntersectionObserver to add `.revealed` class to elements
 * that have the `.reveal` class, triggering CSS entrance animations
 * defined in innovations-3d.css.
 *
 * Usage:
 *   useScrollReveal();  // call once in a layout component or App
 *
 * Or target a specific container:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useScrollReveal(ref);
 */
import { useEffect, type RefObject } from 'react';

export function useScrollReveal(
  containerRef?: RefObject<HTMLElement | null>,
  options: IntersectionObserverInit = { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
) {
  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Just make all reveal elements visible immediately
      const all = (containerRef?.current ?? document).querySelectorAll<HTMLElement>('.reveal');
      all.forEach((el) => el.classList.add('revealed'));
      return;
    }

    const root = containerRef?.current ?? document;
    const targets = root.querySelectorAll<HTMLElement>('.reveal');

    if (targets.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // once revealed, don't re-observe
        }
      });
    }, options);

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [containerRef]);
}
