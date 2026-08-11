BLACKSTONE WEBSITE PATCH

This patch fixes:
1. Missing website styling (the plain blue-link page)
2. Missing/older site JavaScript
3. Cloudflare Worker /api/chat and /api/rates routing

UPLOAD THESE 3 FILES TO THE ROOT OF YOUR GITHUB REPOSITORY:
- worker.js                 (replace the existing root worker.js)
- assets/site.css           (replace the existing assets/site.css)
- assets/site.js            (replace the existing assets/site.js)

IMPORTANT:
- Extract this ZIP first.
- In GitHub, upload the three files while preserving the assets folder.
- Commit directly to main.
- Cloudflare should automatically build billowing-forest-66bc.
- Do not upload the ZIP itself into the repository.

After deployment, test the website in a private/incognito browser tab.
If the AI then says GEMINI_API_KEY is not configured, add GEMINI_API_KEY as a runtime Secret in Cloudflare Settings > Variables and Secrets.
