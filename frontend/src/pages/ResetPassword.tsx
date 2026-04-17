// src/pages/ResetPassword.tsx
import { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, firebaseError } from '@/lib/firebase';
import { Link } from 'react-router-dom';
import { FIREBASE_UNAVAILABLE_MESSAGE, getAuthErrorMessage } from '@/lib/authMessages';
import { SITE_URL } from '@/utils/seoHelpers';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (firebaseError) {
      setError(FIREBASE_UNAVAILABLE_MESSAGE);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (firebaseError || !auth) {
      setError(FIREBASE_UNAVAILABLE_MESSAGE);
      return;
    }

    if (!email) {
      setError('Veuillez saisir votre adresse email.');
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email, {
        // After the user clicks the reset link Firebase will redirect them
        // back to the app's login page (not the generic Firebase hosting URL).
        url: `${SITE_URL}/login`,
        handleCodeInApp: false,
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-white text-center">
          Réinitialiser le mot de passe
        </h1>

        {success ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-200">
              <div className="flex items-start gap-2">
                <span className="text-xl">✅</span>
                <div>
                  <p className="font-medium mb-1">Email envoyé !</p>
                  <p className="text-sm">
                    Un email de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez
                    votre boîte de réception et suivez les instructions.
                  </p>
                  <p className="text-sm mt-2 text-yellow-300">
                    ⚠️ Si vous ne voyez pas l'email dans votre boîte de réception, vérifiez votre
                    dossier <strong>Spam / Courrier indésirable</strong> et marquez-le comme « non
                    spam ».
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="block w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-center transition-colors text-white"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0">❌</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <p className="text-gray-300 text-sm mb-6 text-center">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot
              de passe.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse e-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  required
                  className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
                disabled={loading}
              >
                {loading ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
              >
                ← Retour à la connexion
              </Link>
            </div>
          </>
        )}

        <div className="mt-6 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <p className="text-blue-200 text-xs text-center">
            🔒 Service citoyen gratuit et sécurisé
          </p>
        </div>
      </div>
    </div>
  );
}
