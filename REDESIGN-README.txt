filings4u Unified Portal Redesign

Shared visual shell:
- assets/css/filings4u-portal-shell.css
- assets/js/filings4u-portal-shell.js

All HTML pages in this package load the shared shell last so existing Supabase, Stripe, authentication, dashboard and workflow JavaScript remains intact.

Page modes are applied on the body:
- f4u-auth-page
- f4u-wizard-page
- f4u-client-page
- f4u-admin-page

Primary palette:
- Navy #0a1f44
- Emerald #10b981
- Dark emerald #0e9f6e
- Soft background #f8fafc

Typography:
- Manrope for headings/UI emphasis
- DM Sans for body and form content
