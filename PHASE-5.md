# VEYORA Phase 5 — Profile Customization

## Included now
- Nickname and bio customization
- Theme selection
- Website-provided avatar gallery
- Avatar selection saved as a small Firestore path
- No Firebase Storage needed for avatars

## Coming Soon
Features that require Firebase Storage are intentionally disabled:
- Profile music upload
- Custom background image upload
- Other user file uploads

Users see a Coming Soon card instead of a broken upload control.

## Adding your own avatar images
Put your images in `assets/avatars/` and update `js/avatar/avatar-list.js`.
Example:
`{ id: 'avatar09', name: 'My Avatar', src: 'assets/avatars/avatar09.png' }`
