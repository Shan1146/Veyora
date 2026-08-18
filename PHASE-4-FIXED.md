# VEYORA Phase 4 — Fixed/Merged

This build uses the uploaded Veyora project as the base.

Visible changes:
- Home now has a search bar.
- Search page supports Anime, K-Drama, and Movies.
- Search results have Add to My Library.
- My Library is available in navigation.
- Library supports status, progress, rating, favorites, and removal.
- Firestore watchlist path: users/{uid}/watchlist/{itemId}.

Before testing TMDB, put your TMDB Bearer token in js/api/tmdb.js.
Publish firestore/firestore.rules in Firebase Console.
