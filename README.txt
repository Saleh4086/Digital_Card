BLACKSTONE DIGITAL BUSINESS CARD

Open index.html to preview.

Included:
- One-tap call, text, and email
- Correct email: gharibyar61@gmail.com
- Website: https://blackstonesignatureproperty.com/
- Save-to-Contacts VCF
- Share Card button
- In-card lead forms for buyers, sellers, property management, investments, and consultations
- Blackstone logo and Sal's supplied photo

IMPORTANT:
The forms currently stay inside the card while being completed, then open the visitor's email app to send the lead.
To receive leads automatically without opening email, deploy this folder to your web host and connect the form to a serverless form endpoint/database.


LIVE CARD URL:
https://digital-card.gharibyar61.workers.dev/

The Share My Card button now shares this exact live URL via AirDrop, Messages, Mail, and the iPhone share sheet.

FINAL PATCH:
- Share My Card sends the live URL:
  https://digital-card.gharibyar61.workers.dev/
- Text button opens a new message to (925) 917-5595 with:
  "Hi Sal, I got your digital business card and wanted to connect."


QR CODE UPDATE:
- Added a real scannable QR code pointing to:
  https://digital-card.gharibyar61.workers.dev/
- The QR is displayed directly on the digital card.
- CRM direct-submit integration is intentionally not activated yet because the CRM/API destination must be identified first.


FINAL CRM INTEGRATION:
- Digital card forms POST directly to: https://blackstonesignatureproperty.com/api/leads
- Source is saved as: Digital Business Card
- Uses the existing secure website Worker -> Supabase CRM lead endpoint.
- No Supabase secret is exposed in this digital card.
- Success confirmation stays inside the card.
- QR, Share My Card, Call, Text, Email, and Save to Contacts remain included.


EMAIL NOTIFICATION SUPPORT
- This digital card is ready to display a successful email-alert confirmation if the CRM API returns:
  notification_sent: true
- The card itself cannot safely store an email-service secret.
- The actual email notification must be sent by the secure CRM/API backend after the lead is saved.
- Current CRM save behavior remains unchanged.
