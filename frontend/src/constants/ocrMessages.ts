/**
 * Centralized messages for OCR functionality
 * i18n-ready structure for future translations
 * Part of Ticket 2: OCR Consent & Clarity
 */

export const OCR_MESSAGES = {
  // Consent
  consent: {
    checkbox: {
      label: "J'autorise l'analyse automatique du texte présent sur l'image",
      required: "Vous devez accepter l'analyse pour continuer"
    },
    notice: {
      title: "Information importante",
      content: [
        "L'image ne sera pas conservée après l'analyse",
        "Le texte extrait peut contenir des erreurs",
        "Cette analyse est fournie à titre informatif uniquement",
        "Vérifiez toujours les informations sur l'emballage original"
      ]
    }
  },

  // Processing States
  processing: {
    uploading: "Chargement de l'image...",
    analyzing: "Analyse OCR en cours...",
    extracting: "Extraction du texte...",
    processing: "Traitement en cours..."
  },

  // Results
  result: {
    success: {
      title: "Analyse terminée",
      warning: "Texte extrait automatiquement — des erreurs peuvent exister",
      disclaimer: "Vérifiez toujours les informations sur l'emballage original du produit."
    },
    sections: {
      ingredients: "Ingrédients détectés",
      allergens: "Allergènes détectés",
      legalMentions: "Mentions légales",
      dangerPictograms: "Pictogrammes de danger",
      rawText: "Texte brut extrait"
    },
    empty: {
      title: "Aucun texte détecté",
      description: "L'image ne contient pas de texte lisible ou la qualité est insuffisante.",
      suggestions: [
        "Assurez-vous que le texte est bien visible",
        "Essayez avec une meilleure luminosité",
        "Évitez les reflets sur l'emballage",
        "Prenez la photo à une distance appropriée"
      ]
    },
    lowConfidence: {
      title: "Fiabilité faible",
      description: "La reconnaissance du texte est incertaine. Les résultats peuvent être imprécis."
    }
  },

  // Metadata
  metadata: {
    confidence: "Fiabilité",
    processingTime: "Temps de traitement",
    source: "Source",
    date: "Date d'analyse",
    imageSource: "Image analysée par l'utilisateur"
  },

  // Actions
  actions: {
    startAnalysis: "Lancer l'analyse",
    retry: "Réessayer",
    uploadImage: "Choisir une image",
    takePhoto: "Prendre une photo",
    cancel: "Annuler",
    close: "Fermer",
    viewRaw: "Voir le texte brut",
    viewSections: "Voir les sections"
  },

  // Errors (user-friendly)
  errors: {
    upload: {
      generic: "Impossible de charger l'image",
      format: "Format d'image non supporté. Utilisez JPG, PNG ou WebP.",
      size: "L'image est trop volumineuse. Taille maximale: 10 MB."
    },
    analysis: {
      generic: "L'analyse a échoué. Réessayez avec une autre image.",
      timeout: "L'analyse a pris trop de temps. Réessayez.",
      noText: "Aucun texte détecté dans l'image."
    },
    network: {
      generic: "Une erreur temporaire est survenue. Le service reste accessible.",
      offline: "Vous êtes hors ligne. Reconnectez-vous pour analyser l'image."
    }
  },

  // Warnings
  warnings: {
    automaticDetection: "⚠️ Détection automatique — peut contenir des erreurs",
    noMedicalAdvice: "Cette analyse ne constitue pas un conseil médical ou nutritionnel.",
    verifyOriginal: "Vérifiez toujours les informations sur l'emballage original.",
    dataObservation: "Données observées uniquement, sans interprétation."
  }
} as const;

export type OCRMessages = typeof OCR_MESSAGES;
