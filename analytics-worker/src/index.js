const features = new Set([
  "scripture_read", "meditation_started", "reflection_saved",
  "highlight_added", "bookmark_added", "verse_shared",
  "offline_bible_saved", "quiz_created", "quiz_reviewed"
]);
const locales = new Set(["ko", "en", "ja", "zh-CN", "zh-TW", "fil", "es", "pt-BR"]);
const experimentEvents = new Set(["exposure", "cta_click", "reading_start", "reader_30s", "reader_120s", "reflection_saved", "signup_complete", "return_visit"]);
const experiments = new Set(["global-funnel-v1", "localized-arrival-copy-v1", "kr-home-copy-v1", "kr-gentle-invitation-v1", "kr-spiritual-curiosity-v2", "kr-spiritual-curiosity-v3"]);
const experimentClients = new Set(["app", "web", "unknown"]);
const experimentDevices = new Set(["phone", "tablet", "computer", "unknown"]);
const landingRoutes = new Set(["app", "localized-landing", "guide", "download", "other", "unattributed"]);
const validTag = value => typeof value === "string" && /^[a-zA-Z0-9._-]{1,80}$/.test(value) ? value.toLowerCase() : "";

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
    const url = new URL(request.url);
    const signupLocationRoute = url.pathname === "/analytics/signup-location";
    const headers = signupLocationRoute
      ? { ...cors(origin, env.ALLOWED_ORIGIN), "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS", "cache-control": "no-store" }
      : cors(origin, env.ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, { status: signupLocationRoute || origin === env.ALLOWED_ORIGIN ? 204 : 403, headers });
    if (origin && origin !== env.ALLOWED_ORIGIN && !signupLocationRoute) return json({ error: "origin_not_allowed" }, 403, headers);

    if (request.method === "GET" && signupLocationRoute) {
      const country = /^[A-Z]{2}$/.test(request.cf?.country || "") ? request.cf.country : null;
      const rawRegion = String(request.cf?.regionCode || "").trim().toUpperCase();
      const region = rawRegion.startsWith(`${country}-`) ? rawRegion.slice(country.length + 1) : rawRegion;
      const subdivisionCode = country && /^[A-Z0-9]{1,3}$/.test(region) ? `${country}-${region}` : null;
      return json({ country, subdivisionCode }, 200, headers);
    }

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

    if (request.method === "POST" && url.pathname === "/analytics/experiment/event") {
      const length = Number(request.headers.get("content-length") || 0);
      if (length > 1024) return json({ error: "payload_too_large" }, 413, headers);
      let body;
      try { body = await request.json(); } catch { return json({ error: "invalid_json" }, 400, headers); }
      const country = request.cf?.country;
      const regionCode = String(request.cf?.regionCode || "").toUpperCase();
      const landingRoute = body?.landingRoute === undefined ? "unattributed" : body.landingRoute;
      if (body?.appId !== "selah" || !experiments.has(body.experiment) || !["a", "b"].includes(body.variant) || !experimentEvents.has(body.event) || !locales.has(body.locale) || !experimentClients.has(body.client) || !experimentDevices.has(body.deviceClass) || !landingRoutes.has(landingRoute) || !/^[A-Z]{2}$/.test(country || "") || !/^[A-Z0-9-]{0,8}$/.test(regionCode)) {
        return json({ error: "invalid_event" }, 400, headers);
      }
      const source = validTag(body.source), medium = validTag(body.medium), campaign = validTag(body.campaign);
      await env.DB.prepare("INSERT INTO market_experiment_daily (day, country, region_code, landing_route, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant, event, count) VALUES (date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1) ON CONFLICT(day, country, region_code, landing_route, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant, event) DO UPDATE SET count = count + 1").bind(country, regionCode, landingRoute, body.locale, body.client, body.deviceClass, source, medium, campaign, body.experiment, body.variant, body.event).run();
      return json({ ok: true }, 202, headers);
    }

    if (request.method === "GET" && url.pathname === "/analytics/experiment/summary") {
      const period = url.searchParams.get("period") === "all" ? "all" : "30d";
      const where = period === "all" ? "" : " WHERE day >= date('now', '-29 days')";
      const metrics = "SUM(CASE WHEN event = 'exposure' THEN count ELSE 0 END) AS exposures, SUM(CASE WHEN event = 'cta_click' THEN count ELSE 0 END) AS ctaClicks, SUM(CASE WHEN event = 'reading_start' THEN count ELSE 0 END) AS readingStarts, SUM(CASE WHEN event = 'reader_30s' THEN count ELSE 0 END) AS readers30s, SUM(CASE WHEN event = 'reader_120s' THEN count ELSE 0 END) AS readers120s, SUM(CASE WHEN event = 'reflection_saved' THEN count ELSE 0 END) AS reflectionsSaved, SUM(CASE WHEN event = 'signup_complete' THEN count ELSE 0 END) AS signups, SUM(CASE WHEN event = 'return_visit' THEN count ELSE 0 END) AS returnVisits FROM market_experiment_daily" + where;
      const [markets, details] = await Promise.all([
        env.DB.prepare(`SELECT country, region_code AS regionCode, landing_route AS landingRoute, locale, experiment, variant, ${metrics} GROUP BY country, region_code, landing_route, locale, experiment, variant ORDER BY country, region_code, landing_route, locale, experiment, variant`).all(),
        env.DB.prepare(`SELECT country, region_code AS regionCode, landing_route AS landingRoute, locale, client, device_class AS deviceClass, utm_source AS source, utm_medium AS medium, utm_campaign AS campaign, experiment, variant, ${metrics} GROUP BY country, region_code, landing_route, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant ORDER BY country, region_code, landing_route, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant`).all()
      ]);
      return json({ period, marketRows: markets.results || [], rows: details.results || [] }, 200, headers);
    }

    if (request.method === "GET" && url.pathname === "/analytics/summary") {
      const rows = await rows30(env.DB);
      return json({ period: "30d", featuresByCountry: rollup(rows) }, 200, headers);
    }

    if (request.method === "GET" && url.pathname === "/analytics/market") {
      const country = request.cf?.country;
      const regionCode = String(request.cf?.regionCode || "").toUpperCase();
      if (!/^[A-Z]{2}$/.test(country || "")) return json({ country: null, regionCode: null, topFeature: null }, 200, headers);
      const row = await env.DB.prepare("SELECT feature, SUM(count) AS total FROM feature_daily WHERE country = ? AND day >= date('now', '-29 days') GROUP BY feature ORDER BY total DESC LIMIT 1").bind(country).first();
      // Require a meaningful aggregate before changing the visual emphasis.
      return json({ country, regionCode: /^[A-Z0-9-]{1,8}$/.test(regionCode) ? regionCode : null, topFeature: row && Number(row.total) >= 50 ? row.feature : null, sampleCount: row ? Number(row.total) : 0, experiments: [...experiments] }, 200, headers);
    }
    return json({ error: "not_found" }, 404, headers);
  }
};
