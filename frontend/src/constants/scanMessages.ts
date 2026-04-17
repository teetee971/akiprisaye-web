/**
 * Centralized messages for Scan functionality
 * i18n-ready structure for future translations
 * Part of Ticket 1: UX Scan States
 */

export const SCAN_MESSAGES = {
  // Camera Permission States
  permission: {
    prompt: {
      title: 'Accès à la caméra requis',
      description: "Pour scanner les codes-barres, nous avons besoin d'accéder à votre caméra.",
      button: 'Autoriser la caméra',
    },
    requesting: "Vérification de l'autorisation...",
    denied: {
      title: 'Accès caméra refusé',
      description:
        "L'accès à la caméra est nécessaire pour scanner les codes-barres. Vous pouvez autoriser l'accès dans les paramètres ou utiliser les alternatives ci-dessous.",
      openSettings: 'Voir comment activer',
    },
    notFound: {
      title: 'Aucune caméra détectée',
      description:
        "Aucune caméra n'a été détectée sur cet appareil. Vous pouvez importer une image ou saisir le code manuellement.",
    },
  },

  // Scanning States
  scanning: {
    active: {
      title: 'Scan en cours...',
      instruction: 'Positionnez le code-barres devant la caméra',
      tips: [
        "Maintenez l'appareil stable",
        "Assurez-vous d'avoir un bon éclairage",
        'Distance: 10-20 cm de la caméra',
      ],
    },
    timeout: 'Le scan prend plus de temps que prévu. Le code-barres est-il bien visible ?',
  },

  // Scan Results
  result: {
    success: 'Code-barres détecté avec succès !',
    productNotFound: {
      title: 'Produit non trouvé',
      description:
        "Ce code-barres n'est pas encore dans notre base de données. Vous pouvez nous aider en ajoutant des informations sur ce produit.",
      actions: {
        retry: 'Réessayer le scan',
        upload: 'Importer une image',
        manual: 'Saisir le code manuellement',
        contribute: 'Contribuer les données',
      },
    },
    failed: {
      title: 'Scan non réussi',
      description:
        "Nous n'avons pas réussi à lire le code-barres. Pas d'inquiétude, plusieurs alternatives sont disponibles.",
      actions: {
        retry: 'Réessayer',
        upload: 'Importer une image',
        manual: 'Saisir manuellement',
      },
    },
  },

  // Alternative Methods
  alternatives: {
    import: {
      title: 'Importer une image',
      description: 'Sélectionnez une photo du code-barres depuis votre galerie',
    },
    manual: {
      title: 'Saisie manuelle',
      description: 'Entrez le code EAN (8 à 13 chiffres)',
      placeholder: 'Code EAN (ex: 3017620422003)',
      validation: {
        tooShort: 'Le code doit contenir au moins 8 chiffres',
        tooLong: 'Le code doit contenir au maximum 13 chiffres',
        invalidFormat: 'Le code doit contenir uniquement des chiffres',
      },
    },
  },

  // Instructions
  instructions: {
    title: 'Comment scanner ?',
    steps: [
      'Positionnez le code-barres à 10-20 cm de la caméra',
      "Assurez-vous d'avoir un bon éclairage",
      'Maintenez le téléphone stable pendant 1-2 secondes',
    ],
  },

  // Actions
  actions: {
    startScan: 'Scanner avec la caméra',
    stopScan: 'Arrêter le scan',
    retry: 'Réessayer',
    cancel: 'Annuler',
    close: 'Fermer',
    submit: 'Valider',
  },

  // Errors (user-friendly, no technical details)
  errors: {
    camera: {
      generic: "Impossible d'accéder à la caméra. Vérifiez les paramètres de votre appareil.",
      notSupported: "Votre navigateur ne supporte pas l'accès à la caméra.",
    },
    decode: {
      generic: 'Code-barres non détecté. Essayez avec une meilleure luminosité.',
      timeout: 'Le scan a pris trop de temps. Réessayez ou utilisez une alternative.',
    },
    network: {
      generic: 'Une erreur temporaire est survenue. Le service reste accessible.',
      offline: 'Vous êtes hors ligne. Reconnectez-vous pour rechercher le produit.',
    },
  },
} as const;

export type ScanMessages = typeof SCAN_MESSAGES;
