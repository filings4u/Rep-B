filings4u shared session security

Protection applied to every current admin and client portal page.

Behavior:
- 10 minutes maximum inactivity
- Branded warning at 9 minutes with 60-second countdown
- Stay signed in button resets inactivity
- Sign out now button ends the session immediately
- Automatic logout at 10 minutes
- Activity synchronized across open filings4u tabs
- Timeout synchronized across open filings4u tabs
- Admin redirects to admin-login.html
- Customer redirects to customer-login.html
- Login screen explains inactivity timeout

New shared files:
assets/js/session-security.js
assets/css/session-security.css

Updated shared auth files:
assets/js/admin-auth-guard.js
assets/js/client-auth-guard.js
assets/js/admin-login.js
assets/js/customer-login.js

All protected admin-*.html and client-*.html files in this package include the shared session CSS/JS before the role guard.
