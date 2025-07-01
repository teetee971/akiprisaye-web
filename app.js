import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInAnonymously, signOut, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-functions.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXXXXX",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

document.getElementById("login").addEventListener("click", () => {
  signInAnonymously(auth)
    .then(() => alert("✅ Connecté anonymement"))
    .catch((error) => console.error("Erreur:", error));
});

document.getElementById("upgrade").addEventListener("click", () => {
  alert("🔐 Pour activer un compte premium, veuillez vous inscrire avec e‑mail.");
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const token = await user.getIdTokenResult();
    const isPremium = token.claims.premium === true;
    document.getElementById("status").innerText = isPremium ? "👑 Statut : PREMIUM" : "👤 Statut : Standard";
    if (isPremium) {
      document.getElementById("premiumContent").style.display = "block";
    }
  }
});