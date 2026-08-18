import { requireAuth } from "../utils/guards.js";
import { getUserProfile, updateUserProfile } from "../firebase/profile.js";
import { uploadAvatar, deleteAvatarFiles } from "../firebase/storage.js";
import { showFormMessage, hideFormMessage, setButtonLoading } from "../utils/helpers.js";

const user = await requireAuth();
let profile = await getUserProfile(user.uid);

const username = document.getElementById("username");
const nickname = document.getElementById("nickname");
const bio = document.getElementById("bio");
const bioCount = document.getElementById("bio-count");
const preview = document.getElementById("avatar-preview");
const avatarInput = document.getElementById("avatar-input");
const avatarMessage = document.getElementById("avatar-message");
const profileMessage = document.getElementById("profile-message");
const saveButton = document.getElementById("save-profile");

username.value = profile.username || "";
nickname.value = profile.nickname || "";
bio.value = profile.bio || "";
updateBioCount();
setAvatarPreview(profile.avatarUrl, profile.nickname);

function updateBioCount() {
  bioCount.textContent = `${bio.value.length} / 160`;
}

function setAvatarPreview(url, name = "V") {
  if (url) {
    preview.style.backgroundImage = `url("${url}")`;
    preview.classList.add("has-image");
    preview.textContent = "";
  } else {
    preview.style.backgroundImage = "";
    preview.classList.remove("has-image");
    preview.textContent = (name || "V").charAt(0).toUpperCase();
  }
}

bio.addEventListener("input", updateBioCount);

avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files?.[0];
  if (!file) return;
  hideFormMessage(avatarMessage);

  try {
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl, profile.nickname);
    const url = await uploadAvatar(user.uid, file);
    await updateUserProfile(user.uid, { avatarUrl: url });
    profile = { ...profile, avatarUrl: url };
    setAvatarPreview(url, profile.nickname);
    showFormMessage(avatarMessage, "Avatar updated.", "success");
  } catch (error) {
    setAvatarPreview(profile.avatarUrl, profile.nickname);
    showFormMessage(avatarMessage, error.message || "Avatar upload failed.");
  } finally {
    avatarInput.value = "";
  }
});

document.getElementById("remove-avatar").addEventListener("click", async () => {
  hideFormMessage(avatarMessage);
  try {
    await deleteAvatarFiles(user.uid);
    await updateUserProfile(user.uid, { avatarUrl: null });
    profile = { ...profile, avatarUrl: null };
    setAvatarPreview(null, profile.nickname);
    showFormMessage(avatarMessage, "Avatar removed.", "success");
  } catch (error) {
    showFormMessage(avatarMessage, error.message || "Could not remove avatar.");
  }
});

document.getElementById("profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  hideFormMessage(profileMessage);

  const nextNickname = nickname.value.trim();
  const nextBio = bio.value.trim();

  if (!nextNickname) {
    showFormMessage(profileMessage, "Nickname cannot be empty.");
    return;
  }
  if (nextNickname.length > 40) {
    showFormMessage(profileMessage, "Nickname must be 40 characters or fewer.");
    return;
  }

  setButtonLoading(saveButton, true);
  try {
    await updateUserProfile(user.uid, { nickname: nextNickname, bio: nextBio });
    profile = { ...profile, nickname: nextNickname, bio: nextBio };
    await import("https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js").then(({ updateProfile }) =>
      updateProfile(user, { displayName: nextNickname })
    );
    setAvatarPreview(profile.avatarUrl, profile.nickname);
    showFormMessage(profileMessage, "Profile saved successfully.", "success");
  } catch (error) {
    showFormMessage(profileMessage, error.message || "Could not save your profile.");
  } finally {
    setButtonLoading(saveButton, false);
  }
});

document.getElementById("settings-nav-avatar").style.backgroundImage = profile.avatarUrl ? `url("${profile.avatarUrl}")` : "";
if (!profile.avatarUrl) document.getElementById("settings-nav-avatar").textContent = (profile.nickname || "V").charAt(0).toUpperCase();
document.body.classList.remove("auth-pending");
