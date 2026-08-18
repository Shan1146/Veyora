// VEYORA Phase 4.5 — reliable profile helpers
import { db } from "./config.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const defaults = {
  nickname: "Veyora User",
  bio: "",
  avatarUrl: null,
  avatarPath: "assets/avatars/avatar01.svg",
  theme: "dark",
  background: null,
  musicUrl: null,
};

export async function getUserProfile(uid) {
  if (!uid) throw new Error("No signed-in user.");
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Recover safely if an older account has no user document.
    await setDoc(ref, { ...defaults, createdAt: serverTimestamp() }, { merge: true });
    return { ...defaults };
  }
  return { ...defaults, ...snap.data() };
}

export async function updateUserProfile(uid, data) {
  if (!uid) throw new Error("No signed-in user.");
  const allowed = {};
  for (const key of ["nickname", "bio", "avatarUrl", "avatarPath", "avatarConfig", "theme", "background", "backgroundUrl", "musicUrl", "musicName"]) {
    if (Object.prototype.hasOwnProperty.call(data, key)) allowed[key] = data[key];
  }
  allowed.updatedAt = serverTimestamp();
  await setDoc(doc(db, "users", uid), allowed, { merge: true });
  return getUserProfile(uid);
}

/** Looks up a uid from a public @username (Phase 6 profile links). */
export async function getUidByUsername(username) {
  if (!username) return null;
  const snap = await getDoc(doc(db, "usernames", username.trim().toLowerCase()));
  return snap.exists() ? snap.data().uid : null;
}

export async function ensureProfileFields(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() : {};
  const patch = {};
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in data)) patch[key] = value;
  }
  if (!snap.exists()) patch.createdAt = serverTimestamp();
  if (Object.keys(patch).length) await setDoc(ref, patch, { merge: true });
  return { ...defaults, ...data, ...patch };
}
