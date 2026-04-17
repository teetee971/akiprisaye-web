export const FIREBASE_UNAVAILABLE_MESSAGE =
  "Service d'authentification non disponible. Vérifiez la configuration Firebase.";

/**
 * Traduit un code d'erreur Firebase Auth en message utilisateur en français.
 * N'expose jamais le message technique brut de Firebase.
 */
export function getAuthErrorMessage(err: unknown): string {
  const code =
    typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';

  switch (code) {
    case 'auth/api-key-not-valid':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return FIREBASE_UNAVAILABLE_MESSAGE;
    case 'auth/user-not-found':
      return 'Aucun compte trouvé avec cet email.';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cet email est déjà utilisé.';
    case 'auth/invalid-email':
      return 'Email invalide.';
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect.';
    case 'auth/weak-password':
      return 'Mot de passe trop faible. Minimum 6 caractères.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Réessayez plus tard.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Connexion annulée.';
    case 'auth/popup-blocked':
      return 'Pop-up bloquée par le navigateur. Autorisez les pop-ups pour ce site ou utilisez la connexion par email.';
    case 'auth/account-exists-with-different-credential':
      return 'Un compte existe déjà avec cet email. Connectez-vous par email ou avec le même fournisseur.';
    case 'auth/unauthorized-domain':
      return "Domaine non autorisé. Contactez l'administrateur pour ajouter ce domaine dans Firebase Authentication.";
    case 'auth/operation-not-allowed':
      return "Ce fournisseur de connexion n'est pas activé.";
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.';
    case 'auth/invalid-verification-code':
      return 'Code de vérification invalide.';
    case 'auth/invalid-phone-number':
      return 'Numéro de téléphone invalide.';
    case 'auth/network-request-failed':
      return 'Erreur réseau. Vérifiez votre connexion internet et réessayez.';
    case 'auth/internal-error':
      return "Erreur interne du service d'authentification. Réessayez.";
    case 'auth/requires-recent-login':
      return 'Cette action nécessite une reconnexion récente. Déconnectez-vous et reconnectez-vous.';
    case 'auth/user-token-expired':
      return 'Votre session a expiré. Veuillez vous reconnecter.';
    default:
      return 'Erreur de connexion. Réessayez.';
  }
}
