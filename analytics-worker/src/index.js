const features = new Set([
  "scripture_read", "meditation_started", "reflection_saved",
  "highlight_added", "bookmark_added", "verse_shared",
  "offline_bible_saved", "quiz_created", "quiz_reviewed"
]);
const locales = new Set(["ko", "en", "ja", "zh-CN", "zh-TW", "fil", "es", "pt-BR"]);

function cors(origin, allowed) {
  const valid = origin === allowed;
  return {
    "access-control-allow-origin": valid ? origin : "null",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin"
  };
}
function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });
}
function rollup(rows) {
  const countries = {};
  for (const row of rows) {
    (countries[row.country] ||= {})[row.feature] = Number(row.total);
  }
  return countries;
}
async function rows30(db) {
  const result = await db.prepare("SELECT country, feature, SUM(count) AS total FROM feature_daily WHERE day >= date('now', '-29 days') GROUP BY country, feature").all();
  return result.results || [];
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const headers = cors(origin, env.ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, { status: origin === env.ALLOWED_ORIGIN ? 204 : 403, headers });
    if (origin && origin !== env.ALLOWED_ORIGIN) return json({ error: "origin_not_allowed" }, 403, headers);
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/analytics/event") {
      const length = Number(request.headers.get("content-length") || 0);
      if (length > 2048) return json({ error: "payload_too_large" }, 413, headers);
      let body;
      try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400, headers); }
      const country = request.cf?.country;
      if (body?.appId !== "selah" || !features.has(body.feature) || !locales.has(body.locale) || !/^[A-Z]{2}$/.test(country || "")) {
        return json({ error: "invalid_event" }, 400, headers);
      }
      await env.DB.prepare("INSERT INTO feature_daily (day, country, locale, feature, count) VALUES (date('now'), ?, ?, ?, 1) ON CONFLICT(day, country, locale, feature) DO UPDATE SET count = count + 1").bind(country, body.locale, body.feature).run();
      return json({ ok: true }, 202, headers);
    }

    if (request.method === "GET" && url.pathname === "/analytics/summary") {
      const rows = await rows30(env.DB);
      return json({ period: "30d", featuresByCountry: rollup(rows) }, 200, headers);
    }

    if (request.method === "GET" && url.pathname === "/analytics/market") {
      const country = request.cf?.country;
      if (!/^[A-Z]{2}$/.test(country || "")) return json({ country: null, topFeature: null }, 200, headers);
      const row = await env.DB.prepare("SELECT feature, SUM(count) AS total FROM feature_daily WHERE country = ? AND day >= date('now', '-29 days') GROUP BY feature ORDER BY total DESC LIMIT 1").bind(country).first();
      // Require a meaningful aggregate before changing the visual emphasis.
      return json({ country, topFeature: row && Number(row.total) >= 50 ? row.feature : null, sampleCount: row ? Number(row.total) : 0 }, 200, headers);
    }
    return json({ error: "not_found" }, 404, headers);
  }
};
