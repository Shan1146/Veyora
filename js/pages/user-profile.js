import { requireAuth } from "../utils/guards.js";
import { db } from "../firebase/config.js";
import { ensureProfileFields, getUserProfile, getUidByUsername } from "../firebase/profile.js";
import { getWatchlist } from "../firebase/watchlist.js";
import { getUserPosts } from "../firebase/posts.js";
import {
  followUser, unfollowUser, isFollowing,
  getFollowersCount, getFollowingCount, getFollowerIds, getFollowingIds, getProfilesByIds,
} from "../firebase/follow.js";
import { createPostCard } from "../social/post-card.js";
import { mountNotificationBadge } from "../social/nav-badge.js";
import { escapeHtml } from "../social/format.js";

const user = await requireAuth();
const myProfile = await ensureProfileFields(user.uid);
mountNotificationBadge(user.uid);

const navAvatar = document.getElementById("nav-avatar-button");
const myAvatarUrl = myProfile.avatarPath || myProfile.avatarUrl;
if (myAvatarUrl) {
  navAvatar.style.backgroundImage = `url("${myAvatarUrl}")`;
  navAvatar.classList.add("has-image");
} else {
  navAvatar.textContent = (myProfile.nickname || "V").charAt(0).toUpperCase();
}

const params = new URLSearchParams(location.search);
const usernameParam = (params.get("u") || "").trim().toLowerCase();
const tabStatus = document.getElementById("tab-status");

if (!usernameParam) {
  document.body.classList.remove("auth-pending");
  document.getElementById("profile-nickname").textContent = "No user specified";
  tabStatus.textContent = "Add ?u=username to the URL, or get here by clicking someone's name.";
} else {
  init();
}

async function init() {
  const targetUid = await getUidByUsername(usernameParam);

  if (!targetUid) {
    document.body.classList.remove("auth-pending");
    document.getElementById("profile-nickname").textContent = "User not found";
    tabStatus.textContent = `Nobody goes by @${usernameParam} on VEYORA.`;
    return;
  }

  if (targetUid === user.uid) {
    window.location.href = "profile.html";
    return;
  }

  const ctx = { currentUser: user, currentProfile: myProfile };
  const profile = await getUserProfile(targetUid);

  document.getElementById("profile-nickname").textContent = profile.nickname || "Veyora User";
  document.getElementById("profile-username").textContent = `@${profile.username || usernameParam}`;
  document.getElementById("profile-bio").textContent = profile.bio || "No bio yet.";
  document.title = `${profile.nickname || "Profile"} — VEYORA`;

  const avatarEl = document.getElementById("profile-avatar");
  const avatarUrl = profile.avatarPath || profile.avatarUrl;
  if (avatarUrl) {
    avatarEl.style.backgroundImage = `url("${avatarUrl}")`;
    avatarEl.classList.add("has-image");
  } else {
    avatarEl.textContent = (profile.nickname || "V").charAt(0).toUpperCase();
  }

  document.body.classList.remove("auth-pending");

  // ---- Follow button ----
  const followBtn = document.getElementById("follow-btn");
  followBtn.style.display = "";
  let following = await isFollowing(user.uid, targetUid);
  const paint = () => {
    followBtn.textContent = following ? "Following" : "Follow";
    followBtn.classList.toggle("btn-ghost", following);
    followBtn.classList.toggle("btn-primary", !following);
  };
  paint();

  followBtn.addEventListener("click", async () => {
    followBtn.disabled = true;
    try {
      if (following) {
        await unfollowUser(user.uid, targetUid);
        following = false;
        followersCount--;
      } else {
        await followUser(user.uid, targetUid);
        following = true;
        followersCount++;
      }
      paint();
      document.getElementById("stat-followers").textContent = followersCount;
    } catch (err) {
      console.error("VEYORA follow error:", err);
      alert(err.message || "Could not update follow status.");
    } finally {
      followBtn.disabled = false;
    }
  });

  // ---- Stats ----
  let followersCount = await getFollowersCount(targetUid);
  document.getElementById("stat-followers").textContent = followersCount;
  document.getElementById("stat-following").textContent = await getFollowingCount(targetUid);

  const [posts, library] = await Promise.all([
    getUserPosts(targetUid),
    getWatchlist(db, targetUid).catch(() => []),
  ]);
  document.getElementById("stat-posts").textContent = posts.length;
  document.getElementById("stat-library").textContent = library.length;

  // ---- Tabs ----
  const tabs = document.querySelectorAll(".social-tabs button");
  const panels = {
    posts: document.getElementById("tab-posts"),
    library: document.getElementById("tab-library"),
    followers: document.getElementById("tab-followers"),
    following: document.getElementById("tab-following"),
  };
  const loaded = { posts: false, library: false, followers: false, following: false };

  function showTab(name) {
    tabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    Object.entries(panels).forEach(([key, el]) => { el.style.display = key === name ? "" : "none"; });
    if (!loaded[name]) loadTab(name);
  }

  async function loadTab(name) {
    loaded[name] = true;
    if (name === "posts") {
      if (!posts.length) {
        panels.posts.innerHTML = `<div class="social-empty"><h3>No posts yet</h3><p>${escapeHtml(profile.nickname || "This user")} hasn't posted anything.</p></div>`;
      } else {
        posts.forEach((post) => panels.posts.appendChild(createPostCard(post, ctx)));
      }
    } else if (name === "library") {
      if (!library.length) {
        panels.library.innerHTML = `<div class="social-empty"><h3>Empty library</h3><p>Nothing saved yet.</p></div>`;
      } else {
        panels.library.innerHTML = library.slice(0, 60).map((item) => `
          <div>
            <img src="${escapeHtml(item.poster || "assets/images/default-poster.svg")}" alt="">
            <p style="font-size:.85rem;margin-top:6px;color:var(--text-muted)">${escapeHtml(item.title || "")}</p>
          </div>
        `).join("");
      }
    } else if (name === "followers" || name === "following") {
      const ids = name === "followers" ? await getFollowerIds(targetUid) : await getFollowingIds(targetUid, 1000);
      if (!ids.length) {
        panels[name].innerHTML = `<div class="social-empty"><h3>Nobody here yet</h3><p>${name === "followers" ? "No followers yet." : "Not following anyone yet."}</p></div>`;
        return;
      }
      const people = await getProfilesByIds(ids);
      panels[name].innerHTML = "";
      people.forEach((p) => panels[name].appendChild(renderPersonRow(p)));
    }
  }

  function renderPersonRow(p) {
    const row = document.createElement("a");
    row.href = p.username && p.username !== myProfile.username ? `user.html?u=${encodeURIComponent(p.username)}` : "profile.html";
    row.className = "people-row";
    const pAvatar = p.avatarPath || p.avatarUrl || "assets/avatars/avatar01.svg";
    row.innerHTML = `
      <span class="avatar" style="background-image:url('${escapeHtml(pAvatar)}')"></span>
      <span>
        <span class="people-row-name">${escapeHtml(p.nickname || "Veyora User")}</span><br>
        <span class="people-row-handle">@${escapeHtml(p.username || "user")}</span>
      </span>
    `;
    return row;
  }

  tabs.forEach((btn) => btn.addEventListener("click", () => showTab(btn.dataset.tab)));
  showTab("posts");
}
