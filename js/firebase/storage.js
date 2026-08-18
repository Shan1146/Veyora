// VEYORA Phase 5 — Firebase Storage helpers
import {
  getStorage, ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

export const storage = getStorage();

async function removeIfExists(path) {
  try {
    await deleteObject(ref(storage, path));
  } catch (e) {
    // Ignore a missing old file.
    if (e?.code !== "storage/object-not-found") throw e;
  }
}

export async function replaceAvatar(uid, file) {
  if (!file) throw new Error("No avatar file selected.");
  if (!file.type.startsWith("image/")) throw new Error("Avatar must be an image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Avatar must be 5 MB or smaller.");

  const path = `users/${uid}/avatar`;
  await removeIfExists(path);

  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return await getDownloadURL(fileRef);
}

export async function replaceProfileMusic(uid, file) {
  if (!file) throw new Error("No music file selected.");
  const allowed = ["audio/mpeg","audio/mp3","audio/wav","audio/ogg","audio/webm","audio/mp4","audio/x-m4a"];
  if (!allowed.includes(file.type) && !/\.(mp3|wav|ogg|webm|m4a)$/i.test(file.name)) {
    throw new Error("Please choose an audio file such as MP3, WAV, OGG, or M4A.");
  }
  if (file.size > 15 * 1024 * 1024) throw new Error("Music must be 15 MB or smaller.");

  // One fixed path means replacing the music replaces the old file.
  const path = `users/${uid}/music`;
  await removeIfExists(path);

  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return await getDownloadURL(fileRef);
}

export async function deleteProfileMusic(uid) {
  await removeIfExists(`users/${uid}/music`);
}
