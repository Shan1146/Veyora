import { requireAuth } from "../utils/guards.js";
import { ensureProfileFields } from "../firebase/profile.js";
import { db } from "../firebase/config.js";
import { getWatchlist } from "../firebase/watchlist.js";
import { getFollowersCount, getFollowingCount } from "../firebase/follow.js";
import { getUserPosts } from "../firebase/posts.js";
import { createPostCard } from "../social/post-card.js";
import { mountNotificationBadge } from "../social/nav-badge.js";

const user = await requireAuth();
mountNotificationBadge(user.uid);

try {
  const profile = await ensureProfileFields(user.uid);

  document.getElementById("profile-nickname").textContent = profile.nickname || "Veyora User";
  document.getElementById("profile-username").textContent = `@${profile.username || "username"}`;
  document.getElementById("profile-bio").textContent = profile.bio || "No bio yet.";
  document.getElementById("nav-nickname").textContent = profile.nickname || "Profile";

  const avatarUrl = profile.avatarPath || profile.avatarUrl;
  for (const element of [document.getElementById("profile-avatar"), document.getElementById("nav-avatar-button")]) {
    if (avatarUrl) {
      element.style.backgroundImage = `url("${avatarUrl}")`;
      element.classList.add("has-image");
      element.textContent = "";
    } else {
      element.style.backgroundImage = "";
      element.classList.remove("has-image");
      element.textContent = (profile.nickname || "V").charAt(0).toUpperCase();
    }
  }

  document.getElementById("nav-avatar-button").addEventListener("click", () => {
    window.location.href = "profile.html";
  });

  // Phase 4.5: profile statistics now come from the same Firestore library.
  const items = await getWatchlist(db, user.uid);
  const stats = document.querySelectorAll(".profile-stats strong");
  if (stats.length >= 4) {
    stats[0].textContent = items.filter(x => x.type === "anime").length;
    stats[1].textContent = items.filter(x => x.type === "tv").length;
    stats[2].textContent = items.filter(x => x.type === "movie").length;
    // Friends stays 0 until the Friends phase.
    stats[3].textContent = "0";
  }

  const about = document.querySelector(".profile-grid .panel-copy");
  if (about) {
    about.textContent = `${items.length} title${items.length === 1 ? "" : "s"} in your library. Your favorites, friends, and profile customization will appear here as VEYORA grows.`;
  }

  document.body.classList.remove("auth-pending");

  // Phase 6: follow counts + own posts.
  try {
    const [followers, followingCount, myPosts] = await Promise.all([
      getFollowersCount(user.uid),
      getFollowingCount(user.uid),
      getUserPosts(user.uid),
    ]);
    document.getElementById("stat-followers").textContent = followers;
    document.getElementById("stat-following").textContent = followingCount;
    document.getElementById("stat-posts").textContent = myPosts.length;

    const postsStatus = document.getElementById("my-posts-status");
    const postsList = document.getElementById("my-posts");
    if (!myPosts.length) {
      postsStatus.textContent = "";
      postsList.innerHTML = `<div class="social-empty"><h3>No posts yet</h3><p>Share what you're watching from the Feed page.</p></div>`;
    } else {
      postsStatus.textContent = "";
      const ctx = { currentUser: user, currentProfile: profile, onDeleted: () => {
        document.getElementById("stat-posts").textContent = postsList.querySelectorAll(".post-card").length;
      } };
      myPosts.forEach((post) => postsList.appendChild(createPostCard(post, ctx)));
    }
  } catch (e) {
    console.error("VEYORA social stats error:", e);
  }
} catch (error) {
  console.error("VEYORA profile error:", error);
  document.body.classList.remove("auth-pending");
  const bio = document.getElementById("profile-bio");
  if (bio) bio.textContent = "Could not load your profile. Refresh and try again.";
}
