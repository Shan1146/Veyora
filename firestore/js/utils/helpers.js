// =========================================================
// VEYORA — Shared helpers
// =========================================================

/** Shows an inline form message (error or success). */
export function showFormMessage(el, text, type = "error") {
  el.textContent = text;
  el.classList.remove("error", "success");
  el.classList.add(type, "visible");
}

/** Hides an inline form message. */
export function hideFormMessage(el) {
  el.classList.remove("visible");
  el.textContent = "";
}

/** Toggles a button's loading state (spinner + disabled). */
export function setButtonLoading(button, isLoading) {
  button.classList.toggle("is-loading", isLoading);
  button.disabled = isLoading;
}

/**
 * Maps Firebase Auth error codes to user-facing copy.
 * Firebase's raw messages are developer-facing, not UI copy.
 */
export function friendlyAuthError(error) {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "An account with that email already exists.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password. Try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
  };

  return messages[code] || error?.message || "Something went wrong. Try again.";
}

/** Basic client-side email format check (server/Firebase still validates). */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Username rule: 3–20 chars, letters/numbers/underscore only,
 * must start with a letter. Keeps usernames URL- and
 * mention-friendly (@username).
 */
export function isValidUsername(username) {
  return /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(username);
}
