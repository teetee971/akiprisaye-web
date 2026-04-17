/**
 * Composant de tutoriel interactif utilisant React Joyride
 * Affiche un tour guidé des principales fonctionnalités de l'application
 */

import React, { useEffect, useState } from 'react';
import { Joyride, EventData, STATUS, Step } from 'react-joyride';
import type { Locale } from 'react-joyride';
import { useOnboarding } from '../context/OnboardingContext';

// Traduction française pour React Joyride
const locale: Locale = {
  back: 'Précédent',
  close: 'Fermer',
  last: 'Terminer',
  next: 'Suivant',
  open: 'Ouvrir la boîte de dialogue',
  skip: 'Passer le tutoriel',
};

/**
 * Définition des étapes du tutoriel
 * Chaque étape cible un élément de l'interface avec un message explicatif
 */
const tourSteps: Step[] = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">Bienvenue sur A KI PRI SA YÉ ! 👋</h3>
        <p>
          Découvrez comment comparer les prix et économiser sur vos achats. Ce guide rapide vous
          présente les fonctionnalités principales.
        </p>
      </div>
    ),
    placement: 'center',
    skipBeacon: true,
  },
  {
    target: 'nav a[href*="carte"], nav a[href="#/carte"]',
    content: (
      <div>
        <h4 className="font-bold mb-1">🗺️ Carte interactive</h4>
        <p>
          Localisez les magasins autour de vous et consultez les prix en temps réel. Trouvez les
          meilleures offres près de chez vous.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'nav a[href*="comparateur"], nav a[href="#/comparateur"]',
    content: (
      <div>
        <h4 className="font-bold mb-1">📊 Comparateur de prix</h4>
        <p>
          Comparez les prix des produits entre différents magasins. Identifiez rapidement où acheter
          moins cher.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'nav a[href*="observatoire"], nav a[href="#/observatoire"]',
    content: (
      <div>
        <h4 className="font-bold mb-1">📈 Observatoire des prix</h4>
        <p>
          Suivez l'évolution des prix dans le temps. Analysez les tendances et anticipez les
          hausses.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="ti-panier"]',
    content: (
      <div>
        <h4 className="font-bold mb-1">🛒 Ti-panier intelligent</h4>
        <p>
          Créez votre liste de courses et optimisez votre budget. Recevez des alertes sur les prix
          de vos produits favoris.
        </p>
      </div>
    ),
    placement: 'bottom',
    skipBeacon: true,
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-bold mb-2">🎉 C'est parti !</h3>
        <p>
          Vous êtes maintenant prêt à utiliser A KI PRI SA YÉ. Explorez les fonctionnalités et
          économisez sur vos achats !
        </p>
        <p className="mt-2 text-sm text-slate-600">
          💡 Astuce : Vous pouvez relancer ce guide à tout moment via le bouton "Aide" en bas à
          droite.
        </p>
      </div>
    ),
    placement: 'center',
  },
];

export default function OnboardingTour() {
  const { isTourActive, setIsTourActive, completeOnboarding, dismissOnboarding } = useOnboarding();
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (isTourActive) {
      // Petit délai pour s'assurer que les éléments DOM sont présents
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [isTourActive]);

  const handleJoyrideCallback = (data: EventData) => {
    const { status, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      setIsTourActive(false);

      // Si l'utilisateur a cliqué sur "Passer", on considère qu'il veut masquer
      if (action === 'skip') {
        dismissOnboarding();
      } else {
        completeOnboarding();
      }
    }
  };

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      continuous
      locale={locale}
      onEvent={handleJoyrideCallback}
      options={{
        primaryColor: '#1d4ed8', // blue-700 — WCAG AA contrast ≥4.5:1 with white
        textColor: '#1e293b', // slate-800
        backgroundColor: '#ffffff',
        arrowColor: '#ffffff',
        overlayColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
        overlayClickAction: false,
      }}
      styles={{
        tooltip: {
          borderRadius: 8,
          fontSize: 15,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        buttonPrimary: {
          backgroundColor: '#1d4ed8', // blue-700 — WCAG AA contrast ≥4.5:1 with white
          fontSize: 14,
          fontWeight: 600,
          padding: '8px 16px',
          borderRadius: 6,
        },
        buttonBack: {
          color: '#64748b',
          fontSize: 14,
          marginRight: 8,
        },
        buttonSkip: {
          color: '#64748b',
          fontSize: 14,
        },
      }}
    />
  );
}
