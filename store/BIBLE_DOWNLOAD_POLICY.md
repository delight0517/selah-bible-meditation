# Scripture download and release requirements

- First Bible language follows system languages, unless the user explicitly selected a Scripture language. UI language choices do not silently replace that selection.
- Download default/selected Bible asynchronously in chapters. Persist each chapter in IndexedDB. Reopening, reconnecting or returning to the app resumes missing chapters, without downloading saved chapters again.
- Local chapter is preferred; missing chapters are fetched separately for immediate reading. Storage failures do not block online reading. Partial download never blocks the reader.
- All downloaded editions expire 30 days from download start. Reading does not extend expiry. Expired editions can be downloaded again. Notes, prayers and account archives are unaffected.
- Retry paused downloads with 30-second to 5-minute backoff. iOS may suspend an app after it closes; saved progress resumes on reopen. This is not a native background URLSession claim.
- Mac now packages the shared reader in its bundle, using a WKURLSchemeHandler for local assets. Full translation downloads remain in the app WebView IndexedDB.

## Apple release requirements checked on 2026-10-03

Official reference: https://developer.apple.com/app-store/review/guidelines/

- 2.1: final functional build, working support/privacy links, accurate review information and access to account-dependent features. Native runtime verification is pending.
- 2.5.4: use OS background services only for their permitted purpose. Do not describe JavaScript retries as uninterrupted downloads while the app is closed.
- 4.2: app must offer useful functionality beyond repackaging a website. Local reader, offline chapters and personal reflection tools are implemented, but App Review determines acceptance.
- 5.1: accurate privacy disclosures and account deletion requirements must be checked against actual BlueCloud behavior.
- 5.2: edition redistribution rights must be evidenced. THIRD_PARTY_NOTICES.md leaves bundled Korean Revised Version 1961 worldwide rights unverified.

No Store review has been submitted. Pending: signing/export, ASC records, authentic screenshots, native offline/resume/account journeys, privacy and content rights. Existing shared correlation-ID backlog 474637700f55 remains pending.
