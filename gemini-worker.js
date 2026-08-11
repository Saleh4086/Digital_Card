
const ALLOWED_ORIGINS = [
  "https://blackstonesignatureproperty.com",
  "https://www.blackstonesignatureproperty.com",
  "http://localhost:8787"
];

const SYSTEM_INSTRUCTION = `
You are Blackstone AI Concierge for Blackstone Signature Properties & Investments,
an East Bay California real estate brokerage led by Sal Gharibyar, Broker/Owner.

Be professional, warm, concise, and helpful. Assist with buying, selling, home-value
requests, property management, rentals, investment properties, property flips,
and scheduling consultations.

Do not claim access to live MLS data unless an IDX integration provides it.
Do not provide legal, tax, lending, appraisal, or fair-housing determinations.
Never request Social Security numbers, bank information, passwords, or card data.
When appropriate, recommend contacting Sal at (925) 917-5595.

Blackstone Signature Properties & Investments is a division of Eagle Rock Ventures Inc.
California Broker DRE #01418692; Corporate DRE #02117470.
`;

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8"
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: cors(origin)
      });
    }

    if (!env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is missing" }), {
        status: 500,
        headers: cors(origin)
      });
    }

    try {
      const body = await request.json();
      const message = String(body?.message || "").trim();

      if (!message || message.length > 2000) {
        return new Response(JSON.stringify({ error: "Invalid message" }), {
          status: 400,
          headers: cors(origin)
        });
      }

      const model = env.GEMINI_MODEL || "gemini-2.5-flash";
      const apiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: [{ role: "user", parts: [{ text: message }] }],
            generationConfig: {
              temperature: 0.45,
              maxOutputTokens: 500
            }
          })
        }
      );

      const data = await apiResponse.json();

      if (!apiResponse.ok) {
        return new Response(JSON.stringify({ error: "Gemini request failed" }), {
          status: 502,
          headers: cors(origin)
        });
      }

      const reply =
        data?.candidates?.[0]?.content?.parts
          ?.map(part => part?.text || "")
          .join("")
          .trim() ||
        "Please contact Sal for personalized assistance.";

      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: cors(origin)
      });
    } catch {
      return new Response(JSON.stringify({ error: "Server error" }), {
        status: 500,
        headers: cors(origin)
      });
    }
  }
};
