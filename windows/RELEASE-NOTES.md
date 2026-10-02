# Selah Windows launcher — 1.0.6 / build 18

Fix a local guide-button error that displayed Sync failed after successful cloud requests. Hide the Google sign-in section once connected. Google login from the Selah site is confirmed; the matching provider origin is now registered.

# Selah Windows launcher — 1.0.6 / build 17

Google login now shows a separate loading/error message and reload control, times out stalled loads, and respects server rate-limit cooldowns. Google OAuth origin registration is a separate provider setting; authenticated account sign-in has not yet been verified.

# Selah Windows launcher — 1.0.6 / build 16

Selah's original application code and original documentation are available under the MIT license. Scripture translations and third-party material keep their own terms; see `THIRD_PARTY_NOTICES.md`.

Download the Windows launcher ZIP, extract it, and run `Launch-Selah.cmd`. To create desktop/Start menu shortcuts, run `Create-Selah-Desktop-Shortcut.vbs`. Microsoft Edge and Windows Script Host are required; the first app launch requires an internet connection. The archive includes no user records, tokens, bundled Scripture datasets, browser extensions, or PAC settings.

The launcher opens the hosted Selah app, with back/forward navigation, page zoom/reset, and focus-reading controls. If SixVPNBlocker is already installed, its managed Edge route is preserved and incomplete configuration stops the launch. Otherwise normal Edge app mode is used. Use Edge's install-app menu at the official website for Edge-managed PWA registration.

This download is a launcher ZIP. Microsoft Store packaging and certification remain pending, as do installed Store-build runtime verification and authenticated Mac/Windows sync checks. The website is the shared runtime for Mac and Windows; build 16 identifies this launcher ZIP, which opens that hosted app with the reading-session handoff update.

Application: <https://delight0517.github.io/selah-bible-meditation/>

Source: <https://github.com/delight0517/selah-bible-meditation>

Check the accompanying `.sha256` file to verify the ZIP's SHA-256 digest.
