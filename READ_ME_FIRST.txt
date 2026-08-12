DIGITAL CARD ONLY - DATABASE OWNER TRIGGER FIX

This package uses your existing Supabase database trigger to assign the CRM owner.
Required Cloudflare variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

CRM_OWNER_USER_ID may remain in Cloudflare, but the card no longer requires it because the Supabase trigger assigns your owner UUID.

CRM source is forced to: Digital Business Card

If a required variable is genuinely unavailable at runtime, the error now names the exact missing variable.

This ZIP contains only Digital Card deployment files. Your main website is not included.
