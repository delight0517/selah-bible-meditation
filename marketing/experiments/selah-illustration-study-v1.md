# Selah illustration attraction test v1

## Decision

Compare which illustration theme brings a visitor into the same Selah Scripture-reading experience. Do not change the product name or app features during this test. The one-at-a-time landing page assigns one persistent image per browser; `?variant=a` through `?variant=e` pins a creative for a campaign post.

| ID | Creative | Hypothesis |
| --- | --- | --- |
| a | Epic Scripture quest | A visual journey makes starting feel possible and memorable. |
| b | Focus against distraction | A dramatic but nonviolent metaphor may meet readers who struggle to focus. |
| c | Pixel-art quest | Game-like progress may attract people who enjoy playful visual language. |
| d | Watercolor stillness | A gentle, human scene may feel safe and inviting. |
| e | Editorial light and open Bible | A clear, restrained symbol may explain the app quickly. |

All versions use the same headline, product explanation, features and CTA. Only the illustration changes, so this estimates image preference within the landing experience. It does not prove that an illustration caused an external social post's click.

## Links and event trail

Base: `https://delight0517.github.io/selah-bible-meditation/illustration-study.html`

Pin a candidate with `?lang=ko&variant=a` (or another supported locale and `a`–`e`). Use source/medium tags when posting, for example `&utm_source=facebook&utm_medium=social`. The page assigns the campaign `selah-illustration-v1-a` through `...-e`, then carries that attribution into the same-app reading link. Existing aggregate events record exposure, CTA click, reading start, 30-second/120-second reading, reflection save, signup and return when those app paths emit them.

The existing Worker stores daily aggregate counts grouped by country, first-level region code, locale, app/web, coarse device, source, medium, campaign, experiment, variant and event. It does not store IP, browser/account identity, raw referrer or search query, Bible text, or reflection content. Therefore reports answer “which creative/source/market group had recorded responses,” not “which named person clicked.” Counts are approximate browser events, not unique people. External platform impressions and post CTR must come from that platform's own report; an arriving visit alone is not an impression count.

## Search query analysis

This study page is intentionally `noindex`, so it will not compete with Selah's useful language landing pages. For Google organic search, compare Search Console aggregate `query × page × country × device` impressions, clicks, CTR and position for the actual indexed Selah pages over the same finalized date window. Compare those results with aggregate country/locale reading actions separately. Do not join individual queries to individual app users: Search Console reports grouped search data, omits some rare/anonymized queries, and does not expose a person-level click identity. The API also returns top rows rather than guaranteeing every row.

Google references:

- [Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)
- [Search Console data privacy and omissions](https://support.google.com/webmasters/answer/96568?hl=en)

Current pre-test baseline recorded 2026-10-05: the available settled query/page report was empty through 2026-09-29 and predates the recent localized landing publication. Treat as unavailable baseline, not zero demand.

### Query hypotheses to check, not observed demand

| Market/locale | Search-intent phrases to look for in GSC |
| --- | --- |
| Korea / ko | `성경 묵상 앱`, `성경 읽기 기록 앱` |
| US and other English locales / en | `Bible meditation app`, `Bible reading journal app` |
| Philippines / fil | `Bible reading app Filipino`, `pagbabasa ng Bibliya araw-araw` |
| Japan / ja | `聖書 黙想 アプリ`, `聖書 読書 ノート アプリ` |
| Spanish-language markets / es | `app para leer la Biblia y reflexionar`, `diario de lectura bíblica` |
| Brazil / pt-BR | `aplicativo de leitura bíblica com anotações`, `meditação bíblica app` |
| Simplified Chinese / zh-CN | `圣经阅读 默想`, `圣经阅读笔记` |
| Traditional Chinese / zh-TW | `聖經閱讀 默想`, `聖經閱讀筆記` |

These are only seed phrases for aggregate reporting. Native readers should review the phrasing, and actual surfaced queries take precedence. Google Search does not operate normally in every listed market; use its GSC data only where Google Search is a relevant channel.

### Candidate campaign link pattern

Each external post should attach the matching WebP asset and point to a pinned landing variant, for example:

`https://delight0517.github.io/selah-bible-meditation/illustration-study.html?lang=ko&variant=b&utm_source=facebook&utm_medium=social`

The actual campaign label is generated from the pinned image (`selah-illustration-v1-b`) and carried to the app CTA. Use the real source/medium of the channel; do not copy the sample Facebook label to another platform. Platform-reported post impressions/clicks stay separate from Selah's aggregate landing and app events.

## Decision rule and limits

- Review only after at least 50 recorded exposures per creative in a country/locale slice; this is a minimum observation gate, not statistical significance.
- Compare CTA, reader starts and reflection saves alongside exposure. Do not name a winner from impressions/clicks alone or from a tiny slice.
- If sparse, retain all variants and wait for more data. Do not expand countries by converting unknowns to zero.
- For actual search-result thumbnail testing, use Search Console image/web appearance data where available and compare the indexed page/query/time aggregates. Google chooses its displayed thumbnail; the page cannot guarantee a particular image will appear.
- Human translation review and a non-personal promotion channel are prerequisites for making a localized campaign claim or distributing posts. The personal Instagram account `vivid_wave` is excluded.

## Creative asset inventory

- `assets/marketing/selah-illustrations/quest-path.webp`
- `assets/marketing/selah-illustrations/focus-battle.webp`
- `assets/marketing/selah-illustrations/pixel-quest.webp`
- `assets/marketing/selah-illustrations/watercolor-stillness.webp`
- `assets/marketing/selah-illustrations/editorial-light.webp`

Images are original generated illustrations converted to WebP; no scripture quotation or generated text is embedded in the artwork.
