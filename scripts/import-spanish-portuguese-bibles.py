#!/usr/bin/env python3
"""Import and validate the pinned public Spanish and Brazilian Portuguese Bible texts."""
import hashlib
import io
import json
import re
import shutil
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "e1b254cef86d0e65b1a5d1a94b8b112d0f296a2c"
BOOK_IDS = "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV".split()
SOURCE_BOOKS = "Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|I Samuel|II Samuel|I Kings|II Kings|I Chronicles|II Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|I Corinthians|II Corinthians|Galatians|Ephesians|Philippians|Colossians|I Thessalonians|II Thessalonians|I Timothy|II Timothy|Titus|Philemon|Hebrews|James|I Peter|II Peter|I John|II John|III John|Jude|Revelation of John".split("|")

EDITIONS = {
    "es": {
        "path": "sources/es/SpaRV/SpaRV.json", "locale": "es",
        "edition": "Reina-Valera 1909", "language": "es",
        "license": "Public Domain (as listed by CrossWire)",
        "licenseUrl": "https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=SpaRV",
        "officialDownload": "https://ebible.org/Scriptures/spaRV1909_usfm.zip",
        "sourceUrl": "https://ebible.org/bible/details.php?id=spaRV1909",
        "names": "Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Proverbios|Eclesiastés|Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis".split("|")
    },
    "pt-br": {
        "path": "sources/pt/PorBLivre/PorBLivre.json", "locale": "pt-BR",
        "edition": "Bíblia Livre 2018", "language": "pt",
        "license": "Creative Commons Attribution 4.0 Brazil (CC BY 4.0)",
        "licenseUrl": "https://ebible.org/porbr2018/copyright.htm",
        "officialDownload": "https://ebible.org/Scriptures/porbr2018_usfm.zip",
        "sourceUrl": "https://ebible.org/find/details.php?id=porbr2018",
        "names": "Gênesis|Êxodo|Levítico|Números|Deuteronômio|Josué|Juízes|Rute|1 Samuel|2 Samuel|1 Reis|2 Reis|1 Crônicas|2 Crônicas|Esdras|Neemias|Ester|Jó|Salmos|Provérbios|Eclesiastes|Cantares|Isaías|Jeremias|Lamentações|Ezequiel|Daniel|Oseias|Joel|Amós|Obadias|Jonas|Miqueias|Naum|Habacuque|Sofonias|Ageu|Zacarias|Malaquias|Mateus|Marcos|Lucas|João|Atos|Romanos|1 Coríntios|2 Coríntios|Gálatas|Efésios|Filipenses|Colossenses|1 Tessalonicenses|2 Tessalonicenses|1 Timóteo|2 Timóteo|Tito|Filemom|Hebreus|Tiago|1 Pedro|2 Pedro|1 João|2 João|3 João|Judas|Apocalipse".split("|")
    },
}


def fetch_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Selah Bible pack importer"})
    with urllib.request.urlopen(request, timeout=60) as response:
        raw = response.read()
    return raw, json.loads(raw)


def official_verse_texts(zip_url):
    request = urllib.request.Request(zip_url, headers={"User-Agent": "Mozilla/5.0 Selah Bible pack importer"})
    with urllib.request.urlopen(request, timeout=60) as response:
        archive = response.read()
    texts = {}
    with zipfile.ZipFile(io.BytesIO(archive)) as bundle:
        for filename in bundle.namelist():
            match = re.search(r"-(\w{3})[^/]*\.usfm$", filename, re.I)
            if not match:
                continue
            book_id = match.group(1).upper()
            source = bundle.read(filename).decode("utf-8-sig")
            chapters = re.split(r"\\c\s+(\d+)\b", source)
            for index in range(1, len(chapters), 2):
                chapter_no, content = int(chapters[index]), chapters[index + 1]
                verses = re.split(r"\\v\s+(\d+)\b", content)
                for pos in range(1, len(verses), 2):
                    verse_no, text = int(verses[pos]), verses[pos + 1]
                    text = re.sub(r"\\f\b.*?\\f\*|\\x\b.*?\\x\*", "", text, flags=re.S)
                    text = re.sub(r"\\w\s+(.*?)\|[^\\]*?\\w\*", r"\1", text, flags=re.S)
                    text = text.replace("\\add*", "").replace("\\add ", "")
                    text = re.sub(r"\\[A-Za-z0-9]+\*?", "", text)
                    text = re.sub(r"\s+", " ", text).strip()
                    texts[(book_id, chapter_no, verse_no)] = text
    return hashlib.sha256(archive).hexdigest(), texts


def build():
    for slug, edition in EDITIONS.items():
        url = f"https://raw.githubusercontent.com/scrollmapper/bible_databases/{COMMIT}/{edition['path']}"
        raw, source = fetch_json(url)
        official_sha256, official_texts = official_verse_texts(edition["officialDownload"])
        assert len(source["books"]) == len(BOOK_IDS) == len(edition["names"]) == len(SOURCE_BOOKS)
        assert [book["name"] for book in source["books"]] == SOURCE_BOOKS
        books, chapter_total, verse_total, missing_verses = [], 0, 0, 0
        out = ROOT / slug
        (out / "books").mkdir(parents=True, exist_ok=True)
        for index, source_book in enumerate(source["books"]):
            book_id = BOOK_IDS[index]
            chapters = []
            assert source_book["chapters"]
            for chapter_no, source_chapter in enumerate(source_book["chapters"], 1):
                assert source_chapter["chapter"] == chapter_no
                verses = source_chapter["verses"]
                assert [verse["verse"] for verse in verses] == list(range(1, len(verses) + 1))
                chapter = []
                for verse in verses:
                    text = verse["text"]
                    if not text.strip():
                        text = official_texts.get((book_id, chapter_no, verse["verse"]), "")
                    if not text.strip():
                        missing_verses += 1
                    assert isinstance(text, str)
                    chapter.append(text)
                chapters.append(chapter)
            verse_count = sum(map(len, chapters))
            chapter_total += len(chapters)
            verse_total += verse_count
            books.append({"id": book_id, "name": edition["names"][index], "chapters": len(chapters), "verses": verse_count})
            (out / "books" / f"{book_id}.json").write_text(json.dumps({"id": book_id, "chapters": chapters}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        assert chapter_total == 1189 and verse_total > 30000
        manifest = {"edition": edition["edition"], "language": edition["language"], "locale": edition["locale"], "license": edition["license"], "licenseUrl": edition["licenseUrl"], "sourceUrl": edition["sourceUrl"], "sourceCommit": COMMIT, "sourceSha256": hashlib.sha256(raw).hexdigest(), "officialUsfmSha256": official_sha256, "missingVerseTextCount": missing_verses, "totalChapters": chapter_total, "totalVerses": verse_total, "books": books}
        (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        shutil.copyfile(ROOT / "language-reader.js", out / "reader.js")
        print(f"{edition['edition']}: 66 books, {chapter_total} chapters, {verse_total} verse positions, {missing_verses} edition-omitted; sha256 {manifest['sourceSha256']}")


if __name__ == "__main__":
    build()
