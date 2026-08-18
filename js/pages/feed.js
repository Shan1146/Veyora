import { requireAuth } from "../utils/guards.js";
import { ensureProfileFields } from "../firebase/profile.js";
import { createPost, getFeedPosts, getFollowingFeedPosts } from "../firebase/posts.js";
import { getFollowingIds } from "../firebase/follow.js";
import { createPostCard } from "../social/post-card.js";
import { POST_IMAGES } from "../social/post-assets.js";
import { mountNotificationBadge } from "../social/nav-badge.js";

const user = await requireAuth();
const profile = await ensureProfileFields(user.uid);
const ctx = { currentUser: user, currentProfile: profile };

document.body.classList.remove("auth-pending");
mountNotificationBadge(user.uid);

// ---- Nav + composer avatar ----
const avatarUrl = profile.avatarPath || profile.avatarUrl;
for (const el of [document.getElementById("nav-avatar-button"), document.getElementById("composer-avatar")]) {
  if (!el) continue;
  if (avatarUrl) {
    el.style.backgroundImage = `url("${avatarUrl}")`;
    el.classList.add("has-image");
  } else {
    el.textContent = (profile.nickname || "V").charAt(0).toUpperCase();
  }
}

// ---- Composer ----
const composer = document.getElementById("composer");
const textArea = document.getElementById("composer-text");
const counter = document.getElementById("composer-count");
const message = document.getElementById("composer-message");
const submitBtn = document.getElementById("composer-submit");
const galleryToggle = document.getElementById("composer-image-btn");
const gallery = document.getElementById("composer-gallery");
const preview = document.getElementById("composer-image-preview");
let selectedImage = null;

gallery.innerHTML = POST_IMAGES.filter((img) => img.src).map((img) => `
  <button type="button" data-src="${img.src}" title="${img.name}">
    <img src="${img.src}" alt="${img.name}">
  </button>
`).join("");

textArea.addEventListener("input", () => {
  counter.textContent = textArea.value.length;
});

galleryToggle.addEventListener("click", () => {
  gallery.style.display = gallery.style.display === "grid" ? "none" : "grid";
});

gallery.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-src]");
  if (!btn) return;
  gallery.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedImage = btn.dataset.src;
  preview.style.display = "flex";
  preview.innerHTML = `<img src="${selectedImage}" alt=""><button type="button" id="composer-remove-image">Remove</button>`;
  document.getElementById("composer-remove-image").addEventListener("click", () => {
    selectedImage = null;
    preview.style.display = "none";
    preview.innerHTML = "";
    gallery.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
  });
  gallery.style.display = "none";
});

composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  message.textContent = "";
  const text = textArea.value;
  if (!text.trim()) {
    message.textContent = "Write something before posting.";
    return;
  }
  submitBtn.disabled = true;
  try {
    const postId = await createPost(user.uid, profile, { text, image: selectedImage });
    const newPost = {
      id: postId,
      authorId: user.uid,
      authorUsername: profile.username,
      authorNickname: profile.nickname,
      authorAvatar: avatarUrl,
      text: text.trim(),
      image: selectedImage,
      createdAt: new Date(),
      editedAt: null,
    };
    prependPost(newPost);
    textArea.value = "";
    counter.textContent = "0";
    selectedImage = null;
    preview.style.display = "none";
    preview.innerHTML = "";
  } catch (err) {
    console.error("VEYORA post error:", err);
    message.textContent = err.message || "Could not publish your post.";
  } finally {
    submitBtn.disabled = false;
  }
});

// ---- Feed ----
const feedList = document.getElementById("feed-list");
const feedStatus = document.getElementById("feed-status");
const tabs = document.querySelectorAll(".social-tabs button");
let activeTab = "newest";

function prependPost(post) {
  feedList.prepend(createPostCard(post, ctx));
  const emptyEl = feedList.querySelector(".social-empty");
  if (emptyEl) emptyEl.remove();
}

function renderEmpty(title, body) {
  feedList.innerHTML = `<div class="social-empty"><h3>${title}</h3><p>${body}</p></div>`;
}

async function loadTab(tab) {
  activeTab = tab;
  tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  feedStatus.textContent = "Loading…";
  feedList.innerHTML = "";
  try {
    let posts;
    if (tab === "newest") {
      posts = await getFeedPosts();
    } else {
      const followingIds = await getFollowingIds(user.uid);
      if (!followingIds.length) {
        feedStatus.textContent = "";
        renderEmpty("Follow someone to fill this up", "Visit a profile and hit Follow — their posts will show up here.");
        return;
      }
      posts = await getFollowingFeedPosts(followingIds);
    }
    feedStatus.textContent = "";
    if (!posts.length) {
      renderEmpty("No posts yet", tab === "newest" ? "Be the first to share something." : "Nobody you follow has posted yet.");
      return;
    }
    posts.forEach((post) => feedList.appendChild(createPostCard(post, ctx)));
  } catch (err) {
    console.error("VEYORA feed error:", err);
    feedStatus.textContent = "Could not load the feed. Check Firestore rules.";
  }
}

tabs.forEach((btn) => btn.addEventListener("click", () => {
  if (btn.dataset.tab !== activeTab) loadTab(btn.dataset.tab);
}));

loadTab("newest");
