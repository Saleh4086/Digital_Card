BLACKSTONE DIGITAL CARD — CRM SOURCE + EMAIL FIX

THIS PACKAGE IS DIGITAL CARD ONLY.
It does NOT contain the Blackstone website pages or website Worker.
Uploading this package to the Digital_Card repository will not replace your regular website files.

WHAT WAS FIXED
1. Digital-card leads now save DIRECTLY to the existing Blackstone Supabase CRM.
2. The CRM source is forced to: Digital Business Card
   (it no longer goes through the website API, which was relabeling it as Website.)
3. Digital-card email notifications are supported through Resend.
4. CRM saving still succeeds even if email is temporarily not configured.

DIGITAL CARD CLOUDFLARE WORKER VARIABLES
Keep/add these ONLY on the digital-card Worker:

Required for CRM:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY  (Secret)
- CRM_OWNER_USER_ID

Your current CRM owner ID:
c0f35df8-f8f8-4123-9b68-8c59e6e373da

Required for email notification:
- RESEND_API_KEY  (Secret)
- RESEND_FROM_EMAIL
- LEAD_NOTIFICATION_EMAIL = gharibyar61@gmail.com

IMPORTANT
- Do not put these into the static CRM Worker.
- Do not change the regular website Worker if the website is already working.
- RESEND_FROM_EMAIL must be an address/domain allowed by your Resend account.

TEST AFTER DEPLOYMENT
1. Submit a Digital Card lead.
2. Confirm it appears in CRM.
3. Confirm Source says: Digital Business Card
4. Confirm an email notification arrives.

HEALTH CHECK
Open:
https://digital-card.gharibyar61.workers.dev/api/health

Expected after all variables are configured:
crm_configured: true
owner_configured: true
email_configured: true
