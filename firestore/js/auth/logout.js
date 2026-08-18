// =========================================================
// VEYORA — Standalone Firebase logout
// This module is intentionally independent from settings.js.
// =========================================================

import { logoutUser } from "../firebase/auth.js";

let logoutInProgress = false;

async function handleLogout(event) {
  event.preventDefault();

  if (logoutInProgress) return;
  logoutInProgress = true;

  const button = event.currentTarget;
  const originalHtml = button.innerHTML;

  try {
    button.disabled = true;
    button.textContent = "Signing out...";

    await logoutUser();

    // Relative redirect works locally and in deployed subfolders.
    window.location.replace("./index.html");
  } catch (error) {
    console.error("Logout failed:", error);
    button.disabled = false;
    button.innerHTML = originalHtml;
    alert(`Could not sign out: ${error.message || "Unknown error"}`);
  } finally {
    logoutInProgress = false;
  }
}

function initLogout() {
  const buttons = document.querySelectorAll('[data-action="logout"], #logout');

  buttons.forEach((button) => {
    if (button.dataset.logoutBound === "true") return;
    button.dataset.logoutBound = "true";
    button.addEventListener("click", handleLogout);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLogout, { once: true });
} else {
  initLogout();
}
