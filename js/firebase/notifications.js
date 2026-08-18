// =========================================================
// VEYORA — Phase 6: Notifications
// Each user's inbox lives at notifications/{uid}/items/{id}.
// Entries are written by whoever caused them (the follower,
// liker, or commenter) directly into the recipient's inbox —
// firestore.rules only lets that actor set toUserId to the
// recipient, fromUserId to themselves, and read to false.
// =========================================================
import { auth, db } from "./config.js";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getCountFromServer,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function inboxRef(uid) {
  return collection(db, "notifications", uid, "items");
}

/**
 * Creates one notification in `toUserId`'s inbox on behalf of
 * the currently signed-in user (the actor). `extra` can carry
 * postId / commentId so the UI can deep-link.
 */
export async function createNotification(toUserId, extra = {}) {
  const actor = auth.currentUser;
  if (!actor || actor.uid === toUserId) return; // never notify yourself
  await addDoc(inboxRef(toUserId), {
    toUserId,
    fromUserId: actor.uid,
    fromUsername: actor.displayName ? actor.displayName : null,
    read: false,
    createdAt: serverTimestamp(),
    ...extra,
  });
}

/**
 * Best-effort cleanup for reversible actions (unlike, unfollow):
 * removes a matching not-yet-read notification if one exists.
 */
export async function removeNotification(toUserId, match) {
  const actor = auth.currentUser;
  if (!actor) return;
  let q = query(
    inboxRef(toUserId),
    where("fromUserId", "==", match.fromUserId || actor.uid),
    where("type", "==", match.type)
  );
  const snap = await getDocs(q);
  const target = snap.docs.find((d) => !match.postId || d.data().postId === match.postId);
  if (target) await deleteDoc(target.ref);
}

export async function getNotifications(uid, max = 40) {
  const snap = await getDocs(query(inboxRef(uid), orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function markAsRead(uid, notifId) {
  await updateDoc(doc(db, "notifications", uid, "items", notifId), { read: true });
}

export async function markAllAsRead(uid) {
  const snap = await getDocs(query(inboxRef(uid), where("read", "==", false)));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function getUnreadCount(uid) {
  const snap = await getCountFromServer(query(inboxRef(uid), where("read", "==", false)));
  return snap.data().count;
}

/** Live-updating unread badge. Returns an unsubscribe function. */
export function watchUnreadCount(uid, callback) {
  const q = query(inboxRef(uid), where("read", "==", false));
  return onSnapshot(q, (snap) => callback(snap.size), () => callback(0));
}
