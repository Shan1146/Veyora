// =========================================================
// VEYORA — Login page controller
// =========================================================

import { loginUser } from "../firebase/auth.js";
import { redirectIfAuthed } from "../utils/guards.js";
import {
  showFormMessage,
  hideFormMessage,
  setButtonLoading,
  friendlyAuthError,
  isValidEmail,
} from "../utils/helpers.js";

redirectIfAuthed("./home.html");

const form = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const submitBtn = document.getElementById("login-submit");
const message = document.getElementById("login-message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideFormMessage(message);

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!isValidEmail(email)) {
    showFormMessage(message, "Enter a valid email address.");
    return;
  }
  if (!password) {
    showFormMessage(message, "Enter your password.");
    return;
  }

  setButtonLoading(submitBtn, true);
  try {
    await loginUser({ email, password });
    window.location.replace("./home.html");
  } catch (error) {
    showFormMessage(message, friendlyAuthError(error));
  } finally {
    setButtonLoading(submitBtn, false);
  }
});
