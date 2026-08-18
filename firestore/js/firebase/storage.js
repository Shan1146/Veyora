// VEYORA — Firebase Storage helpers for profile avatars
import { storage } from "./config.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadAvatar(uid, file) {
  if (!file) throw new Error("Choose an image first.");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Avatar must be JPG, PNG, or WebP.");
  if (file.size > MAX_AVATAR_BYTES) throw new Error("Avatar must be 5 MB or smaller.");

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const avatarRef = ref(storage, `avatars/${uid}/avatar.${extension}`);
  await uploadBytes(avatarRef, file, { contentType: file.type, cacheControl: "public,max-age=3600" });
  return getDownloadURL(avatarRef);
}

export async function deleteAvatarFiles(uid) {
  const extensions = ["jpg", "png", "webp"];
  await Promise.allSettled(
    extensions.map((extension) => deleteObject(ref(storage, `avatars/${uid}/avatar.${extension}`)))
  );
}
