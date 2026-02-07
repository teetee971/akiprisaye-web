import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';

interface OnboardingTourProps {
  run?: boolean;
  onComplete?: () => void;
}

const ONBOARDING_KEY = 'akiprisaye_onboarding_completed';

const steps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">🎉 Bienvenue sur A KI PRI SA YÉ !</h2>
        <p>Découvrez comment comparer les prix et faire des économies dans les territoires ultramarins.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="search"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">🔍 Recherche de produits</h3>
        <p>Recherchez un produit par son nom ou scannez son code-barres pour comparer les prix.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="comparateur"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">📊 Comparateur de prix</h3>
        <p>Comparez les prix entre différentes enseignes et trouvez les meilleures offres.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="carte"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">🗺️ Carte des magasins</h3>
        <p>Localisez les magasins près de chez vous et planifiez votre itinéraire.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="ti-panier"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">🛒 Ti-Panier</h3>
        <p>Ajoutez des produits à votre panier pour calculer le total de vos courses et voir les économies possibles.</p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: '[data-tour="alertes"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">🔔 Alertes prix</h3>
        <p>Créez des alertes pour être notifié quand le prix d'un produit baisse.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="scanner"]',
    content: (
      <div>
        <h3 className="font-bold mb-2">📸 Scanner</h3>
        <p>Scannez les codes-barres en magasin ou vos tickets de caisse pour un suivi automatique.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">✅ C'est parti !</h2>
        <p>Vous êtes prêt à économiser. Bonne découverte !</p>
        <p className="text-sm text-gray-500 mt-2">Vous pouvez relancer ce guide à tout moment depuis le menu Aide.</p>
      </div>
    ),
    placement: 'center',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ run: externalRun, onComplete }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem(ONBOARDING_KEY);
    if (!completed && externalRun === undefined) {
      // Small delay to let the page render
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
    if (externalRun !== undefined) {
      setRun(externalRun);
    }
  }, [externalRun]);

  const handleCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(ONBOARDING_KEY, 'true');
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableOverlayClose
      callback={handleCallback}
      locale={{
        back: 'Précédent',
        close: 'Fermer',
        last: 'Terminer',
        next: 'Suivant',
        open: 'Ouvrir',
        skip: 'Passer le tutoriel',
      }}
      styles={{
        options: {
          primaryColor: '#3B82F6',
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: '#3B82F6',
          borderRadius: 8,
          padding: '10px 20px',
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: 10,
        },
        buttonSkip: {
          color: '#9CA3AF',
        },
        spotlight: {
          borderRadius: 8,
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
};

export const resetOnboarding = () => {
  localStorage.removeItem(ONBOARDING_KEY);
};

export const isOnboardingCompleted = () => {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
};

export default OnboardingTour;
