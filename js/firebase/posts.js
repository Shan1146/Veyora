// =========================================================
// VEYORA — Phase 6: Posts, Likes & Comments
// =========================================================
import { db } from "./config.js";
import { createNotification, removeNotification } from "./notifications.js";
import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  documentId,
  serverTimestamp,
  getCountFromServer,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const POSTS = collection(db, "posts");
const TEXT_MAX = 500;

/** Author snapshot embedded on every post/comment so cards render without extra reads. */
function authorStamp(profile, uid) {
  return {
    authorId: uid,
    authorUsername: profile.username || "user",
    authorNickname: profile.nickname || "Veyora User",
    authorAvatar: profile.avatarPath || profile.avatarUrl || "assets/avatars/avatar01.svg",
  };
}

// ---------------------------------------------------------
// Posts
// ---------------------------------------------------------

export async function createPost(uid, profile, { text, image = null }) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Write something before posting.");
  if (trimmed.length > TEXT_MAX) throw new Error(`Posts are limited to ${TEXT_MAX} characters.`);

  const docRef = await addDoc(POSTS, {
    ...authorStamp(profile, uid),
    text: trimmed,
    image: image || null,
    createdAt: serverTimestamp(),
    editedAt: null,
  });
  return docRef.id;
}

export async function updatePost(postId, uid, { text, image }) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Post text can't be empty.");
  if (trimmed.length > TEXT_MAX) throw new Error(`Posts are limited to ${TEXT_MAX} characters.`);

  await updateDoc(doc(db, "posts", postId), {
    text: trimmed,
    image: image || null,
    editedAt: serverTimestamp(),
  });
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, "posts", postId));
}

export async function getPost(postId) {
  const snap = await getDoc(doc(db, "posts", postId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Newest-first feed of every post on VEYORA. */
export async function getFeedPosts(max = 30) {
  const snap = await getDocs(query(POSTS, orderBy("createdAt", "desc"), limit(max)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Newest-first feed limited to a set of followed author ids. */
export async function getFollowingFeedPosts(authorIds, max = 30) {
  if (!authorIds.length) return [];
  // Firestore "in" queries cap at 30 values.
  const capped = authorIds.slice(0, 30);
  const snap = await getDocs(
    query(POSTS, where("authorId", "in", capped), orderBy("createdAt", "desc"), limit(max))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** All posts by one author, newest first — used on profile pages. */
export async function getUserPosts(uid, max = 50) {
  const snap = await getDocs(
    query(POSTS, where("authorId", "==", uid), orderBy("createdAt", "desc"), limit(max))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ---------------------------------------------------------
// Likes
// ---------------------------------------------------------

export async function likePost(postId, uid, { postAuthorId } = {}) {
  await setDoc(doc(db, "posts", postId, "likes", uid), {
    uid,
    createdAt: serverTimestamp(),
  });
  if (postAuthorId && postAuthorId !== uid) {
    await createNotification(postAuthorId, {
      type: "like",
      postId,
    });
  }
}

export async function unlikePost(postId, uid, { postAuthorId } = {}) {
  await deleteDoc(doc(db, "posts", postId, "likes", uid));
  if (postAuthorId && postAuthorId !== uid) {
    await removeNotification(postAuthorId, { type: "like", postId, fromUserId: uid });
  }
}

export async function hasLiked(postId, uid) {
  const snap = await getDoc(doc(db, "posts", postId, "likes", uid));
  return snap.exists();
}

export async function getLikeCount(postId) {
  const snap = await getCountFromServer(collection(db, "posts", postId, "likes"));
  return snap.data().count;
}

// ---------------------------------------------------------
// Comments
// ---------------------------------------------------------

export async function addComment(postId, uid, profile, text, { postAuthorId } = {}) {
  const trimmed = (text || "").trim();
  if (!trimmed) throw new Error("Write a comment first.");
  if (trimmed.length > 300) throw new Error("Comments are limited to 300 characters.");

  const ref = await addDoc(collection(db, "posts", postId, "comments"), {
    ...authorStamp(profile, uid),
    text: trimmed,
    createdAt: serverTimestamp(),
  });

  if (postAuthorId && postAuthorId !== uid) {
    await createNotification(postAuthorId, { type: "comment", postId, commentId: ref.id });
  }
  return ref.id;
}

export async function deleteComment(postId, commentId) {
  await deleteDoc(doc(db, "posts", postId, "comments", commentId));
}

export async function getComments(postId, max = 50) {
  const snap = await getDocs(
    query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"), limit(max))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCommentCount(postId) {
  const snap = await getCountFromServer(collection(db, "posts", postId, "comments"));
  return snap.data().count;
}
