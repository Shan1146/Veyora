// =========================================================
// VEYORA — Phase 6: post card component
// A single reusable renderer used by the feed, and by both
// the "my posts" and "their posts" sections of profile pages.
// =========================================================
import {
  likePost, unlikePost, hasLiked, getLikeCount,
  getComments, addComment, deleteComment, getCommentCount,
  updatePost, deletePost,
} from "../firebase/posts.js";
import { escapeHtml, timeAgo } from "./format.js";

/**
 * @param {object} post - post doc ({ id, authorId, authorUsername, ... })
 * @param {object} ctx - { currentUser, currentProfile, onDeleted }
 */
export function createPostCard(post, ctx) {
  const isOwner = ctx.currentUser && post.authorId === ctx.currentUser.uid;
  const profileHref = isOwner ? "profile.html" : `user.html?u=${encodeURIComponent(post.authorUsername)}`;

  const card = document.createElement("article");
  card.className = "post-card";
  card.dataset.postId = post.id;

  card.innerHTML = `
    <div class="post-head">
      <button class="post-author" type="button">
        <span class="avatar avatar-small" style="${post.authorAvatar ? `background-image:url('${escapeHtml(post.authorAvatar)}')` : ""}"></span>
        <span>
          <span class="post-author-name">${escapeHtml(post.authorNickname)}</span><br>
          <span class="post-author-meta">@${escapeHtml(post.authorUsername)} · <span class="post-time">${timeAgo(post.createdAt)}</span>${post.editedAt ? '<span class="post-edited">(edited)</span>' : ""}</span>
        </span>
      </button>
      ${isOwner ? `<div class="post-menu"><button type="button" data-action="edit">Edit</button><button type="button" class="danger" data-action="delete">Delete</button></div>` : ""}
    </div>
    <div class="post-body">
      <p class="post-text">${escapeHtml(post.text)}</p>
      ${post.image ? `<img class="post-image" src="${escapeHtml(post.image)}" alt="">` : ""}
    </div>
    <div class="post-actions">
      <button class="post-action" data-action="like" type="button">🤍 <span class="like-count">–</span></button>
      <button class="post-action" data-action="comment" type="button">💬 <span class="comment-count">–</span></button>
    </div>
    <div class="comment-section">
      <div class="comment-list"></div>
      <form class="comment-form">
        <input type="text" maxlength="300" placeholder="Add a comment…" required>
        <button class="btn btn-ghost" type="submit">Post</button>
      </form>
    </div>
  `;

  const authorBtn = card.querySelector(".post-author");
  authorBtn.addEventListener("click", () => { window.location.href = profileHref; });

  wireLike(card, post, ctx);
  wireComments(card, post, ctx);
  if (isOwner) wireOwnerMenu(card, post, ctx);

  return card;
}

function wireLike(card, post, ctx) {
  const likeBtn = card.querySelector('[data-action="like"]');
  const countEl = card.querySelector(".like-count");
  let liked = false;
  let busy = false;

  Promise.all([hasLiked(post.id, ctx.currentUser.uid), getLikeCount(post.id)]).then(([l, c]) => {
    liked = l;
    countEl.textContent = c;
    likeBtn.classList.toggle("liked", liked);
    likeBtn.firstChild.textContent = liked ? "❤️ " : "🤍 ";
  });

  likeBtn.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    const wasLiked = liked;
    liked = !liked;
    likeBtn.classList.toggle("liked", liked);
    likeBtn.firstChild.textContent = liked ? "❤️ " : "🤍 ";
    countEl.textContent = Math.max(0, Number(countEl.textContent || 0) + (liked ? 1 : -1));
    try {
      if (wasLiked) {
        await unlikePost(post.id, ctx.currentUser.uid, { postAuthorId: post.authorId });
      } else {
        await likePost(post.id, ctx.currentUser.uid, { postAuthorId: post.authorId });
      }
    } catch (e) {
      console.error("VEYORA like error:", e);
      // Roll back optimistic UI on failure.
      liked = wasLiked;
      likeBtn.classList.toggle("liked", liked);
      likeBtn.firstChild.textContent = liked ? "❤️ " : "🤍 ";
      countEl.textContent = Math.max(0, Number(countEl.textContent || 0) + (liked ? 1 : -1));
    } finally {
      busy = false;
    }
  });
}

function wireComments(card, post, ctx) {
  const commentBtn = card.querySelector('[data-action="comment"]');
  const countEl = card.querySelector(".comment-count");
  const section = card.querySelector(".comment-section");
  const list = card.querySelector(".comment-list");
  const form = card.querySelector(".comment-form");
  let loaded = false;

  getCommentCount(post.id).then((c) => { countEl.textContent = c; });

  async function renderComments() {
    list.innerHTML = `<p class="comment-empty">Loading…</p>`;
    const comments = await getComments(post.id);
    list.innerHTML = "";
    if (!comments.length) {
      list.innerHTML = `<p class="comment-empty">No comments yet.</p>`;
    }
    comments.forEach((c) => list.appendChild(renderComment(c, post, ctx)));
  }

  commentBtn.addEventListener("click", async () => {
    section.classList.toggle("open");
    if (section.classList.contains("open") && !loaded) {
      loaded = true;
      await renderComments();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    const text = input.value;
    if (!text.trim()) return;
    const submitBtn = form.querySelector("button");
    submitBtn.disabled = true;
    try {
      await addComment(post.id, ctx.currentUser.uid, ctx.currentProfile, text, { postAuthorId: post.authorId });
      input.value = "";
      countEl.textContent = Number(countEl.textContent === "–" ? 0 : countEl.textContent) + 1;
      await renderComments();
    } catch (err) {
      console.error("VEYORA comment error:", err);
      alert(err.message || "Could not post comment.");
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function renderComment(comment, post, ctx) {
  const row = document.createElement("div");
  row.className = "comment-item";
  const canDelete = ctx.currentUser && comment.authorId === ctx.currentUser.uid;
  row.innerHTML = `
    <span class="avatar" style="${comment.authorAvatar ? `background-image:url('${escapeHtml(comment.authorAvatar)}')` : ""}"></span>
    <div class="comment-body">
      <span class="comment-author">${escapeHtml(comment.authorNickname)}</span>
      ${canDelete ? `<button class="comment-delete" type="button">Delete</button>` : ""}
      <p class="comment-text">${escapeHtml(comment.text)}</p>
    </div>
  `;
  if (canDelete) {
    row.querySelector(".comment-delete").addEventListener("click", async () => {
      if (!confirm("Delete this comment?")) return;
      try {
        await deleteComment(post.id, comment.id);
        row.remove();
        const countEl = row.closest(".post-card").querySelector(".comment-count");
        countEl.textContent = Math.max(0, Number(countEl.textContent || 1) - 1);
      } catch (err) {
        console.error("VEYORA delete comment error:", err);
        alert("Could not delete comment.");
      }
    });
  }
  return row;
}

function wireOwnerMenu(card, post, ctx) {
  card.querySelector('[data-action="delete"]').addEventListener("click", async () => {
    if (!confirm("Delete this post? This can't be undone.")) return;
    try {
      await deletePost(post.id);
      card.remove();
      ctx.onDeleted?.(post.id);
    } catch (err) {
      console.error("VEYORA delete post error:", err);
      alert("Could not delete post.");
    }
  });

  card.querySelector('[data-action="edit"]').addEventListener("click", () => {
    const body = card.querySelector(".post-body");
    const textEl = card.querySelector(".post-text");
    if (card.querySelector(".post-edit-form")) return;

    const form = document.createElement("form");
    form.className = "post-edit-form";
    form.innerHTML = `
      <textarea class="composer-edit-textarea" maxlength="500" rows="3">${escapeHtml(post.text)}</textarea>
      <div class="composer-foot">
        <span class="composer-counter"></span>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn btn-ghost" data-cancel>Cancel</button>
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </div>
    `;
    form.querySelector("textarea").style.cssText = "width:100%;resize:vertical;min-height:70px;background:var(--bg);border:1px solid var(--surface-line);border-radius:var(--radius-sm);padding:var(--space-3) var(--space-4);color:var(--text-primary);font:inherit;margin-top:var(--space-3)";
    textEl.style.display = "none";
    body.appendChild(form);

    form.querySelector("[data-cancel]").addEventListener("click", () => {
      form.remove();
      textEl.style.display = "";
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newText = form.querySelector("textarea").value;
      const saveBtn = form.querySelector('[type="submit"]');
      saveBtn.disabled = true;
      try {
        await updatePost(post.id, ctx.currentUser.uid, { text: newText, image: post.image });
        post.text = newText.trim();
        post.editedAt = new Date();
        textEl.textContent = post.text;
        textEl.style.display = "";
        form.remove();
        const meta = card.querySelector(".post-author-meta");
        if (!meta.querySelector(".post-edited")) {
          meta.insertAdjacentHTML("beforeend", '<span class="post-edited">(edited)</span>');
        }
      } catch (err) {
        console.error("VEYORA edit post error:", err);
        alert(err.message || "Could not save changes.");
      } finally {
        saveBtn.disabled = false;
      }
    });
  });
}
