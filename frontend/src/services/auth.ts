import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type ActionCodeSettings,
  type User,
  type UserCredential,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

const googleProvider   = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const appleProvider    = new OAuthProvider('apple.com');

// Request extra scopes for better profile info
googleProvider.addScope('profile');
googleProvider.addScope('email');
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');
appleProvider.addScope('email');
appleProvider.addScope('name');

function ensureAuth() {
  if (!auth) {
    throw new Error("Service d'authentification non disponible.");
  }
  return auth;
}

export async function ensureSessionPersistence(): Promise<void> {
  const authInstance = ensureAuth();
  await setPersistence(authInstance, browserLocalPersistence);
}

export async function signUpEmailPassword(email: string, password: string): Promise<UserCredential> {
  const authInstance = ensureAuth();
  await ensureSessionPersistence();
  const credential = await createUserWithEmailAndPassword(authInstance, email, password);
  try {
    const continueUrl = `${window.location.origin}${import.meta.env.BASE_URL}mon-compte`;
    const actionCodeSettings: ActionCodeSettings = { url: continueUrl };
    await sendEmailVerification(credential.user, actionCodeSettings);
  } catch {
    console.warn("sendEmailVerification failed — account created but verification email not sent.");
  }
  return credential;
}

export async function signInEmailPassword(email: string, password: string): Promise<UserCredential> {
  const authInstance = ensureAuth();
  await ensureSessionPersistence();
  return signInWithEmailAndPassword(authInstance, email, password);
}

export async function signInGooglePopup(): Promise<UserCredential> {
  const authInstance = ensureAuth();
  await ensureSessionPersistence();
  return signInWithPopup(authInstance, googleProvider);
}

/**
 * Facebook sign-in.
 * Requires Facebook to be enabled in Firebase Console:
 * Authentication → Sign-in method → Facebook → enable + add App ID & Secret.
 */
export async function signInFacebookPopup(): Promise<UserCredential> {
  const authInstance = ensureAuth();
  await ensureSessionPersistence();
  return signInWithPopup(authInstance, facebookProvider);
}

/**
 * Apple sign-in.
 * Requires Apple to be enabled in Firebase Console:
 * Authentication → Sign-in method → Apple → enable.
 * Also requires an Apple Developer account + Services ID configured.
 */
export async function signInApplePopup(): Promise<UserCredential> {
  const authInstance = ensureAuth();
  await ensureSessionPersistence();
  return signInWithPopup(authInstance, appleProvider);
}

export async function signOutUser(): Promise<void> {
  const authInstance = ensureAuth();
  await signOut(authInstance);
}

export function subscribeToAuthState(handler: (user: User | null) => void): () => void {
  const authInstance = ensureAuth();
  return onAuthStateChanged(authInstance, handler);
}
