# Selah feature analytics

An anonymous, country-level feature counter. It stores only UTC date, Cloudflare country code, UI locale, feature name, and aggregate count. It does not store IP addresses, accounts, browser identifiers, Bible passages, or reflection text. `GET /analytics/signup-location` returns only Cloudflare’s country and ISO 3166-2 first-level subdivision code for the current request, with no storage.

The site sends at most one event per feature per browser per UTC day. Counts are approximate browser-days, not people or raw clicks. `/analytics/market` only suggests a UI emphasis after at least 50 aggregate events for a country in the trailing 30 days; otherwise the default UI remains.

Deploy with Wrangler using the configured D1 database. D1 remains on the free plan; do not enable paid features for this project.
