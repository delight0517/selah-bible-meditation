#!/usr/bin/env python3
"""Check the bundled Chinese Matthew texts have matching, complete verse numbering."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
datasets = [json.loads((root / name).read_text(encoding="utf-8")) for name in ("matthew-cuv-simp.json", "matthew-cuv-trad.json")]
counts = []
for data in datasets:
    chapters = data["chapters"]
    assert len(chapters) == 28
    assert all(chapter["chapter"] == i and chapter["ref"].endswith(str(i)) for i, chapter in enumerate(chapters, 1))
    assert all([verse["verse"] for verse in chapter["verses"]] == list(range(1, len(chapter["verses"]) + 1)) for chapter in chapters)
    counts.append([len(chapter["verses"]) for chapter in chapters])
assert counts[0] == counts[1] and sum(counts[0]) == 1071
print("Chinese Matthew CUV files: 28 chapters and 1,071 aligned verses each")
