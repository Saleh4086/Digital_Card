
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function clean(v, max = 5000) {
  return String(v ?? "").trim().slice(0, max);
}

function leadType(v) {
  const s = clean(v, 120).toLowerCase();
  if (s.includes("buy")) return "buyer";
  if (s.includes("sell")) return "seller";
  if (s.includes("rental") || s.includes("manage")) return "property_management";
  if (s.includes("invest")) return "investor";
  if (s.includes("consult")) return "consultation";
  return "contact";
}

function buildLead(input) {
  const f = input?.fields && typeof input.fields === "object" ? input.fields : {};
  const preferred = clean(f.preferred_date_time || "", 200);
  const message = clean(input?.message || f.notes || f.message, 5000);
  return {
    name: clean(input?.name || f.name || f.full_name, 200) || "Digital Card Lead",
    phone: clean(input?.phone || f.phone, 80) || null,
    email: clean(input?.email || f.email, 320).toLowerCase() || null,
    property_address: clean(input?.property_address || f.property_address || f.address, 400) || null,
    city: clean(input?.city || f.city, 160) || null,
    lead_type: leadType(input?.lead_type || f.interest || f.lead_type),
    source: "Digital Business Card",
    status: "New Lead",
    timeline: clean(input?.timeline || f.timeline, 200) || null,
    motivation: clean(input?.motivation || f.motivation, 500) || null,
    notes: [message, preferred ? `Preferred date/time: ${preferred}` : ""].filter(Boolean).join("\n\n") || null,
    consent_to_contact: input?.consent_to_contact !== false
  };
}

async function saveCRM(payload, env) {
  // Digital Card CRM recovery: use the existing Blackstone website CRM API.
  // This keeps Supabase credentials out of the Digital Card Worker and restores
  // the same CRM route the card used when lead capture was working.
  const crmEndpoint = clean(
    env.CRM_API_URL || "https://blackstonesignatureproperty.com/api/leads",
    1000
  );

  const r = await fetch(crmEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const raw = await r.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!r.ok) {
    throw new Error(data?.error || data?.message || data?.details || raw || `CRM API returned ${r.status}`);
  }

  // Preserve the website API's lead result when available.
  return data?.lead || data?.data || data || {};
}

async function emailSal(payload, saved, env) {
  const key = clean(env.RESEND_API_KEY, 500);
  const from = clean(env.RESEND_FROM_EMAIL, 320);
  const to = clean(env.LEAD_NOTIFICATION_EMAIL || "gharibyar61@gmail.com", 320);

  // CRM must work even if email isn't configured yet.
  if (!key || !from || !to) return { sent: false, skipped: true };

  const label = payload.lead_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const body = {
    from,
    to: [to],
    subject: `NEW DIGITAL CARD LEAD - ${label} - ${payload.name}`,
    text: [
      "A new lead was saved to Blackstone CRM.",
      "",
      `Name: ${payload.name || ""}`,
      `Phone: ${payload.phone || ""}`,
      `Email: ${payload.email || ""}`,
      `Lead Type: ${label}`,
      `Property Address: ${payload.property_address || ""}`,
      `City: ${payload.city || ""}`,
      `Timeline: ${payload.timeline || ""}`,
      `Source: ${payload.source}`,
      `CRM Lead ID: ${saved?.id || ""}`,
      "",
      "Notes:",
      payload.notes || ""
    ].join("\n")
  };

  if (payload.email) body.reply_to = payload.email;

  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const raw = await r.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }

  if (!r.ok) throw new Error(data?.message || raw || `Resend returned ${r.status}`);
  return { sent: true, id: data?.id || null };
}

async function handleLead(request, env) {
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  let input;
  try { input = await request.json(); }
  catch { return json({ error: "Invalid form submission." }, 400); }

  const payload = buildLead(input);
  if (!payload.phone && !payload.email) {
    return json({ error: "Please provide a phone number or email." }, 400);
  }

  // CRM save is the primary operation.
  let saved;
  try {
    saved = await saveCRM(payload, env);
  } catch (e) {
    console.error("CRM save failed:", e);
    return json({ error: `CRM save failed: ${e.message}` }, 502);
  }

  // Email is secondary and can never undo/fail the saved CRM lead.
  let emailSent = false;
  let emailError = null;
  try {
    const result = await emailSal(payload, saved, env);
    emailSent = Boolean(result?.sent);
  } catch (e) {
    emailError = e.message;
    console.error("Email notification failed:", e);
  }

  return json({
    ok: true,
    lead_id: saved?.id || null,
    notification_sent: emailSent,
    notification_error: emailError,
    message: emailSent
      ? "Thank you. Your request was saved to Blackstone CRM and Sal was notified by email."
      : "Thank you. Your request was saved to Blackstone CRM. Sal will follow up shortly."
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        crm_configured: true,
        crm_mode: "blackstone_website_api",
        owner_configured: Boolean(env.CRM_OWNER_USER_ID),
        email_configured: Boolean(
          env.RESEND_API_KEY &&
          env.RESEND_FROM_EMAIL &&
          (env.LEAD_NOTIFICATION_EMAIL || "gharibyar61@gmail.com")
        )
      });
    }

    if (url.pathname === "/api/leads" || url.pathname === "/api/leads/") {
      return handleLead(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
