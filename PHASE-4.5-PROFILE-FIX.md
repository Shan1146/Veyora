# VEYORA Phase 4.5 — Profile Fix

- Profile reads the current Firestore `users/{uid}` document.
- Missing profile documents/fields are recovered safely.
- Nickname and bio use merge writes, so existing account fields are preserved.
- Avatar URL is persisted in the same user document.
- Profile statistics now count the user's Phase 4 Firestore watchlist.
- Stale Phase 2 profile copy has been updated.
- Search and My Library links are visible from Profile/Settings.

Before avatar upload works, Firebase Storage rules must also be published.
