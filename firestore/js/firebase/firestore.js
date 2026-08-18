

// ===== VEYORA PHASE 4: WATCHLIST =====
import {
    collection,
    doc,
    addDoc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

export async function addToWatchlist(db, userId, item) {
    const ref = collection(db, "users", userId, "watchlist");
    const existing = await getDocs(query(
        ref,
        where("source", "==", item.source),
        where("externalId", "==", String(item.externalId))
    ));

    if (!existing.empty) {
        return { id: existing.docs[0].id, alreadyExists: true };
    }

    const docRef = await addDoc(ref, {
        source: item.source,
        externalId: String(item.externalId),
        title: item.title || "",
        poster: item.poster || "",
        type: item.type || "unknown",
        status: item.status || "plan_to_watch",
        progress: Number(item.progress || 0),
        totalEpisodes: item.totalEpisodes == null ? null : Number(item.totalEpisodes),
        rating: item.rating == null ? null : Number(item.rating),
        favorite: Boolean(item.favorite),
        addedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });

    return { id: docRef.id, alreadyExists: false };
}

export async function getWatchlist(db, userId, filters = {}) {
    const ref = collection(db, "users", userId, "watchlist");
    const snap = await getDocs(query(ref, orderBy("addedAt", "desc")));

    let items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (filters.type && filters.type !== "all") {
        items = items.filter(item => item.type === filters.type);
    }

    if (filters.status && filters.status !== "all") {
        items = items.filter(item => item.status === filters.status);
    }

    if (filters.favorite === true) {
        items = items.filter(item => item.favorite === true);
    }

    return items;
}

export async function getWatchlistItem(db, userId, itemId) {
    const snap = await getDoc(doc(db, "users", userId, "watchlist", itemId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateWatchlistItem(db, userId, itemId, changes) {
    const allowed = {};
    const keys = ["status", "progress", "rating", "favorite"];
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(changes, key)) {
            allowed[key] = changes[key];
        }
    }
    allowed.updatedAt = serverTimestamp();

    await updateDoc(doc(db, "users", userId, "watchlist", itemId), allowed);
}

export async function removeFromWatchlist(db, userId, itemId) {
    await deleteDoc(doc(db, "users", userId, "watchlist", itemId));
}
