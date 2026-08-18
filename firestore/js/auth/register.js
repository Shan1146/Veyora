// =========================================================
// VEYORA — Register page controller
// =========================================================

import { registerUser } from "../firebase/auth.js";
import { redirectIfAuthed } from "../utils/guards.js";
import {
  showFormMessage,
  hideFormMessage,
  setButtonLoading,
  friendlyAuthError,
  isValidEmail,
  isValidUsername,
} from "../utils/helpers.js";

redirectIfAuthed("/home.html");

const form = document.getElementById("register-form");
const nicknameInput = document.getElementById("register-nickname");
const usernameInput = document.getElementById("register-username");
const emailInput = document.getElementById("register-email");
const passwordInput = document.getElementById("register-password");
const submitBtn = document.getElementById("register-submit");
const message = document.getElementById("register-message");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideFormMessage(message);

  const nickname = nicknameInput.value.trim();
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!nickname) {
    showFormMessage(message, "Enter a nickname — this is your public display name.");
    return;
  }
  if (!isValidUsername(username)) {
    showFormMessage(
      message,
      "Username must be 3–20 characters, start with a letter, and use only letters, numbers, or underscores."
    );
    return;
  }
  if (!isValidEmail(email)) {
    showFormMessage(message, "Enter a valid email address.");
    return;
  }
  if (password.length < 6) {
    showFormMessage(message, "Password should be at least 6 characters.");
    return;
  }

  setButtonLoading(submitBtn, true);
  try {
    await registerUser({ email, password, username, nickname });
    window.location.href = "/home.html";
  } catch (error) {
    showFormMessage(message, friendlyAuthError(error));
  } finally {
    setButtonLoading(submitBtn, false);
  }
});
