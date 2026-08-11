BLACKSTONE CRM LEAD EMAIL ALERT — SETUP

WHAT THIS PATCH DOES
- Keeps the existing /api/leads -> Supabase CRM lead capture unchanged.
- After a lead is successfully saved, sends Sal an instant email notification through Resend.
- If email sending ever fails, the lead STILL remains safely saved in the CRM.
- The visitor still sees the normal thank-you confirmation.
- No Resend API key is placed in public website code.

EMAIL DESTINATION
gharibyar61@gmail.com

CLOUDFLARE SECRETS / VARIABLES TO ADD TO THE WEBSITE WORKER
1. RESEND_API_KEY
   Type: Secret
   Value: your Resend API key (starts with re_)

2. RESEND_FROM_EMAIL
   Type: Variable or Secret
   Recommended after verifying your domain in Resend:
   Blackstone Leads <leads@blackstonesignatureproperty.com>

3. LEAD_NOTIFICATION_EMAIL
   Type: Variable
   Value:
   gharibyar61@gmail.com

IMPORTANT
- Add these to the WEBSITE Worker that runs worker.js and handles /api/leads.
- Do NOT add them to the static CRM Worker green-wave-a8cd.
- You must verify the sending domain/address in Resend before using a custom From address.
- After deployment, submit one test lead from the digital card. Verify:
  1) it appears in the CRM
  2) an email arrives at gharibyar61@gmail.com

The email subject will look like:
NEW DIGITAL CARD LEAD - Seller - John Smith
