(() => {
  const STORAGE_KEY = "selah.bibleEditionWishlist.v1";
  const ENDPOINT = "https://selah-feature-analytics.imdisablebutgodisable.workers.dev/analytics/edition-interest";
  const SUMMARY_ENDPOINT = "https://selah-feature-analytics.imdisablebutgodisable.workers.dev/analytics/edition-interest/summary?period=all";
  const languages = ["ko", "en", "ja", "zh-CN", "zh-TW", "ar", "he", "other"];
  const labels = {
    ko: {
      title: "내가 기다리는 성경 판본", intro: "위시리스트는 이 브라우저에만 저장되며 BlueCloud 계정과 동기화되지 않습니다. 판본 본문은 저장하거나 보내지 않습니다.",
      name: "원하는 판본 이름", namePlaceholder: "예: 개역개정 4판", language: "성경 언어", source: "공식 판본 안내 링크 (선택)",
      share: "이 판본명과 언어를 익명 수요 집계로 공유", paid: "권리가 확인된 유료 정식판본이 나오면 구매를 고려하겠습니다",
      paidNote: "유료 관심 표시는 구매나 선주문이 아닙니다. 출판권·가격·판매 가능 지역을 확인한 뒤에만 판매합니다.",
      add: "위시리스트에 저장", remove: "삭제", empty: "아직 저장된 판본이 없습니다.", localOnly: "이 기기에만 저장", rights: "본문 제공 전 권리와 지역별 허가 확인 필요",
      shared: "익명 수요 신호를 공유함", notShared: "익명 수요는 공유하지 않음", shareNow: "익명으로 수요 공유", retry: "다시 시도",
      saveOk: "위시리스트를 이 기기에 저장했습니다.", sharedOk: "익명 수요 집계에 전송했습니다.", shareFail: "기기에는 저장했지만 익명 집계 전송은 실패했습니다. 연결 후 다시 시도할 수 있습니다.", nameError: "판본 이름을 입력해 주세요.", sourceError: "공식 출처 링크는 https:// 주소만 사용할 수 있습니다.", saveError: "저장 공간을 사용할 수 없어 이 기기에 저장하지 못했습니다.",
      privacy: "익명 공유를 선택하면 판본명, 성경 언어, 화면 언어, 관심 유형(읽기/유료판본)과 넓은 국가 코드만 집계합니다. 계정, 이메일, 메모, 읽은 말씀, 성경 본문은 보내지 않습니다. 집계된 신호는 되돌릴 수 없습니다.",
      aggregate: "익명 관심 신호", aggregateNote: "관심 유형별로 10건 이상인 전 세계 합계만 표시합니다. 사람 수가 아니라 익명 제출 건수입니다.", readMetric: "읽기 요청", paidMetric: "유료판본 관심",
      catalogAdd: "위시리스트에 추가", languageNames: { ko: "한국어", en: "영어", ja: "일본어", "zh-CN": "중국어 간체", "zh-TW": "중국어 번체", ar: "아랍어", he: "히브리어", other: "기타 / 모름" }
    },
    en: {
      title: "Bible editions I’m waiting for", intro: "Your wish list stays in this browser and is not synced to BlueCloud. Scripture text is never saved or sent here.",
      name: "Edition or translation name", namePlaceholder: "For example: Revised Korean Version, 4th edition", language: "Bible language", source: "Official edition information link (optional)",
      share: "Share this edition name and language in anonymous demand totals", paid: "I would consider buying a licensed edition if rights are secured",
      paidNote: "Paid interest is not a purchase or preorder. Nothing will be sold until rights, price, and eligible regions are confirmed.",
      add: "Save to wish list", remove: "Remove", empty: "No editions saved yet.", localOnly: "Saved on this device only", rights: "Rights and regional permission must be checked before text is offered",
      shared: "Anonymous interest shared", notShared: "Anonymous demand not shared", shareNow: "Share anonymous demand", retry: "Retry",
      saveOk: "Saved to this device’s wish list.", sharedOk: "Anonymous interest signal submitted.", shareFail: "Saved on this device, but anonymous sharing failed. You can retry when connected.", nameError: "Enter an edition name.", sourceError: "Use an HTTPS link for the official edition page.", saveError: "This browser could not save the wish list.",
      privacy: "If you opt in, only the edition name, Bible language, interface language, interest type, and broad country code are aggregated. No account, email, notes, reading history, or Bible text is sent. Aggregated signals cannot be withdrawn.",
      aggregate: "Anonymous interest signals", aggregateNote: "Only global totals with at least 10 submissions per interest type are shown. Counts are submissions, not people.", readMetric: "Read requests", paidMetric: "Paid-edition interest",
      catalogAdd: "Add to wish list", languageNames: { ko: "Korean", en: "English", ja: "Japanese", "zh-CN": "Simplified Chinese", "zh-TW": "Traditional Chinese", ar: "Arabic", he: "Hebrew", other: "Other / not sure" }
    },
    ja: {
      title: "読みたい聖書の版", intro: "希望リストはこのブラウザー内だけに保存され、BlueCloudとは同期されません。聖書本文は保存も送信もしません。",
      name: "版・翻訳名", namePlaceholder: "例：改訂韓国語聖書 第4版", language: "聖書の言語", source: "公式の版情報リンク（任意）",
      share: "版名と言語を匿名の需要集計に共有する", paid: "権利が確認された有料版が出たら購入を検討する",
      paidNote: "有料版への関心表明は購入・予約ではありません。権利、価格、販売地域を確認してから販売します。",
      add: "希望リストに保存", remove: "削除", empty: "保存された版はありません。", localOnly: "この端末にのみ保存", rights: "本文提供前に権利と地域許可の確認が必要です",
      shared: "匿名の関心を共有済み", notShared: "匿名共有なし", shareNow: "匿名で需要を共有", retry: "再試行",
      saveOk: "この端末の希望リストに保存しました。", sharedOk: "匿名の関心シグナルを送信しました。", shareFail: "端末には保存しましたが匿名共有に失敗しました。接続後に再試行できます。", nameError: "版名を入力してください。", sourceError: "公式ページのリンクには HTTPS を使用してください。", saveError: "この端末に保存できませんでした。",
      privacy: "同意した場合のみ、版名、聖書の言語、画面言語、関心の種類、広域の国コードを匿名集計します。アカウント、メール、メモ、読書履歴、聖書本文は送信しません。集計後のシグナルは取り消せません。",
      aggregate: "匿名の関心シグナル", aggregateNote: "関心の種類ごとに10件以上の世界合計のみ表示します。人数ではなく匿名の送信件数です。", readMetric: "読書希望", paidMetric: "有料版への関心",
      catalogAdd: "希望リストに追加", languageNames: { ko: "韓国語", en: "英語", ja: "日本語", "zh-CN": "簡体字中国語", "zh-TW": "繁体字中国語", ar: "アラビア語", he: "ヘブライ語", other: "その他・不明" }
    },
    "zh-CN": {
      title: "我想要的圣经译本", intro: "心愿单只保存在此浏览器中，不与 BlueCloud 同步。这里不会保存或发送圣经正文。",
      name: "译本或版本名称", namePlaceholder: "例如：修订韩文圣经 第4版", language: "圣经语言", source: "官方版本信息链接（可选）",
      share: "匿名分享此译本名称和语言，用于需求汇总", paid: "如果版权获批并推出正版付费版，我会考虑购买",
      paidNote: "付费意向不是购买或预订。只有确认版权、价格和销售地区后才会销售。",
      add: "保存到心愿单", remove: "删除", empty: "还没有保存译本。", localOnly: "仅保存在此设备", rights: "提供正文前必须确认版权和地区许可",
      shared: "已分享匿名意向", notShared: "未分享匿名需求", shareNow: "匿名分享需求", retry: "重试",
      saveOk: "已保存到此设备的心愿单。", sharedOk: "已提交匿名意向。", shareFail: "已保存在设备上，但匿名分享失败。联网后可以重试。", nameError: "请输入译本名称。", sourceError: "官方版本链接必须使用 HTTPS。", saveError: "无法保存到此浏览器。",
      privacy: "仅在你选择同意后，才汇总译本名称、圣经语言、界面语言、意向类型和宽泛的国家代码。不会发送账户、邮箱、笔记、阅读历史或圣经正文。汇总信号无法撤回。",
      aggregate: "匿名意向信号", aggregateNote: "仅显示每种意向至少10次提交的全球汇总。计数是提交次数，不代表人数。", readMetric: "阅读需求", paidMetric: "付费版意向",
      catalogAdd: "加入心愿单", languageNames: { ko: "韩语", en: "英语", ja: "日语", "zh-CN": "简体中文", "zh-TW": "繁体中文", ar: "阿拉伯语", he: "希伯来语", other: "其他 / 不确定" }
    },
    "zh-TW": {
      title: "我想要的聖經譯本", intro: "願望清單只保存在此瀏覽器，不與 BlueCloud 同步。這裡不會儲存或傳送聖經正文。",
      name: "譯本或版本名稱", namePlaceholder: "例如：修訂韓文聖經 第4版", language: "聖經語言", source: "官方版本資訊連結（選填）",
      share: "匿名分享此譯本名稱和語言，用於需求統計", paid: "若版權獲准並推出正版付費版，我會考慮購買",
      paidNote: "付費意願不是購買或預購。只有確認版權、價格和銷售地區後才會銷售。",
      add: "儲存到願望清單", remove: "刪除", empty: "尚未儲存譯本。", localOnly: "僅儲存在此裝置", rights: "提供正文前必須確認版權和地區授權",
      shared: "已分享匿名意願", notShared: "未分享匿名需求", shareNow: "匿名分享需求", retry: "重試",
      saveOk: "已儲存到此裝置的願望清單。", sharedOk: "已提交匿名意願。", shareFail: "已儲存在裝置上，但匿名分享失敗。連線後可重試。", nameError: "請輸入譯本名稱。", sourceError: "官方版本連結必須使用 HTTPS。", saveError: "無法儲存到此瀏覽器。",
      privacy: "只有在你選擇同意後，才會彙總譯本名稱、聖經語言、介面語言、意願類型和概略國家代碼。不會傳送帳戶、電子郵件、筆記、閱讀紀錄或聖經正文。彙總信號無法撤回。",
      aggregate: "匿名意願信號", aggregateNote: "只顯示每種意願至少10次提交的全球彙總。計數是提交次數，不代表人數。", readMetric: "閱讀需求", paidMetric: "付費版意願",
      catalogAdd: "加入願望清單", languageNames: { ko: "韓語", en: "英語", ja: "日語", "zh-CN": "簡體中文", "zh-TW": "繁體中文", ar: "阿拉伯語", he: "希伯來語", other: "其他 / 不確定" }
    }
  };

  function currentLocale() {
    const raw = document.documentElement?.lang || "en";
    if (labels[raw]) return raw;
    if (raw.toLowerCase().startsWith("ko")) return "ko";
    if (raw.toLowerCase().startsWith("ja")) return "ja";
    if (raw.toLowerCase().startsWith("zh-tw")) return "zh-TW";
    if (raw.toLowerCase().startsWith("zh")) return "zh-CN";
    return "en";
  }
  const text = () => labels[currentLocale()] || labels.en;
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  function normalizeEditionName(value) {
    return String(value ?? "").normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
  }
  function normalizeLanguage(value) { return languages.includes(value) ? value : "other"; }
  function normalizeHttpsUrl(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    if (raw.length > 500) throw new Error("source_url_too_long");
    let url;
    try { url = new URL(raw); } catch { throw new Error("source_url_invalid"); }
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("source_url_https_only");
    if (url.href.length > 500) throw new Error("source_url_too_long");
    return url.href;
  }
  function normalizeCatalogId(value) {
    const id = String(value ?? "").trim();
    return /^[A-Za-z0-9_.:-]{1,80}$/.test(id) ? id : "";
  }
  function editionKey(item) {
    const id = normalizeCatalogId(item.catalogId || item.editionId);
    return id ? `id:${id.toLowerCase()}` : `${normalizeLanguage(item.language)}|${normalizeEditionName(item.editionName).toLowerCase()}`;
  }
  function interestKey(item, kind) { return `${editionKey(item)}|${kind}`; }
  function emptyState() { return { version: 1, items: [], shared: [] }; }
  function createStore(storage, options = {}) {
    const now = options.now || (() => Date.now());
    const makeId = options.makeId || (() => globalThis.crypto?.randomUUID?.() || `${now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
    function read() {
      try {
        const value = JSON.parse(storage.getItem(STORAGE_KEY) || "null");
        if (!value || value.version !== 1 || !Array.isArray(value.items)) return emptyState();
        const items = value.items.filter(item => item && typeof item.id === "string" && normalizeEditionName(item.editionName) && languages.includes(item.language)).slice(0, 50).map(item => {
          let sourceUrl = "";
          try { sourceUrl = normalizeHttpsUrl(item.sourceUrl); } catch { }
          return {
            id: item.id.slice(0, 80), editionName: normalizeEditionName(item.editionName), language: item.language,
            sourceUrl, catalogId: normalizeCatalogId(item.catalogId), addedAt: Number.isFinite(item.addedAt) ? item.addedAt : 0,
            shareConsent: item.shareConsent === true, paidInterest: item.shareConsent === true && item.paidInterest === true
          };
        });
        return { version: 1, items, shared: Array.isArray(value.shared) ? value.shared.filter(x => typeof x === "string").slice(-500) : [] };
      } catch { return emptyState(); }
    }
    function write(state) { storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    return {
      all: () => read().items,
      wasShared: key => read().shared.includes(key),
      add(input) {
        const editionName = normalizeEditionName(input.editionName);
        if (!editionName) throw new Error("edition_name_required");
        const language = normalizeLanguage(input.language);
        const sourceUrl = normalizeHttpsUrl(input.sourceUrl);
        const catalogId = normalizeCatalogId(input.catalogId);
        const state = read();
        const candidate = { editionName, language, catalogId };
        const duplicate = state.items.find(item => (catalogId && item.catalogId?.toLowerCase() === catalogId.toLowerCase()) || editionKey(item) === editionKey(candidate));
        if (duplicate) {
          if (input.shareConsent === true) duplicate.shareConsent = true;
          if (input.paidInterest === true && duplicate.shareConsent) duplicate.paidInterest = true;
          write(state);
          return { item: duplicate, duplicate: true };
        }
        const item = {
          id: makeId(), editionName, language, sourceUrl, catalogId,
          addedAt: now(), shareConsent: input.shareConsent === true, paidInterest: input.shareConsent === true && input.paidInterest === true
        };
        state.items.unshift(item);
        state.items = state.items.slice(0, 50);
        write(state);
        return { item, duplicate: false };
      },
      update(id, patch) {
        const state = read();
        const item = state.items.find(row => row.id === id);
        if (!item) return null;
        if (patch.shareConsent === true) item.shareConsent = true;
        if (patch.paidInterest === true && item.shareConsent) item.paidInterest = true;
        write(state);
        return item;
      },
      remove(id) {
        const state = read();
        const next = state.items.filter(row => row.id !== id);
        if (next.length === state.items.length) return false;
        state.items = next;
        write(state);
        return true;
      },
      markShared(key) {
        const state = read();
        state.shared = [...new Set([...state.shared, key])].slice(-500);
        write(state);
      }
    };
  }
  function languageForCatalog(code) {
    const value = String(code || "").toLowerCase();
    if (["ko", "kor", "korean"].includes(value)) return "ko";
    if (["en", "eng", "english"].includes(value)) return "en";
    if (["ja", "jpn", "japanese"].includes(value)) return "ja";
    if (["zh-cn", "cmn", "zho", "chi", "cmn-hans"].includes(value)) return "zh-CN";
    if (["zh-tw", "cmn-hant"].includes(value)) return "zh-TW";
    if (["ar", "ara", "arabic"].includes(value)) return "ar";
    if (["he", "heb", "hebrew"].includes(value)) return "he";
    return "other";
  }
  function catalogButtonHtml(id) {
    const copy = text();
    return `<button type="button" class="bible-wishlist-catalog-button" data-wish-bible="${escapeHtml(normalizeCatalogId(id))}" aria-label="${escapeHtml(copy.catalogAdd)}" title="${escapeHtml(copy.catalogAdd)}">♡</button>`;
  }
  function safeEvent(item, interestType) {
    return {
      appId: "selah", editionName: normalizeEditionName(item.editionName), editionId: normalizeCatalogId(item.catalogId),
      language: normalizeLanguage(item.language), interestType, locale: currentLocale()
    };
  }
  async function sendInterest(item, interestType, fetcher = globalThis.fetch) {
    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.()) return false;
    if (typeof fetcher !== "function") return false;
    const response = await fetcher(ENDPOINT, {
      method: "POST", mode: "cors", credentials: "omit", keepalive: true,
      headers: { "content-type": "application/json" }, body: JSON.stringify(safeEvent(item, interestType))
    });
    return response.ok;
  }
  function languageOptions(copy) {
    return languages.map(code => `<option value="${code}">${escapeHtml(copy.languageNames[code] || labels.en.languageNames[code])}</option>`).join("");
  }
  function init() {
    const root = document.getElementById("bibleEditionWishlistRoot");
    if (!root || root.dataset.ready === "1") return;
    root.dataset.ready = "1";
    const copy = text();
    const supportsAnonymousShare = !(window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" && window.Capacitor.isNativePlatform());
    const hiddenShareControls = supportsAnonymousShare ? "" : " hidden";
    const store = createStore(window.localStorage);
    root.innerHTML = `<details class="edition-wishlist" id="editionWishlistPanel"><summary>${escapeHtml(copy.title)} <span class="small" id="editionWishlistCount"></span></summary><p class="note edition-wishlist-intro">${escapeHtml(copy.intro)}</p><form id="editionWishlistForm" class="edition-wishlist-form"><label for="editionWishlistName">${escapeHtml(copy.name)}</label><input id="editionWishlistName" maxlength="100" autocomplete="off" required placeholder="${escapeHtml(copy.namePlaceholder)}"><label for="editionWishlistLanguage">${escapeHtml(copy.language)}</label><select id="editionWishlistLanguage">${languageOptions(copy)}</select><label for="editionWishlistSource">${escapeHtml(copy.source)}</label><input id="editionWishlistSource" type="url" maxlength="500" inputmode="url" placeholder="https://…"><label class="edition-wishlist-check"${hiddenShareControls}><input id="editionWishlistShare" type="checkbox"${supportsAnonymousShare ? "" : " disabled"}><span>${escapeHtml(copy.share)}</span></label><label class="edition-wishlist-check"${hiddenShareControls}><input id="editionWishlistPaid" type="checkbox" disabled><span>${escapeHtml(copy.paid)}</span></label><p class="small"${hiddenShareControls}>${escapeHtml(copy.paidNote)}</p><p class="small edition-wishlist-privacy"${hiddenShareControls}>${escapeHtml(copy.privacy)}</p><button class="btn secondary" type="submit">${escapeHtml(copy.add)}</button></form><h3 class="edition-wishlist-subhead">${escapeHtml(copy.aggregate)}</h3><p class="small">${escapeHtml(copy.aggregateNote)}</p><div id="editionWishlistItems" class="edition-wishlist-items" aria-live="polite"></div><p class="note" id="editionWishlistStatus" role="status" aria-live="polite"></p></details>`;
    const form = root.querySelector("#editionWishlistForm");
    const nameInput = root.querySelector("#editionWishlistName");
    const languageInput = root.querySelector("#editionWishlistLanguage");
    languageInput.value = languages.includes(currentLocale()) ? currentLocale() : "other";
    const sourceInput = root.querySelector("#editionWishlistSource");
    const shareInput = root.querySelector("#editionWishlistShare");
    const paidInput = root.querySelector("#editionWishlistPaid");
    const list = root.querySelector("#editionWishlistItems");
    const status = root.querySelector("#editionWishlistStatus");
    const count = root.querySelector("#editionWishlistCount");
    let summaryRows = [];
    function renderList() {
      const items = store.all();
      count.textContent = items.length ? `(${items.length})` : "";
      if (!items.length) { list.innerHTML = `<p class="note">${escapeHtml(copy.empty)}</p>`; return; }
      list.innerHTML = items.map(item => {
        const types = ["read", ...(item.paidInterest ? ["paid"] : [])];
        const allShared = item.shareConsent && types.every(type => store.wasShared(interestKey(item, type)));
        const stats = summaryRows.filter(row => editionKey(row) === editionKey(item));
        const statsMarkup = stats.length ? `<span class="small edition-wishlist-stats">${escapeHtml(copy.aggregate)}: ${stats.map(row => `${escapeHtml(row.interestType === "paid" ? copy.paidMetric : copy.readMetric)} ${Number(row.total || 0)}`).join(" · ")}</span>` : "";
        const shareButton = !supportsAnonymousShare
          ? `<span class="small">${escapeHtml(copy.notShared)}</span>`
          : item.shareConsent && !allShared
            ? `<button class="btn ghost" type="button" data-share-wish="${escapeHtml(item.id)}">${escapeHtml(copy.retry)}</button>`
            : !item.shareConsent
              ? `<button class="btn ghost" type="button" data-consent-share="${escapeHtml(item.id)}">${escapeHtml(copy.shareNow)}</button>`
              : `<span class="small">${escapeHtml(copy.shared)}</span>`;
        const source = item.sourceUrl ? `<a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(copy.source)}</a>` : "";
        return `<article class="edition-wishlist-item"><div><strong>${escapeHtml(item.editionName)}</strong><span class="small">${escapeHtml(copy.languageNames[item.language] || labels.en.languageNames[item.language] || item.language)} · ${escapeHtml(copy.localOnly)}</span><span class="small edition-wishlist-rights">${escapeHtml(copy.rights)}</span>${source}${statsMarkup}</div><div class="edition-wishlist-actions">${shareButton}<button class="btn ghost" type="button" data-remove-wish="${escapeHtml(item.id)}">${escapeHtml(copy.remove)}</button></div></article>`;
      }).join("");
    }
    async function refreshSummary() {
      try {
        const response = await fetch(SUMMARY_ENDPOINT, { credentials: "omit", cache: "no-store" });
        if (!response.ok) return;
        const body = await response.json();
        summaryRows = Array.isArray(body.editions) ? body.editions : [];
        renderList();
      } catch { }
    }
    async function shareItem(item) {
      if (!item.shareConsent) return;
      const types = ["read", ...(item.paidInterest ? ["paid"] : [])];
      for (const type of types) {
        const key = interestKey(item, type);
        if (store.wasShared(key)) continue;
        try {
          if (!await sendInterest(item, type)) throw new Error("share_failed");
          store.markShared(key);
        } catch {
          status.textContent = copy.shareFail;
          renderList();
          return;
        }
      }
      status.textContent = copy.sharedOk;
      renderList();
      await refreshSummary();
    }
    shareInput.addEventListener("change", () => {
      paidInput.disabled = !shareInput.checked;
      if (!shareInput.checked) paidInput.checked = false;
    });
    nameInput.addEventListener("input", () => {
      if (form.dataset.catalogPrefill && nameInput.value !== form.dataset.catalogPrefill) form.dataset.catalogId = "";
    });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      try {
        const { item } = store.add({ editionName: nameInput.value, language: languageInput.value, sourceUrl: sourceInput.value, catalogId: form.dataset.catalogId || "", shareConsent: shareInput.checked, paidInterest: paidInput.checked });
        nameInput.value = ""; sourceInput.value = ""; form.dataset.catalogId = ""; shareInput.checked = false; paidInput.checked = false; paidInput.disabled = true;
        status.textContent = copy.saveOk;
        renderList();
        if (item.shareConsent) await shareItem(item);
      } catch (error) {
        status.textContent = error.message === "source_url_https_only" || error.message === "source_url_invalid" || error.message === "source_url_too_long" ? copy.sourceError : error.message === "edition_name_required" ? copy.nameError : copy.saveError;
      }
    });
    root.addEventListener("click", async event => {
      const remove = event.target.closest("[data-remove-wish]");
      if (remove) { store.remove(remove.dataset.removeWish); status.textContent = ""; renderList(); return; }
      const share = event.target.closest("[data-share-wish]");
      if (share) { const item = store.all().find(row => row.id === share.dataset.shareWish); if (item) await shareItem(item); return; }
      const consent = event.target.closest("[data-consent-share]");
      if (consent) {
        const item = store.all().find(row => row.id === consent.dataset.consentShare);
        if (!item || !window.confirm(copy.privacy)) return;
        store.update(item.id, { shareConsent: true });
        await shareItem(store.all().find(row => row.id === item.id));
      }
    });
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-wish-bible]");
      if (!button) return;
      const catalogItem = (window.selahBibleCatalog || []).find(item => item.id === button.dataset.wishBible);
      if (!catalogItem) return;
      root.querySelector("#editionWishlistPanel").open = true;
      nameInput.value = catalogItem.name || catalogItem.translation || catalogItem.id;
      sourceInput.value = [catalogItem.website, catalogItem.licenseUrl].find(value => typeof value === "string" && /^https:\/\//i.test(value)) || "";
      languageInput.value = languageForCatalog(catalogItem.language);
      form.dataset.catalogId = normalizeCatalogId(catalogItem.id);
      form.dataset.catalogPrefill = nameInput.value;
      nameInput.focus();
      status.textContent = copy.rights;
    });
    renderList();
    if (supportsAnonymousShare && store.all().some(item => item.shareConsent)) void refreshSummary();
  }

  const api = { STORAGE_KEY, normalizeEditionName, normalizeLanguage, normalizeHttpsUrl, normalizeCatalogId, editionKey, interestKey, createStore, languageForCatalog, catalogButtonHtml, safeEvent, sendInterest, init };
  if (typeof window !== "undefined") {
    window.SelahBibleEditionWishlist = api;
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0), { once: true });
    else init();
  }
})();
