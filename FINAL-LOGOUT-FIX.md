# Final Logout Fix

The logout button is now handled by `js/auth/logout.js` independently of
`js/profile/settings.js`.

`settings.html` loads both modules:
- js/profile/settings.js
- js/auth/logout.js

This means a failure in avatar, storage, profile, or other settings code cannot
prevent the Firebase sign-out click handler from being attached.

The redirect is relative: `./index.html`.
