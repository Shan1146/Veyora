import { requireAuth } from "../utils/guards.js";
import { getUserProfile } from "../firebase/profile.js";

const user = await requireAuth();
const profile = await getUserProfile(user.uid);

document.getElementById("profile-nickname").textContent = profile.nickname || "Veyora User";
document.getElementById("profile-username").textContent = `@${profile.username || "username"}`;
document.getElementById("profile-bio").textContent = profile.bio || "No bio yet.";
document.getElementById("nav-nickname").textContent = profile.nickname || "Profile";

const avatarUrl = profile.avatarUrl;
for (const element of [document.getElementById("profile-avatar"), document.getElementById("nav-avatar-button")]) {
  if (avatarUrl) {
    element.style.backgroundImage = `url("${avatarUrl}")`;
    element.classList.add("has-image");
    element.textContent = "";
  } else {
    element.textContent = (profile.nickname || "V").charAt(0).toUpperCase();
  }
}

document.getElementById("nav-avatar-button").addEventListener("click", () => {
  window.location.href = "profile.html";
});

document.body.classList.remove("auth-pending");
