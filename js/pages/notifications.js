import { requireAuth } from "../utils/guards.js";
import { ensureProfileFields } from "../firebase/profile.js";
import { getNotifications, markAsRead, markAllAsRead } from "../firebase/notifications.js";
import { getProfilesByIds } from "../firebase/follow.js";
import { mountNotificationBadge } from "../social/nav-badge.js";
import { escapeHtml, timeAgo } from "../social/format.js";

const user = await requireAuth();
const profile = await ensureProfileFields(user.uid);
document.body.classList.remove("auth-pending");
mountNotificationBadge(user.uid);

const navAvatar = document.getElementById("nav-avatar-button");
const avatarUrl = profile.avatarPath || profile.avatarUrl;
if (avatarUrl) {
  navAvatar.style.backgroundImage = `url("${avatarUrl}")`;
  navAvatar.classList.add("has-image");
} else {
  navAvatar.textContent = (profile.nickname || "V").charAt(0).toUpperCase();
}

const list = document.getElementById("notif-list");
const status = document.getElementById("notif-status");

const COPY = {
  follow: (name) => `<strong>${name}</strong> started following you`,
  like: (name) => `<strong>${name}</strong> liked your post`,
  comment: (name) => `<strong>${name}</strong> commented on your post`,
};

async function load() {
  status.textContent = "Loading…";
  list.innerHTML = "";
  try {
    const items = await getNotifications(user.uid);
    if (!items.length) {
      status.textContent = "";
      list.innerHTML = `<div class="social-empty"><h3>Nothing yet</h3><p>Follows, likes, and comments on your posts will show up here.</p></div>`;
      return;
    }

    const actorIds = [...new Set(items.map((n) => n.fromUserId))];
    const profiles = await getProfilesByIds(actorIds);
    const byId = Object.fromEntries(profiles.map((p) => [p.uid, p]));

    status.textContent = "";
    items.forEach((n) => list.appendChild(renderNotification(n, byId[n.fromUserId])));
  } catch (err) {
    console.error("VEYORA notifications error:", err);
    status.textContent = "Could not load notifications. Check Firestore rules.";
  }
}

function renderNotification(n, actor) {
  const row = document.createElement("div");
  row.className = `notif-item${n.read ? "" : " unread"}`;
  const nickname = actor?.nickname || n.fromUsername || "Someone";
  const avatar = actor?.avatarPath || actor?.avatarUrl || "assets/avatars/avatar01.svg";
  const text = (COPY[n.type] || (() => `${escapeHtml(nickname)} interacted with your account`))(escapeHtml(nickname));

  row.innerHTML = `
    ${!n.read ? '<span class="notif-dot"></span>' : '<span style="width:8px"></span>'}
    <span class="avatar avatar-small" style="background-image:url('${avatar}')"></span>
    <span class="notif-text">${text}</span>
    <span class="notif-time">${timeAgo(n.createdAt)}</span>
  `;

  row.addEventListener("click", async () => {
    if (!n.read) {
      n.read = true;
      row.classList.remove("unread");
      const dot = row.querySelector(".notif-dot");
      if (dot) dot.remove();
      try { await markAsRead(user.uid, n.id); } catch (e) { console.error(e); }
    }
    if (n.type === "follow" && actor?.username) {
      window.location.href = `user.html?u=${encodeURIComponent(actor.username)}`;
    } else if (n.postId) {
      window.location.href = `feed.html`;
    }
  });

  return row;
}

document.getElementById("mark-all-read").addEventListener("click", async () => {
  try {
    await markAllAsRead(user.uid);
    document.querySelectorAll(".notif-item.unread").forEach((el) => {
      el.classList.remove("unread");
      el.querySelector(".notif-dot")?.remove();
    });
  } catch (err) {
    console.error("VEYORA mark all read error:", err);
  }
});

load();
