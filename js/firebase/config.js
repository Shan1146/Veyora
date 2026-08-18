// =========================================================
// VEYORA — Firebase Configuration
// =========================================================
// Replace every value below with your own Firebase project's
// config (Firebase Console → Project Settings → General →
// "Your apps" → SDK setup and configuration).
//
// These are safe to expose client-side — Firebase config
// values are not secrets. Actual access control is enforced
// by firestore.rules and storage.rules.
// =========================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrEhMz6FTW3qpq32zkLBX_kzbZuPPZjkw",
  authDomain: "veyora-90dbb.firebaseapp.com",
  projectId: "veyora-90dbb",
  storageBucket: "veyora-90dbb.firebasestorage.app",
  messagingSenderId: "307044514594",
  appId: "1:307044514594:web:e1a7d9dffe042bf0b8837b"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
