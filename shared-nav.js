// Shared Navigation JavaScript for A KI PRI SA YÉ
// This file provides consistent navigation behavior across all pages

(function() {
  'use strict';

  // Initialize navigation when DOM is ready
  function initSharedNavigation() {
    // Burger Menu Toggle
    const burgerMenu = document.getElementById('burger-menu');
    const mobileNav = document.getElementById('mobile-nav');
    const navOverlay = document.getElementById('nav-overlay');
    const closeNav = document.getElementById('close-nav');

    function openMobileNav() {
      if (mobileNav && navOverlay && burgerMenu) {
        mobileNav.classList.add('active');
        navOverlay.classList.add('active');
        burgerMenu.classList.add('active');
        burgerMenu.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeMobileNav() {
      if (mobileNav && navOverlay && burgerMenu) {
        mobileNav.classList.remove('active');
        navOverlay.classList.remove('active');
        burgerMenu.classList.remove('active');
        burgerMenu.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }

    if (burgerMenu) {
      burgerMenu.addEventListener('click', openMobileNav);
    }

    if (closeNav) {
      closeNav.addEventListener('click', closeMobileNav);
    }

    if (navOverlay) {
      navOverlay.addEventListener('click', closeMobileNav);
    }

    // Close mobile nav when a link is clicked
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-list a');
    mobileNavLinks.forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMobileNav();
      }
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSharedNavigation);
  } else {
    initSharedNavigation();
  }
})();
