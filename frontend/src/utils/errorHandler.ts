/**
 * Centralized Error Handler for User-Friendly Error Messages
 * Part of Ticket 5: UX Error Management
 * 
 * Converts technical errors into human-readable messages
 * Never exposes stack traces, HTTP codes, or technical details to users
 */

import toast from 'react-hot-toast';

export interface UserFriendlyError {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  recoverable: boolean;
  actions?: Array<{
    label: string;
    handler: () => void;
  }>;
}

/**
 * Convert any error to a user-friendly format
 */
export function handleError(error: unknown, context?: string): UserFriendlyError {
  // Default error response
  let userError: UserFriendlyError = {
    title: 'Une erreur est survenue',
    message: 'Une erreur temporaire est survenue. Le service reste accessible.',
    type: 'error',
    recoverable: true
  };

  // Log technical error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error(`[${context || 'Unknown Context'}]`, error);
  }

  // Parse error and return appropriate message
  if (error instanceof Error) {
    const errorName = error.name.toLowerCase();
    const errorMessage = error.message.toLowerCase();

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('cors')) {
      userError = {
        title: 'Problème de connexion',
        message: 'Vérifiez votre connexion internet et réessayez.',
        type: 'warning',
        recoverable: true
      };
    }
    // Timeout errors
    else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
      userError = {
        title: 'Délai d\'attente dépassé',
        message: 'L\'opération a pris trop de temps. Réessayez dans quelques instants.',
        type: 'warning',
        recoverable: true
      };
    }
    // Camera/permission errors
    else if (errorName === 'notallowederror' || errorName === 'permissiondeniederror') {
      userError = {
        title: 'Autorisation refusée',
        message: 'L\'accès a été refusé. Vérifiez les autorisations de votre appareil.',
        type: 'warning',
        recoverable: true
      };
    }
    // Device not found (no camera)
    else if (errorName === 'notfounderror') {
      userError = {
        title: 'Appareil non trouvé',
        message: 'L\'appareil demandé (caméra, microphone) n\'a pas été trouvé.',
        type: 'info',
        recoverable: true
      };
    }
    // Not supported errors
    else if (errorName === 'notsupportederror') {
      userError = {
        title: 'Non supporté',
        message: 'Cette fonctionnalité n\'est pas supportée par votre appareil ou navigateur.',
        type: 'info',
        recoverable: false
      };
    }
  }

  // HTTP errors (if we receive response objects)
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: number }).status;
    
    if (status === 404) {
      userError = {
        title: 'Non trouvé',
        message: 'La ressource demandée n\'a pas été trouvée.',
        type: 'info',
        recoverable: false
      };
    } else if (status === 429) {
      userError = {
        title: 'Trop de requêtes',
        message: 'Vous avez effectué trop de requêtes. Attendez quelques instants avant de réessayer.',
        type: 'warning',
        recoverable: true
      };
    } else if (status >= 500) {
      userError = {
        title: 'Erreur serveur',
        message: 'Le service rencontre un problème temporaire. Réessayez dans quelques instants.',
        type: 'error',
        recoverable: true
      };
    } else if (status >= 400) {
      userError = {
        title: 'Requête invalide',
        message: 'La requête n\'a pas pu être traitée. Vérifiez les informations saisies.',
        type: 'warning',
        recoverable: true
      };
    }
  }

  return userError;
}

/**
 * Error Handler for Scan operations
 */
export function handleScanError(error: unknown): UserFriendlyError {
  const userError = handleError(error, 'Scan');
  
  // Add scan-specific context if applicable
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('barcode') || errorMessage.includes('decode')) {
      return {
        title: 'Code non détecté',
        message: 'Le code-barres n\'a pas pu être lu. Essayez avec une meilleure luminosité ou utilisez la saisie manuelle.',
        type: 'info',
        recoverable: true
      };
    }
  }
  
  return userError;
}

/**
 * Error Handler for OCR operations
 */
export function handleOCRError(error: unknown): UserFriendlyError {
  const userError = handleError(error, 'OCR');
  
  // Add OCR-specific context
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('image') || errorMessage.includes('load')) {
      return {
        title: 'Image invalide',
        message: 'L\'image n\'a pas pu être chargée. Assurez-vous qu\'elle est au bon format (JPG, PNG).',
        type: 'warning',
        recoverable: true
      };
    }
    
    if (errorMessage.includes('text') || errorMessage.includes('recognize')) {
      return {
        title: 'Texte non détecté',
        message: 'Aucun texte n\'a pu être détecté dans l\'image. Essayez avec une image plus nette.',
        type: 'info',
        recoverable: true
      };
    }
  }
  
  return userError;
}

/**
 * Error Handler for Product operations
 */
export function handleProductError(error: unknown): UserFriendlyError {
  const userError = handleError(error, 'Product');
  
  // Add product-specific context
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return {
        title: 'Produit non trouvé',
        message: 'Ce produit n\'est pas encore dans notre base de données. Vous pouvez contribuer en ajoutant des informations.',
        type: 'info',
        recoverable: false
      };
    }
  }
  
  return userError;
}

/**
 * Display error toast/notification
 */
export function showErrorToUser(error: UserFriendlyError) {
  const icon = error.type === 'error' ? '❌' : error.type === 'warning' ? '⚠️' : 'ℹ️';
  import('react-hot-toast').then(({ default: toast }) => {
    const message = `${icon} ${error.title} — ${error.message}`;
    if (error.type === 'error') {
      toast.error(message);
    } else if (error.type === 'warning') {
      toast(message, { icon: '⚠️' });
    } else {
      toast(message, { icon: 'ℹ️' });
    }
  }).catch(() => {
    console.error(`[ErrorHandler] ${error.title}: ${error.message}`);
    alert(`${icon} ${error.title} — ${error.message}`);
  });
}
