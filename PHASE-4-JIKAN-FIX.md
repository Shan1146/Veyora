# Jikan 504 Fix

The previous Jikan request could fail with HTTP 504 (Gateway Timeout).

This build:
1. Retries Jikan temporary errors (429/500/502/503/504).
2. Waits between retries.
3. Falls back to the public AniList GraphQL API if Jikan remains unavailable.
4. Keeps anime results compatible with the existing VEYORA search UI.
5. Prevents an anime API outage from breaking the whole search page.

No Firebase Storage or paid service is required for this fix.
