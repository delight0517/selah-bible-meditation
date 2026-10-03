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
          : { appId: "selah", event, path, locale, referrer, ...visitorIds(), ...campaign })
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
      track("engagement:reader_opened", "selah.analytics." + locale + ".reader." + path + "." + day);
      this.feature("scripture_read");
    },
    feature(name) {
      if (!["scripture_read", "reflection_saved", "highlight_added", "bookmark_added", "verse_shared", "offline_bible_saved"].includes(name)) return;
      track("feature:" + name, "selah.analytics." + locale + ".feature." + name + "." + path + "." + day);
    },
    reflection(note) {
      if (eligible && note.trim().length >= 20) {
        track("activation:first_reflection_saved", activationKey);
        this.feature("reflection_saved");
      }
    }
  };
})();
