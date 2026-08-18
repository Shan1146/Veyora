// =========================================================
// VEYORA — Auth helpers
// Thin wrapper around Firebase Authentication + the initial
// Firestore user-document write on registration.
// =========================================================

import { auth, db } from "./config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

/**
 * Checks Firestore to see if a username is already taken.
 * Usernames are stored lowercase in usernames/{username} → { uid }
 * for fast uniqueness lookups without a query.
 */
async function isUsernameTaken(username) {
  const ref = doc(db, "usernames", username.toLowerCase());
  const snap = await getDoc(ref);
  return snap.exists();
}

/**
 * Registers a new VEYORA account:
 *  1. Validates the username is free.
 *  2. Creates the Firebase Auth user (email/password).
 *  3. Sets the Auth display name to the nickname.
 *  4. Writes the users/{uid} Firestore document.
 *  5. Reserves usernames/{username} → { uid }.
 */
export async function registerUser({ email, password, username, nickname }) {
  const normalizedUsername = username.trim().toLowerCase();

  if (await isUsernameTaken(normalizedUsername)) {
    throw new Error("That username is already taken.");
  }

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName: nickname.trim() });

  await setDoc(doc(db, "users", user.uid), {
    username: normalizedUsername,
    nickname: nickname.trim(),
    email: user.email,
    avatarUrl: null,
    bio: "",
    theme: "dark",
    background: null,
    musicUrl: null,
    privacy: {
      profile: "public",
      anime: "public",
      movies: "public",
      dramas: "public",
      favorites: "public",
      activity: "public",
      music: "public",
    },
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(db, "usernames", normalizedUsername), { uid: user.uid });

  return user;
}

/** Logs in with email + password. */
export async function loginUser({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/** Logs the current user out. */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Subscribes to auth state changes.
 * Returns the unsubscribe function.
 */
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
