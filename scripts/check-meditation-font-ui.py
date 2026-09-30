#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path


VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


class StrictFragment(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        assert self.stack and self.stack[-1] == tag, f"unexpected </{tag}>; open tags: {self.stack}"
        self.stack.pop()


for filename in ("index.html", "mobile/www/index.html"):
    source = Path(filename).read_text()
    start = source.index('<div class="meditation-font-bar"')
    end = source.index('<div class="meditation-toolbar"', start)
    fragment = source[start:end]
    parser = StrictFragment()
    parser.feed(fragment)
    assert not parser.stack, f"unclosed tags in {filename}: {parser.stack}"
    assert fragment.index('class="font-choice-row"') < fragment.index('class="focus-font-size-controls"')
    for control in ("focusReaderFont", "focusFontDecrease", "focusFontIncrease", "focusFontFile", "addFocusFont", "customFontChoice"):
        assert f'id="{control}"' in fragment, f"missing {control} in {filename}"
    assert '.font-preview-card[aria-pressed=\"true\"]' in source and '.font-choice-row' in source
    for font in ('system', 'serif', 'sans', 'custom'):
        assert f'data-focus-font=\"{font}\"' in fragment, f'missing {font} preview in {filename}'
    assert 'function syncMeditationFontChoices()' in source and 'saveReaderPref(\"font\",\"custom\")' in source
    handler = source.split('$(\"focusReaderFont\").onchange=', 1)[1].split('$(\"readerSize\").onchange=', 1)[0]
    assert 'db.customFontData={deleted:true' not in handler, f"choosing another font must preserve the uploaded font in {filename}"
    print(f"{filename}: meditation font UI OK")
