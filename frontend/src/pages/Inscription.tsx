// src/pages/Inscription.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, firebaseError } from '@/lib/firebase';
import { PasswordInput } from '@/components/PasswordInput';
import { FIREBASE_UNAVAILABLE_MESSAGE, getAuthErrorMessage } from '@/lib/authMessages';
import { HeroImage } from '@/components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '@/config/imageAssets';
import SocialLoginButtons from '@/components/SocialLoginButtons';
import { useAuth } from '@/context/authHook';

import { SEOHead } from '../components/ui/SEOHead';
const DEFAULT_USER_PLAN = 'free';
const PLAN_LABELS: Record<string, { title: string; description: string }> = {
  free: {
    title: 'Gratuit',
    description: 'Accès citoyen ouvert (scan et lecture seule).',
  },
  citizen: {
    title: 'Citoyen',
    description: 'Fonctionnalités avancées (alertes, OCR, historique).',
  },
  professional: {
    title: 'Professionnel',
    description: 'Exports, agrégations et support dédié.',
  },
};

export default function Inscription() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUpEmailPassword } = useAuth();

  const requestedPlan = searchParams.get('plan') || DEFAULT_USER_PLAN;
  const selectedPlan = Object.hasOwn(PLAN_LABELS, requestedPlan)
    ? requestedPlan
    : DEFAULT_USER_PLAN;
  const selectedPlanInfo = PLAN_LABELS[selectedPlan];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (firebaseError) {
      setError(FIREBASE_UNAVAILABLE_MESSAGE);
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      // Uses auth service layer: ensureSessionPersistence + createUser + sendEmailVerification
      await signUpEmailPassword(email, password);

      // Optionnel: Sauvegarder le plan choisi dans Firestore si disponible
      // auth.currentUser est mis à jour de façon synchrone après la création du compte
      const currentUser = auth?.currentUser;
      if (db && currentUser) {
        await setDoc(
          doc(db, 'users', currentUser.uid),
          {
            email,
            plan: selectedPlan,
            createdAt: new Date(),
          },
          { merge: true }
        );
      }

      setSuccess(true);

      setTimeout(() => {
        navigate(`/mon-compte?plan=${selectedPlan}`);
      }, 1500);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Inscription — Rejoindre A KI PRI SA YÉ"
        description="Créez votre compte pour contribuer à l'observatoire citoyen des prix Outre-mer et accéder à toutes les fonctionnalités."
        canonical="https://teetee971.github.io/akiprisaye-web/inscription"
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl p-6 shadow-lg w-full max-w-md">
          <HeroImage
            src={PAGE_HERO_IMAGES.inscription}
            alt="Créer un compte"
            gradient="from-slate-950 to-blue-900"
            height="h-40 sm:h-52"
          >
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
              ✨ Créer un compte
            </h1>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Rejoignez la communauté et accédez à tous les outils
            </p>
          </HeroImage>

          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/40 rounded-lg text-blue-100 text-sm">
            <p className="font-semibold">
              Plan sélectionné : <span className="text-white">{selectedPlanInfo.title}</span>
            </p>
            <p className="text-xs mt-1 text-blue-200">{selectedPlanInfo.description}</p>
            {!searchParams.get('plan') && (
              <p className="text-xs mt-2 text-blue-300">
                Astuce : choisissez une formule depuis la page Tarifs pour la pré-remplir ici.
              </p>
            )}
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-200 text-sm text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">✅</span>
                <span>Compte créé avec succès !</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0">❌</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <SocialLoginButtons
            redirectTo={`/mon-compte?plan=${selectedPlan}`}
            onError={setError}
            showDivider={false}
          />

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">ou par email</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

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

            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              label="Mot de passe"
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
              autoComplete="new-password"
            />

            <button
              type="submit"
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
              disabled={loading}
            >
              {loading ? 'Création en cours…' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Déjà un compte ?{' '}
              <button
                type="button"
                onClick={() => navigate('/mon-compte')}
                className="text-blue-400 hover:text-blue-300 hover:underline font-medium cursor-pointer bg-transparent border-0 p-0"
              >
                Se connecter
              </button>
            </p>
          </div>

          <div className="mt-6 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
            <p className="text-blue-200 text-xs text-center">
              🔒 Service citoyen gratuit et sécurisé
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
