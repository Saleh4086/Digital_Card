BLACKSTONE WEBSITE V2 — COMPLETE PACKAGE

THIS PACKAGE INCLUDES
- Working Cloudflare Worker route at /api/chat
- Gemini 3.6 Flash AI concierge
- Freddie Mac weekly mortgage-rate endpoint at /api/rates
- 30-year and 15-year rates
- Last-updated date and weekly up/down change
- Mortgage calculator button that fills the current 30-year benchmark
- Mobile-friendly Blackstone AI widget on every page
- Existing Blackstone pages, branding, listings, forms, and assets

DEPLOYMENT
1. In GitHub, upload the CONTENTS of this folder to the ROOT of:
   blackstone_-New-website
2. Allow matching files to be replaced.
3. Commit directly to the main branch.
4. Cloudflare should deploy automatically using:
   npx wrangler deploy
5. In Cloudflare Variables and Secrets, keep:
   GEMINI_API_KEY
6. After deployment, test:
   /api/rates
   /api/chat  (opening it directly should say Method not allowed; the widget uses POST)

IMPORTANT
- Mortgage rates are Freddie Mac national weekly averages, not lender quotes.
- Freddie Mac normally updates PMMS weekly, commonly on Thursday. Rates can therefore
  look the same for several days or remain unchanged from the prior week.
- If Freddie Mac is temporarily unavailable, the site shows a clearly labeled last
  verified benchmark instead of a blank section.
- The API key previously shown in chat/screenshots should eventually be replaced.
  Replacing the secret value does not require changing any website code.
