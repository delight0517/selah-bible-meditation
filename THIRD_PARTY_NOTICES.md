# License scope and third-party notices

The root [MIT license](LICENSE) applies to original Selah application source code and original project documentation. It does not replace licenses or rights in Scripture texts, translation datasets, external images/icons/fonts, dependency code, or third-party material embedded in source files. Those materials retain their own terms. The MIT grant does not grant trademark rights in Selah or third-party names/logos.

## Bundled Scripture texts

| Material | Notice and source |
| --- | --- |
| `matthew-krv.json` | The file identifies the Korean Revised Version (1961), 대한성서공회, and its source at [crizin/bible-db](https://github.com/crizin/bible-db/blob/main/data/krv/krv_holybible.jsonl). The [official Korean Bible Society FAQ](https://www.bskorea.or.kr/bbs/board.php?bo_table=copyright_faq&wr_id=5), checked 2026-10-03, states the economic protection period expired and use without royalties is possible. It requires attribution and integrity of the text, form and title. Preserve the edition and 대한성서공회 attribution and do not rewrite verses. The FAQ does not expressly describe worldwide territorial coverage; the root MIT license does not apply to this text. |
| `matthew-web.json` | World English Bible; eBible describes its text as public domain, while the name World English Bible is a trademark. See [eBible copyright notice](https://ebible.org/eng-web/copyright.htm). |
| `matthew-jpn1965.json` | New Japanese NT (1965); eBible labels this edition public domain. See [edition details](https://ebible.org/Scriptures/details.php?id=jpn1965). No MIT relicensing is claimed. |
| `matthew-cuv-simp.json`, `matthew-cuv-trad.json`, Chinese reader data | 1919 Chinese Union Version; see the existing Chinese section of [README](README.md). The project identifies the historical edition as public domain, with jurisdiction caveats; this notice does not grant rights in later revisions. |
| `pt-br/` Bible data | Bíblia Livre 2018; preserve [the attribution and source record](pt-br/ATTRIBUTION.md) and the edition's [copyright notice](https://ebible.org/porbr2018/copyright.htm). These texts remain under their stated CC BY terms. |
| `es/` Bible data | Reina-Valera 1909; preserve [the attribution and source record](es/ATTRIBUTION.md). |
| `fil/` Bible data | Ang Biblia (1905); preserve [the attribution and source record](fil/ATTRIBUTION.md). |

Mirrored copies in mobile web bundles retain the same terms. Downloadable translations listed in `bible-translations.json` each have their own `licenseUrl`; this repository's MIT license does not apply to those translations. Read the edition's terms before redistribution. Embedded verses and quotations retain their original text rights even where their surrounding code is MIT licensed.

## Icons, images, fonts, and dependencies

- `assets/settings-icon.png` and `assets/cloud-icon.png` are Google Material Icons under Apache 2.0. Preserve [the notice](assets/MATERIAL-ICONS-NOTICE.txt) and [the complete license](assets/MATERIAL-ICONS-LICENSE.txt).
- Other images, illustrations, logos, preview images, and fonts are outside the source-code MIT grant unless a separate notice explicitly grants reuse rights. Reference this distinction when copying the code with its visual assets.
- Capacitor and other dependency packages retain their upstream license files and notices. The mobile package manager must preserve those when building a distribution; they are not relicensed by Selah.

The Windows launcher ZIP contains application launcher code and documentation only. It links to the hosted app and does not bundle Scripture datasets or third-party image/font assets.
