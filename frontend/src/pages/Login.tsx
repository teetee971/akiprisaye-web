// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firebaseError } from "@/lib/firebase";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (firebaseError) {
      setError("Service d'authentification non disponible. Veuillez contacter l'administrateur.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (firebaseError || !auth) {
      setError("Service d'authentification non disponible. Veuillez contacter l'administrateur.");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      const nextParam = searchParams.get("next");
      // Prevent open redirect: must start with / but not with //
      const safeNext = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
      navigate(safeNext || "/mon-compte");
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (err: any): string => {
    const code = err?.code || "";

    switch (code) {
      case "auth/user-not-found":
        return "Aucun compte trouvé avec cet email.";
      case "auth/wrong-password":
        return "Mot de passe incorrect.";
      case "auth/invalid-email":
        return "Email invalide.";
      case "auth/too-many-requests":
        return "Trop de tentatives. Réessayez plus tard.";
      case "auth/invalid-credential":
        return "Email ou mot de passe incorrect.";
      default:
        return err?.message || "Une erreur est survenue. Réessayez.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl p-6 shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6 text-white text-center">Connexion</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0">❌</span>
              <span>{error}</span>
            </div>
          </div>
        )}

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              placeholder="Minimum 6 caractères"
              required
              minLength={6}
              className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed text-white"
            disabled={loading}
          >
            {loading ? "Connexion en cours…" : "Se connecter"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/reset-password"
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Pas encore de compte ?{" "}
            <Link
              to="/inscription"
              className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
            >
              Créer un compte
            </Link>
          </p>
        </div>

        <div className="mt-6 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <p className="text-blue-200 text-xs text-center">
            🔒 Service citoyen gratuit et sécurisé
          </p>
        </div>
      </div>
    </div>
  );
}
