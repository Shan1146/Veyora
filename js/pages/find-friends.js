import { requireAuth } from "../utils/guards.js";
import { ensureProfileFields, searchUsersByUsername } from "../firebase/profile.js";
import { isFollowing, followUser, unfollowUser } from "../firebase/follow.js";
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

document.body.classList.remove("auth-pending");

const form = document.getElementById("friend-search-form");
const input = document.getElementById("friend-search");
const status = document.getElementById("friend-search-status");
const results = document.getElementById("friend-results");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const term = input.value.trim().replace(/^@/, "");
  if (term.length < 2) {
    status.textContent = "Type at least 2 characters to find people.";
    results.innerHTML = "";
    return;
  }

  status.textContent = "Searching…";
  results.innerHTML = "";

  try {
    const people = (await searchUsersByUsername(term, 20)).filter((p) => p.uid !== user.uid);

    if (!people.length) {
      status.textContent = `No users found starting with @${term}.`;
      results.innerHTML = `<div class="social-empty"><h3>No people found</h3><p>Try another username.</p></div>`;
      return;
    }

    status.textContent = `${people.length} ${people.length === 1 ? "person" : "people"} found.`;
    for (const person of people) {
      results.appendChild(await renderPerson(person));
    }
  } catch (error) {
    console.error("VEYORA find friends error:", error);
    status.textContent = "Could not search right now.";
    results.innerHTML = `<div class="social-empty"><h3>Search failed</h3><p>Check your connection and try again.</p></div>`;
  }
});

async function renderPerson(person) {
  const row = document.createElement("article");
  row.className = "people-row friend-result-row";

  const avatar = person.avatarPath || person.avatarUrl || "assets/avatars/avatar01.svg";
  const username = person.username || "user";
  const nickname = person.nickname || "Veyora User";
  const following = await isFollowing(user.uid, person.uid);

  row.innerHTML = `
    <a class="friend-result-main" href="user.html?u=${encodeURIComponent(username)}">
      <span class="avatar" style="background-image:url('${escapeHtml(avatar)}')"></span>
      <span class="friend-result-info">
        <strong class="people-row-name">${escapeHtml(nickname)}</strong>
        <span class="people-row-handle">@${escapeHtml(username)}</span>
      </span>
    </a>
    <div class="friend-result-actions">
      <a class="btn btn-ghost friend-view-btn" href="user.html?u=${encodeURIComponent(username)}">View</a>
      <button class="btn ${following ? "btn-ghost" : "btn-primary"} follow-btn friend-follow-btn" type="button">${following ? "Following" : "Follow"}</button>
    </div>
  `;

  const followBtn = row.querySelector(".friend-follow-btn");
  let isFollowingNow = following;
  followBtn.addEventListener("click", async () => {
    followBtn.disabled = true;
    try {
      if (isFollowingNow) {
        await unfollowUser(user.uid, person.uid);
        isFollowingNow = false;
      } else {
        await followUser(user.uid, person.uid);
        isFollowingNow = true;
      }
      followBtn.textContent = isFollowingNow ? "Following" : "Follow";
      followBtn.classList.toggle("btn-primary", !isFollowingNow);
      followBtn.classList.toggle("btn-ghost", isFollowingNow);
    } catch (error) {
      console.error("VEYORA follow error:", error);
      alert(error.message || "Could not update follow status.");
    } finally {
      followBtn.disabled = false;
    }
  });

  return row;
}
