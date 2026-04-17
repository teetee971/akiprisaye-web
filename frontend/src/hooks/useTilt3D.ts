/**
 * useTilt3D
 *
 * Applies a subtle 3D perspective tilt to a card element based on
 * mouse position. Uses CSS custom properties to drive the transform.
 *
 * Usage:
 *   const ref = useTilt3D<HTMLDivElement>();
 *   <div ref={ref} className="card-3d">...</div>
 */
import { useRef, useCallback } from 'react';
import type React from 'react';

const MAX_TILT = 12; // degrees

export function useTilt3D<T extends HTMLElement = HTMLDivElement>(): React.RefCallback<T> {
  const elementRef = useRef<T | null>(null);

  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = elementRef.current;
    if (!el) return;

    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width; // 0–1
    const y = (e.clientY - top) / height; // 0–1

    const tiltX = (y - 0.5) * -MAX_TILT; // top edge tilts toward viewer
    const tiltY = (x - 0.5) * MAX_TILT; // right edge tilts toward viewer

    el.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
    el.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    el.style.setProperty('--shine-x', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--shine-y', `${(y * 100).toFixed(1)}%`);
  }, []);

  const onMouseLeave = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  }, []);

  const refCallback = useCallback(
    (node: T | null) => {
      // Remove listeners from old node
      if (elementRef.current) {
        elementRef.current.removeEventListener('mousemove', onMouseMove);
        elementRef.current.removeEventListener('mouseleave', onMouseLeave);
      }
      elementRef.current = node;
      // Attach listeners to new node (only on pointer devices, non-reduced-motion)
      if (
        node &&
        window.matchMedia('(hover: hover)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        node.addEventListener('mousemove', onMouseMove, { passive: true });
        node.addEventListener('mouseleave', onMouseLeave, { passive: true });
      }
    },
    [onMouseMove, onMouseLeave]
  );

  return refCallback;
}
