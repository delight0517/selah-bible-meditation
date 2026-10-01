#!/usr/bin/env python3
"""Split the checked Ang Biblia source JSON into on-demand book payloads."""

import json
import sys
from pathlib import Path

source = Path(sys.argv[1])
target = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent
bible = json.loads(source.read_text(encoding="utf-8"))
assert bible["language"] == "tl" and bible["license"] == "Public Domain"
assert len(bible["books"]) == 66
assert sum(len(book["chapters"]) for book in bible["books"]) == 1189
assert sum(len(chapter) for book in bible["books"] for chapter in book["chapters"]) == 31102
assert all(
    len(book["id"]) == 3 and book["id"].isalnum() and book["id"].isupper()
    and book["chapters"]
    and all(chapter and all(isinstance(verse, str) and verse.strip() for verse in chapter) for chapter in book["chapters"])
    for book in bible["books"]
)

books_dir = target / "books"
books_dir.mkdir(parents=True, exist_ok=True)
books = []
for book in bible["books"]:
    verses = sum(map(len, book["chapters"]))
    books.append({"id": book["id"], "chapters": len(book["chapters"]), "verses": verses})
    (books_dir / f"{book['id']}.json").write_text(
        json.dumps(book, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

manifest = {key: bible[key] for key in ("edition", "language", "license", "source")}
manifest.update({"totalChapters": 1189, "totalVerses": 31102, "books": books})
(target / "manifest.json").write_text(
    json.dumps(manifest, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
)
