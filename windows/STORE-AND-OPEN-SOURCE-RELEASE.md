# Selah Windows Store and open-source release readiness

Tracking versions: **Windows launcher 1.0.9 / build 23** and **hosted Selah app 1.0.10 / build 26** (Store preparation; not a Store binary release).

## Current state

- Windows runs the hosted Selah PWA in Microsoft Edge app mode. The shared source and Windows controls are in this repository; there is no standalone Windows executable or Microsoft Store package here.
- The public app is <https://delight0517.github.io/selah-bible-meditation/> and its privacy policy is <https://delight0517.github.io/selah-bible-meditation/privacy.html>.
- The root `LICENSE` and `THIRD_PARTY_NOTICES.md` are published; both public Pages paths return HTTP 200. GitHub Release `v1.0.9-build23` is the latest launcher release. The Windows ZIP remains a hosted Edge app-window launcher, not a Store package.
- The hosted shared app is currently **1.0.10 / build 26** (live `SHARED_APP_BUILD.json` readback). This is a separate version stream from the Windows launcher ZIP's **1.0.9 / build 23** metadata.
- GitHub owner authentication and publishing were previously completed; do not treat the old pending-auth notes in historical TODO entries as current blockers. Partner Center access/product identity remains unverified.

## Store path

Microsoft's documented PWA path is to reserve the product name in Partner Center, copy the Package ID and Publisher identity, run the published PWA through PWABuilder, download the Windows `.msixbundle` and `.classic.appxbundle`, then complete and submit the Partner Center listing for certification.

The manifest is configured as a standalone PWA with 192×192 and 512×512 PNG icons. The live site, manifest, privacy page, and both PNG icons returned HTTP 200 on 2026-10-03. A PWABuilder live assessment was attempted, but its Start button remained disabled after entering the public PWA URL; no report card or package validation was produced. Partner Center still needs the actual account and reserved identity. The listing also needs a description, category, price/market settings, age-rating questionnaire, screenshots, and any required logos. Do not claim Store availability until Microsoft approves the submission and the live listing is read back.

## Open-source boundary

The user's public open-source release request authorizes licensing original application code. MIT is used for original code and original documentation; the grant excludes Scripture texts/translations, externally sourced images/icons/fonts, brand marks, and other third-party material. `THIRD_PARTY_NOTICES.md` records the current attribution boundary without claiming new permissions in those works. In particular, the bundled Korean Revised Version metadata's public-domain claim has not yet been independently verified for worldwide Store distribution.

The release script produces a Windows launcher ZIP without bundled Bible text or third-party images/fonts. Once authenticated, publish the licensing change and launcher ZIP on GitHub and verify both the public source license and anonymous download. The Store listing draft is `store-listing.json`; it leaves identity and rating fields pending rather than inventing them.

## Completion checklist

- [x] Prepare MIT source license and third-party/data exclusions under the user's public-release authorization.
- [x] Prepare a Korean/English Store listing draft without inventing publisher identity or age rating.
- [x] Add a Windows launcher ZIP packaging script with an explicit input allowlist and SHA-256 metadata.
- [ ] Independently verify bundled Korean text rights for worldwide Store distribution.
- [x] Publish the source license and third-party notice; public Pages readback returned HTTP 200.
- [ ] Sign in to the owner's Partner Center account and reserve Selah's product name; record its package and publisher identifiers without committing secrets.
- [ ] Run PWABuilder's live readiness report and resolve its blocking findings.
- [ ] Generate and locally validate both Windows packages using the reserved identity.
- [ ] Complete the Store listing, privacy URL, age rating, availability, and screenshots.
- [ ] Submit for certification; after approval, verify the public Store listing and download link.
- [ ] Install the Store build on Windows and verify launch and key reading/reflection flows.

## 2026-10-03 continuation checkpoint

- Live version readback: hosted app 1.0.10/build 26; latest Windows launcher release remains 1.0.9/build 23.
- Live availability: app, manifest, privacy page, 192 px icon, and 512 px icon all returned HTTP 200.
- Manual browser interaction: Matthew 1 → Matthew 2 → Matthew 1 navigation worked; the timed-meditation instructions opened and were dismissed without saving test content. This was a browser check, not a Store-installed Windows package test.
- PWABuilder: public URL was entered in its official assessment page, but Start stayed disabled, so the live report remains unverified and packaging did not start.
- Shared-work protection: this continuation uses a fresh task worktree based on `origin/main` at `ba286351`; older Selah worktrees were left untouched.
- Microsoft documents the PWA flow as name reservation in Partner Center, PWABuilder evaluation/package generation, and Store submission. Name reservation and certification remain open; see the official references above.

## References

- Microsoft: [Publish a PWA to the Microsoft Store](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store)
- Microsoft: [Create an app submission for MSIX apps](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/create-app-submission)
- Microsoft: [Open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)
