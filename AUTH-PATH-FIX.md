# Authentication Path Fix

Updated both project copies:
- Login redirects now use `./home.html`
- Logout redirects now use `./index.html`
- Relative paths work when testing inside a local project folder and when deployed under a subfolder.
