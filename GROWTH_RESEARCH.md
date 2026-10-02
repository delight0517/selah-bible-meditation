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
