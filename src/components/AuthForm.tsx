// src/components/AuthForm.tsx
import React, { useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<any>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  // --- Google Sign In ---
  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await setDoc(doc(db, "users", result.user.uid), {
      email: result.user.email,
      name: result.user.displayName,
      plan: "freemium",
      createdAt: new Date(),
    }, { merge: true });
  };

  // --- Email Sign In ---
  const handleEmailAuth = async () => {
    try {
      const userCredential =
        mode === "login"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        plan: "freemium",
        createdAt: new Date(),
      }, { merge: true });
    } catch (err) {
      alert("Erreur d'authentification : " + err);
    }
  };

  // --- Phone Auth ---
  const sendOtp = async () => {
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          "recaptcha-container",
          { size: "invisible" },
          auth
        );
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier
      );
      setConfirmResult(confirmation);
      alert("Code OTP envoyé !");
    } catch (err) {
      alert("Erreur envoi OTP : " + err);
    }
  };

  const verifyOtp = async () => {
    try {
      const result = await confirmResult.confirm(otp);
      await setDoc(doc(db, "users", result.user.uid), {
        phone,
        plan: "freemium",
        createdAt: new Date(),
      }, { merge: true });
    } catch (err) {
      alert("Erreur OTP : " + err);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-6 shadow-lg w-full max-w-md mx-auto text-center">
      <h2 className="text-2xl font-semibold mb-6 text-white">Connexion / Inscription</h2>

      {/* Google */}
      <Button onClick={signInGoogle} className="w-full mb-4 bg-blue-600 hover:bg-blue-700">
        Se connecter avec Google
      </Button>

      {/* Email */}
      <input
        type="email"
        value={email}
        placeholder="Adresse e-mail"
        onChange={(e) => setEmail(e.target.value)}
        className="w-full mb-3 p-3 rounded bg-slate-800 text-white"
      />
      <input
        type="password"
        value={password}
        placeholder="Mot de passe"
        onChange={(e) => setPassword(e.target.value)}
        className="w-full mb-3 p-3 rounded bg-slate-800 text-white"
      />
      <Button onClick={handleEmailAuth} className="w-full mb-4 bg-green-600 hover:bg-green-700">
        {mode === "login" ? "Connexion" : "Créer un compte"}
      </Button>

      {/* Téléphone */}
      <input
        type="tel"
        value={phone}
        placeholder="+590XXXXXXXX"
        onChange={(e) => setPhone(e.target.value)}
        className="w-full mb-3 p-3 rounded bg-slate-800 text-white"
      />
      {confirmResult ? (
        <>
          <input
            type="text"
            value={otp}
            placeholder="Code OTP reçu"
            onChange={(e) => setOtp(e.target.value)}
            className="w-full mb-3 p-3 rounded bg-slate-800 text-white"
          />
          <Button onClick={verifyOtp} className="w-full bg-yellow-600 hover:bg-yellow-700">
            Vérifier le code
          </Button>
        </>
      ) : (
        <Button onClick={sendOtp} className="w-full bg-yellow-500 hover:bg-yellow-600">
          Recevoir un code SMS
        </Button>
      )}
      <div id="recaptcha-container"></div>

      <p className="text-gray-400 mt-4 text-sm">
        {mode === "login" ? "Pas encore inscrit ?" : "Déjà un compte ?"}{" "}
        <span
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-blue-400 cursor-pointer hover:underline"
        >
          {mode === "login" ? "Créer un compte" : "Se connecter"}
        </span>
      </p>
    </div>
  );
}
