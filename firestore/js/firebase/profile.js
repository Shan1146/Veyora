// VEYORA — Profile data helpers
import { db } from "./config.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const defaults = {
  nickname: "Veyora User",
  bio: "",
  avatarUrl: null,
  theme: "dark",
  background: null,
  musicUrl: null,
};

export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Your profile could not be found.");
  return { ...defaults, ...snap.data() };
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function ensureProfileFields(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const patch = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in data)) patch[key] = value;
  }
  if (Object.keys(patch).length) await setDoc(ref, patch, { merge: true });
  return { ...defaults, ...data, ...patch };
}
