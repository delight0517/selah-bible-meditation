# Selah Growth Plan: First 1,000 to the Long-Range Targets

Updated: 2026-10-04
Canonical product: Selah Bible meditation at `https://delight0517.github.io/selah-bible-meditation/`

## 1. Outcomes and honest starting point

The owner’s long-range aspirations are 100,000 concurrent users, 1,000,000 cumulative users, 300,000 registered accounts and 10,000 active premium customers. They are not forecasts. The current active goal is 1,000 verified active users; it is the first proof milestone, not evidence that the larger targets are achievable.

Latest observed baseline:

- Google Search Console had no settled Selah page/query rows through 2026-09-29. That report predates the Oct 2 crawl and the Oct 3 signup-page change.
- In the Oct 1–3 first-party window there were 46 page-view events and 31 anonymous browser IDs, mostly tagged KR and US. Source, medium and campaign were empty; QA, owner visits and repeat activity are not cleanly separable. These are not verified people or attributable acquisitions.
- The retained landing test had 7 exposures, 4 CTA clicks, 2 reading starts, no 30-second/120-second readers, no saved reflections and no recorded signups. It is too small and contaminated to select a winner.
- The free signup path is now visible on the public landing page. Its actual account-completion flow has not been verified. Tagalog and Brazilian Portuguese guide pages were fetched by Google but reported `Crawled - currently not indexed`.
- The authorized ₩20,000 is a spending ceiling, not a target. No paid acquisition has been purchased.

Therefore the immediate problem is not simply “more promotion.” Selah cannot yet tell whether a search arrival became a real reader, whether the signup promise worked, or which channel brought that person. Buying traffic before that is fixed would leave the main business question unanswered.

## 2. North-star metric contract

Use separate, auditable counts. Never sum these into a single “users” number.

| Stage | Operational definition | Source of truth |
| --- | --- | --- |
| Search discovery | Selah-path impressions, queries, clicks, device and country; show the settled-through date | Exact Google Search Console property and page-prefix filter |
| Qualified arrival | A non-QA, non-owner visit with a source/medium/campaign or an explicitly labelled direct/referral source; deduplicate by a privacy-reviewed first-party identifier | First-party aggregate analytics; reconcile with Search Console clicks without requiring exact equality |
| Reading start | User opens a Scripture chapter and begins the focused reading session | Selah product event |
| Activated reader | One account or consented anonymous ID completes at least one focused reading of 120 seconds and saves a reflection in the same session or within 24 hours | Joined, pseudonymous product events; do not send the passage or reflection text |
| Registered user | BlueCloud account creation completes and is confirmed by the authentication service | BlueCloud account event; do not count signup-button clicks |
| Verified active user (first milestone) | A distinct confirmed account meets the activated-reader definition during a rolling 30-day window | Account-linked aggregate activation events; one account counted once per window |
| Retained user | An activated account returns and completes another reading or saves another reflection on a later day; report D1 and D7 separately | Account-linked aggregate events |
| Premium customer | A distinct account has a currently active paid entitlement; refunds, expiry and cancellation must update the count | Billing entitlement state, not checkout starts or lifetime purchases |
| Cumulative user | Report confirmed accounts and consented anonymous visitors separately until a defensible cross-device deduplication policy exists | Account service plus privacy-reviewed first-party analytics |
| Concurrent user | Distinct authenticated active sessions in a rolling 60-second window, with bot/admin traffic excluded | Server-side session telemetry and a documented retention/scale policy |

Before wiring identifiers across marketing and account events, confirm the privacy notice, consent basis, data minimization and retention. Do not collect raw IP, Bible passages, reflection text or more precise location for growth reporting. Continue marking owner, QA, app-webview and unauthenticated traffic as unknown/excluded where the evidence does not distinguish it.

## 3. Parallel market validation

### Parallel market lanes: Korea, Brazil, and the Philippines

Do not make Korea a prerequisite for learning in other countries. Keep it as the product baseline because the current primary experience is Korean and it is the only locale with any observed experiment activity. At the same time, investigate multiple localized markets in parallel. This is an operating choice, not proof that any listed market is the largest or best-converting one.

Keep the candidate need narrow and testable: “I want a quiet, manageable Scripture reading and a way to resume or record what I noticed.” Treat this only as a hypothesis until local readers or attributable behavior confirm it. Selah's focused reader, chapter selection, and saved note are product facts; they are not proof of market differentiation.

**Korea — benchmark lane.** Keep the existing Korean entry journey as a stable control and measure search → focused reading → reflection → signup. The available sample is too small to select a message or establish a distinct need. Established Korean Bible apps already offer plans, notes, sharing and multiple reading features, so avoid generic superiority claims. [Daily Bible app listing](https://play.google.com/store/apps/details?hl=ko&id=kr.or.su.everydaybible)

**Brazil — next message hypothesis, not a market winner.** Selah already has a complete 66-book Portuguese Bíblia Livre 2018 edition and a live “short reading / one chapter at a time” promise. A 2024 survey of more than 800 Our Daily Bread Brazil constituents reported routine, forgetfulness and prioritization barriers; that faith-engaged sample is not nationally representative. A separate national readership study is evidence about book-reading context, not Bible-app demand. Test whether “resume gently after a missed day” is more relevant than repeating the current short-reading message only after source attribution works and local-reader feedback supports the distinction. [Our Daily Bread research](https://www.odbm.org/en/center-for-bible-engagement/blog/research-factors-that-help-and-hinder-bible-reading) · [Fundação Itaú reading survey](https://fundacaoitau.org.br/observatorio/biblioteca/retratos-da-leitura-no-brasil-6-edicao)

**Philippines — edition-fit and access lane.** The 2023 National Readership Survey reported that the Bible was the most popular adult non-school reading genre and that Filipino was the preferred reading language; this describes reading preferences, not Bible-app demand. General internet access differs sharply by region, supporting a mobile-first, low-data hypothesis rather than proving a devotional need. Selah currently offers the older Ang Biblia 1905 edition, while existing Tagalog apps already provide offline access, notes, highlights and audio. Check whether the edition is acceptable to local readers and verify jurisdiction-specific text rights before promoting or expanding it. [Philippine Information Agency survey summary](https://pia.gov.ph/news/pay-more-attention-to-reading-literacy-nbdb-urges-works-to-get-more-filipinos-to-read/) · [Philippine Statistics Authority internet access](https://psa.gov.ph/content/percentage-households-internet-connection-increased-488-percent-2024-two-out-every-three) · [CrossWire TagAngBiblia module](https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=TagAngBiblia)

**Other locales — continue discovery.** Japan, Taiwan, Spanish-speaking markets and other supported languages remain open research lanes. Do not wait for Korea, but do not create country-specific claims or UI variants without a local query/problem signal, a suitable Scripture edition, and an attributable path to reading outcomes.

### Compare markets with the same scorecard

Do not launch every translation as a separate campaign. Score each candidate 0–5 using these weights; mark missing evidence `unknown`, never zero:

- Search demand and actual query visibility: 30%
- Demonstrated user problem and local-language feedback: 25%
- A distinctive Selah experience that solves it: 20%
- Correct, licensed Scripture text and complete locale journey: 15%
- Reachable channel and measurable acquisition cost: 10%

Re-score Korea, the US, the Philippines, Brazil, Japan and other locales when comparable evidence exists. Country/locale page opens alone do not prove local visitors or local need; established Bible products in both Brazil and the Philippines already provide broad reading features. A market only advances when local query or direct user evidence, visitor market, first-screen promise and downstream reading behavior line up. Preserve each source's population, sample, date and limitations in `GROWTH_RESEARCH.md`.

### Expert review lenses

Apply these five checks at each decision point; these are review roles, not a claim that outside consultants were hired:

1. **Search/SEO:** Is the query real, the result descriptive, and the landing page the best answer?
2. **Local market research:** Does the claimed pain point come from local readers, and does the Scripture edition fit the language and rights available?
3. **Product growth:** Does the first screen immediately deliver what the search promise offered, and can a reader finish one meaningful reflection?
4. **Measurement/research:** Are QA and owner traffic excluded, are event definitions stable, and is the sample strong enough for this decision?
5. **Monetization/reliability:** Is value repeatable before premium asks, can unit economics be calculated, and can the service handle the next traffic step?

## 4. Execution sequence and decision gates

### Gate 0 — Make measurement trustworthy (first)

1. Exclude explicit QA traffic from page views, experiments and conversion reports; preserve a visible QA audit trail rather than deleting ambiguous history.
2. Preserve validated UTM values and referrer/source at arrival; carry the campaign ID through reading start, saved reflection, account completion and return events.
3. Add or verify the missing confirmed signup and reflection-save events using aggregate/pseudonymous IDs. Ensure event names, timestamps, locale, country/region granularity and web/app labels reconcile in the live summary.
4. Run one end-to-end QA journey, then verify that QA exclusion works and the production aggregate readback contains only synthetic proof. Do not use that proof as customer data.
5. Keep Google Search Console as search-performance truth and analytics as on-site behavior truth. Their click/session numbers will not be identical; compare trends and tagged journeys rather than forcing a false one-to-one match. [Google’s measurement guidance](https://developers.google.com/search/docs/monitor-debug/google-analytics-search-console)

**Pass:** a tagged test journey can be followed from arrival to reading, reflection and confirmed signup, with QA excluded and no personal Scripture content collected.
**Fail:** keep paid spend at ₩0, repair the missing event or readback, and do not declare acquisition success.

### Gate 1 — Validate each local promise and search intent

1. Export Selah-only settled queries and landing pages weekly for every supported locale; separate branded, generic and problem-intent queries. Keep zero-row markets visible as “no settled data,” not as zero demand.
2. Collect small, voluntary qualitative feedback from readers in each active lane (Korea, Brazil, Philippines) about reading routines, where they break, the Bible edition they trust and the tools they already use. Label this discovery, not a representative survey.
3. Map only a real query or repeated local problem to one useful landing page and matching first screen. Do not produce thin country/keyword pages or translate a Korean winner by default.
4. Check the actual Google result by query, locale, device and date when available. Compare title/description promise with the first screen. Google recommends people-first content and discourages pages produced primarily to attract search visits. [Google helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

**Pass per market:** local-reader language and a relevant search/query signal support the same promise; the arriving reader immediately finds the promised feature, and a downstream reading/record event is measurable.
**Fail:** revise that market's promise or need independently. A weak result in one country does not pause discovery elsewhere.

### Gate 2 — Run one clean conversion experiment

Keep one market, one landing page, one acquisition source and one changed variable per experiment. Record exact copy, screenshot, commit, audience, dates, UTM, device and the full funnel. Retain the existing 28-day minimum observation period and 50 eligible exposures per variant as an early directional floor; they are not by themselves enough to claim statistical certainty. Never choose a winner from click-through alone. The main decision metric is activated readers per qualified arrival; signup and D7 return are quality checks.

**Pass:** the observed activation improvement is large enough to matter, its uncertainty is disclosed, the visitor expectation matches the in-app experience, and no downstream quality metric worsens materially.
**Fail:** keep the incumbent, capture the learning, and test a different need or channel only after one clear diagnosis.

### Gate 3 — Small paid probe, only after Gate 0 and Gate 1 pass

Use at most ₩5,000 for the first tightly scoped high-intent search test. The remaining ₩15,000 stays unspent until the first result is connected to reading, reflection and signup. Target one language and one geography, use exact/problem-intent terms and negatives, and point to the matching landing page. Do not boost broad “Christianity” traffic. Use a dedicated UTM and set the platform’s actual spend cap before enabling.

**Continue only if:** paid arrivals are correctly attributed, some complete the activation event, and projected cost per activated reader is compatible with the eventual premium contribution margin. Since price, paid retention and contribution margin are not yet established, no profitable CAC claim can be made today. Stop the ad when attribution fails, the spend cap is reached, or visits fail to start Scripture reading; do not spend the remaining allowance merely because it exists.

### Gate 4 — Expand only after repeatable activation

Evaluate every locale on the same scorecard; do not require Korea to pass before another market can progress. Localize search promise, interface emphasis, Scripture edition and proof only where evidence requires it. Verify public-domain/license terms for each translation before packaging or promoting it. Reuse the measurement contract, never assume a message or design winner transfers across countries.

For premium, first establish repeated value and retention, then test a clear optional paid feature. Keep Scripture access and the stated free offer transparent. Report active paid entitlement, paid retention, refunds and contribution margin separately. Do not claim premium growth until the billing source confirms it.

## 5. Scale math and engineering gates

These relationships explain the size of the aspiration; they are not predicted conversion rates:

- 300,000 registrations from 1,000,000 cumulative users implies a 30% registration share if both figures use the same deduplicated population and time horizon.
- 10,000 active premium accounts among 300,000 registrations implies 3.3% active-paid penetration at that snapshot.
- 100,000 simultaneous users compared with 1,000,000 cumulative users is a 10% concurrency ratio. This is a major peak-load objective, not a result that SEO alone can provide.

Do not set acquisition budgets from these ratios. Populate actual stage-to-stage rates from clean cohorts, then calculate required eligible search impressions and qualified arrivals from those observed rates. Before large campaigns, establish load tests, database/worker capacity, rate limits, monitoring, incident response, Bible-content delivery costs, support coverage and a safe rollback. Scale promotion only after those systems pass the tested peak with headroom.

## 6. Weekly operating rhythm

Each weekly checkpoint records: settled-through dates; Selah-only search impressions/clicks/queries by locale; tagged qualified arrivals; activated readers; signup completion; D1/D7 returns; active paid accounts; spend; QA exclusions; current hypothesis; decision; next checkpoint. A week with too little sample results in “continue observing,” not a forced redesign. Keep the known-good page stable while the cohort matures.

Every market or design attempt gets a permanent research entry with the query, exact copy and asset, source commit, audience, period, sample, funnel outcomes, confidence, negative result and next decision. Retain aggregate research for comparison; never preserve individual reflection content or personal identifiers in the research log.

## 7. First-user acquisition sequence

Use channels in this order so each one teaches something measurable:

1. **Google and local search:** answer demonstrated queries in each market with a small number of complete local pages. Monitor each search engine separately; an IndexNow receipt is not a ranking or visitor.
2. **Reader/community discovery:** invite small, consented reader groups in each active market to try the exact local flow and share friction. Give a useful, non-promotional reason to participate; record themes, not names or private devotional content. Do not post to the reserved personal Instagram.
3. **Natural sharing:** make the existing Scripture/reading share flow lead back to the same chapter or reflection context. Measure shared-link opens and subsequent reading without making the recipient auto-follow or exposing the sender’s private notes.
4. **Paid high-intent search:** only the bounded test in Gate 3 after attribution and promise match pass. Keep display/network expansion off for this first test so the query and intent remain interpretable.
5. **App-store discovery:** once the iOS release itself is ready and install-to-first-reading analytics exist, optimize store listing and screenshots as a separate acquisition funnel. Do not call web traffic an app install.

## 8. Verified-active-user milestone ladder

Use these as operational checkpoints within the existing 1,000-user goal, not as calendar forecasts:

- **0 → 10 activated accounts:** validate signup, 120-second focused reading, reflection save and later-day return on real opt-in users; remove QA from the count.
- **10 → 50:** find repeated friction and the search promise that brings readers who actually complete the experience. Keep variants fixed until the observation gate passes.
- **50 → 200:** repeat one acquisition route and confirm D7 return; stop scaling a channel that brings clicks without completed reading/reflection.
- **200 → 1,000:** increase only the channel whose acquisition, activation and retention can be measured and whose cost or operating effort is sustainable.

Each checkpoint is a distinct-account count in the rolling 30-day window under the activated-reader contract. The 10/50/200 checkpoints are planning gates, not evidence of current users and not claims about expected speed. Once the 1,000 goal is proven, use actual retention, acquisition cost and contribution margin to propose the next reachable target before committing money or infrastructure to the long-range aspirations.

## Immediate priority

Complete Gate 0 across the shared multilingual funnel, because missing source attribution and no confirmed signup prevent reliable market comparisons. Keep the ₩20,000 ceiling untouched until the end-to-end readback passes. In parallel, retain Korea as the baseline, review the Brazil “resume after a missed day” hypothesis against local evidence, and verify Philippine edition fit and access constraints. Observe settled search windows without forcing variants or choosing a winner when the sample is small. This document sets a weekly review cadence but does not create or reactivate a scheduled automation.
