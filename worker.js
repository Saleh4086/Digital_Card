
const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeLeadType(value) {
  const s = clean(value, 120).toLowerCase();
  if (s.includes("buy")) return "buyer";
  if (s.includes("sell")) return "seller";
  if (s.includes("rental") || s.includes("manage")) return "property_management";
  if (s.includes("invest")) return "investor";
  if (s.includes("consult")) return "consultation";
  return s.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "general";
}

function buildLead(input) {
  const f = input?.fields && typeof input.fields === "object" ? input.fields : {};
  const leadType = normalizeLeadType(input?.lead_type || f.interest || f.lead_type);
  const message = clean(input?.message || f.notes || f.message, 5000);
  const preferred = clean(f.preferred_date_time || "", 200);
  const notes = [message, preferred ? `Preferred date/time: ${preferred}` : ""].filter(Boolean).join("\n\n");

  return {
    name: clean(input?.name || f.name || f.full_name, 200),
    phone: clean(input?.phone || f.phone, 80),
    email: clean(input?.email || f.email, 320).toLowerCase(),
    lead_type: leadType,
    property_address: clean(input?.property_address || f.property_address || f.address, 400),
    city: clean(input?.city || f.city, 160),
    timeline: clean(input?.timeline || f.timeline, 200),
    motivation: clean(input?.motivation || f.motivation, 500),
    source: "Digital Business Card",
    status: "new",
    notes,
    consent_to_contact: input?.consent_to_contact !== false
  };
}

async function saveLeadToSupabase(payload, env) {
  const url = clean(env.SUPABASE_URL, 500).replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("CRM settings are missing on the Digital Card Worker.");
  }

  if (env.CRM_OWNER_USER_ID) payload.user_id = env.CRM_OWNER_USER_ID;

  const r = await fetch(`${url}/rest/v1/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`,
      "Prefer": "return=representation"
    },
    body: JSON.stringify(payload)
  });

  const raw = await r.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!r.ok) {
    throw new Error(data?.message || data?.details || raw || `Supabase returned ${r.status}`);
  }
  return Array.isArray(data) ? data[0] : data;
}

async function sendNotification(payload, savedLead, env) {
  const key = clean(env.RESEND_API_KEY, 500);
  const to = clean(env.LEAD_NOTIFICATION_EMAIL || "gharibyar61@gmail.com", 320);
  const from = clean(env.RESEND_FROM_EMAIL, 320);
  if (!key || !from || !to) return { sent: false, skipped: true };

  const label = payload.lead_type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  const lines = [
    "A new lead was saved to Blackstone CRM.",
    "",
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email}`,
    `Lead Type: ${label}`,
    `Property Address: ${payload.property_address}`,
    `City: ${payload.city}`,
    `Timeline: ${payload.timeline}`,
    `Source: ${payload.source}`,
    `CRM Lead ID: ${savedLead?.id || ""}`,
    "",
    "Notes:",
    payload.notes || ""
  ];

  const body = {
    from,
    to: [to],
    subject: `NEW DIGITAL CARD LEAD - ${label} - ${payload.name || "New Lead"}`,
    text: lines.join("\n")
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
  let data;
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

  try {
    const savedLead = await saveLeadToSupabase(payload, env);
    let notification = { sent: false };
    try {
      notification = await sendNotification(payload, savedLead, env);
    } catch (emailError) {
      console.error("Email alert failed:", emailError);
      notification = { sent: false, error: emailError.message };
    }

    return json({
      ok: true,
      lead_id: savedLead?.id || null,
      notification_sent: Boolean(notification.sent),
      message: notification.sent
        ? "Thank you. Your request was saved to Blackstone CRM and Sal was notified by email."
        : "Thank you. Your request was saved to Blackstone CRM. Sal will follow up shortly."
    });
  } catch (error) {
    console.error("CRM save failed:", error);
    return json({ error: `CRM save failed: ${error.message}` }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        crm_configured: Boolean(env.SUPABASE_URL && (env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.SUPABASE_PUBLISHABLE_KEY)),
        email_configured: Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && (env.LEAD_NOTIFICATION_EMAIL || "gharibyar61@gmail.com"))
      });
    }

    if (url.pathname === "/api/leads" || url.pathname === "/api/leads/") {
      return handleLead(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};
