# Selah iOS and Mac release preparation

Current candidate: 1.0.10 / build 26, after meditation setup translations were added for all five reader locales. Both build 25 packages were uploaded and processed VALID; they are attached temporarily and will be superseded before review. No review submission has occurred.

ASC apps: iOS 6818769383 (`com.delight0517.selah`); Mac 6818769432 (`com.delight0517.selah.mac`). en-US/ko/ja descriptions, subtitles and privacy-policy URL were saved and read back.

Use `BUILD_RELEASE.md` and `release-manifest.json` for exact native packaging gates. Source copy to mobile/www must be followed by Capacitor copy into ios/App/App/public; inspect the actual archive resources before upload.

Simulator reading, font size, settings, Korean/Japanese language and mobile action layout were inspected. Full offline download, account sync, 30-day retention and final build 26 runtime validation remain pending. Physical iPhone is not requested. Mac store archive passes codesign but fails local spctl execution assessment, so it was not launched. A separate trusted Developer ID build is being prepared for notarized runtime validation.

The Korean Bible Society FAQ permits royalty-free use after expired economic protection while requiring attribution and integrity; worldwide scope remains unstated. Japanese 1965 translation is New Testament only. Bible text must retain source attribution.

First release remains ad-free. Ad PR #121 stays deferred. Shared correlation backlog 474637700f55 is pending; Windows is unavailable today.
