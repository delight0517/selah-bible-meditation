import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import vm from "node:vm";

const source = await readFile(new URL("./semantic-theme.js", import.meta.url), "utf8");
const themeCss = await readFile(new URL("../styles/semantic-theme.css", import.meta.url), "utf8");
const layoutCss = await readFile(new URL("../styles/desktop-polish.css", import.meta.url), "utf8");
const page = await readFile(new URL("../index.html", import.meta.url), "utf8");
const desktopPolishRevision = execFileSync("git", ["log", "-1", "--format=%h", "--", "styles/desktop-polish.css"], { encoding: "utf8" }).trim();
const readerStart = page.indexOf('<div class="reading-notebook">');
const notebookStart = page.indexOf('<aside class="notebook card"', readerStart);
assert.ok(readerStart >= 0 && notebookStart > readerStart, "reader markup boundaries must exist");
const readerMarkup = page.slice(readerStart, notebookStart);
const readerStack = [];
let verseAncestors = [];
for (const match of readerMarkup.matchAll(/<\/?(div|section|details)\b[^>]*>/g)) {
  const tag = match[1];
  if (match[0].startsWith("</")) {
    assert.equal(readerStack.at(-1)?.tag, tag, `reader markup closes ${tag} out of order`);
    readerStack.pop();
  } else {
    const classes = match[0].match(/\bclass="([^"]*)"/)?.[1] || "";
    if (match[0].includes('id="verseText"')) verseAncestors = [...readerStack, { tag, classes }];
    readerStack.push({ tag, classes });
  }
}
assert.ok(verseAncestors.some(({ classes }) => classes === "reading-scripture"), "Bible text must remain inside the aligned reader column");
assert.ok(verseAncestors.some(({ classes }) => classes === "card verse-card"), "Bible text must remain inside its contrasting reader surface");
assert.match(themeCss, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+44px\s+44px/, "mobile reader controls must fit in an aligned row");
assert.match(themeCss, /clip-path:\s*inset\(50%\)/, "compact mobile reader controls must keep visible labels accessible");
assert.match(themeCss, /body::before\s*\{[^}]*height:\s*env\(safe-area-inset-top/, "mobile web view must mask content behind the fixed status bar");

function luminance(hex) {
  const channels = hex.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16) / 255);
  return channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(foreground, background) {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function appliedColors(foreground, background) {
  const vars = {
    "--ink": foreground,
    "--muted": foreground,
    "--accent-text": foreground,
    "--on-accent": foreground,
    "--green": background,
    "--paper": background,
    "--card": background,
    "--soft": background,
  };
  const written = {};
  const root = { style: { setProperty: (name, value) => { written[name] = value; } } };
  const context = {
    window: { applyTheme() {} },
    document: { documentElement: root },
    getComputedStyle: () => ({ getPropertyValue: (name) => vars[name] || "" }),
  };
  vm.runInNewContext(source, context, { filename: "semantic-theme.js" });
  return written;
}

const backgrounds = new Set([
  ...Array.from({ length: 256 }, (_, value) => `#${value.toString(16).padStart(2, "0").repeat(3)}`),
  "#111612", "#1b231d", "#29362d", "#767676", "#808080", "#8f62a2", "#0f5f90", "#e36c9a",
]);
const roles = ["--ink-on-paper", "--muted-on-paper", "--accent-on-paper", "--ink-on-card", "--muted-on-card", "--accent-on-card", "--ink-on-soft", "--muted-on-soft", "--accent-on-soft", "--text-on-accent"];

for (const background of backgrounds) {
  const colors = appliedColors(background, background);
  for (const role of roles) {
    assert.ok(contrast(colors[role], background) >= 4.5, `${role} fails 4.5:1 on ${background}: ${colors[role]}`);
  }
}

assert.equal(appliedColors("#20251f", "#f5f2eb")["--ink-on-paper"], "#20251f", "readable custom colors should be preserved");
assert.ok(themeCss.includes(":root .verse-card :is(.bible-audio-disclosure > summary, .audio-link, .bible-library > summary, .bible-library label, .bible-library .note)"), "reader controls on the accent surface must use its calculated foreground");
assert.ok(themeCss.includes(":root[data-theme=\"dark\"] .verse-card {\n  background: var(--card) !important;\n  color: var(--ink) !important;"), "dark-theme reader must use a dim card surface instead of the bright accent swatch");
assert.ok(themeCss.includes(":root[data-theme=\"dark\"] .verse-card :is(.verse, .reference, .bible-verse-num, .eyebrow) {\n  color: var(--ink) !important;"), "dark-theme Scripture and labels must use the softened readable foreground");
assert.ok(themeCss.includes(":root #bibleAudioPlayer:not(.is-minimized) #bibleAudioPlayerVideo iframe {\n  width: min(100%, 360px) !important;"), "expanded YouTube playback must stay compact beside the Scripture reader");
assert.ok(themeCss.includes(":root .verse-card .reader-display-controls select { color: var(--ink-on-card, var(--ink)) !important; }"), "reader selects must use the foreground calculated for their card surface");
assert.ok(themeCss.includes(":root .verse-card .reader-zoom-controls button:not(#readerZoomToggle) { color: var(--text-on-accent, var(--on-accent)) !important; }"), "reader zoom buttons must use the foreground calculated for the accent card, not the soft control surface");
assert.ok(themeCss.includes(":root .verse-card :is(.reader-theme-toggle, .reader-fullscreen-toggle) { color: var(--ink-on-soft, var(--ink)) !important; }"), "reader toggles must use the foreground calculated for their soft surface");
assert.ok(themeCss.includes(":root body.mobile-reading-focus .verse-card { background: var(--paper) !important; color: var(--ink-on-paper, var(--ink)) !important; }"), "full-screen focus mode must retain its paper surface and calculated foreground");
assert.ok(themeCss.includes(":root body.mobile-reading-focus .verse-card :is(.reference, .bible-verse-num, .eyebrow) { color: var(--ink-on-paper, var(--ink)) !important; }"), "full-screen focus labels must use the paper-surface foreground too");
assert.ok(layoutCss.includes(".reading-scripture { inline-size: 100%; margin-inline: 0; }"), "desktop reader must align to the full content column");
assert.ok(layoutCss.includes(".verse-card { min-height: 420px; padding: 28px 30px; border-radius: 20px; background: var(--green);"), "reader surface must stay solid so measured text contrast matches the rendered background");
assert.ok(page.includes("color:var(--ink-on-paper,var(--ink))!important}body.mobile-reading-focus.reader-settings-collapsed"), "full-screen mobile reader text must use the calculated paper-surface foreground");
assert.ok(page.includes("grid-template-rows:auto auto auto minmax(0,1fr) auto;align-content:stretch"), "focus reader allocates its flexible row to the Scripture text after the fixed toolbar rows");
assert.ok(page.includes("body.mobile-reading-focus .bible-audio-disclosure,body.mobile-reading-focus .audio-options-panel,body.mobile-reading-focus #readerAudioPrimary{display:none!important}"), "focus reader hides secondary audio controls so they cannot displace or overlap Scripture text");
assert.ok(page.includes("./styles/semantic-theme.css?v=5"), "theme styles must use a fresh cache key after visual corrections");
assert.match(page, new RegExp(`desktop-polish\\.css\\?v=[^"']*-${desktopPolishRevision}`), "desktop reader CSS cache key must advance when its source changes");
console.log(`semantic theme contrast passed for ${backgrounds.size} backgrounds and ${roles.length} text roles`);
