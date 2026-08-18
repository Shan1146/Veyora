// =========================================================
// VEYORA — Phase 6: Following
// Edges live at follows/{followerId}_{followingId} so a
// duplicate follow can't be created (see firestore.rules).
// =========================================================
import { db } from "./config.js";
import { createNotification, removeNotification } from "./notifications.js";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  documentId,
  serverTimestamp,
  getCountFromServer,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const FOLLOWS = collection(db, "follows");
const edgeId = (followerId, followingId) => `${followerId}_${followingId}`;

export async function followUser(followerId, followingId) {
  if (followerId === followingId) throw new Error("You can't follow yourself.");
  await setDoc(doc(db, "follows", edgeId(followerId, followingId)), {
    followerId,
    followingId,
    createdAt: serverTimestamp(),
  });
  await createNotification(followingId, { type: "follow" });
}

export async function unfollowUser(followerId, followingId) {
  await deleteDoc(doc(db, "follows", edgeId(followerId, followingId)));
  await removeNotification(followingId, { type: "follow", fromUserId: followerId });
}

export async function isFollowing(followerId, followingId) {
  const snap = await getDoc(doc(db, "follows", edgeId(followerId, followingId)));
  return snap.exists();
}

export async function getFollowersCount(uid) {
  const snap = await getCountFromServer(query(FOLLOWS, where("followingId", "==", uid)));
  return snap.data().count;
}

export async function getFollowingCount(uid) {
  const snap = await getCountFromServer(query(FOLLOWS, where("followerId", "==", uid)));
  return snap.data().count;
}

/** Uids of everyone this user follows (capped at 30 for the feed's "in" query). */
export async function getFollowingIds(uid, max = 30) {
  const snap = await getDocs(query(FOLLOWS, where("followerId", "==", uid)));
  return snap.docs.map((d) => d.data().followingId).slice(0, max);
}

export async function getFollowerIds(uid) {
  const snap = await getDocs(query(FOLLOWS, where("followingId", "==", uid)));
  return snap.docs.map((d) => d.data().followerId);
}

/** Resolves a list of uids to lightweight profile cards for followers/following lists. */
export async function getProfilesByIds(uids) {
  if (!uids.length) return [];
  const chunks = [];
  for (let i = 0; i < uids.length; i += 30) chunks.push(uids.slice(i, i + 30));

  const results = [];
  for (const chunk of chunks) {
    const snap = await getDocs(query(collection(db, "users"), where(documentId(), "in", chunk)));
    snap.docs.forEach((d) => results.push({ uid: d.id, ...d.data() }));
  }
  return results;
}
