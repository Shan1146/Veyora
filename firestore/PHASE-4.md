# VEYORA Phase 4 — My Library / Watchlist

## Features
- Add anime, movies, and K-dramas to the user's Firestore library.
- Default status: Plan to Watch.
- Categories: All, Anime, K-Drama, Movies.
- Status filters: Watching, Completed, Plan to Watch, On Hold, Dropped.
- Progress tracking.
- 1–5 star rating.
- Favorites.
- Remove titles.
- Library statistics.

## Firestore structure

users/{userId}/watchlist/{itemId}

Each item stores:
source, externalId, title, poster, type, status, progress,
totalEpisodes, rating, favorite, addedAt, updatedAt.

## Rules

Publish `firestore/firestore.rules` in Firebase Console. It permits a user to access only their own user document and watchlist.

## Free-first

This phase uses Firestore only. It does not require Firebase Storage.
