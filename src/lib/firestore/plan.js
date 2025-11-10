// src/lib/firestore/plan.js
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function getUserPlan(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().plan || "freemium" : "freemium";
}

export async function setUserPlan(uid, plan) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { plan }, { merge: true });
}
