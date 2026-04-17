import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Routes where FloatingActions (FABs) are disabled/hidden
  const fabDisabledRoutes = [
    '/observatoire',
    '/pricing',
    '/tarifs',
    '/inscription',
    '/login',
    '/connexion',
    '/subscribe',
  ];
  const areFABsVisible = !fabDisabledRoutes.some((path) => location.pathname.startsWith(path));

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // Hide ScrollToTop when FloatingActions (FABs) are visible to avoid z-index conflict and visual clutter
  if (isVisible && areFABsVisible) {
    return null;
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all hover:scale-110 motion-reduce:transform-none motion-reduce:hover:scale-100"
          aria-label="Retour en haut"
          style={{ paddingBottom: 'max(0.75rem, calc(0.75rem + var(--safe-bottom)))' }}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </>
  );
}
