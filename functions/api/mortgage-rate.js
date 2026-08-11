// Cloudflare Pages Function: returns the latest Freddie Mac 30-year fixed
// national average from FRED. This avoids browser CORS issues.
export async function onRequestGet() {
  const source = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=MORTGAGE30US';
  try {
    const response = await fetch(source, {
      headers: { 'User-Agent': 'BlackstoneSignatureProperties/1.0' },
      cf: { cacheTtl: 21600, cacheEverything: true }
    });
    if (!response.ok) throw new Error(`FRED returned ${response.status}`);
    const csv = await response.text();
    const lines = csv.trim().split(/\r?\n/).slice(1);
    const rows = [];
    for (const line of lines) {
      const comma = line.indexOf(',');
      if (comma < 0) continue;
      const date = line.slice(0, comma).trim();
      const rate = Number.parseFloat(line.slice(comma + 1).trim());
      if (date && Number.isFinite(rate)) rows.push({ date, rate });
    }
    if (!rows.length) throw new Error('No valid rate rows found');
    const latest = rows.at(-1);
    const previous = rows.length > 1 ? rows.at(-2) : null;
    return Response.json({
      ok: true,
      rate: latest.rate,
      date: latest.date,
      previousRate: previous?.rate ?? null,
      previousDate: previous?.date ?? null,
      frequency: 'weekly',
      source: 'Freddie Mac / FRED',
      disclaimer: 'National weekly average, not a lender quote.'
    }, {
      headers: {
        'Cache-Control': 'public, max-age=21600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return Response.json({ ok: false, error: 'Rate source temporarily unavailable.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}
