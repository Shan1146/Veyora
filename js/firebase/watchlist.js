// VEYORA — Firestore watchlist helpers
import {
  collection, doc, setDoc, getDocs, query, where, orderBy,
  updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function cleanId(source, externalId) {
  return `${source}_${String(externalId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export async function addToWatchlist(db, uid, item) {
  if (!uid) throw new Error("You are not signed in. Please log in again.");

  const ref = collection(db, "users", uid, "watchlist");
  const externalId = String(item.externalId);
  const duplicate = await getDocs(query(
    ref,
    where("source", "==", item.source),
    where("externalId", "==", externalId)
  ));

  if (!duplicate.empty) {
    return { id: duplicate.docs[0].id, alreadyExists: true };
  }

  const id = cleanId(item.source, externalId);

  await setDoc(doc(db, "users", uid, "watchlist", id), {
    source: item.source,
    externalId,
    title: item.title || "",
    poster: item.poster || "",
    type: item.type || "unknown",
    status: "plan_to_watch",
    progress: 0,
    rating: null,
    favorite: false,
    addedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return { id, alreadyExists: false };
}

export async function getWatchlist(db, uid) {
  const ref = collection(db, "users", uid, "watchlist");
  const snap = await getDocs(query(ref, orderBy("addedAt", "desc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateWatchlistItem(db, uid, itemId, changes) {
  await updateDoc(doc(db, "users", uid, "watchlist", itemId), {
    ...changes,
    updatedAt: serverTimestamp()
  });
}

export async function removeFromWatchlist(db, uid, itemId) {
  await deleteDoc(doc(db, "users", uid, "watchlist", itemId));
}
