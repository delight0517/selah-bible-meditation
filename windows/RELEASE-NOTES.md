# Selah Windows launcher — 1.0.6 / build 15

Selah's original application code and original documentation are available under the MIT license. Scripture translations and third-party material keep their own terms; see `THIRD_PARTY_NOTICES.md`.

Download the Windows launcher ZIP, extract it, and run `Launch-Selah.cmd`. To create desktop/Start menu shortcuts, run `Create-Selah-Desktop-Shortcut.vbs`. Microsoft Edge and Windows Script Host are required; the first app launch requires an internet connection. The archive includes no user records, tokens, bundled Scripture datasets, browser extensions, or PAC settings.

The launcher opens the hosted Selah app, with back/forward navigation, page zoom/reset, and focus-reading controls. If SixVPNBlocker is already installed, its managed Edge route is preserved and incomplete configuration stops the launch. Otherwise normal Edge app mode is used. Use Edge's install-app menu at the official website for Edge-managed PWA registration.

This download is a launcher ZIP. Microsoft Store packaging and certification remain pending, as do installed Store-build runtime verification and authenticated Mac/Windows sync checks. The app's website and shared data service are updated independently of this launcher package; build 15 identifies these launcher/release files.

Application: <https://delight0517.github.io/selah-bible-meditation/>

Source: <https://github.com/delight0517/selah-bible-meditation>

Check the accompanying `.sha256` file to verify the ZIP's SHA-256 digest.
