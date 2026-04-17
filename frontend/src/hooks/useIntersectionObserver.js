import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for Intersection Observer
 * Detects when an element enters the viewport
 *
 * @param {Object} options - Intersection Observer options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {string} options.rootMargin - Margin around root
 * @returns {[React.Ref, boolean]} - [ref to attach, isVisible state]
 */
export function useIntersectionObserver(options = {}) {
  const { threshold = 0.1, rootMargin = '50px' } = options;

  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        // Only trigger once when element becomes visible
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    // Start observing
    observerRef.current.observe(element);

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, isVisible]);

  return [elementRef, isVisible];
}
