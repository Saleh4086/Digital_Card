BLACKSTONE DIGITAL CARD — CRM + EMAIL FIX

THIS PACKAGE FIXES BOTH IN THE DIGITAL CARD WORKER:
1) CRM saving
2) Email lead alerts

Important design change:
The card now submits to its OWN /api/leads endpoint.
That removes the cross-domain dependency on the main website and avoids CORS problems.
Do NOT replace your main website or CRM with this ZIP.

UPLOAD TO:
GitHub repository: Digital_Card
Cloudflare Worker: digital-card

CLOUDFLARE BUILD SETTINGS
Build command: npm install
Deploy command: npm run deploy
Root directory: /

REQUIRED DIGITAL-CARD WORKER VARIABLES / SECRETS
Copy the same CRM values from the WORKING website Worker:

SUPABASE_URL
  Variable
  Your Blackstone CRM Supabase project URL

SUPABASE_SERVICE_ROLE_KEY
  Secret
  Recommended. Do not place it in GitHub.

CRM_OWNER_USER_ID
  Variable/Secret if your existing website Worker uses one.
  Copy the exact existing value if present.

RESEND_API_KEY
  Secret
  Your Resend API key.

RESEND_FROM_EMAIL
  Variable
  Example after Resend verifies the domain:
  Blackstone Leads <leads@blackstonesignatureproperty.com>

LEAD_NOTIFICATION_EMAIL
  Variable
  gharibyar61@gmail.com

TEST
After deploying, open:
https://digital-card.gharibyar61.workers.dev/api/health

You want:
crm_configured: true
email_configured: true

Then submit one Digital Card test lead.
Expected:
- Lead appears in Blackstone CRM.
- Email alert arrives at gharibyar61@gmail.com.
- Card confirmation says both happened.

Wrangler is pinned to 4.120.0 to avoid the failed latest-version/miniflare installation you saw.
