import React from 'react';
import '../../styles/a11y.css';

/**
 * Composant SkipLinks - Liens d'évitement pour navigation clavier
 * Permet aux utilisateurs de clavier/lecteur d'écran de sauter directement au contenu principal
 * Conforme WCAG 2.1 - 2.4.1 (Bypass Blocks)
 */
export default function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main" className="skip-link">
        Aller au contenu principal
      </a>
      <a href="#main-nav" className="skip-link">
        Aller à la navigation
      </a>
      <a href="#footer" className="skip-link">
        Aller au pied de page
      </a>
    </div>
  );
}
