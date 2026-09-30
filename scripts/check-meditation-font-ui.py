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
    assert fragment.index('class="focus-font-controls"') < fragment.index('class="focus-font-upload-details"')
    for control in ("focusReaderFont", "focusFontDecrease", "focusFontIncrease", "focusFontFile"):
        assert f'id="{control}"' in fragment, f"missing {control} in {filename}"
    assert '.meditation-font-bar{' in source and '.focus-font-upload-details .focus-font-upload{' in source
    print(f"{filename}: meditation font UI OK")
