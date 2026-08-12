DIGITAL CARD — EMAIL NOTIFICATION ONLY PATCH

BASELINE:
Digital_Card_ONLY_ROBUST_CRM_ASSETS_FIX.zip

ONLY CHANGE:
- public/index.html now sends an email notification to gharibyar61@gmail.com AFTER the CRM confirms the lead was saved.
- Uses the same FormSubmit approach already used by the Blackstone website.
- Email sends in a hidden iframe, so the visitor stays on the digital card.
- CRM/Worker logic was NOT changed.
- worker.js was NOT changed.
- wrangler.jsonc was NOT changed.
- Supabase settings were NOT changed.
- Lead source remains Digital Business Card.

IMPORTANT:
If FormSubmit asks for a one-time email activation, confirm the activation email once. The Blackstone website already uses this email address, so it may already be activated.
