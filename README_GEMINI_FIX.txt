BLACKSTONE GEMINI QUICK FIX

This patch changes only worker.js.
It switches the AI call from the legacy generateContent endpoint to Gemini's current Interactions API.

Upload worker.js to the ROOT of the blackstone_-New-website GitHub repository and replace the existing worker.js. Commit the change. Cloudflare will redeploy automatically. Do not replace any other file.

Keep the Cloudflare secret named exactly GEMINI_API_KEY.
