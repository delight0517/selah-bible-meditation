(() => {
  "use strict";
  const rgb = (value) => {
    const hex = value.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
    if (hex) {
      const digits = hex[1].length === 3 ? [...hex[1]].map((part) => part + part).join("") : hex[1];
      return [0, 2, 4].map((index) => parseInt(digits.slice(index, index + 2), 16) / 255);
    }
    const channels = value.match(/[\d.]+/g);
    return channels?.length >= 3 ? channels.slice(0, 3).map((part) => Number(part) / 255) : null;
  };
  const luminance = (color) => color.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const contrast = (foreground, background) => {
    const [light, dark] = [luminance(foreground), luminance(background)].sort((left, right) => right - left);
    return (light + 0.05) / (dark + 0.05);
  };
  const bestBlackOrWhite = (background) => {
    const dark = [0, 0, 0], light = [1, 1, 1];
    return contrast(dark, background) >= contrast(light, background) ? "#000000" : "#ffffff";
  };
  const safeForeground = (preferred, background) => {
    const foreground = rgb(preferred);
    if (!foreground || !background) return preferred;
    return contrast(foreground, background) >= 4.5 ? preferred : bestBlackOrWhite(background);
  };
  function applySemanticTheme() {
    const root = document.documentElement, styles = getComputedStyle(root);
    const color = (name) => rgb(styles.getPropertyValue(name).trim());
    const ink = styles.getPropertyValue("--ink").trim();
    const muted = styles.getPropertyValue("--muted").trim();
    const accent = styles.getPropertyValue("--accent-text").trim();
    for (const surface of ["paper", "card", "soft"]) {
      const background = color("--" + surface);
      root.style.setProperty("--ink-on-" + surface, safeForeground(ink, background));
      root.style.setProperty("--muted-on-" + surface, safeForeground(muted, background));
      root.style.setProperty("--accent-on-" + surface, safeForeground(accent, background));
    }
    root.style.setProperty("--text-on-accent", safeForeground(styles.getPropertyValue("--on-accent").trim(), color("--green")));
    root.style.setProperty("--text-on-ink", safeForeground(styles.getPropertyValue("--paper").trim(), color("--ink")));
  }
  const applyTheme = window.applyTheme;
  if (typeof applyTheme === "function") window.applyTheme = (...args) => {
    const result = applyTheme(...args);
    applySemanticTheme();
    return result;
  };
  applySemanticTheme();
})();
