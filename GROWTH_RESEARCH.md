# Selah growth research archive

Purpose: preserve search promises, landing-page designs, experimental methods, evidence, and decisions so future work can build on prior learning instead of restarting.

## Archive rules

- Append a dated record for every new market, search-promise, copy, or UI experiment. Do not replace an earlier result with a newer snapshot. Correct errors by appending a dated correction that points to the original entry.
- Preserve the exact audience/locale, query intent, title, description, preview image, first-screen copy and hierarchy, CTA, variant assignment method, success measures, and stop/winner rule. Include source commit, deployment commit/version, canonical URL, and evidence date.
- Separate proposed designs, source-code state, live state, search-result appearance, and product behavior. Mark unobserved fields `not observed`; never infer actual Google snippets from HTML metadata.
- Snapshot Google Search Console's property, page filter, date range, date basis, search type, dimensions, row count, data source and settled-through date. Preserve zero-row responses as zero matching rows, not as evidence about unqueried periods.
- Snapshot experiment aggregates by market/first-level region, locale, variant, device class and campaign tags when available. Keep both a rolled-up market comparison and detailed breakdown. Never identify individual visitors or preserve Bible passages, reflection text, raw IP, or finer location.
- Use the previous record to write the next hypothesis and record what changed. Do not repeat a design merely because it was built; retain it as a candidate only when the evidence supports it.
- A deployment, sitemap submission, indexing request, impression, click, visit, browser count, first saved reflection, returning user, and verified active user are distinct outcomes.

## Reusable study method

1. Write the user's intent in their natural search language and name the audience/locale without treating a broad country as a persona.
2. Inspect actual Google queries and result pages. Record what the user can understand before clicking: product, Bible text/edition, core task, concrete benefit, and truthful reason to choose this result. Save the actual displayed snippet/image only when observed.
3. Follow that exact result to the landing page. Check query → snippet → destination → first viewport → Bible edition/content → CTA → next screen on desktop and mobile. The visitor should see the promised experience immediately.
4. If either search promise or landing match fails, repair the words/UI before buying or increasing traffic. Keep one central proposition and vary only one element per experiment.
5. Measure Google exposure/click/CTR separately from arrival, CTA, reading start, focused reading, new reflection save, and later-day return. Choose a winner only after the predeclared sample rule and downstream behaviors support it.
6. Record decision, confidence, alternative explanation, unresolved evidence, and the next smallest useful test. Update the live system only after the proposed change passes the promise-match gate.

## Study records

### KR-SERP-20261002-01 — Korean search promise and landing baseline

- **Status:** baseline captured; search snippet not observed; A/B experience not yet launched.
- **Audience hypothesis:** Korean-language Scripture readers searching for a quiet Bible-reading/meditation app. This is a working audience description, not confirmed market demand.
- **Question:** Can a Korean searcher tell that Selah reads Matthew and supports a short reflection/prayer record, and does the first screen immediately show the same experience?
- **Canonical destination:** `https://delight0517.github.io/selah-bible-meditation/`.
- **Observed public state (2026-10-02):** HTTP 200; response `Last-Modified: Fri, 02 Oct 2026 05:32:38 GMT`. The live document exposes title `무료 성경 묵상 앱 셀라 | 마태복음 읽기와 기도 기록`; description `셀라에서 마태복음을 한 장씩 읽고, 짧은 묵상과 기도를 기록해 보세요. 직접 만든 질문으로 기억하고 싶은 말씀을 다시 돌아볼 수 있습니다.`; `og:title` `셀라 성경 묵상 앱 | 마태복음 읽기와 기도 기록`; `og:description` `마태복음을 한 장씩 읽고, 기도와 묵상을 기록해요. 기억하고 싶은 말씀을 다시 돌아볼 수 있습니다.`; preview `assets/previews/selah-ko.png` (1200×630 declared). The live first-screen H1 is `말씀을 천천히 마음에 담아 보세요.` and lead is `읽고, 머물고, 깨달은 것을 기록하세요.` The primary actions are `시간 묵상` and `말씀 읽기`.
- **Search Console baseline:** property `https://delight0517.github.io/`, Selah page filter containing `/selah-bible-meditation/`, Web search, 2026-09-02 through 2026-09-29, latest settled date 2026-09-29 (America/Los_Angeles date basis), source `api`. Three reports were read: query+page, date+page, and device+page. Each returned zero matching rows. No actual search query, Google-rendered title/description/image, or search CTR was observed in this window.
- **Source design captured locally, not yet live:** experiment `kr-home-copy-v1` assigns a sticky random A/B variant to Korean visitors. A: H1 `말씀을 천천히 마음에 담아 보세요.`; lead `읽고, 머물고, 깨달은 것을 기록하세요.` B: H1 `오늘 읽은 말씀, 한 문장으로 남겨 보세요.`; lead `마태복음 한 장을 읽고 마음에 남은 것을 기록해 보세요.` The test tracks exposure, CTA click, reading start, focused reading at 30 seconds/2 minutes, new reflection saved, and later-day return. Source also groups anonymous aggregate rows by country/first-level region, locale, app/web, coarse device class and validated UTM labels.
- **Launch verification:** live HTML currently contains the A copy; it does not contain the B copy or `kr-home-copy-v1`. The live experiment therefore has not started. Live Worker summary returned `marketRows: []` and `rows: []`; no experiment outcome exists. The local branch has the experiment implementation, but its website commit is not yet published. Worker/D1 collection is deployed separately.
- **Design method retained:** make the headline and lead state one direct benefit; make title/description identify both product and task; keep the Bible edition and first action visible; then compare one headline/lead pair while keeping layout, preview, and CTA fixed. The warm paper/forest-green palette is a code-defined design property; no dated screenshot comparison was captured in this study.
- **Interpretation:** the current search window does not provide evidence that Google displays the intended message or that the promise attracts clicks. It also provides no audience demand signal. The on-page copy is understandable and consistent with Matthew reading/reflection in the source, but user comprehension and mobile/desktop promise-match have not yet been observed in a recorded walkthrough.
- **Decision:** do not name an A/B winner, claim SEO traction, or broaden paid/organic promotion from this baseline. First publish and verify the experiment code, then inspect actual Google result appearance when available and check the landing experience on phone and desktop. Only then accumulate exposure and downstream behavior.
- **Evidence limits:** Search Console reports are aggregate and privacy-preserving; zero matching rows do not describe untracked channels or current-day behavior. The local source is ahead of the public site. No SERP screenshot, usability observation, or live A/B exposure was captured.

### Append-only record template

Copy this block for each study; replace every unknown with an observation or `not observed`.

```text
### <STUDY-ID> — <market, intent, or design question>
- Status: proposed | live | paused | concluded
- Audience/locale and confidence:
- Prior study and what changes:
- Search query/intent:
- Search-result evidence (Google-rendered text/image, device, locale, date):
- Exact title / description / preview asset:
- Canonical landing URL and deployed commit:
- First-screen text, hierarchy, CTA, device checks:
- Hypothesis and alternative explanation:
- Variants (exact copy and single changed element):
- Metrics, dates, data source, sample rule:
- Search Console snapshot (property, page filter, range, dimensions, rows, source, settled-through):
- Product event snapshot (market roll-up and detailed rows):
- Decision and confidence:
- Unresolved evidence / next smallest test:
```

### OPS-20261002-01 — Keep aggregate experiment history queryable

- **Decision:** preserve the existing daily D1 aggregates for longitudinal review and provide an explicit all-retained-period summary alongside the existing recent 30-day summary.
- **Implementation:** Worker `selah-feature-analytics`, endpoint `/analytics/experiment/summary?period=all`; recent comparison remains `/analytics/experiment/summary?period=30d`. Deployment version `308bba9d-6c8f-45f2-8f8b-51081a6122a3` on 2026-10-02.
- **Validation:** `node scripts/test-market-experiment-worker.mjs` passed. Live requests to both endpoints returned HTTP success with `{ "marketRows": [], "rows": [] }` (period values `all` and `30d`, respectively).
- **Observed result:** no retained A/B aggregate rows exist yet. The Korean website source includes `kr-home-copy-v1`, but the live site has not started serving that experiment. Therefore there are no variant outcomes to compare.
- **Retention/privacy:** this exposes existing aggregate daily rows; it does not add individual visitor storage. Country and first-level region only, coarse device/client, locale and validated campaign labels remain the maximum breakdown. No Bible passage or reflection content is collected.
- **Failure and correction:** initial deploy returned Worker 1101 because a JavaScript template placeholder was left literal in the SQL string. Fixed by concatenating the existing period clause, added a regression assertion, redeployed, and verified both live periods. The failed deployment is not treated as usable research data.
- **Next decision:** make the existing website experiment live only after the canonical site can be published; then record exposure, reading, saved-reflection and return aggregates in a new study entry before deciding whether either design works.

### KR-SERP-20261002-02 — Live Korean Google intent scan and launch

- **Status:** website experiment deployed; Google indexing request accepted; search result for Selah itself remains unobserved; experiment outcomes not yet available.
- **Prior study:** `KR-SERP-20261002-01`. This entry adds a live Korean Google search-page observation and records the public launch state.
- **Observed Google search context (2026-10-02, South Korea):** one signed-in Google search session showed personalization enabled and a South Korea IP-based location. These are spot observations, not a representative sample or search-volume estimate.
- **Search 1:** `성경 묵상 앱 묵상 노트`. Visible results included app listings for `성경노트 - 설교·묵상·기도` and `말씀 온 - 매일 성경 묵상, 기도 노트, 성경 어플`. Their snippets emphasize Scripture-linked notes, autosave, QT notes, prayer diaries, daily prompts/alarms and reading plans. These are competitor claims, not verified user needs or proof that those features are preferred.
- **Search 2:** `성경 어디서부터 읽어야 할지 매일 읽기`. Google's AI overview and several visible results recommended starting with Mark or John. This is a personalized, synthesized SERP observation; it is not authoritative theological advice or population evidence. It reveals a possible mismatch for a searcher asking for the universally best first book if the site only offers Matthew as its current starting path.
- **Positioning implication:** keep Matthew explicit in the title, snippet and first-screen path; describe it as Selah's available reading path, not the objectively best starting point for every beginner. The two searches reflect different intents (finding an app for notes vs. choosing a first Bible book), so the current homepage A/B test cannot establish which query group converts better. Do not merge those intents into one winning claim.
- **Public launch:** PR #54 merged as `7b367688e64b47ccb727bb66c9cf77b065fa00ef`; GitHub Pages workflow `36974191618` completed successfully. Public homepage returned HTTP 200 and the live HTML contains `kr-home-copy-v1`, variant B copy, canonical URL, the existing title/description and OG image. `robots.txt` and `sitemap.xml` returned HTTP 200; all 11 sitemap URLs returned HTTP 200; robots allows crawling; no `noindex` was observed.
- **Google state:** URL Inspection reported `URL is unknown to Google`, no crawl time and no referring sitemap detected. The Search Console UI then accepted one request and confirmed the URL was added to a priority crawl queue. Sitemap `https://delight0517.github.io/selah-bible-meditation/sitemap.xml` was resubmitted at `2026-10-02T06:43:45.499Z`; Search Console accepted the submission, but status remained pending with 0 warnings/errors. Neither action means indexed or ranked.
- **Experiment state:** anonymous market summary `/analytics/experiment/summary?period=all` returned no rows after this session's public-page QA. No variant exposure, click, reading, save or return outcome is available to score. The internal QA page view is not an acquisition success and must not be counted toward the 1,000-user goal.
- **Next test:** wait for Google to discover/crawl the URL and for actual eligible Korean exposures to accumulate. Compare A (quiet reflection) with B (one Matthew chapter and one written reflection) using saved-reflection and return events as downstream checks. Keep browser counts separate from actual people and query-group differences unproven until Search Console provides query/page rows.
- **Evidence limits:** a localized, signed-in Google result page changes over time and may be personalized. One search session, competitor descriptions, or Google's AI overview cannot establish Korean demand, market size, preferred Bible book, or a winning design.


### KR-LANDING-20261002-01 — Search promise, first-screen match, and internal QA integrity

- **Status:** fixes deployed and browser-viewport checked; Google indexing and market response remain unconfirmed.
- **Prior records:** `KR-SERP-20261002-01` and `KR-SERP-20261002-02`. This entry preserves new Google live-test evidence, responsive UI defects found while checking the promise-to-page match, and an explicit rule to exclude internal QA traffic.
- **Audience/query scope:** Korean-language visitors arriving at the Selah homepage or looking for a Bible reading/reflection app. Actual query-level Search Console performance remains unavailable.
- **Search promise and page match:** canonical `https://delight0517.github.io/selah-bible-meditation/`; Korean page identifies Matthew reading and prayer/reflection notes. The primary visitor expectation is that a Matthew passage and first reading action appear after the search click. Google-rendered snippet and thumbnail for Selah were not observed.
- **Search Console snapshot (2026-10-02):** property `https://delight0517.github.io/`; page inspection of the canonical homepage. Last live URL test reported URL available to Google, smartphone crawler, crawl allowed, successful fetch, and indexing allowed. Indexed inspection still said URL unknown/not on Google, with no crawl time and no referring sitemap. One further indexing request was accepted into the priority crawl queue. Acceptance is not evidence of indexing or ranking.
- **Sitemap/robots snapshot:** public `/selah-bible-meditation/sitemap.xml` returned HTTP 200, XML content type and valid XML with 11 locations; `robots.txt` returned HTTP 200 and allowed crawling. Search Console reported sitemap status “Couldn’t fetch,” discovered pages 0. Cause is unresolved; do not infer that Search Console has processed the sitemap from the public HTTP result. Manual actions showed no issues detected.
- **First-screen desktop/mobile QA:** public site visually checked at desktop 1280×720 and desktop browser configured to a 390×844 viewport. This is responsive viewport emulation, not a physical phone test. A null-element handler was preventing startup; removing it is recorded in PR #56, commit `3c368c07568f45418d8c95e78b152481514c0273`. Mobile CTA and reader zoom controls had dark foreground against dark green; PR #57, commit `253c74fc6e99e9ee9499a4b0b7dcf538fd11089c`, changed zoom-control foreground. Both Pages changes completed in workflow `36976616331`. Browser checks then showed Matthew 6 text, 66 book options, 29 Matthew chapters, working A/B headline, desktop and mobile viewport content, and 9.37:1 contrast on primary CTA and zoom controls. No new browser console error appeared after reload; the only console error was timestamped before the deployed startup fix.
- **Experiment snapshot and contamination note:** immediately before this UI QA, Worker summaries for `period=all` and `period=30d` had no rows. After the responsive browser session, the all-retained-period aggregate contained exactly one row: KR / region 44 / ko / web / computer / experiment `kr-home-copy-v1` / variant B / exposure 1 / clicks, reading, saves and returns all 0. This is the agent's own QA run from a desktop browser with a mobile-sized viewport; device class “computer” is expected. Exclude this row from user acquisition and from any winner/market-effect conclusion. It cannot be safely deleted from the anonymous aggregate without risking other data.
- **QA instrumentation:** PR #59 merged on 2026-10-02 as `ae176446e17f3cda88e017be5fb273c272506a9f`. Explicit query parameter `?selah_qa=1` suppresses page-view POST, product-feature events, A/B experiment events, and first-reflection activation events during internal QA. Normal visitors without the parameter retain existing measurement. Deployment and zero-event readback are pending at the time of this record.
- **Design method retained for reuse:** start from actual localized search intent; state the exact available reading path and benefit in the snippet; make the first viewport immediately show the expected passage/action; vary one message element at a time; check both desktop and phone-sized layout; log defect, fix, deployment and observed result. Do not score a variant from an internal QA exposure or from search/indexing setup actions.
- **Decision/confidence:** high confidence in the recorded browser-visible text, controls, contrast and cited deployment state; low confidence about Korean user preference because there are no clean exposure or downstream outcome samples. No design winner declared.
- **Next smallest test:** wait for Google crawl/indexing and accumulate clean, non-QA eligible Korean sessions. Verify the `selah_qa=1` guard after deployment before any further site walkthrough; then compare actual query → snippet → landing-page match and downstream focused reading, reflection save and later return. Preserve Search Console query/page/date/device snapshots and anonymous market aggregates with their settled-through dates.
