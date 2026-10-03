const features = new Set([
  "scripture_read", "meditation_started", "reflection_saved",
  "highlight_added", "bookmark_added", "verse_shared",
  "offline_bible_saved", "bible_downloaded", "quiz_created", "quiz_reviewed", "focused_reading_started"
]);
const locales = new Set(["ko", "en", "ja", "zh-CN", "zh-TW", "fil", "es", "pt-BR"]);
const experimentEvents = new Set(["exposure", "cta_click", "reading_start", "reader_30s", "reader_120s", "reflection_saved", "return_visit"]);
const experiments = new Set(["kr-home-copy-v1"]);
const experimentClients = new Set(["app", "web", "unknown"]);
const experimentDevices = new Set(["phone", "tablet", "computer", "unknown"]);
const validTag = value => typeof value === "string" && /^[a-zA-Z0-9._-]{1,80}$/.test(value) ? value.toLowerCase() : "";

function cors(origin, allowed) {
  const valid = origin === allowed;
  return {
    "access-control-allow-origin": valid ? origin : "null",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, authorization",
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

    if (url.pathname.startsWith("/analytics/usage/")) {
      headers["cache-control"] = "no-store";
      const uuid = value => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
      if (request.method === "POST") {
        const raw = await request.text();
        if (raw.length > 2048) return json({ error: "payload_too_large" }, 413, headers);
        let body;
        try { body = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400, headers); }
        if (!uuid(body?.visitorId)) return json({ error: "invalid_visitor" }, 400, headers);
        if (url.pathname === "/analytics/usage/delete") {
          await env.DB.prepare("DELETE FROM usage_events WHERE visitor_id = ?").bind(body.visitorId).run();
          return json({ ok: true }, 200, headers);
        }
        if (url.pathname === "/analytics/usage/event") {
          const country = /^[A-Z]{2}$/.test(request.cf?.country || "") ? request.cf.country : "ZZ";
          if (body.consent !== true || !uuid(body.eventId) || !features.has(body.feature) || !locales.has(body.locale) || !experimentClients.has(body.client) || !experimentDevices.has(body.deviceClass)) return json({ error: "invalid_event" }, 400, headers);
          await env.DB.prepare("DELETE FROM usage_events WHERE occurred_at < datetime('now', '-30 days')").run();
          // Stable event IDs make offline retries idempotent. Cap each browser's daily writes.
          await env.DB.prepare("INSERT OR IGNORE INTO usage_events (event_id, visitor_id, occurred_at, country, locale, client, device_class, feature, source, medium, campaign) SELECT ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, ? WHERE (SELECT COUNT(*) FROM usage_events WHERE visitor_id = ? AND occurred_at >= date('now')) < 500").bind(body.eventId, body.visitorId, country, body.locale, body.client, body.deviceClass, body.feature, validTag(body.source), validTag(body.medium), validTag(body.campaign), body.visitorId).run();
          return json({ ok: true }, 202, headers);
        }
      }
      if (request.method === "GET" && url.pathname === "/analytics/usage/users") {
        const authorization = request.headers.get("authorization") || "";
        if (!/^Bearer [^\s]{1,4096}$/.test(authorization)) return json({ error: "developer_session_required" }, 401, headers);
        // Validate the current developer session with the owning auth server, never a client flag.
        try {
          const access = await fetch("https://brainwire-f2gf.onrender.com/api/feedback/developer-proof", { headers: { authorization }, redirect: "error", signal: AbortSignal.timeout(8000) });
          const proof = access.ok ? await access.json() : null;
          if (!proof?.ok || !proof.proof) return json({ error: "developer_session_required" }, 403, headers);
        } catch { return json({ error: "auth_unavailable" }, 503, headers); }
        await env.DB.prepare("DELETE FROM usage_events WHERE occurred_at < datetime('now', '-30 days')").run();
        const visitor = url.searchParams.get("visitorId");
        if (visitor && !uuid(visitor)) return json({ error: "invalid_visitor" }, 400, headers);
        if (visitor) {
          const result = await env.DB.prepare("SELECT occurred_at AS occurredAt, country, locale, client, device_class AS deviceClass, feature, source, medium, campaign FROM usage_events WHERE visitor_id = ? ORDER BY occurred_at DESC, event_id DESC LIMIT 200").bind(visitor).all();
          return json({ visitorId: visitor, events: result.results || [], limit: 200, period: "30d" }, 200, headers);
        }
        const result = await env.DB.prepare("SELECT visitor_id AS visitorId, feature, COUNT(*) AS uses, MIN(occurred_at) AS firstSeen, MAX(occurred_at) AS lastSeen FROM usage_events WHERE visitor_id IN (SELECT visitor_id FROM usage_events GROUP BY visitor_id ORDER BY MAX(occurred_at) DESC, visitor_id LIMIT 100) GROUP BY visitor_id, feature ORDER BY lastSeen DESC, visitorId, feature").all();
        return json({ rows: result.results || [], limit: 100, period: "30d", identity: "consented_browser" }, 200, headers);
      }
      return json({ error: "not_found" }, 404, headers);
    }

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
      if (body?.appId !== "selah" || !experiments.has(body.experiment) || !["a", "b"].includes(body.variant) || !experimentEvents.has(body.event) || !locales.has(body.locale) || !experimentClients.has(body.client) || !experimentDevices.has(body.deviceClass) || !/^[A-Z]{2}$/.test(country || "") || !/^[A-Z0-9-]{0,8}$/.test(regionCode)) {
        return json({ error: "invalid_event" }, 400, headers);
      }
      const source = validTag(body.source), medium = validTag(body.medium), campaign = validTag(body.campaign);
      await env.DB.prepare("INSERT INTO market_experiment_daily (day, country, region_code, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant, event, count) VALUES (date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1) ON CONFLICT(day, country, region_code, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant, event) DO UPDATE SET count = count + 1").bind(country, regionCode, body.locale, body.client, body.deviceClass, source, medium, campaign, body.experiment, body.variant, body.event).run();
      return json({ ok: true }, 202, headers);
    }

    if (request.method === "GET" && url.pathname === "/analytics/experiment/summary") {
      const period = url.searchParams.get("period") === "all" ? "all" : "30d";
      const where = period === "all" ? "" : " WHERE day >= date('now', '-29 days')";
      const metrics = "SUM(CASE WHEN event = 'exposure' THEN count ELSE 0 END) AS exposures, SUM(CASE WHEN event = 'cta_click' THEN count ELSE 0 END) AS ctaClicks, SUM(CASE WHEN event = 'reading_start' THEN count ELSE 0 END) AS readingStarts, SUM(CASE WHEN event = 'reader_30s' THEN count ELSE 0 END) AS readers30s, SUM(CASE WHEN event = 'reader_120s' THEN count ELSE 0 END) AS readers120s, SUM(CASE WHEN event = 'reflection_saved' THEN count ELSE 0 END) AS reflectionsSaved, SUM(CASE WHEN event = 'return_visit' THEN count ELSE 0 END) AS returnVisits FROM market_experiment_daily" + where;
      const [markets, details] = await Promise.all([
        env.DB.prepare(`SELECT country, region_code AS regionCode, locale, experiment, variant, ${metrics} GROUP BY country, region_code, locale, experiment, variant ORDER BY country, region_code, locale, experiment, variant`).all(),
        env.DB.prepare(`SELECT country, region_code AS regionCode, locale, client, device_class AS deviceClass, utm_source AS source, utm_medium AS medium, utm_campaign AS campaign, experiment, variant, ${metrics} GROUP BY country, region_code, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant ORDER BY country, region_code, locale, client, device_class, utm_source, utm_medium, utm_campaign, experiment, variant`).all()
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
      return json({ country, regionCode: /^[A-Z0-9-]{1,8}$/.test(regionCode) ? regionCode : null, topFeature: row && Number(row.total) >= 50 ? row.feature : null, sampleCount: row ? Number(row.total) : 0 }, 200, headers);
    }
    return json({ error: "not_found" }, 404, headers);
  }
};
