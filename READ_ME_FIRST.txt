DIGITAL CARD ONLY - ROBUST CRM FALLBACK FIX

This package contains ONLY the Digital Card files. It does not contain your main website.

What is fixed:
1. Digital Card source is forced to: Digital Business Card.
2. If Cloudflare exposes SUPABASE_SERVICE_ROLE_KEY, the card saves directly to Supabase CRM.
3. If the uploaded Worker version cannot see the secret, the card automatically uses the already-working Blackstone website /api/leads CRM endpoint instead of failing.
4. The Worker no longer crashes in Cloudflare's editor preview when ASSETS is unavailable.
5. Email remains secondary; CRM saving will not fail because Digital Card Resend variables are missing.

Existing Cloudflare variables can stay exactly as they are:
- CRM_OWNER_USER_ID
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Optional Digital Card email variables:
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- LEAD_NOTIFICATION_EMAIL

No Supabase database change is required for this package.
