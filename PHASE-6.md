# VEYORA — Phase 6: Full Social System

Phase 6 adds a real social layer on top of the account, profile, and
library features from earlier phases: posts, a home feed, likes,
comments, public profiles, following, and notifications — all backed
by Firestore, with no Firebase Storage involved.

## Included

**6.1 Posts** — `feed.html`
- Text posts (500 char limit)
- Optional image attached from the existing site asset gallery
  (avatar artwork + the default poster) — see `js/social/post-assets.js`
- Edit or delete your own posts in place
- Post timestamps ("3m", "5h", "2d"…) with an "(edited)" tag after edits
- Author avatar + nickname + @username shown on every post

**6.2 Home Feed** — `feed.html`
- "Newest" tab: every post on VEYORA, newest first
- Post cards, empty-state messaging, responsive layout

**6.3 Likes**
- Like / unlike with an optimistic UI
- Like counts via Firestore aggregate `count()` queries (no denormalized
  counters to keep in sync)
- One like per user, enforced structurally: a like's document ID *is*
  the liking user's uid, so a second like is a same-ID overwrite, and
  the rules only allow a user to write the like doc that matches their
  own uid

**6.4 Comments**
- Add comments (300 char limit), delete your own
- Comment counts via aggregate `count()` queries
- Full persistence in `posts/{id}/comments`

**6.5 User Profiles** — `user.html?u=<username>`
- Click any post author's name/avatar to open their profile
- Bio, avatar, nickname
- Library tab (their public watchlist, read-only)
- Posts tab (their posts, with like/comment enabled but no edit/delete
  since you're not the owner)
- Followers / following tabs and counts

**6.6 Following**
- Follow / unfollow button on other users' profiles
- Followers count, following count (aggregate queries, no counters to
  drift out of sync)
- "Following" tab on the feed, limited to posts from people you follow
  (Firestore's `in` operator caps this at 30 authors — plenty for this
  phase; a heavier fan-out model would be the next step at scale)

**6.7 Notifications** — `notifications.html`
- New follower, post like, and new comment notifications
- Unread badge on the 🔔 nav icon (live, via `onSnapshot`) on the
  feed, profile, settings, and notifications pages
- Mark one as read on click, or "Mark all as read"

**6.8 Firebase Security** — see `firestore.rules`
- Users can only edit their own profile (`users/{uid}`)
- Users can only edit/delete their own posts and comments
- Likes can't be duplicated — the like document ID is the liking
  user's uid, so a duplicate is structurally impossible, not just
  behaviorally discouraged
- Follow edges use a composite ID (`{followerId}_{followingId}`) for
  the same reason — a duplicate follow can't be created
- Notifications are written by the actor directly into the
  recipient's inbox, but the rules constrain `toUserId`/`fromUserId`/
  `read` on create, and only allow the owner to flip `read` on
  update — no other field can ever be changed after creation

**6.9 Storage**
- ❌ No Firebase Storage used anywhere in this phase
- ✅ Post images are limited to the existing avatar artwork + default
  poster already shipped in `assets/`
- 🚧 User-uploaded post images are intentionally not offered — there's
  no "Coming Soon" card for it since posting works fully without it,
  but the same pattern from Phase 5 (swap in Storage later, gate it
  behind a rules/plan check) would apply if that's added

## Data model

```text
posts/{postId}
  authorId, authorUsername, authorNickname, authorAvatar
  text, image (asset path | null)
  createdAt, editedAt

posts/{postId}/likes/{uid}        — doc id = liking user's uid
posts/{postId}/comments/{id}      — authorId, text, createdAt

follows/{followerId}_{followingId}
  followerId, followingId, createdAt

notifications/{ownerId}/items/{id}
  toUserId, fromUserId, type ("follow" | "like" | "comment")
  postId?, read, createdAt
```

## New files

```text
firestore.indexes.json                 — composite index for posts (authorId + createdAt)
css/social.css                          — composer, post cards, comments, notifications, follow UI
js/firebase/posts.js                    — post/like/comment CRUD + feed queries
js/firebase/follow.js                   — follow/unfollow + counts
js/firebase/notifications.js            — notification inbox CRUD + live unread count
js/social/post-card.js                  — the reusable post card component
js/social/post-assets.js                — the "existing website assets" image gallery
js/social/format.js                     — escapeHtml / timeAgo helpers
js/social/nav-badge.js                  — mounts the live 🔔 unread badge
js/pages/feed.js                        — feed.html logic
js/pages/notifications.js               — notifications.html logic
js/pages/user-profile.js                — user.html logic
feed.html / user.html / notifications.html
```

## Setup

Same as previous phases, plus deploy the new index:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

The first time the "Following" feed or a profile's "Posts" tab runs
without the index deployed, Firestore's error message includes a
direct console link to create it — either path works.

## Known limitation carried over

`js/profile/settings.js` still imports `uploadAvatar` /
`deleteAvatarFiles` from `js/firebase/storage.js`, which only exports
`replaceAvatar` / `replaceProfileMusic` / `deleteProfileMusic`. That
mismatch predates Phase 6 (avatar upload was replaced by the asset
gallery in Phase 5) and is unrelated to the social system — flagging
it here so it doesn't get mistaken for a Phase 6 bug.
