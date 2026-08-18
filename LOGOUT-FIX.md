# Logout Fix

- Centralized logout handling in `js/auth/logout.js`.
- Settings uses the centralized handler.
- Duplicate `firestore/js` copy was updated too.
- Logout waits for Firebase `signOut()` before redirecting.
- Double-click protection and error handling added.
- Redirect uses `/index.html`.
