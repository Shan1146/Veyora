// =========================================================
// VEYORA — Phase 6: nav notification badge
// Call from any authenticated page that has a
// <a id="nav-bell" class="nav-bell" href="notifications.html">
// with a nested <span class="nav-bell-badge"></span>.
// =========================================================
import { watchUnreadCount } from "../firebase/notifications.js";

export function mountNotificationBadge(uid) {
  const badge = document.querySelector(".nav-bell-badge");
  if (!badge || !uid) return () => {};
  return watchUnreadCount(uid, (count) => {
    badge.textContent = count > 9 ? "9+" : String(count);
    badge.classList.toggle("visible", count > 0);
  });
}
