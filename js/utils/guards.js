// =========================================================
// VEYORA — Route guards
// Call one of these at the top of a page's script to enforce
// its auth requirement. Both resolve the "loading" flicker by
// keeping the page hidden (via the .auth-pending class on
// <body>) until Firebase reports the real auth state.
// =========================================================

import { watchAuthState } from "../firebase/auth.js";

/**
 * Use on protected pages (home, profile, settings, etc).
 * Redirects to the login page if no user is signed in.
 */
export function requireAuth() {
  return new Promise((resolve) => {
    const unsubscribe = watchAuthState((user) => {
      unsubscribe();
      if (!user) {
        window.location.href = "/index.html";
        return;
      }
      document.body.classList.remove("auth-pending");
      resolve(user);
    });
  });
}

/**
 * Use on the landing/login and register pages.
 * Redirects to home if a user is already signed in, so a
 * logged-in visitor never sees the login form again.
 */
export function redirectIfAuthed(destination = "/home.html") {
  return new Promise((resolve) => {
    const unsubscribe = watchAuthState((user) => {
      unsubscribe();
      if (user) {
        window.location.href = destination;
        return;
      }
      document.body.classList.remove("auth-pending");
      resolve(null);
    });
  });
}
