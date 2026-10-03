# Selah ads — implementation and activation checkpoint

- Google native AdMob integration added for Capacitor iOS (plugin 8.1.0).
- **Disabled** pending verification of Selah's publisher, app ID and interstitial unit.
- Demo IDs in `assets/selah-ad-config.js` and iOS Info.plist are not revenue IDs.
- Existing 1.0.10/22 exported IPA/PKG do NOT contain this feature. Integrate this PR
  with release prep, increment the shared build, rebuild and capture device evidence.

## Policy

Maximum three presentation reservations per local calendar day, per installation.
Atomic IndexedDB transaction serializes tabs/windows. Quota survives app restarts.
Moving the clock backwards does not reset it. Clearing app data or using another
installation is outside this local cap; this is not a verified account-wide cap.
Fifteen-minute minimum between displays. No startup ads, reading/meditation overlay,
or ad when a dialog is open. No-fill, offline, consent or storage failures do not
block reading. Failed load does not count; failed presentation after reservation
conservatively consumes a slot to avoid exceeding the cap after a crash.

Entry points: exit focus reading; exit a completed meditation session. Early
meditation cancellation never triggers an ad. Feedback/dialogs take priority.
No delayed ad is queued for later if another screen has already been opened.

Google UMP consent is refreshed before request. Ads require canRequestAds.
Required privacy-options form has a visible button. No ATT prompt is added;
do not enable tracking/personalization without implementing applicable permission
and updating actual App Privacy declarations. Never send Scripture, prayers,
notes, religious preferences, or BlueCloud profile fields to the ad adapter.

## Activation / remaining evidence

1. Confirm publisher account and Selah-specific iOS app/ad-unit IDs in AdMob.
2. Replace demo iOS GADApplicationIdentifier and interstitial; testing=false.
3. Configure applicable consent messages, privacy page/declarations, and all
   SKAdNetwork IDs for selected networks from Google's current setup documentation.
4. Explicit test build uses Google demo IDs only; never click live developer ads.
5. Exercise actual native consent/load/display/dismissal and the fourth transition,
   app restart, next-day reset and offline recovery. These have NOT been tested.
6. Mac WKWebView has no AdMob adapter. Select a provider explicitly supporting
   macOS desktop apps or use separately authorized sponsored content. Do not
   inject ordinary AdSense units into the desktop WebView.
7. Android adapter configuration is present but Android native app-ID setup and
   runtime validation remain pending; it is not part of this iOS/Mac preparation.

Sources: https://github.com/capacitor-community/admob
https://developers.google.com/admob/ios/interstitial
https://developers.google.com/admob/ios/privacy
https://support.google.com/admanager/answer/6310245

## Build evidence

2026-10-03: Xcode unsigned iOS Debug build **BUILD SUCCEEDED** with native
CapacitorCommunityAdmob and Google SDK dependency. Log:
`/Users/rogan/Documents/Codex/2026-10-03/selah-ads-build.log`.
This proves compilation only. No physical impression or quota runtime test yet.
