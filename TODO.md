## 2026-10-03 · Mac-delivered Korean Bible 1910 reader
- Corrected the Korean default edition: `kor_old` now bundles actual eBible Korean Bible 1910 Matthew instead of Korean Revised Version (1961) text stored under the wrong translation ID. Existing local default caches from that mismatch are refreshed from the corrected bundled text.
- Kept the 66-book/chapter API reader and complete offline download path; added verse selection with local-only highlights, bookmarks, private notes, and copy. Annotation storage is outside the account sync payload.
- Added attribution for 레널즈, 이승두, 김정삼 and disclosed the source distribution gap: 1 Peter 4:15 through the end of the book is not provided. The reader shows the notice in the affected chapter and does not reconstruct the missing text.
- Verified eBible's edition listing reports Korean Bible 1910 as public domain and confirms the contributor/source metadata. Source and app bundle checks are local; no hosted Pages deployment, signed native app, or Windows readback is claimed.
- PR #122 (`codex/selah-korean-bible-reader`) is open and mergeable. Pages deployment and a visible Mac/iOS UI remain unverified until merge and runtime review.

## 2026-10-03 · Search acquisition baseline and visible signup CTA — 1.0.9 / build 21
- Google can crawl and has indexed the Selah root and Filipino page, but the latest settled Selah-only Search Console window (2026-09-03–2026-09-30; data through 2026-09-29) has zero page/query rows and zero sitemap-URL impressions. The parent GitHub Pages property has other projects; do not count its 88 impressions / 3 clicks as Selah traffic.
- Live first-party summary for 2026-10-01–03 reports 46 page-view events / 31 anonymous browser IDs (KR and US); source, medium and campaign are empty. This is not verified human count or attributable acquisition. Current Korean copy test: 7 exposures (A=3/B=4), 4 CTA clicks, 2 reading starts, 0 30-second reads, 0 saved reflections, 0 recorded signup events; sample is too small and may include QA.
- Corrected an accidental `.signup-cta { display:none }` in the shared root reader/landing CSS; the free account button had no visible signup path. Shared source is 1.0.9/build 21 and mobile bundle is generated from the root.
- Paid ad decision: hold the authorized ₩20,000 for now. Search Console has not yet measured post-Oct-2 crawl visibility, and acquisition source attribution is empty. Reassess after post-crawl query/page data and a clean tagged campaign path exist; do not buy unmeasurable visits.
- [x] Open PR #115, merge through the canonical `main` workflow, and verify Pages run `37096278336` plus the live visible-CTA stylesheet; readback is recorded below.
- [ ] After Google’s settled-through date passes the Oct-2 crawl, compare Selah-only page/query/country impressions and clicks with tagged first-party arrivals, signup, focused reading and reflection saves. Keep the existing 28-day / minimum-sample rules; no copy winner selected.
- Long-range owner-stated outcomes, not forecasts: 100,000 simultaneous users; 1,000,000 cumulative users; 300,000 registrations; 10,000 premium customers. Keep the active 1,000 verified-active-user goal as the first proof milestone. Count each stage separately and only from auditable measurements.

## 2026-10-03 · iOS reader startup and source identity — 1.0.8 / build 20
- Remove unrelated Matthew snippets during startup. Bundle actual book metadata for each default translation, restore the selected book without network-first catalog fallback, serialize book selection, and preserve verse DOM/scroll on unchanged renders.
- Root HTML remains authoritative; mobile runtime is copied/hashed. Native iOS bundle version now follows SHARED_APP_BUILD.json. Regression checks and device build/install evidence recorded in the PR; physical UI proof remains separate if Mirroring cannot connect.

## 2026-10-03 · Chapter keyboard shortcuts
- Reader uses Ctrl/Command+Z for the previous chapter and Ctrl/Command+Shift+Z for the next chapter, through existing cross-book navigation. Editable controls, open dialogs, IME composition and held-key repeats are guarded. Shared mobile source mirrored.
- Syntax/whitespace checks only; installed-app keypress behavior remains unverified.

## 2026-10-03 · App offline Scripture and local-first navigation
- Automatically download the selected translation in native/installed apps, reuse complete saved metadata and chapters before network access, hydrate a book into memory, deduplicate downloads, and retain saved Scripture. Added manual download/retry control.
- Web/mobile source mirrored; first complete download needs internet. Native rebuild/install and physical-device offline behavior remain separate verification stages.

## 2026-10-03 · Friend add entry and invitation links
- Added friend entry buttons in the header and shared-reading dialog, localized search by username/invitation URL, and personal invite-link sharing. Existing BlueCloud follow API is reused; no automatic follow or messaging.
- Root and mobile runtime mirrored. Syntax/whitespace checks passed; authenticated friend mutation and native installation have not been exercised. Deployment recorded in the pull request.

# TODO — Selah Windows/macOS parity

## 2026-10-02 · 모든 기기의 공통 UI와 데이터 계약 — 공유 앱 1.0.7 / 빌드 19
- 사용자 피드백: “이 앱이 만들어졌잖아 근데 이 성경 앱의 방식 ui 부터 시작해서 모든게 맥의 ios 웹사이트와 간극이 벌어져서 따로따로 서로 다른 데이터를 관리해야 하는 위험으로부터 이 데이터를 통합으로ㅓ 만들수 있는 그러한 시스템 만어줄래 ?”
- 공통 데이터 코어에 기록별 결정적 병합, 삭제 이력과 복구본, 필드별 변경 시계, 계정별 오프라인 보관, 기기/작성창별 공유 초안과 추가형 백업 가져오기를 구현했다. 전체 기록을 자동 갱신하고 무변경 PUT 루프를 막으며 인증/계정 병합 오류에는 로컬 기록을 보존한다.
- iOS 번들은 원본 index/스타일/이미지/스크립트에서 생성하고 SHA-256 검사로 오래된 UI 복사본을 차단한다. CI와 mobile sync 명령에 같은 검사를 연결했다.
- 공통 코어 13개 및 합성 Windows/Mac/iOS 브라우저 동기화 시험, 기존 폰트/출석 검사를 통과했다. 사용자 실제 계정 토큰/노트를 읽거나 쓰지 않았다.
- [x] PR #91 병합 및 Pages 배포 성공. 공개 공유 버전 1.0.7/19, 원본 6개 SHA-256 일치 및 새 익명 Windows/모바일 공통 계정 화면(오류 0)을 확인했다. 최신 main의 peer 변경을 모두 보존했다.
- [ ] 생산 BlueCloud 인증 왕복과 설치된 Mac/iOS 업데이트 후 실제 기기간 동기화·로컬 기록 유지 확인. Mac 요청은 releasepilot-hub main의 `20261002T111052Z_windows_selah_unified_build19`로 전달했으나 수신 회신은 없다. SSH는 신뢰한 Mac 탐색에 실패했다.
- 설계·증거: docs/UNIFIED_DATA.md; Mac 지시서: docs/handoffs/20261002-selah-unified-data-mac.md.

## 2026-10-02 · First exact-property Google index readback — 1.0.6 / build 18
- GSC Wizard's URL Inspection API checked the four tracked pages (4 of 2,000 daily inspections used): the Selah root is **Submitted and indexed**; `/download/`, `/en/download/`, and `/windows/download.html` are still **URL is unknown to Google** with no crawl time. The hub requests were already accepted earlier; don't repeat them. Let the pending sitemap and hourly tracker progress, then inspect on the next scheduled checkpoint.
- Search Analytics for 2026-09-02 through 2026-09-29 still returns no query or page rows, and Google gave no settled-through boundary. Treat this as “no data returned,” not as impressions, rankings, or a confirmed indexing cause.
- Re-audited all 14 sitemap pages after the favicon deployment: 14/14 HTTP 200, indexable, and favicon present; Windows guide remains at zero on-page issues. The remaining three medium flags are CJK word-count heuristics on substantive Japanese and Chinese pages.
- General web search also surfaced a separate App Store product named “SELAH Bible Meditation.” Keep Selah's Windows/Mac/iPhone distribution clear in search and social metadata so users can distinguish the web app; do not imply association with that publisher.

## 2026-10-02 · Localized page favicon coverage after 14-page audit — 1.0.6 / build 18
- PR #90 merged. GitHub Pages run `36998929617` succeeded; live `sitemap.xml` returns HTTP 200, parses as XML, and contains 14 URLs including `/windows/download.html`.
- Audited all 14 sitemap URLs through GSC Wizard: all returned HTTP 200 and were indexable; no critical or high issues. Its three medium “thin content” flags are on Japanese and Chinese pages whose substantive CJK paragraphs/lists are tokenized as only 21–29 space-delimited words. Do not pad those pages just to satisfy this word-count heuristic.
- The audit found the shared favicon was missing from 10 locale/guide pages. Added the existing Selah SVG favicon with correct relative paths; verify GSC Wizard's favicon results after deployment.
- GSC Wizard's CrUX report is not configured because no Chrome UX Report API key is available; no key or billing setup was attempted. Selah-specific Search Analytics still returns no rows and cannot establish a settled-through date.

## 2026-10-02 · Windows guide sitemap coverage and post-deploy evidence — 1.0.6 / build 18
- PR #88 merged and GitHub Pages deployment `36998459124` succeeded. Live readback confirmed the Edge install steps, checksum command, launcher ZIP, and checksum sidecar return successfully; the public SHA-256 sidecar matches the build 18 ZIP digest.
- Post-deploy GSC Wizard audit of `/windows/download.html`: HTTP 200, self-canonical, indexable, title 38 characters, 390 words, valid WebPage/WebSite structured data, and zero reported issues.
- Registered the home page, Korean and English download hubs, and Windows guide in the GSC Wizard indexing tracker for its scheduled checks. The exact Selah property still returns no Search Analytics rows and no settled-through boundary; do not infer indexing or rankings.
- Found the Windows install guide was missing from the published 13-URL sitemap despite being linked from both download hubs. Added its canonical URL to `sitemap.xml`; after deployment, verify the live XML contains 14 valid same-property URLs. The sitemap itself is already submitted and pending, so don't submit it again.

## 2026-10-02 · Windows install guide clarity after live GSC audit — 1.0.6 / build 18
- Rechecked the deployed Korean/English hub, Windows install page, and root with GSC Wizard: all 4 returned HTTP 200 and were indexable, with zero critical/high/medium findings. Remaining flags are low-severity heuristics: short Windows title/content and empty alt on decorative brand marks.
- Expanded the Windows guide with Edge's built-in install route, Windows Script Host fallback, accurate account/local storage and Bible-download behavior, plus a PowerShell SHA-256 verification command. Lengthened the Korean title consistently in title/Open Graph/JSON-LD.
- The page still describes the artifact as a hosted Edge launcher, not a native EXE/MSIX or Store release. App binary/version unchanged at 1.0.6/build 18. Validate links, checksum command examples, and deployed readback after publishing; do not repeatedly resubmit the pending sitemap or request indexing.

## 2026-10-02 · GSC Wizard audit and current release alignment — 1.0.6 / build 18
- The connected Selah URL-prefix property returned no query rows for 2026-09-02 through 2026-09-29; Search Console did not provide a settled-through boundary. Its sitemap is submitted and pending with zero reported warnings/errors. Google Search Console has not yet produced the first Selah-specific performance data.
- GSC Wizard audited the root, both download pages, and Windows install guide: 4/4 are HTTP 200 and indexable; 0 critical/high issues, 1 medium, 9 low. The Windows guide's missing canonical was the medium issue; added its canonical, longer description, social metadata, icon, and WebPage JSON-LD. Shortened the English download-page title from 64 characters.
- The hub's empty-alt logo is decorative next to visible “Selah” text, so it remains correctly ignored by assistive technology rather than receiving redundant alt text.
- GSC Wizard was connected and the exact Selah property was added to it. No unrelated property was hidden or removed.
- The Windows launcher advanced to build 18 during this work. The hub download links already target build 18; updated the Windows guide's meta description, Open Graph summary, and WebPage description to match it.

## 2026-10-02 · Search-intent copy for the download hub — 1.0.6 / build 17
- Google result samples for Korean Bible-meditation queries were weighted toward mobile app-store pages. Added concise, verifiable Selah feature copy for Matthew reading, timed meditation, reflection/prayer notes, and review quizzes to clarify the web app's usefulness before platform install steps.
- Added direct reading and meditation links on both language landing pages, and aligned the English/Korean descriptions with those visible features. Kept store and native-installer claims explicit.
- Selah-specific Search Console performance is still processing after property verification; evaluate impressions and queries after Google reports data before changing keyword strategy.

## 2026-10-02 · Search Console and current Windows release alignment — 1.0.6 / build 17
- Registered the exact Selah URL-prefix property `https://delight0517.github.io/selah-bible-meditation/`; Google verified it through the already verified parent property. Performance and indexing reports are still processing for the new property.
- Submitted the Korean and English download URLs for indexing; Google added both to its priority crawl queue. The live Google URL test says the English page is available to Google. This does not yet mean either URL is indexed or ranking.
- Submitted `sitemap.xml` to the parent property; the GSC dialog accepted it, while the list still shows its initial “Couldn't fetch” state. Direct Googlebot-UA HTTP reads returned 200 for robots, sitemap, and both landing pages; sitemap XML is valid.
- Live content extraction found the dedicated Windows download page now serves launcher build 17 (`d9e3951e1992315579416d2141b4fa0fcca2c718ecd644b73b0a029dbb1a01a0`). Updated both download-hub buttons to point at build 17; the prior build-15 link was stale relative to current main.
- Search-result evidence for broad Korean Bible meditation queries is dominated by mobile-app store listings; prioritize truthful Windows/Mac/iPhone web-app availability and platform-specific long-tail intent. GSC Wizard was found and suggested as the one useful plugin, but is not installed/connected yet; current Selah-specific query data is not available until Google finishes processing.

## 2026-10-02 · Cross-platform Selah download and install hub — web content / build 15
- User requested a promotional page that gathers Selah install/download options for Mac, iPhone/iOS, and Windows and can be discovered through Google Search.
- Added Korean and English `/download/` landing pages, platform-specific install steps, responsive shared styling, home-page entry links in all five supported UI locales, canonical/language metadata, WebPage structured data, and sitemap entries.
- Public release evidence at task start: Windows launcher build 15 is downloadable. Mac and iPhone instructions use the hosted web app (Safari Add to Dock / Add to Home Screen); no separate signed Mac installer, App Store listing, or IPA was observed. Do not claim those binaries exist.
- Next: validate the routes and links, publish the page changes, read back the deployed assets, then register/verify the Search Console property and submit the sitemap if account access permits. Google indexing is a request, not a guaranteed appearance/ranking.

## 2026-10-02 · Desktop zoom reset parity — source milestone 1.0.6 / build 13
- Compared Mac `SelahApp.swift` commands with the Windows Edge app-shell toolbar. Windows already had Ctrl+Alt+0, but lacked a visible reset action corresponding to Mac's **Reset Text Size** menu command.
- Made the zoom percentage button reset to 100% and labeled it with the same keyboard shortcut. The existing 80–150% zoom bounds and per-profile saved zoom remain unchanged.
- Mac checkout is still dirty and 63 commits behind `origin/main`; its local `selah://` Info.plist changes are not in the installed bundle. Native deep-link runtime remains open work.
- Windows build 12 deployed in PR #65; build 13 deployed in PR #66, merge commit `ecf477ca0be952c04e431aff7e4e8ca0abb7f394`, Pages run `36983685451`. Public readback confirmed `windows/BUILD_INFO.json` reports 1.0.6/build 13 and `windows/app-shell.js` contains the reset control and click handler. A hidden in-app-browser runtime snapshot of the deployed `?windowsShell=1` URL rendered the toolbar, reset button, and computer-reading target selector. This is shared-page rendering evidence, not verification of the active managed Edge app window.
- The earlier Mac relay item remains unreceived. Sent an updated urgent item `20261002T082415Z_windows_16467cb4`, which supersedes the older handoff and asks Mac to compare installed app registration, source provenance, and computer-reading fields while preserving dirty files. Receipt is still pending.
- Do not call the cross-platform goal complete until Mac receipt/source alignment, a visible Windows app launch, authenticated BlueCloud round trip, and Mac wrapper deep-link result are verified.

## 2026-10-02 · Managed Edge launch correction — source milestone 1.0.6 / build 12
- Diagnosed the Selah app window title `We couldn't load that extension.`: the installed launcher passed a Claude extension ID as an extra `--disable-extensions-except` item, although Chromium defines this switch as a comma-separated list of extension paths. The SixVPN unpacked extension path itself and PAC route were present.
- Removed the ID entry from the Selah launcher. It now permits only `%LOCALAPPDATA%\SixVPNBlocker\chrome_blocker` and retains the PAC URL and `--load-extension` protection path. Updated the installed per-user Selah launcher for future launches; left the currently running Edge window and processes untouched.
- Version/build tracking advanced to **1.0.6 / build 12**. Dry-run verification should confirm one permitted extension path and the existing PAC URL. Visible Edge UI/runtime confirmation remains pending.
- Mac handoff `SELAH-WINDOWS-DESKTOP-PARITY-20261002` was rechecked against GitHub `origin/main`: `status=open`, `received=false`, `completed=false`. Mac queue receiver files/runtime are absent; no reply is available yet.

## 2026-10-02 · Edge PWA registration and Mac follow-up (source milestone 1.0.6 / build 11)
- Read-only Windows registration check: `Selah App Window` Start/Desktop shortcuts target the installed VBS launcher, and no Selah PWA entry was found in the current default Edge profile. The existing managed Edge app-window launcher remains usable; official PWA installation through Edge is still pending.
- Sent Mac relay request `20261002T_WINDOWS_SELAH_MAC_FOLLOWUP_REQUEST` asking for receipt, review of the 1.0.30 deep-link scheme guard, safe dirty-checkout/build assessment, and authenticated target-side evidence. No Mac reply has arrived in `windows_inbox` or `windows_inbox_done`.
- Open verification: Edge PWA install/readback, Mac wrapper dispatch, authenticated two-device BlueCloud GET/PUT/GET, and preference convergence. No account data was changed.

## 2026-10-02 · Shared Bible text-language preference
- Add a Bible text-language selector to the Scripture library, independent of the interface locale. The selected language follows the UI locale until the user makes an explicit choice.
- Save explicit choices as optional `bibleContentLanguage: { code, updatedAt }` in BlueCloud state. Newer timestamps win; local wins ties. Keep selected translation IDs and the `selah-bible-library` chapter cache local because each browser profile may have different downloads.
- Include the explicit preference in portable backup v1; omit account owner, revision, and credentials as before.
- Change `mobile/scripts/copy-web.mjs` to copy source files from the current checkout instead of `origin/main`, preventing generated mobile assets from silently discarding local source edits.
- Current branch: `codex/selah-bible-language-sync`, based on `origin/main` at `9971628`. Original Windows checkout remains separate and dirty; no edits or merges were made there.
- Validation completed: inline JavaScript syntax parse, copy script `node --check`, JSON parsing for both schemas and manifest, `git diff --check`, and SHA-256 equality between root `index.html` and generated `mobile/www/index.html`.
- Contract audit: all 20 explicit fields in the current BlueCloud PUT serializer are declared by `selah-cloud-state.schema.json`; the client also preserves unknown remote top-level fields when writing.
- Mac snapshot audit: a new October 2 `cloudstate_*_selah.json` was found in the handoff repository. Without reading private record values, its top-level inventory showed `computerReadingRequest` and `computerReadingResult` (both null) that were not yet named in the schema; added them as opaque JSON extensions pending Mac source handoff. No `bibleContentLanguage` was present in that snapshot.
- Conflict-resolution follow-up: equal `bibleContentLanguage.updatedAt` values now use a deterministic lexical code tie-breaker, avoiding each device repeatedly reasserting its own value after simultaneous edits.
- Follow-up review corrected the Japanese default: the language selector now opens the bundled Japanese Matthew text (`matthew-jpn1965.json`, `jpn_loc`) instead of English. eBible.org identifies this 1965 Japanese New Testament as public domain; the asset already existed in the repository and mobile asset-copy list.
- Not yet verified: real browser interaction, authenticated BlueCloud GET/PUT/GET, cross-device timestamp convergence, Edge-managed PWA installation, Safari Add to Dock, and Mac runtime. PR #46 is merged and the GitHub Pages deployment for its merge commit succeeded.
- Mac source/data request `2026-10-01T210800_windows-selah-desktop-parity` remains `open`, `received=false` in `origin/main`.
- Source milestone version/build: **1.0.6 / build 7** (tracking label only; Windows protected Edge launcher updated; no native desktop binary built).
- Review artifact: PR [#46](https://github.com/delight0517/selah-bible-meditation/pull/46) merged at `b7b70a01a7200f8f3f905772c08f03a7c02c392a` (`2026-10-02T01:58:39Z`). No PR checks were reported; the Pages deployment run succeeded for the merge commit.
- Live deploy readback after merge (2026-10-02): public root and `manifest.webmanifest` both return HTTP 200. Manifest content type is `application/manifest+json`, `display` is `standalone`, and published HTML contains `bibleLanguageSelect`, the deterministic equal-timestamp code tie-break, and the Japanese default mapping (`matthew-jpn1965.json`, `jpn_loc`). This confirms the merged change is deployed; it does not verify signed-in sync or Mac runtime.
## Remaining parity work
- Read Mac operator's reply and reconcile the source/contract description with actual Mac runtime evidence.
- Use a synthetic test account/fixture to verify preference sync without exposing personal reflections or credentials.
- Install/launch the PWA in Edge and verify Windows app-window behavior; verify the same hosted source from Safari Add to Dock on Mac.
- On the current Windows PC, Selah shortcuts were being retargeted to the managed Edge wrapper, which cleared their URL arguments. Added a Selah-specific Windows Script Host launcher that carries the installed browser protection extension and PAC settings into app mode; real Edge rendering still needs a UI-capable verification session.
- Resolve whether anonymous local data should remain profile-local or needs a safer migration UX beyond the existing portable backup.

## 2026-10-02 · Authentication recovery and downloadable release — 1.0.6 / build 15
- User instructed continuing the public release and actively restoring GitHub authentication. Checked GitHub CLI and both standard/installed Windows Git Credential Manager paths without exposing credentials; no valid reusable credential was found. Started the official GitHub CLI OAuth device login and opened the approval page; the owner must complete browser authentication. Computer Use guidance forbids automated authentication-dialog interaction.
- The public open-source request provides authorization to license original Selah code. Added the standard MIT license and `THIRD_PARTY_NOTICES.md`, preserving Scripture/third-party rights and calling out unverified worldwide rights in the bundled Korean edition.
- Added a Korean/English Store listing draft with public app/privacy URLs. Publisher identity, product reservation, screenshots, actual age-rating answers, package validation, and certification remain pending.
- Added a Windows launcher release script using an explicit allowlist, SHA-256 file inventory and archive checksum. It excludes Scripture datasets, credentials, user records, browser extensions, proxy configuration and image/font assets. Output is ignored by Git; existing ZIPs are preserved.
- Source milestone advanced to **1.0.6 / build 15**. These are prepared local licensing/release changes, not proof of GitHub publication, Store approval, Edge PWA installation, or Mac/Windows authenticated sync.
- Built `Selah-Windows-Launcher-v1.0.6-build15.zip`. Verified exactly eight expected archive entries, all seven manifest file hashes, the archive checksum, packaging-script syntax, and the launcher dry-run command with the existing managed extension/PAC route. SHA-256: `e39e509e0f6bfec0ec26ae23108379e4217e2c0dd0d07ad08f1486dfe6a5f9c6`. No browser was launched by these checks; current runtime and Store-build behavior remain unverified.

## 2026-10-02 · Public Windows distribution request — 1.0.6 / build 14
- User requested Microsoft Store distribution and an open-source release so anyone can download Selah.
- Confirmed Windows is a hosted Edge PWA/app window; there is no `.msixbundle`, `.appxbundle`, `.exe`, or Store listing in this checkout. Microsoft documents publishing a PWA through Partner Center product reservation, PWABuilder packaging, and Store certification.
- Current checkout is clean before this documentation update; current GitHub CLI credential is rejected, so remote publication/push cannot be completed until GitHub authentication is restored.
- No repository-wide open-source license is present. The repository contains bundled Bible translations and third-party assets with distinct attribution/license terms; do not place one blanket license over those data/assets. Release brief records a code-only licensing boundary for the owner to approve.
- Store submission remains blocked on Partner Center account access, reserved product name/Package ID/Publisher ID, package generation, and required listing metadata/screenshots/age-rating answers. Public privacy policy URL is already available at `https://delight0517.github.io/selah-bible-meditation/privacy.html`.
- Updated the Windows release-readiness documentation and build tracker to **1.0.6 / build 14**. This is documentation/readiness tracking only; no app binary was built or installed and no public listing/source license was published.

## 2026-10-02 · Installed Mac native shell evidence and queue access
- User asked to continue the Selah Mac-to-Windows desktop parity work and avoid all UI/mouse interaction. Inspected over SSH only; no Mac app was launched.
- Mac has a `Selah Mac.app` installed in addition to Safari's `Selah.app` web app. Bundle ID `com.delight0517.selah.mac`; universal x86_64/arm64; minimum macOS 14; SwiftUI/AppKit/WebKit; executable embeds the shared Selah URL; signed entitlements include app sandbox and network-client access. Source found in the Mac checkout's `macos/Sources/SelahApp.swift`, repository `delight0517/selah-bible-meditation`, branch `codex/selah-mac-app`, commit `2fccdd7d09077404e631f4ef86ee4c8ed4973c55`. The checkout is 1 ahead/39 behind `origin/main` and contains dirty/untracked changes. Source documents a 760×620 minimum window, back/forward controls, 80–150% page zoom, focus-reading action, keyboard commands, and navigation gestures.
- Installed app and the local Xcode archive have different Mach-O UUIDs, and installed/archive Info.plist files lack version/build keys. A separate untracked `Selah-Info.plist` in the dirty Mac checkout declares version 1.0/build 1 and `selah://`, but these values are not in the installed bundle. Uncommitted `selah://read` handling maps to `homeAction=read&requestId=...`; the website handles `homeAction` but does not read `requestId`. Exact installed-source provenance and status of this local deep-link change remain open.
- The Mac Hub checkout's local inbox was stale. Left its existing branch and dirty Hermes file untouched, and delivered a separate local copy of the sanitized handoff into its `mac_inbox` over SSH. Upstream response synchronization is still pending.
- The Mac Hub checkout's local inbox was stale. Left its existing branch and dirty Hermes file untouched, and delivered a separate local copy of the sanitized handoff into its `mac_inbox` over SSH. Upstream response synchronization is still pending. Windows docs now describe the located Mac wrapper source and separate confirmed behavior from dirty/unbuilt changes.
- Rechecked Windows launch registration without opening a window: the stable Selah VBS launcher exists, and both the Desktop and Start Menu `Selah App Window` shortcuts invoke it through `wscript.exe`. This confirms local launch wiring, not visible Edge rendering or account-sync behavior.
- No app source/build version changed. Existing Windows source tracking milestone remains **1.0.6 / build 7**; no native Windows binary was built.
- Sent a separate Mac follow-up request at `/Users/rogan/appDev/releasepilot-hub/apps/_shared/cross_queue/mac_inbox/20261002T_WINDOWS_SELAH_SOURCE_HANDOFF_FOLLOWUP.md` with newly discovered Swift source provenance, dirty deep-link caveats, and targeted questions. SHA-256: `0c548fb36c3bc89bfddd8f5d2827553a6927f137a40d7977db7bac0193c08780`. Mac Hub checkout still cannot sync upstream because its GitHub authentication is unavailable; follow-up remains local/open.

## 2026-10-02 · Windows Selah desktop shell parity — 1.0.6 / build 8
- Mac source checkout confirmed the SwiftUI shell controls: back/forward, 80–150% page zoom, focus reading, shortcuts and navigation gestures. Exact installed binary provenance remains open because its Mach-O UUID differs from the local archive; Mac's inbox handoff is still unanswered.
- Implemented `windows/app-shell.js` for the managed Edge app/PWA: matching back/forward controls, 80–150% page zoom, focus-reading action, Alt+Left/Right, Ctrl+Shift+F, and Ctrl+Alt zoom shortcuts. It activates only for `windowsShell=1` and stores only the zoom preference in the local browser profile.
- Updated the protected Edge app launcher and PWA manifest start/shortcut URLs to include `windowsShell=1`. Both platforms continue to load the same hosted Selah application and BlueCloud contract; no cloud-state or portable-backup fields were added. Windows remains on the managed Edge route so the existing extension/PAC behavior is retained.
- Version/build tracking advanced from 1.0.6/build 7 to **1.0.6/build 8**. This is a source milestone; web deployment and visible Edge interaction are not yet verified. No window or mouse was used.
- Remaining: validate keyboard/focus/zoom in Edge app mode, confirm install via Edge PWA manifest, run authenticated synthetic BlueCloud round-trip and preference convergence, and verify matching behavior in the installed Mac wrapper. Keep the Mac handoff request open for installed-build provenance and wrapper storage details.

## 2026-10-02 · Selah computer-reading handoff parity — 1.0.6 / build 10
- Read-only Mac checkout source review confirmed an uncommitted `computerReadingRequest` / `computerReadingResult` / `computerReadingSession` implementation in its `index.html`; the Mac inbox handoff itself still has no reply. The Windows Pomodoro consumer in `timer1/lib/services/selah_computer_reading_service.dart` confirms UUID request IDs, `open-reading`, `targetPlatform=windows`, a two-minute request age, result fields `id/status/reason/openedWith/completedAt`, and a seven-minute session grace period.
- Added the matching Mac/Windows target selector, request/status UI, BlueCloud synchronization bridge, result polling, focus-reading deep-link activation, session heartbeat/pause lifecycle, and request/session merge behavior to the canonical Windows-hosted page. The handoff includes no Scripture, prayer, reflection, or credential content.
- Defined the three optional cloud fields in `contracts/selah-cloud-state.schema.json`. Updated `mobile/scripts/copy-web.mjs` to copy the shared handoff JS/CSS and Windows shell script into the mobile web bundle. Live command/session fields remain outside portable backup payloads.
- Advanced source tracking from 1.0.6/build 8 to **1.0.6/build 10**. The result poll also adopts the server revision before the next queued write. This is a source milestone, not a native Windows binary build. Authenticated BlueCloud convergence, actual Mac/Windows consumer launch, Edge PWA behavior, and installed Mac wrapper behavior remain unverified.
- No UI/mouse interaction. The Mac checkout remains dirty and the Windows Pomodoro checkout remains dirty; neither was reset or committed as part of this Selah change.
- Deployment readback: PR #58 merged as `c644db8`; GitHub Pages run `36977780538` succeeded for a later `main` commit containing it. Public page, handoff script, schema, and build metadata returned HTTP 200. A hidden browser rendered the Windows toolbar/target selector and both synthetic focus-reading deep-link forms. Authenticated BlueCloud convergence, actual Edge PWA registration, installed Mac wrapper dispatch, and live Pomodoro consumer handling remain unverified; a sanitized follow-up was written to the Mac local relay and has no acknowledgment yet.

## 2026-10-02 · Mac response reconciled into Selah parity record — 1.0.6 / build 15
- Read the Mac local relay reply at 18:20 KST. Corrected the evidence: `codex/selah-mac-app` no longer points at the previously cited `2fccdd7` source, its current remote tip is reported as `1a3b846`, and that branch is mobile iOS code. No canonical native SwiftUI wrapper source or installed bundle provenance is available yet.
- Installed Mac bundle facts remain: `com.delight0517.selah.mac`, universal x86_64/arm64, minimum macOS 14, embedded hosted URL, no version/build metadata, and no `selah://` registration. The wrapper's local storage/auth behavior is unverified.
- Mac confirmed the shared reading handoff source contract: `computerReadingRequest`, `computerReadingResult`, `computerReadingSession`; `homeAction=read` opens reader focus and `sessionId` associates/resumes the session. `requestId` in a URL is not consumed by the page. The Pomodoro consumer correlates its cloud result independently and has a Mac-target guard.
- Mac's source checks (`npm run check`, `node scripts/selah-computer-reading-smoke.js`, `node scripts/lock-safety-smoke.js`) passed. No Mac app build/open, authenticated cross-device BlueCloud exchange, or installed wrapper dispatch was verified. No credentials or personal reflections were accessed.
- Completed after that note: inspected the Windows target consumer; its targeted Flutter test passes 7/7, and the build-15 ZIP manifest/checksum validate. A clean-profile Edge launch was not run. Remaining: reconcile Mac local-vs-remote source and installed-app provenance, obtain authenticated synthetic BlueCloud GET/PUT/GET and cross-device convergence evidence, and verify the managed Edge app window without disturbing the existing browser session.
## 2026-10-02 · Fresh Mac source and live build reconciliation — 1.0.6 / build 15
- A direct read-only SSH recheck found the local Mac Selah checkout at HEAD `2fccdd7d09077404e631f4ef86ee4c8ed4973c55`, branch `codex/selah-mac-app`, 1 ahead / 71 behind origin/main. The committed tree contains `macos/Sources/SelahApp.swift`, an Xcode project/target, and `macos/README.md`; the Swift source and project have dirty changes. This is a real source snapshot, but installed app provenance remains unproven and the remote branch tip may differ. Sent `20261002T_WINDOWS_SELAH_SOURCE_RECONCILE_REQUEST.md` to Mac `mac_inbox`; no reconciliation reply observed yet. Mac checkout remains untouched.
- Fresh public HTTP readback: hosted `windows/BUILD_INFO.json` is still 1.0.6/build 13. Public `app-shell.js` includes the visible 100% zoom-reset button and click handler. Local commit `639ddb1` prepares build 15 licensing/launcher files but is not on origin/main; do not report build 15 as publicly deployed.
- Local launcher dry-run emits the managed Edge route with the SixVPN extension path, PAC URL, and `?windowsShell=1`; current running Edge process still has the older launch arguments/error title, so the corrected managed Edge app window has not been runtime-verified. No browser was terminated or restarted.
- Node syntax checks passed for `windows/app-shell.js` and `scripts/computer-reading-handoff.js`; JSON parsing passed for build metadata, both schemas, and Store listing; release ZIP's seven payload hashes and archive checksum match. These checks do not prove live app launch or authenticated two-device sync.
- GitHub public fetch works; saved GitHub CLI credential remains invalid and its web login has not completed. Local release commit and follow-up docs are prepared; no push/deploy yet. Authenticated BlueCloud round trip and Mac wrapper provenance/runtime remain open.
## 2026-10-02 · Windows Selah target-consumer tests — 1.0.6 / build 15
- Ran `flutter test test/services/selah_computer_reading_service_test.dart` in `C:\Users\delig\Desktop\app dev\timer1`; **7/7 tests passed**. Coverage: accept a fresh Windows-target request; reject malformed/wrong-platform/expired/future-dated requests; keep running heartbeat active until seven minutes; enforce the paused-session grace deadline; ignore ended/malformed sessions.
- No Pomodoro source/test files were edited by this Selah task. The test is source-level validation; it does not exercise the currently installed Pomodoro runtime, launch Selah, make authenticated BlueCloud writes, or prove Mac/Windows convergence.
## 2026-10-02 · Public Windows launcher download route prepared — 1.0.6 / build 15
- Added `windows/download.html` with Korean/English install steps, exact app limitations, live app/privacy/source links, direct ZIP link, and SHA-256. Added the verified 8 KB launcher ZIP and checksum under `windows/downloads/`; its seven packaged file hashes and archive checksum match, and it includes no Scripture dataset or user settings.
- Root README now links the Windows download page. Intended post-deploy URL: `https://delight0517.github.io/selah-bible-meditation/windows/download.html`. It is **not public yet**: local source branch includes release commit `639ddb1` plus uncommitted delivery/evidence docs; GitHub Pages still serves build 13, and GitHub CLI auth is awaiting owner approval.
- Direct Mac reconciliation request `20261002T_WINDOWS_SELAH_SOURCE_RECONCILE_REQUEST.md` was written to the Mac `mac_inbox` over the confirmed SSH connection at 18:27 KST. At the last read it had no Mac response yet. The Mac checkout remained untouched.
## Current state at 2026-10-02 — awaiting GitHub owner authentication
- Local branch `codex/selah-public-release-20261002` now has commits `639ddb1` (MIT scope, Store draft, packaging script, build 15 metadata) and `e73358e` (public Windows download page and ZIP). Working tree was clean after these commits; branch is ahead of public `origin/main` by two commits.
- `gh auth status` still says the saved `delight0517` token is invalid, and no `gh auth login` process is running. Public read-only fetch works, but push/PR/Pages deployment cannot be completed until the repository owner reauthenticates.
- Public HTTP remains build 13; build 15 download page and ZIP exist only in the local branch until push and Pages readback.
- Mac source reconciliation request is in the Mac local inbox; latest check found no response. Mac native wrapper checkout remains dirty and was not changed or built.
## 2026-10-02 · Installed Windows Selah launcher runtime readback — 1.0.6 / build 15 candidate
- Confirmed installed `%LOCALAPPDATA%\Programs\Selah\Launch-Selah-App.vbs` SHA-256 equals the repository launcher (`5586025B2EED8A498D72147559D247EB21E7C629C823F7676889ADB8F6391FBA`). Its dry-run contains the managed extension folder, existing PAC URL, and hosted `?windowsShell=1` app URL.
- The first launch was forwarded to the existing Edge singleton and kept the old extension-error title. I requested graceful close only for that Selah error window; Edge PID 38508 remained alive. A later launch through the installed launcher changed its main-window title to `무료 성경 묵상 앱 셀라 | 마태복음 읽기와 기도 기록`; the process reported responsive. No Edge process was forcibly terminated.
- This verifies the installed launcher opens the hosted Selah page in Edge. It does not prove the forwarded app URL's live query state, visible toolbar interactions, extension runtime state, PWA registration, or authenticated BlueCloud synchronization. The process retains its original startup command line, so treat toolbar state as unverified in this live Edge instance.
## Latest continuation checkpoint — 2026-10-02
- Local branch now contains four reviewable commits ahead of public main; latest is `48bc0bc`. The verified Windows launcher ZIP and public download page are committed but remain unpublished until authentication is restored.
- Installed Edge launch now shows the live Selah page after a graceful close of the stale error window and a relaunch through the installed VBS. No Edge process was force-killed. The current Edge process kept its old startup arguments, so treat the Windows toolbar query and controls as not yet proven in that process.
- The Mac reconciliation request remains unacknowledged in the local Mac relay. The live Mac checkout provides a dirty, 71-commits-behind SwiftUI source snapshot, but installed app provenance is unknown.
- Remaining proof for the full objective: publish/read back build 15 and the Windows download; resolve the Mac source/installed provenance; verify actual Edge toolbar interactions; and perform a synthetic authenticated BlueCloud round trip/convergence test. Existing source tests and release-package integrity checks passed; they do not substitute for these runtime checks.

## 2026-10-02 · GitHub login succeeded; repository write permission pending
- User confirmed completing GitHub device approval. The official CLI flow exited successfully, and `gh api user` identified the active account as `delight0517-art`.
- `gh repo view delight0517/selah-bible-meditation` confirmed `visibility=PUBLIC`, default branch `main`, and `viewerPermission=READ`. This account cannot publish the prepared branch, merge it, or create a release in the canonical repository. The inactive original owner's stored token is still invalid.
- Public Git fetch succeeded and the prepared branch was clean before this evidence note. Started a fresh official device login and asked the user to approve it using the `delight0517` owner account, or report if that account is unavailable. No credential/token contents are recorded here.
- Prepared Windows source/download milestone remains **1.0.6 / build 15**; no app code, ZIP, runtime installation, or public deployment changed in this authentication check.

## 2026-10-02 · Public Selah source and Windows launcher release — 1.0.6 / build 15
- Owner GitHub login succeeded as `delight0517`; the canonical repository reports `ADMIN`. PR [#71](https://github.com/delight0517/selah-bible-meditation/pull/71) merged as `a30a72d10746b0ff3e2da7f194eb78af98501462`.
- GitHub Pages workflow [36993348281](https://github.com/delight0517/selah-bible-meditation/actions/runs/36993348281) completed successfully. Public readback returned HTTP 200 for build 15 metadata, the bilingual Windows download page, MIT license, launcher ZIP, and checksum sidecar. GitHub's license API identifies root source license as MIT.
- Created public GitHub Release [`v1.0.6-build15`](https://github.com/delight0517/selah-bible-meditation/releases/tag/v1.0.6-build15) with the launcher ZIP and checksum. Downloaded the public ZIP and verified its 8,106-byte SHA-256 matches the published page and sidecar: `e39e509e0f6bfec0ec26ae23108379e4217e2c0dd0d07ad08f1486dfe6a5f9c6`.
- Store submission remains open. No Partner Center product reservation, package/publisher identity, Windows `.msixbundle`, `.classic.appxbundle`, actual Store screenshots/age-rating questionnaire, or certified listing has been created. The Store listing draft is `windows/store-listing.json`; worldwide rights for every bundled Bible edition, especially Korean translation data, still need confirmation before Store distribution.
- Existing Windows launcher target tests passed 7/7 and the downloaded package member/checksum checks passed. This does not prove a Store installation, a fresh-profile PWA interaction test, or authenticated Mac/Windows BlueCloud convergence.

## 2026-10-02 · Mac deep-link reading-session continuity — 1.0.6 / build 16
- Compared the live Mac checkout's dirty SwiftUI URL handler with the canonical shared-page consumer. The wrapper maps `request` to `requestId`; the page previously ignored that ID and could assign a different reading `sessionId` from the BlueCloud request.
- Updated `scripts/computer-reading-handoff.js` to match the request ID, require a matching target platform and unexpired request, and use its existing shared session ID. If BlueCloud delivers the request after reading opens, the active session is reconciled on merge. Personal reflection content is not involved.
- Mac's installed app still lacks a registered `selah://` scheme. Sent Mac a separate request to register/install the receiving handler and provide version/build/source provenance plus a synthetic request readback.
- PR #71 merged as `a30a72d10746b0ff3e2da7f194eb78af98501462`; Pages deployment run `36993348281` succeeded. Public `windows/BUILD_INFO.json` reads back 1.0.6/build 15, the download page is HTTP 200, and the build-15 ZIP is HTTP 200 with the locally verified SHA-256. The prior build-15 deployment is confirmed.
- Source milestone advanced to **1.0.6 / build 16** for the session-correlation update. Windows build-16 ZIP was created and its eight-entry archive manifest verifies all seven payload hashes; SHA-256 is `ef21c18608c98f16998e330d945f8ced9c8a1913627db65798c50c495538fb8c`. Authenticated two-device BlueCloud convergence and Mac URL-scheme launch remain pending.
## 2026-10-02 · BlueCloud / Google login recovery — 1.0.6 build 17
- User feedback: Retry BlueCloud/Google login, diagnose the error, and fix it.
- Live retry rendered the Google button. Clicking it produced `[GSI_LOGGER]: The given origin is not allowed for the given client ID.`
- Confirmed production `/api/auth/google-client-id` matches `brainwire-web` in Google Cloud project `rogan-youtube`. Its only authorized JavaScript origin was `https://brainwire-f2gf.onrender.com`; Selah runs on `https://delight0517.github.io`.
- User approved saving the Selah origin on 2026-10-02. Saved `https://delight0517.github.io` in the matching Google Cloud OAuth client and reopened its settings to confirm persistent readback. No secrets, redirect URIs, or scopes changed.
- App fix: Dedicated Google status and retry UI; concurrent-load deduplication; request and script timeouts; Retry-After cooldown on HTTP 429; reload after failed script/config requests. Google load errors no longer overwrite password-login errors. Mobile web asset copying includes the recovery helper.
- Five regression scenarios passed: concurrent initialization, rate-limit cooldown/retry, failed script/retry, aborted request/retry, missing server configuration. Actual Google account authorization and cloud synchronization remain unverified.
## 2026-10-02 · Windows Selah desktop polish and parallel worktrees — 1.0.6 / build 17
- [x] Refined the desktop title, Bible reading card, meditation journal, prayer field, and saved-note cards with a calm forest/ivory visual system in `styles/desktop-polish.css`; styles apply above 760 px and keep the existing mobile presentation.
- [x] Added `docs/WORKTREE_WORKFLOW.md` and `scripts/Start-WorktreeTask.ps1` so each concurrent chat can start from a clean `origin/main` worktree, own a separate branch, and share code through pull requests with explicit status/evidence. Complements the open repository governance PR #63.
- Version/build: hosted Selah source 1.0.6 / build 17. The Windows launcher package version is governed separately by its build archive.
- Initial browser check after build 16 exposed an existing one-child `.layout` grid that left unused blank space and narrowed the main panel. The desktop stylesheet now makes that wrapper a full-width block and uses the app's live theme variables so dark mode and user colors continue to apply.
- Follow-up desktop viewport inspection found the Bible reader wrapper also had only one visible child while its notebook was intentionally moved to the focus-mode drawer. Center the reader card at a readable 920 px maximum instead of leaving an empty second column.
- Added `?v=17` to the desktop stylesheet URL after confirming GitHub Pages serves CSS with a 600-second cache lifetime; this avoids keeping a previously cached design after publish. Browser verification remains pending.

## 2026-10-02 · Google OAuth provider correction and account-login handoff — build 17
- User feedback: Proceed with all required steps; user will handle account login and verification.
- Saved the missing Selah JavaScript origin in Google Cloud, then navigated back to the client detail screen and confirmed it persisted alongside the existing BlueCloud server origin.
- The live Selah app renders the Google button without the prior rate-limit message. After a test click, no unauthorized-origin error was captured; an account chooser/new tab was not observable through the automated browser, so this is not proof of completed account sign-in.
- Displayed the live Selah login screen and requested that the user complete Google account selection/login. Authenticated BlueCloud connection and data synchronization remain pending user login.
- Prior build 17 deployment and recovery regression checks remain valid. Provider settings take effect separately from the deployed application build; Google console notes a propagation delay of 5 minutes to several hours.
## 2026-10-02 · Authenticated login and missing-guide-button correction — build 18
- User completed Google login in the visible live Selah page. Readback confirmed the Account control and signed-in account panel.
- Follow-up readback showed `Sync failed`; the hidden auth error contained `Cannot set properties of null (setting 'hidden')`. DOM inspection confirmed the removed `guideStart` control is absent.
- Root cause: sync finished its cloud request/merge and then attempted to update the absent optional guide button. The resulting local TypeError was reported as a cloud sync failure. Guide completion had the same missing-element assumption.
- Guard both optional guide-button updates and hide the Google sign-in section once the account is connected. Provider authorization and Google login were verified; final Synced UI readback remains unverified after deployment.
- Changed the stylesheet cache token to `?v=17-9b9913c` after the follow-up UI check showed the `?v=17` response was still cached after confirming GitHub Pages serves CSS with a 600-second cache lifetime; this avoids keeping a previously cached design after publish. Browser verification remains pending.

## 2026-10-02 · Windows desktop polish deployed and interaction checked — hosted source 1.0.6 / build 18
- GitHub Pages deployment for `main` commit `dfc49056eb71d126b6e6c5542fadb80eac276c09` succeeded (run `36997319087`). Cache-busted public HTML and desktop CSS both returned HTTP 200; CSS link is `?v=17-9b9913c`.
- At a 1440 px browser width, live DOM readback showed the Bible reader centered at 920 px. Clicked through Matthew 2 and restored Matthew 1; Korean Bible rendering and light theme were confirmed. Tested timed meditation, opened its notebook, entered reflection and prayer drafts, confirmed the entered values in both fields while the on-device save notice was visible, then cleared both test strings and ended the session without creating a saved test note. Browser console had no errors.
- The parallel-work setup is live on `main`: `docs/WORKTREE_WORKFLOW.md` and `scripts/Start-WorktreeTask.ps1` create isolated `origin/main` task branches/worktrees and share changes through PRs with ownership and evidence in `TODO.md`/task notes. Each chat must preserve existing dirty trees and inspect new `main` commits before integration. Root governance PR #63 remains open for repository instruction/workflow files. GitHub branch protection was enabled separately: PR required, zero approvals required for solo work, admins included, force pushes and deletion disabled; no required status check is configured yet.
- Scope/evidence limit: this is a hosted web-source style change, not a new Windows launcher binary. BlueCloud cloud sync and final saved-note creation were not exercised.

## 2026-10-02 · Reject invalid Selah handoff session URLs — 1.0.6 / build 19
- Read the Windows Pomodoro consumer's actual handoff URL, which includes `requestId` and `sessionId`. Build 16 allowed an unmatched URL session ID to bypass the target and expiration guard.
- Build 19 only uses a bare URL session ID when no request ID is present. If a request ID exists, require the cloud request to match it, target this platform, and have an age from zero through 120 seconds before adopting its session ID.
- PR #81 had already published launcher build 18 for Google-login recovery, so the target-validation change was rebased and assigned build 19. The Korean/English download hubs and detail page now point to build 19. Regression coverage includes matching request, missing request, wrong platform, expired/future/missing timestamp, and legacy no-request session URL. Actual authenticated cross-device sync and installed Mac URL dispatch remain pending.

## 2026-10-02 · Selah build 19 handoff validation and Mac follow-up
- Build 19 was generated with `windows/Build-Selah-Release.ps1` after PR #81 assigned build 18 to Google-login recovery. Launcher ZIP SHA-256: `a74960674a975ff3e49c5e834355af58489b623dadae8a60b4b22b49132da1ae`; release manifest reports version 1.0.6/build 19 and all 7 payload hashes verify.
- Added `scripts/test-computer-reading-handoff.cjs`; Node syntax and six request/session scenarios pass. A matching Windows request uses its shared session ID; missing, wrong-target, expired, future-dated, or timestamp-less requests do not use the URL session fallback; legacy session-only links remain compatible.
- Sent Mac follow-up `20261002T105406Z_windows_94ea382b` through releasepilot-hub `origin/main`: verify current Mac source and installed bundle URI registration, align the request/session contract, preserve dirty work, then safely build/install and synthetic-readback if build policy and live process state allow. Official queue readback at 2026-10-02 20:06 KST: status `open`, `received=false`, `completed=false`; Mac receipt and response are still pending.
- GitHub PR #83 merged as `e9e62f65f5bda563492d841f113ae18e90d182ea`; Pages run `36998929617` succeeded. Deployment and public ZIP readback are recorded below. Authenticated Mac/Windows round-trip and Mac installed `selah://` launch remain unverified.

## 2026-10-02 · Build 19 deployment and Windows public artifact readback
- PR #83 merged to `main` as `e9e62f65f5bda563492d841f113ae18e90d182ea`; Pages workflow `36998929617` completed successfully.
- Public `windows/BUILD_INFO.json` reads version 1.0.6/build 19. Public JS contains the 0–120 second request-age guard; Korean/English download hubs and the detail guide resolve to the build-19 ZIP and matching checksum.
- Downloaded the public ZIP in memory; SHA-256 matches `a74960674a975ff3e49c5e834355af58489b623dadae8a60b4b22b49132da1ae`. GitHub Release `v1.0.6-build19` contains the ZIP and sidecar checksum.
- This Windows package remains an Edge app-window launcher, not a standalone EXE/MSIX. Mac installed scheme/provenance and authenticated cross-device data convergence remain open.

## 2026-10-03 · Growth baseline and free-signup CTA deployment
- [x] Fixed the hidden free BlueCloud signup CTA on the normal homepage; it wraps at narrow widths and remains hidden in immersive reading mode.
- [x] PR #115 merged as `3c42697d2e0822ff95b834be11cea567480edbab`; Pages run `37096278336` succeeded for that commit.
- [x] Live HTTP readback confirms the CTA CSS and shared app version 1.0.9/build 21. The signup flow itself was not completed or verified.
- [ ] Wait until Search Console's settled-through date passes the Oct 2 crawls; compare Selah-only impressions/clicks and queries with tagged first-party visits, reading/reflection events and verified signups. No current data identifies 100,000 concurrent users, 1,000,000 cumulative users, 300,000 registrations or 10,000 premium customers; those remain owner-stated aspirations, not forecasts.
- [ ] Keep the ₩20,000 ad allowance unspent until campaign attribution can connect an acquired visit to reading/reflection and verified signup. Continue excluding personal Instagram.

## 2026-10-03 · Configure free change notification for supported search engines
- [x] Publish `selah-indexnow-key.txt` under the Selah URL prefix, compare its live content to the generated project key without echoing the key, and submit only the changed Korean homepage through the IndexNow protocol.
- [x] Record protocol acceptance separately from search indexing. PR #118 / Pages run `37097961779` published the key file; live byte comparison passed; the global IndexNow endpoint returned HTTP 200 for the Korean homepage only.
- [ ] Check later Bing/Naver result and crawl status; Google Search Console still has zero settled Selah impressions through Sep 29 and some locale guides report `Crawled - currently not indexed`. IndexNow does not notify Google or guarantee indexing.

## 2026-10-03 · Localized SERP and preview checkpoint
- [x] Reviewed current GSC page/query evidence, direct mobile inspections of the Tagalog and Brazilian Portuguese guides, and on-page SEO for the Korean and English landing pages. The sample remains pre-change for the main CTA and contains no settled Selah search row.
- [x] Visually checked the configured Korean, Tagalog, and Brazilian Portuguese preview cards. Their content matches the local Bible-reading promise; the actual Google-rendered title, description, and image are still unknown.
- [ ] Wait for the post-Oct-2 crawl dates to settle in GSC; decide whether to improve the two crawled-but-not-indexed guide pages only after comparing actual search queries and downstream local-market activity. Do not infer the cause from low-severity audit heuristics.

## 2026-10-03 · North Star growth plan and execution gates
- [x] Recorded the owner's four long-range aspirations separately from current performance and retained 1,000 verified active users as the first evidence milestone.
- [x] Wrote a staged plan covering metric definitions, Korea-first validation, locale selection, search-result/landing promise match, one-variable experiments, the ₩20,000 spend cap, premium evidence and concurrent-load readiness: `docs/GROWTH_PLAN_NORTHSTAR.md`.
- [ ] Complete Gate 0: connect tagged arrivals through focused reading, saved reflection and confirmed signup; exclude QA and verify the live aggregate readback.
- [ ] Hold spend at ₩0 until Gate 0 and the Korean need/intent check pass; then cap the first high-intent paid probe at ₩5,000 and keep ₩15,000 reserved pending activation evidence.
- [ ] Keep weekly research checkpoints; if sample is below the stated floor, continue observing rather than forcing a country, variant or “winner.”
