# Selah Windows Store and open-source release readiness

Tracking version: **1.0.6 / build 19** (Windows launcher/source release preparation; not a Store binary release).

## Current state

- Windows runs the hosted Selah PWA in Microsoft Edge app mode. The shared source and Windows controls are in this repository; there is no standalone Windows executable or Microsoft Store package here.
- The public app is <https://delight0517.github.io/selah-bible-meditation/> and its privacy policy is <https://delight0517.github.io/selah-bible-meditation/privacy.html>.
- The prepared root `LICENSE` grants MIT terms to original Selah application code and original documentation. `THIRD_PARTY_NOTICES.md` explicitly preserves the distinct terms of Bible editions and third-party assets. These licensing changes still need remote publication and readback.
- GitHub OAuth login succeeded as `delight0517-art`; GitHub reports that account's permission on `delight0517/selah-bible-meditation` as `READ`. The original owner's saved credential remains invalid. Public fetch/readback works, but publishing a branch, merging the source change, or creating a canonical release requires owner authentication or a collaborator with write permission. A new official owner-login request is awaiting browser approval.

## Store path

Microsoft's documented PWA path is to reserve the product name in Partner Center, copy the Package ID and Publisher identity, run the published PWA through PWABuilder, download the Windows `.msixbundle` and `.classic.appxbundle`, then complete and submit the Partner Center listing for certification.

The manifest is already configured as a standalone PWA with 192×192 and 512×512 PNG icons. This is a promising starting point, not a PWABuilder pass or package validation. Partner Center still needs the actual account and reserved identity. The listing also needs a description, category, price/market settings, age-rating questionnaire, screenshots, and any required logos. Do not claim Store availability until Microsoft approves the submission and the live listing is read back.

## Open-source boundary

The user's public open-source release request authorizes licensing original application code. MIT is used for original code and original documentation; the grant excludes Scripture texts/translations, externally sourced images/icons/fonts, brand marks, and other third-party material. `THIRD_PARTY_NOTICES.md` records the current attribution boundary without claiming new permissions in those works. In particular, the bundled Korean Revised Version metadata's public-domain claim has not yet been independently verified for worldwide Store distribution.

The release script produces a Windows launcher ZIP without bundled Bible text or third-party images/fonts. Once authenticated, publish the licensing change and launcher ZIP on GitHub and verify both the public source license and anonymous download. The Store listing draft is `store-listing.json`; it leaves identity and rating fields pending rather than inventing them.

## Completion checklist

- [x] Prepare MIT source license and third-party/data exclusions under the user's public-release authorization.
- [x] Prepare a Korean/English Store listing draft without inventing publisher identity or age rating.
- [x] Add a Windows launcher ZIP packaging script with an explicit input allowlist and SHA-256 metadata.
- [ ] Independently verify bundled Korean text rights for worldwide Store distribution.
- [ ] Restore GitHub authentication; publish the license/notice and read it back from the public repository.
- [ ] Sign in to the owner's Partner Center account and reserve Selah's product name; record its package and publisher identifiers without committing secrets.
- [ ] Run PWABuilder's live readiness report and resolve its blocking findings.
- [ ] Generate and locally validate both Windows packages using the reserved identity.
- [ ] Complete the Store listing, privacy URL, age rating, availability, and screenshots.
- [ ] Submit for certification; after approval, verify the public Store listing and download link.
- [ ] Install the Store build on Windows and verify launch and key reading/reflection flows.

## References

- Microsoft: [Publish a PWA to the Microsoft Store](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store)
- Microsoft: [Create an app submission for MSIX apps](https://learn.microsoft.com/en-us/windows/apps/publish/publish-your-app/msix/create-app-submission)
- Microsoft: [Open a developer account](https://learn.microsoft.com/en-us/windows/apps/publish/partner-center/open-a-developer-account)
