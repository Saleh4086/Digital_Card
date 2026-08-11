BLACKSTONE CRM EMAIL NOTIFICATION PATCH — WORKER.JS ONLY

THIS PATCH IS BASED ON THE EXACT WORKING ZIP YOU JUST UPLOADED:
blackstrone_-New-website-main(4).zip

WHAT CHANGED:
- Only worker.js was changed.
- Existing /api/leads -> Supabase CRM saving remains intact.
- After the CRM lead saves successfully, the Worker sends Sal an email alert through Resend.
- If email sending fails, the CRM lead is still saved.
- API response now includes: notification_sent: true/false

DO NOT:
- Do not replace the whole website.
- Do not upload this to the Digital_Card Worker.
- Do not upload this to the CRM static Worker green-wave-a8cd.

YOU MUST ADD THESE TO THE SAME WEBSITE WORKER THAT CURRENTLY HAS:
SUPABASE_URL / SUPABASE keys and handles /api/leads

1) RESEND_API_KEY
   Type: Secret
   Value: your Resend API key

2) RESEND_FROM_EMAIL
   Type: Variable
   Example after domain verification:
   Blackstone Leads <leads@blackstonesignatureproperty.com>

3) LEAD_NOTIFICATION_EMAIL
   Type: Variable
   Value:
   gharibyar61@gmail.com

Until RESEND_API_KEY and RESEND_FROM_EMAIL are configured, CRM saving will still work but email alerts will be skipped.

EMAIL SUBJECT EXAMPLE:
NEW BLACKSTONE LEAD - Seller - John Smith
