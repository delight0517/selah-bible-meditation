(() => {
  // Keep internal QA visits out of first-party page and feature analytics.
  if (new URLSearchParams(location.search).get("selah_qa") === "1") return;

  const endpoint = "https://cloud-account-storage.imdisablebutgodisable.workers.dev/analytics/event";
  const featureEndpoint = "https://selah-feature-analytics.imdisablebutgodisable.workers.dev/analytics/event";
  const day = new Date().toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  const path = location.pathname;
  const pending = new Set();
  const locale = document.documentElement.lang.startsWith("fil") ? "fil" : document.documentElement.lang;
  const nativeApp = window.Capacitor?.isNativePlatform?.() === true;
  const referrer = (() => { try { return document.referrer ? new URL(document.referrer).hostname : ""; } catch { return ""; } })();
  const campaign = attribution();
  const eligibilityKey = "selah.analytics." + locale + ".activationEligible";
  const activationKey = "selah.analytics." + locale + ".firstReflectionSaved";

  function visitorIds() {
    const dailyKey = "selah.analytics.dailyVisitor";
    const monthlyKey = "selah.analytics.monthlyVisitor";
    try {
      let daily = JSON.parse(localStorage.getItem(dailyKey) || "null");
      if (daily?.day !== day) {
        daily = { day, id: crypto.randomUUID() };
        localStorage.setItem(dailyKey, JSON.stringify(daily));
      }
      let monthly = JSON.parse(localStorage.getItem(monthlyKey) || "null");
      if (monthly?.month !== month) {
        monthly = { month, id: crypto.randomUUID() };
        localStorage.setItem(monthlyKey, JSON.stringify(monthly));
      }
      return { visitorId: daily.id, monthlyVisitorId: monthly.id };
    } catch {
      try {
        const getSessionId = key => {
          let id = sessionStorage.getItem(key);
          if (!id) {
            id = crypto.randomUUID();
            sessionStorage.setItem(key, id);
          }
          return id;
        };
        return {
          visitorId: getSessionId(dailyKey + "." + day),
          monthlyVisitorId: getSessionId(monthlyKey + "." + month)
        };
      } catch {
        return { visitorId: crypto.randomUUID(), monthlyVisitorId: crypto.randomUUID() };
      }
    }
  }

  function attribution() {
    const params = new URLSearchParams(location.search);
    const tagged = Object.fromEntries(["source", "medium", "campaign"].flatMap(name => {
      const value = params.get("utm_" + name) || "";
      return /^[a-zA-Z0-9._-]{1,80}$/.test(value) ? [[name, value]] : [];
    }));
    if (Object.keys(tagged).length) return tagged;
    if (!referrer || referrer === location.hostname) return {};
    const sources = [
      ["google", /(^|\.)google\./, "organic"], ["naver", /(^|\.)naver\./, "organic"],
      ["bing", /(^|\.)bing\.com$/, "organic"], ["yahoo", /(^|\.)yahoo\./, "organic"],
      ["duckduckgo", /(^|\.)duckduckgo\.com$/, "organic"], ["daum", /(^|\.)daum\.net$/, "organic"],
      ["baidu", /(^|\.)baidu\.com$/, "organic"], ["yandex", /(^|\.)yandex\./, "organic"],
      ["instagram", /(^|\.)instagram\.com$/, "social"], ["facebook", /(^|\.)facebook\.com$|(^|\.)fb\.me$/, "social"],
      ["x", /(^|\.)x\.com$|(^|\.)t\.co$/, "social"], ["threads", /(^|\.)threads\.net$/, "social"],
      ["tiktok", /(^|\.)tiktok\.com$/, "social"], ["reddit", /(^|\.)reddit\.com$/, "social"],
      ["youtube", /(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "social"], ["pinterest", /(^|\.)pinterest\.com$/, "social"],
      ["telegram", /(^|\.)t\.me$|(^|\.)telegram\.org$/, "social"], ["whatsapp", /(^|\.)whatsapp\.com$|(^|\.)wa\.me$/, "social"],
      ["messenger", /(^|\.)messenger\.com$|(^|\.)m\.me$/, "social"], ["line", /(^|\.)line\.me$|(^|\.)line\.naver\.jp$/, "social"],
      ["kakao", /(^|\.)kakao\.com$|(^|\.)kakao\.co\.kr$/, "social"], ["wechat", /(^|\.)wechat\.com$|(^|\.)weixin\.qq\.com$/, "social"]
    ];
    const match = sources.find(([, pattern]) => pattern.test(referrer));
    return match ? { source: match[0], medium: match[2] } : { source: "referral", medium: "referral" };
  }

  // Keep the original discovery source on internal links, including the handoff into the reader.
  if (Object.keys(campaign).length) {
    document.querySelectorAll("a[href]").forEach(link => {
      try {
        const target = new URL(link.href, location.href);
        if (target.origin !== location.origin) return;
        for (const [name, value] of Object.entries(campaign)) {
          if (!target.searchParams.has("utm_" + name)) target.searchParams.set("utm_" + name, value);
        }
        link.href = target.href;
      } catch { }
    });
  }

  function wasTracked(key) {
    try { return localStorage.getItem(key) === "1"; } catch {
      try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
    }
  }

  function markTracked(key) {
    try { localStorage.setItem(key, "1"); } catch {
      try { sessionStorage.setItem(key, "1"); } catch { }
    }
  }

  const deviceClass = (() => {
    const ua = navigator.userAgent || "";
    const tablet = /iPad|Tablet|PlayBook|Silk/i.test(ua)
      || (/MacIntel/.test(navigator.platform || "") && navigator.maxTouchPoints > 1)
      || (/Android/i.test(ua) && !/Mobile/i.test(ua));
    const phone = !tablet && (navigator.userAgentData?.mobile === true || /iPhone|iPod|Android.*Mobile|Windows Phone|Mobile/i.test(ua));
    return tablet ? "tablet" : phone ? "phone" : ua ? "computer" : "unknown";
  })();
  const funnelClient = window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true ? "app" : "web";
  const funnelAttribution = {
    source: campaign.source || "direct",
    medium: campaign.medium || "",
    campaign: campaign.campaign || ""
  };

  function reserveFunnelKey(key) {
    try {
      const saved = localStorage.getItem(key) || "";
      const pendingAt = saved.startsWith("pending:") ? Number(saved.slice(8)) : NaN;
      const age = Date.now() - pendingAt;
      if (saved === "1" || (Number.isFinite(pendingAt) && age >= 0 && age < 30000)) return null;
      const marker = "pending:" + Date.now();
      localStorage.setItem(key, marker);
      return marker;
    } catch {
      return "";
    }
  }

  function settleFunnelKey(key, marker, success) {
    try {
      if (marker && localStorage.getItem(key) !== marker) return;
      if (success) markTracked(key);
      else if (marker) localStorage.removeItem(key);
    } catch { }
  }

  function trackFunnel(event, occurrence = "once") {
    if (nativeApp) return;
    const scope = [locale, funnelClient, deviceClass, funnelAttribution.source, funnelAttribution.medium, funnelAttribution.campaign].join(".");
    const key = "selah.experiment.global-funnel-v1.a." + scope + "." + event + "." + occurrence;
    if (pending.has(key)) return;
    const marker = reserveFunnelKey(key);
    if (marker === null) return;
    pending.add(key);
    fetch("https://selah-feature-analytics.imdisablebutgodisable.workers.dev/analytics/experiment/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        appId: "selah", experiment: "global-funnel-v1", variant: "a", event, locale,
        client: funnelClient, deviceClass, ...funnelAttribution
      }),
      keepalive: true
    }).then(response => settleFunnelKey(key, marker, response.ok))
      .catch(() => settleFunnelKey(key, marker, false))
      .finally(() => pending.delete(key));
  }

  if (!nativeApp) {
    const firstSeenKey = "selah.experiment.global-funnel-v1.first-seen";
    try {
      const firstSeen = localStorage.getItem(firstSeenKey) || "";
      if (firstSeen && firstSeen < day) trackFunnel("return_visit", day);
      else if (!firstSeen) localStorage.setItem(firstSeenKey, day);
    } catch { }
    trackFunnel("exposure");
    document.addEventListener("click", event => {
      const target = event.target instanceof Element ? event.target.closest("a[href],button") : null;
      if (!target) return;
      if (target.matches("button#start")) {
        trackFunnel("cta_click");
        return;
      }
      if (target.tagName !== "A") return;
      try {
        const url = new URL(target.href, location.href);
        if (url.origin === location.origin && ["read", "meditate"].includes(url.searchParams.get("homeAction"))) {
          trackFunnel("cta_click");
        }
      } catch { }
    }, true);
  }

  async function track(event, key) {
    if (pending.has(key)) return;
    pending.add(key);
    try {
      if (wasTracked(key)) return;
      const feature = event.startsWith("feature:") ? event.slice(8) : "";
      const response = await fetch(feature ? featureEndpoint : endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(feature
          ? { appId: "selah", feature, locale }
          : { appId: "selah", event, path, locale, referrer, ...visitorIds(), ...campaign }),
        keepalive: true
      });
      if (response.ok) markTracked(key);
    } catch {
    } finally {
      pending.delete(key);
    }
  }

  let eligible = false;
  try {
    let saved = localStorage.getItem(eligibilityKey);
    if (saved === null) {
      const prior = JSON.parse(localStorage.getItem(locale === "fil" ? "selah.fil.reader.v1" : "selah.reader." + locale + ".v1") || "{}");
      const hadNotes = Object.values(prior.notes || {}).some(note => typeof note === "string" && note.trim());
      saved = hadNotes ? "0" : "1";
      localStorage.setItem(eligibilityKey, saved);
    }
    eligible = saved === "1";
  } catch {
  }

  track("page:view", "selah.analytics." + locale + ".page." + path + "." + day + "." + Object.values(campaign).join("."));

  async function applyMarketEmphasis() {
    if (!document.querySelector(".reader-card,.note-card,#highlight,#bookmark,#share")) return;
    try {
      const key = "selah.analytics.market.checked", today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(key) === today) return;
      const response = await fetch("https://selah-feature-analytics.imdisablebutgodisable.workers.dev/analytics/market", { cache: "no-store" });
      if (!response.ok) return;
      const { topFeature } = await response.json();
      localStorage.setItem(key, today);
      const targets = { scripture_read: ".reader-card", reflection_saved: ".note-card", highlight_added: "#highlight", bookmark_added: "#bookmark", verse_shared: "#share" };
      const target = document.querySelector(targets[topFeature]);
      if (target) target.classList.add("market-feature-emphasis");
    } catch {
    }
  }
  void applyMarketEmphasis();

  window.selahAnalytics = {
    reader() {
      trackFunnel("reading_start");
      track("engagement:reader_opened", "selah.analytics." + locale + ".reader." + path + "." + day);
      this.feature("scripture_read");
    },
    feature(name) {
      if (!["scripture_read", "reflection_saved", "highlight_added", "bookmark_added", "verse_shared", "offline_bible_saved"].includes(name)) return;
      track("feature:" + name, "selah.analytics." + locale + ".feature." + name + "." + path + "." + day);
    },
    reflection(note) {
      if (eligible && note.trim().length >= 20) {
        trackFunnel("reflection_saved");
        track("activation:first_reflection_saved", activationKey);
        this.feature("reflection_saved");
      }
    }
  };
})();
