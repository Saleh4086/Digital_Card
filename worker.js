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

async function parseResponse(r) {
  const raw = await r.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; }
  catch { data = raw; }
  return { raw, data };
}

async function saveDirectToSupabase(payload, env) {
  const supabaseUrl = clean(env?.SUPABASE_URL, 1000).replace(/\/$/, "");
  const serviceKey = clean(env?.SUPABASE_SERVICE_ROLE_KEY, 10000);
  const ownerId = clean(env?.CRM_OWNER_USER_ID, 100);

  if (!supabaseUrl || !serviceKey) return null;

  const row = { ...payload, source: "Digital Business Card" };
  if (ownerId) row.user_id = ownerId;

  const r = await fetch(`${supabaseUrl}/rest/v1/leads`, {
    method: "POST",
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation"
    },
    body: JSON.stringify(row)
  });

  const { raw, data } = await parseResponse(r);
  if (!r.ok) {
    throw new Error(data?.message || data?.details || data?.hint || raw || `Supabase returned ${r.status}`);
  }

  return {
    saved: Array.isArray(data) ? (data[0] || {}) : (data || {}),
    mode: "direct_supabase",
    websiteNotificationMayHaveSent: false
  };
}

async function saveThroughWebsite(payload, env) {
  const endpoint = clean(
    env?.CRM_API_URL || "https://blackstonesignatureproperty.com/api/leads",
    1000
  );

  const websitePayload = {
    ...payload,
    source: "Digital Business Card",
    page: "/digital-business-card",
    fields: {
      name: payload.name || "",
      phone: payload.phone || "",
      email: payload.email || "",
      property_address: payload.property_address || "",
      city: payload.city || "",
      lead_type: payload.lead_type || "",
      timeline: payload.timeline || "",
      motivation: payload.motivation || "",
      notes: payload.notes || "",
      source: "Digital Business Card"
    }
  };

  const separator = endpoint.includes("?") ? "&" : "?";
  const r = await fetch(`${endpoint}${separator}source=digital-business-card`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Lead-Source": "Digital Business Card"
    },
    body: JSON.stringify(websitePayload)
  });

  const { raw, data } = await parseResponse(r);
  if (!r.ok) {
    throw new Error(data?.error || data?.message || data?.details || raw || `Website CRM API returned ${r.status}`);
  }

  return {
    saved: data?.lead || data?.data || data || {},
    mode: "website_crm_api_fallback",
    websiteNotificationMayHaveSent: Boolean(data?.notification_sent || data?.email_sent || data?.ok)
  };
}

async function saveCRM(payload, env) {
  // Preferred path: direct Supabase when the secret is available.
  // Safe fallback: use the already-working Blackstone website CRM endpoint.
  // This makes the Digital Card keep working even if Cloudflare's uploaded
  // Worker version cannot see the dashboard Secret binding.
  const direct = await saveDirectToSupabase(payload, env);
  if (direct) return direct;
  return saveThroughWebsite(payload, env);
}

async function emailSal(payload, saved, env) {
  const key = clean(env?.RESEND_API_KEY, 500);
  const from = clean(env?.RESEND_FROM_EMAIL, 320);
  const to = clean(env?.LEAD_NOTIFICATION_EMAIL || "gharibyar61@gmail.com", 320);

  // CRM must work even if Digital Card email variables are not configured.
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
      `Source: Digital Business Card`,
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

  const { raw, data } = await parseResponse(r);
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

  let crmResult;
  try {
    crmResult = await saveCRM(payload, env);
  } catch (e) {
    console.error("CRM save failed:", e);
    return json({ error: `CRM save failed: ${e.message}` }, 502);
  }

  let emailSent = false;
  let emailError = null;

  // If the website fallback is used, that endpoint already handles the website's
  // lead notification. Only call Resend here when its Digital Card vars exist.
  try {
    const result = await emailSal(payload, crmResult.saved, env);
    emailSent = Boolean(result?.sent) || Boolean(crmResult.websiteNotificationMayHaveSent);
  } catch (e) {
    emailError = e.message;
    console.error("Email notification failed:", e);
    emailSent = Boolean(crmResult.websiteNotificationMayHaveSent);
  }

  return json({
    ok: true,
    lead_id: crmResult.saved?.id || crmResult.saved?.lead_id || null,
    source: "Digital Business Card",
    crm_mode: crmResult.mode,
    notification_sent: emailSent,
    notification_error: emailError,
    message: emailSent
      ? "Thank you. Your request was saved to Blackstone CRM and Sal was notified by email."
      : "Thank you. Your request was saved to Blackstone CRM. Sal will follow up shortly."
  });
}

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        direct_supabase_available: Boolean(env?.SUPABASE_URL && env?.SUPABASE_SERVICE_ROLE_KEY),
        supabase_url_configured: Boolean(env?.SUPABASE_URL),
        service_role_key_configured: Boolean(env?.SUPABASE_SERVICE_ROLE_KEY),
        owner_configured: Boolean(env?.CRM_OWNER_USER_ID),
        fallback_endpoint: clean(env?.CRM_API_URL || "https://blackstonesignatureproperty.com/api/leads", 1000),
        email_configured: Boolean(env?.RESEND_API_KEY && env?.RESEND_FROM_EMAIL),
        source: "Digital Business Card"
      });
    }

    if (url.pathname === "/api/leads" || url.pathname === "/api/leads/") {
      return handleLead(request, env);
    }

    // In production Cloudflare serves the files in /public as static assets.
    // The dashboard preview can omit the ASSETS binding, so never crash here.
    if (env?.ASSETS && typeof env.ASSETS.fetch === "function") {
      return env.ASSETS.fetch(request);
    }

    return new Response("Digital Card static asset preview unavailable.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
};
