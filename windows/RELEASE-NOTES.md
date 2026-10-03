# Selah Windows launcher — 1.0.10 / build 25

Repairs an incomplete Selah-owned selah: registry marker during reinstall after unregistering the handler. Existing handlers from other apps remain untouched; the shortcut installation and URI forwarding can now be repeated safely.

# Selah Windows launcher — 1.0.10 / build 24

Registers the per-user selah://read?request=<id> handoff when installing desktop shortcuts, but only if the scheme is not already owned. The launcher accepts one strictly validated reading request and routes it to the shared Selah reader while preserving the managed Edge launch path. Includes an exact-match-only protocol unregister script.

# Selah Windows launcher — 1.0.9 / build 23

The app's reader and home headers now use the same Bible-and-cross icon as the PWA, iOS, and Windows app icon.


Adds the Selah app icon to desktop and Start menu shortcuts and includes the multi-size icon in the launcher package. The hosted PWA uses the matching 192×192 and 512×512 assets; the iOS asset catalog uses the matching 1024×1024 artwork.

# Selah Windows launcher — 1.0.6 / build 19

Preserves the build 18 Google sign-in cloud-sync recovery and requires a matching current BlueCloud request for the current platform before reusing its reading session. A bare `sessionId` cannot bypass an invalid, expired, or wrong-platform `requestId`. The Windows launcher opens the same hosted Selah runtime.

# Selah Windows launcher — 1.0.6 / build 17

Google login now shows a separate loading/error message and reload control, times out stalled loads, and respects server rate-limit cooldowns. Google OAuth origin registration is a separate provider setting; authenticated account sign-in has not yet been verified.
