#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
import re


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
    for control in ("focusReaderFont", "focusFontDecrease", "focusFontIncrease", "focusFontFile", "focusFontRemove", "fontChoiceRow"):
        assert f'id="{control}"' in fragment, f"missing {control} in {filename}"
    assert '.font-preview-card[aria-pressed=\"true\"]' in source and '.font-choice-row' in source
    assert 'id="addFocusFont"' in source and 'function syncMeditationFontChoices()' in source
    assert '#readerFont,label[for="readerFont"],.font-choice-row{display:none!important}' not in source, f"reader font controls must remain visible in {filename}"
    assert 'body :not(#chatGptPrompt):not(.verse):not(.verse *):not(.font-preview-sample){font-family:var(--ui-font)!important;font-weight:400!important}' in source, f"global UI font must not override reader text or font previews in {filename}"
    assert '$("readerFont").onchange=()=>saveReaderPref("font",$("readerFont").value)' in source
    assert 'data-reader-theme-toggle' in source and 'addEventListener("click",toggleReaderTheme)' in source
    assert 'data-reader-fullscreen-toggle' in source and 'document.addEventListener("fullscreenchange",updateReaderFullscreenToggles)' in source
    assert '.meditation .focus-font-controls .font-preview-sample{color:var(--ink)}' in source
    assert '.meditation .meditation-chapter-nav{position:fixed;' in source
    assert 'saveReaderPref("font","custom")' in source
    for language in ("ko", "en", "ja", "zh-CN", "zh-TW"):
        match = re.search(rf'(?<![\w-]){re.escape(language)}:\{{sample:.*?fonts:\[(.*?)\]\}}', source, re.S)
        if language.startswith("zh-"):
            match = re.search(rf'"{re.escape(language)}":\{{sample:.*?fonts:\[(.*?)\]\}}', source, re.S)
        assert match, f"missing {language} font catalog in {filename}"
        assert len(re.findall(r'\{id:', match.group(1))) >= 5, f"expected more {language} font choices in {filename}"
    assert 'activeReaderFontLanguage()===language' in source and 'fontsByLanguage' in source
    handler = source.split('$(\"focusReaderFont\").onchange=', 1)[1].split('$(\"readerSize\").onchange=', 1)[0]
    assert 'db.customFontData={deleted:true' not in handler, f"choosing another font must preserve the uploaded font in {filename}"
    print(f"{filename}: meditation font UI OK")
