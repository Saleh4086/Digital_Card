const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=900, s-maxage=900"
  }
});

function cleanHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/\s+/g, " ");
}

function parseMnd(text, loanType) {
  const normalized = cleanHtml(text);
  const heading = loanType === "fha"
    ? /MND(?:'s)?\s+30\s+Year\s+FHA/i
    : /MND(?:'s)?\s+30\s+Year\s+Fixed/i;
  const idx = normalized.search(heading);
  const section = idx >= 0 ? normalized.slice(idx, idx + 9000) : normalized;

  // MND history rows commonly appear as: 8/6/2026 6.77% ... +0.02%
  let m = section.match(/(\d{1,2}\/\d{1,2}\/(?:\d{2}|\d{4}))[^0-9]{0,80}(\d+\.\d+)%[^+\-]{0,120}([+\-]\d+\.\d+)%/i);
  if (m) return { updated: m[1], rate: +m[2], change: +m[3] };

  // Alternate layout where the rate/change is near the current heading.
  m = section.match(/(\d+\.\d+)%\s*([+\-]\d+\.\d+)%[^0-9]{0,160}(\d{1,2}\/\d{1,2}\/(?:\d{2}|\d{4}))/i);
  if (m) return { updated: m[3], rate: +m[1], change: +m[2] };

  return null;
}

async function fetchMnd(path) {
  const url = `https://www.mortgagenewsdaily.com${path}`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; BlackstoneRateWatch/3.0; +https://blackstonesignatureproperty.com)",
      "Accept": "text/html,application/xhtml+xml"
    },
    cf: { cacheTtl: 900, cacheEverything: true }
  });
  if (!r.ok) throw new Error(`MND ${r.status}`);
  return r.text();
}

async function freddieFallback() {
  const url = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US";
  const r = await fetch(url, { cf: { cacheTtl: 21600, cacheEverything: true } });
  if (!r.ok) throw new Error(`FRED ${r.status}`);
  const csv = await r.text();
  const rows = csv.trim().split(/\r?\n/).slice(1).map(line => {
    const comma = line.indexOf(",");
    return comma < 0 ? null : { date: line.slice(0, comma), rate: parseFloat(line.slice(comma + 1)) };
  }).filter(x => x && Number.isFinite(x.rate));
  if (!rows.length) throw new Error("No Freddie rate rows");
  const latest = rows.at(-1), prev = rows.at(-2);
  return {
    rate30: latest.rate,
    fha30: null,
    change30: prev ? +(latest.rate - prev.rate).toFixed(2) : null,
    changeFha30: null,
    updated: latest.date,
    source: "Freddie Mac PMMS (weekly fallback)",
    sourceUrl: "https://fred.stlouisfed.org/series/MORTGAGE30US",
    frequency: "Weekly",
    fallback: true
  };
}

export async function onRequestGet() {
  try {
    const [fixedHtml, fhaHtml] = await Promise.all([
      fetchMnd("/mortgage-rates/30-year-fixed"),
      fetchMnd("/mortgage-rates/30-year-fha")
    ]);
    const fixed = parseMnd(fixedHtml, "fixed");
    const fha = parseMnd(fhaHtml, "fha");
    if (!fixed || !Number.isFinite(fixed.rate)) throw new Error("Could not parse MND 30-year fixed rate");

    return json({
      rate30: fixed.rate,
      fha30: fha && Number.isFinite(fha.rate) ? fha.rate : null,
      change30: Number.isFinite(fixed.change) ? fixed.change : null,
      changeFha30: fha && Number.isFinite(fha.change) ? fha.change : null,
      updated: fixed.updated,
      fhaUpdated: fha?.updated || fixed.updated,
      source: "Mortgage News Daily Rate Index",
      sourceUrl: "https://www.mortgagenewsdaily.com/mortgage-rates",
      frequency: "Weekdays"
    });
  } catch (mndError) {
    try {
      return json(await freddieFallback());
    } catch (fallbackError) {
      return json({
        error: "Live mortgage-rate sources are temporarily unavailable.",
        details: "The site will retry automatically on the next visit."
      }, 503);
    }
  }
}
