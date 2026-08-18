# Firestore save fix

This build:
- uses Firebase JS SDK 10.13.0 consistently;
- stores library items under users/{uid}/watchlist/{itemId};
- includes firestore.rules at the project root;
- changes the search error to show the actual Firebase error code/message.

IMPORTANT:
The local rules file is not automatically published by Live Server.
Publish the rules in Firebase Console for the project `veyora-90dbb`, or run:
firebase deploy --only firestore:rules

If saving still fails, the alert will now show the exact Firebase error instead of only "Could not save".
