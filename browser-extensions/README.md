# Selah Gesture Navigation

Selah Gesture Navigation is an optional, open-source desktop browser extension. It is a separate add-on, not the Selah iPhone or Mac application. It lets a reader use one visible hand to scroll a web page and, where the page exposes a labeled next/previous control, move between pages or Bible chapters.

## Gestures

- Open palm, fast finger sweep left: next page/chapter.
- Open palm, fast finger sweep right: previous page/chapter.
- Open palm, fast finger sweep up/down: smooth vertical scroll.
- For sites without labeled page controls, choose horizontal scrolling in the camera window.

The first behavior is rule-based: it compares fingertip movement with palm joint 9 and distinguishes the faster swipe from a slower hand reset. It passed the eight labeled sample videos supplied for this Selah project. That is a small calibration set, not a guarantee of error-free recognition for every person, camera, lighting condition, or hand orientation.

## Install from source

Requirements: Node.js 20 or newer, npm, and a webcam.

```sh
cd browser-extensions
npm ci
npm run build
```

For Chromium browsers, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked** with `browser-extensions/dist/chrome`.

For Firefox, open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `browser-extensions/dist/firefox/manifest.json`. Temporary installs end when Firefox closes. A permanent Firefox listing requires Mozilla signing; the source build does not claim to be a signed store release.

Click the extension button while the reading page is active. The extension injects its small navigation listener into that tab, then opens the camera window. Press **카메라 켜기** to request camera permission. Closing the window or pressing **카메라 끄기** stops all camera tracks and the recognition worker.

## Permissions and privacy

The extension asks only for `activeTab` and `scripting`. It injects into the current tab only after the toolbar action is clicked; it does not request access to all websites, read browsing history, or run on every page. Camera permission is requested only after the user presses the camera button. Camera frames and hand landmarks are processed locally by the packaged MediaPipe SDK and model. They are not uploaded, saved, or used for analytics. The extension makes no network requests after it is built.

The extension controls vertical scrolling and labeled page controls in ordinary websites. Browsers reserve internal pages and some protected sites from extension script access. A site without accessible next/previous controls cannot be reliably page-turned by a generic extension; horizontal-scroll mode is available for horizontally scrolling readers.

## Build contents

`npm run build` creates `dist/chrome` and `dist/firefox` with the same shared Selah classifier, a pinned MediaPipe Tasks Vision package, the hand landmark model, and browser-specific Manifest V3 metadata. The model is downloaded during the build from Google's public MediaPipe model bucket and checked against the SHA-256 pinned in `build.mjs`. Runtime model, WASM, JavaScript, and camera frames stay local.

License: Selah code is MIT. MediaPipe Tasks Vision and the hand landmark model are Apache-2.0; its license notice is included in each built package.
