# VEYORA — Phase 2

Phase 2 adds the user profile identity layer on top of Phase 1 authentication.

## Included

- Public profile page
- Editable nickname
- Editable bio (160 characters)
- Avatar upload to Firebase Storage
- Avatar replacement/removal
- 5 MB avatar limit
- JPG/PNG/WebP validation
- Firestore profile updates
- Profile/settings navigation
- Updated Firebase Storage rules
- Updated home page

## Setup

1. Open `js/firebase/config.js` and enter the Firebase Web App configuration from Firebase Console.
2. Enable Email/Password Authentication.
3. Create/enable Firestore Database.
4. Create/enable Firebase Storage.
5. Deploy rules:

```bash
firebase deploy --only firestore:rules,storage
```

6. Serve the project through a local web server. Do not open the HTML files directly with `file://`.

Example with VS Code Live Server or:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500/`.

## Phase 2 Firebase Storage path

```text
avatars/{userId}/avatar.jpg
avatars/{userId}/avatar.png
avatars/{userId}/avatar.webp
```

Only the authenticated owner can write/delete their own avatar files.
