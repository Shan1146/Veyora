// =========================================================
// VEYORA — Phase 6: post image gallery
// Posts can only attach images that already ship with the
// site (no Firebase Storage in this phase — see 6.9). This
// reuses the same avatar artwork plus the default poster.
// =========================================================
import { AVATARS } from "../avatar/avatar-list.js";

export const POST_IMAGES = [
  { id: "none", name: "No image", src: null },
  ...AVATARS.map((a) => ({ id: a.id, name: a.name, src: a.src })),
  { id: "default-poster", name: "Poster", src: "assets/images/default-poster.svg" },
];
