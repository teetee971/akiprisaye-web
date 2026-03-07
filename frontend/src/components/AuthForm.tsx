 
// src/components/AuthForm.tsx
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db, firebaseError } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { safeToText } from "../utils/safeToText";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if Firebase is available
  React.useEffect(() => {
    if (firebaseError) {
      setError(safeToText(firebaseError));
    }
  }, []);

  // --- Email Sign In / Sign Up ---
  const handleEmailAuth = async () => {
    if (firebaseError || !auth) {
      setError("Service d'authentification non disponible. Veuillez contacter l'administrateur.");
      console.error('Firebase Auth Error:', firebaseError);
      return;
    }
    
    if (!email || !password) {
      setError("Veuillez renseigner votre email et mot de passe.");
      return;
    }
    
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const userCredential =
        mode === "login"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);

      // Optionnel: Sauvegarder dans Firestore si disponible
      if (db) {
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email,
          plan: "freemium",
          createdAt: new Date(),
        }, { merge: true });
      }
      
      // Succès - la redirection se fera automatiquement via onAuthStateChanged
    } catch (err: any) {
      console.error("Email auth error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // --- Password Reset ---
  const handlePasswordReset = async () => {
    if (firebaseError || !auth) {
      setError("Service d'authentification non disponible. Veuillez contacter l'administrateur.");
      console.error('Firebase Auth Error:', firebaseError);
      return;
    }
    
    if (!email) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Un email de réinitialisation a été envoyé à " + email);
      setMode("login");
    } catch (err: any) {
      console.error("Password reset error:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  
  // Helper pour traduire les erreurs Firebase
  const getErrorMessage = (err: any): string => {
    const code = err?.code || '';
    
    switch (code) {
      case 'auth/user-not-found':
        return "Aucun compte trouvé avec cet email.";
      case 'auth/wrong-password':
        return "Mot de passe incorrect.";
      case 'auth/email-already-in-use':
        return "Cet email est déjà utilisé.";
      case 'auth/invalid-email':
        return "Email invalide.";
      case 'auth/weak-password':
        return "Mot de passe trop faible. Minimum 6 caractères.";
      case 'auth/too-many-requests':
        return "Trop de tentatives. Réessayez plus tard.";
      case 'auth/popup-closed-by-user':
        return "Connexion annulée.";
      case 'auth/invalid-verification-code':
        return "Code de vérification invalide.";
      case 'auth/invalid-phone-number':
        return "Numéro de téléphone invalide.";
      default:
        return err?.message || "Une erreur est survenue. Réessayez.";
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-6 shadow-lg w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6 text-white text-center">
        {mode === "reset" ? "Réinitialiser le mot de passe" : mode === "login" ? "Connexion" : "Créer un compte"}
      </h2>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0">❌</span>
            <span>{safeToText(error)}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-200 text-sm">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0">✅</span>
            <span>{safeToText(success)}</span>
          </div>
        </div>
      )}

      {/* Email Input */}
      <div className="mb-3">
        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          placeholder="votre@email.com"
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && mode !== 'reset') {
              handleEmailAuth();
            } else if (e.key === 'Enter' && mode === 'reset') {
              handlePasswordReset();
            }
          }}
          disabled={loading}
          className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Password Input (not shown in reset mode) */}
      {mode !== "reset" && (
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            placeholder="Minimum 6 caractères"
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleEmailAuth();
              }
            }}
            disabled={loading}
            className="w-full p-3 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>
      )}

      {/* Action Button */}
      {mode === "reset" ? (
        <Button 
          onClick={handlePasswordReset} 
          disabled={loading}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {loading ? "⏳ Envoi..." : "Envoyer le lien de réinitialisation"}
        </Button>
      ) : (
        <Button 
          onClick={handleEmailAuth} 
          disabled={loading}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {loading ? "⏳ Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </Button>
      )}

      {/* Forgot Password Link */}
      {mode === "login" && (
        <div className="text-center mb-4">
          <button
            onClick={() => {
              setMode("reset");
              setError(null);
              setSuccess(null);
            }}
            className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            Mot de passe oublié ?
          </button>
        </div>
      )}

      {/* Mode Switch */}
      <div className="text-center pt-4 border-t border-gray-700">
        <p className="text-gray-400 text-sm">
          {mode === "reset" ? (
            <>
              Retour à la{" "}
              <span
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-blue-400 cursor-pointer hover:underline font-medium"
              >
                connexion
              </span>
            </>
          ) : mode === "login" ? (
            <>
              Pas encore inscrit ?{" "}
              <span
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-blue-400 cursor-pointer hover:underline font-medium"
              >
                Créer un compte
              </span>
            </>
          ) : (
            <>
              Déjà un compte ?{" "}
              <span
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                }}
                className="text-blue-400 cursor-pointer hover:underline font-medium"
              >
                Se connecter
              </span>
            </>
          )}
        </p>
      </div>

      {/* Info Notice */}
      <div className="mt-6 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
        <p className="text-blue-200 text-xs text-center">
          🔒 Service citoyen gratuit et sécurisé
        </p>
      </div>
    </div>
  );
}
