#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

try:
    import fitz
except ImportError:
    fitz = None

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None


HEADING_PATTERNS = [
    re.compile(r"^(第[一二三四五六七八九十百零〇0-9]+[章节篇部]\s*[^。；，]{1,55})$"),
    re.compile(r"^((?:[1-9]\d*)(?:\.\d+){0,3}\s+[^。；，]{2,55})$"),
    re.compile(r"^(摘要|中文摘要|英文摘要|ABSTRACT|绪论|引言|前言|材料与方法|实验材料与方法|结果|讨论|结论|结论与展望|参考文献|附录|致谢)$", re.I),
]


class TextCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.lines = []
        self.buffer = []
        self.block_tags = {"li", "p", "h1", "h2", "h3", "h4", "h5", "div", "td"}

    def handle_starttag(self, tag, attrs):
        if tag.lower() in self.block_tags:
            self.flush()

    def handle_endtag(self, tag):
        if tag.lower() in self.block_tags:
            self.flush()

    def handle_data(self, data):
        value = re.sub(r"\s+", " ", data).strip()
        if value:
            self.buffer.append(value)

    def flush(self):
        if self.buffer:
            self.lines.append(" ".join(self.buffer))
            self.buffer = []


def clean_line(value):
    value = re.sub(r"\.{3,}\s*\d+\s*$", "", value)
    value = re.sub(r"\s+\d+\s*$", "", value)
    return re.sub(r"\s+", " ", value).strip(" .·\t")


def infer_level(title):
    if re.match(r"^第.+章", title):
        return 1
    if re.match(r"^第.+节", title):
        return 2
    number = re.match(r"^(\d+(?:\.\d+){0,3})", title)
    if number:
        return number.group(1).count(".") + 1
    return 1


def looks_like_heading(value):
    value = clean_line(value)
    if not value or len(value) > 70 or len(value) < 2:
        return None
    if "。" in value or re.search(r"[；;]", value):
        return None
    for pattern in HEADING_PATTERNS:
        match = pattern.match(value)
        if match:
            return clean_line(match.group(1))
    return None


def dedupe_headings(rows):
    seen = set()
    result = []
    for row in rows:
        key = re.sub(r"\s+", "", row["title"]).lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(row)
    return result


def pdf_headings(file_path, max_pages):
    if fitz is not None:
        document = fitz.open(file_path)
        bookmarks = document.get_toc(simple=True)
        if len(bookmarks) >= 3:
            chapters = [
                {"title": clean_line(title), "level": max(1, min(int(level), 4)), "page": int(page), "confidence": "high"}
                for level, title, page in bookmarks
                if clean_line(title)
            ]
            return dedupe_headings(chapters), "pdf_bookmarks_fitz", len(document)
        chapters = []
        for page_index in range(min(max_pages, len(document))):
            text = document[page_index].get_text("text")
            for line in text.splitlines():
                title = looks_like_heading(line)
                if title:
                    chapters.append({"title": title, "level": infer_level(title), "page": page_index + 1, "confidence": "medium"})
        return dedupe_headings(chapters), "pdf_front_matter_fitz", len(document)

    if PdfReader is not None:
        reader = PdfReader(str(file_path))
        chapters = []

        def walk_outline(items, level=1):
            for item in items or []:
                if isinstance(item, list):
                    walk_outline(item, min(level + 1, 4))
                    continue
                title = clean_line(getattr(item, "title", ""))
                if not title:
                    continue
                try:
                    page = reader.get_destination_page_number(item) + 1
                except Exception:
                    page = None
                chapters.append({"title": title, "level": level, "page": page, "confidence": "high"})

        try:
            walk_outline(reader.outline)
        except Exception:
            chapters = []
        if len(chapters) >= 3:
            return dedupe_headings(chapters), "pdf_bookmarks_pypdf", len(reader.pages)

        chapters = []
        for page_index, page in enumerate(reader.pages[:max_pages]):
            text = page.extract_text() or ""
            for line in text.splitlines():
                title = looks_like_heading(line)
                if title:
                    chapters.append({"title": title, "level": infer_level(title), "page": page_index + 1, "confidence": "medium"})
        return dedupe_headings(chapters), "pdf_front_matter_pypdf", len(reader.pages)

    raise RuntimeError("Neither PyMuPDF nor pypdf is installed")


def text_headings(file_path):
    text = file_path.read_text(encoding="utf-8", errors="ignore")
    chapters = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        title = looks_like_heading(line)
        if title:
            chapters.append({"title": title, "level": infer_level(title), "line": line_number, "confidence": "medium"})
    return dedupe_headings(chapters), "plain_text", None


def html_headings(file_path):
    parser = TextCollector()
    parser.feed(file_path.read_text(encoding="utf-8", errors="ignore"))
    parser.flush()
    chapters = []
    for line_number, line in enumerate(parser.lines, start=1):
        title = looks_like_heading(line)
        if title:
            chapters.append({"title": title, "level": infer_level(title), "line": line_number, "confidence": "medium"})
    return dedupe_headings(chapters), "saved_html", None


def normalize_title(value):
    return re.sub(r"[^0-9a-z\u4e00-\u9fff]", "", value.lower())


def similarity(left, right):
    a, b = set(normalize_title(left)), set(normalize_title(right))
    if not a or not b:
        return 0
    return len(a & b) / len(a | b)


def match_metadata(file_path, records):
    stem = file_path.stem
    best = None
    best_score = 0
    for record in records:
        score = similarity(stem, record.get("title", ""))
        if score > best_score:
            best, best_score = record, score
    return (best, best_score) if best_score >= 0.38 else (None, best_score)


def load_records(metadata_path):
    if not metadata_path.exists():
        return []
    payload = json.loads(metadata_path.read_text(encoding="utf-8"))
    return payload if isinstance(payload, list) else payload.get("records", payload.get("papers", []))


def main():
    parser = argparse.ArgumentParser(description="Extract zebrafish paper table-of-contents headings from local files")
    parser.add_argument("input", nargs="?", default="data/pdfs")
    parser.add_argument("--metadata", default="data/metadata.json")
    parser.add_argument("--out", default="data/toc.json")
    parser.add_argument("--max-pages", type=int, default=30)
    args = parser.parse_args()

    input_path = Path(args.input).resolve()
    metadata_path = Path(args.metadata).resolve()
    output_path = Path(args.out).resolve()
    records = load_records(metadata_path)
    files = [input_path] if input_path.is_file() else sorted(p for p in input_path.rglob("*") if p.is_file()) if input_path.exists() else []
    supported = {".pdf", ".txt", ".html", ".htm", ".caj"}
    results = {}
    report = {"files": 0, "matched": 0, "withToc": 0, "unsupportedCaj": 0, "errors": []}

    for file_path in files:
        if file_path.suffix.lower() not in supported:
            continue
        report["files"] += 1
        record, match_score = match_metadata(file_path, records)
        paper_id = record.get("id") if record else "file-" + hashlib.sha1(str(file_path).encode("utf-8")).hexdigest()[:16]
        title = record.get("title") if record else file_path.stem
        try:
            suffix = file_path.suffix.lower()
            if suffix == ".caj":
                report["unsupportedCaj"] += 1
                results[paper_id] = {"paperId": paper_id, "title": title, "sourceFile": file_path.name, "status": "needs_pdf_conversion", "chapters": [], "matchScore": round(match_score, 3)}
                continue
            if suffix == ".pdf":
                chapters, method, page_count = pdf_headings(file_path, args.max_pages)
            elif suffix in {".html", ".htm"}:
                chapters, method, page_count = html_headings(file_path)
            else:
                chapters, method, page_count = text_headings(file_path)
            if record:
                report["matched"] += 1
            if chapters:
                report["withToc"] += 1
            results[paper_id] = {
                "paperId": paper_id,
                "title": title,
                "sourceFile": file_path.name,
                "status": "complete" if chapters else "no_toc_detected",
                "method": method,
                "pageCount": page_count,
                "matchScore": round(match_score, 3),
                "chapters": chapters,
            }
        except Exception as error:
            report["errors"].append({"file": str(file_path), "error": str(error)})
            results[paper_id] = {"paperId": paper_id, "title": title, "sourceFile": file_path.name, "status": "error", "error": str(error), "chapters": []}

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps({"generatedAt": __import__("datetime").datetime.now().isoformat(), "records": results, "report": report}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(output_path), **report}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    sys.exit(main())
