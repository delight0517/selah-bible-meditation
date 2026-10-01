(() => {
  const endpoint = "https://cloud-account-storage.imdisablebutgodisable.workers.dev/analytics/event";
  const day = new Date().toISOString().slice(0, 10);
  const month = day.slice(0, 7);
  const path = location.pathname;
  const pending = new Set();
  const eligibilityKey = "selah.analytics.fil.activationEligible";
  const activationKey = "selah.analytics.fil.firstReflectionSaved";

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
      return {
        visitorId: sessionStorage.getItem(dailyKey + "." + day) || crypto.randomUUID(),
        monthlyVisitorId: sessionStorage.getItem(monthlyKey + "." + month) || crypto.randomUUID()
      };
    }
  }

  function attribution() {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(["source", "medium", "campaign"].flatMap(name => {
      const value = params.get("utm_" + name) || "";
      return /^[a-zA-Z0-9._-]{1,80}$/.test(value) ? [[name, value]] : [];
    }));
  }

  async function track(event, key) {
    if (pending.has(key)) return;
    pending.add(key);
    try {
      if (localStorage.getItem(key) === "1") return;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          appId: "selah", event, path, ...visitorIds(), ...attribution()
        })
      });
      if (response.ok) localStorage.setItem(key, "1");
    } catch {
    } finally {
      pending.delete(key);
    }
  }

  let eligible = false;
  try {
    let saved = localStorage.getItem(eligibilityKey);
    if (saved === null) {
      const prior = JSON.parse(localStorage.getItem("selah.fil.reader.v1") || "{}");
      const hadNotes = Object.values(prior.notes || {}).some(note => typeof note === "string" && note.trim());
      saved = hadNotes ? "0" : "1";
      localStorage.setItem(eligibilityKey, saved);
    }
    eligible = saved === "1";
  } catch {
  }

  track("page:view", "selah.analytics.fil.page." + path + "." + day + "." + Object.values(attribution()).join("."));

  window.selahAnalytics = {
    reader() {
      track("engagement:reader_opened", "selah.analytics.fil.reader." + path + "." + day);
    },
    reflection(note) {
      if (eligible && note.trim().length >= 20) track("activation:first_reflection_saved", activationKey);
    }
  };
})();
