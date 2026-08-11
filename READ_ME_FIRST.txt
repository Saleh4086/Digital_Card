BLACKSTONE DIGITAL CARD — SAFE CRM + EMAIL PATCH

This package contains ONLY the Digital Card app and its own secure API Worker.
It does NOT contain the Blackstone main website or CRM app.

IMPORTANT:
The card now POSTs to /api/leads on the Digital Card Worker itself.

CRM is saved FIRST.
Email is attempted only AFTER CRM save succeeds.
If email fails, the CRM lead remains saved.

Cloudflare Digital Card Worker must have:
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY   (Secret; recommended)
CRM_OWNER_USER_ID           (copy the exact value from the working website/API Worker if it uses one)

For email alerts:
RESEND_API_KEY              (Secret)
RESEND_FROM_EMAIL           (verified Resend sender)
LEAD_NOTIFICATION_EMAIL     = gharibyar61@gmail.com

Do not put secret values in GitHub.

After deployment open:
https://digital-card.gharibyar61.workers.dev/api/health

You want:
crm_configured: true
email_configured: true

If crm_configured is false, do NOT test the form yet. Add the missing CRM Worker settings first.
