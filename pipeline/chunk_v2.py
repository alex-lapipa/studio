"""Bounded, page-aware chunker for Studio KB v2.

Unlike the legacy chunker, this guarantees that no emitted chunk exceeds MAXC,
even when PDF extraction yields a single extremely long paragraph.
"""
import json
import os
import re

TARGET = 1400
MAXC = 1900
OVERLAP = 180


def clean(s: str) -> str:
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def split_long_unit(text: str, max_chars: int = MAXC, overlap: int = OVERLAP):
    """Split an oversized paragraph near sentence/word boundaries, hard bounded."""
    text = text.strip()
    if len(text) <= max_chars:
        return [text]
    out = []
    start = 0
    while start < len(text):
        hard_end = min(start + max_chars, len(text))
        end = hard_end
        if hard_end < len(text):
            window = text[start:hard_end]
            # Prefer sentence, then whitespace; never choose a pathologically short piece.
            floor = int(max_chars * 0.60)
            sentence = max(window.rfind(". ", floor), window.rfind("? ", floor), window.rfind("! ", floor))
            if sentence >= floor:
                end = start + sentence + 1
            else:
                space = window.rfind(" ", floor)
                if space >= floor:
                    end = start + space
        piece = text[start:end].strip()
        if not piece:
            raise ValueError("chunker produced an empty split")
        if len(piece) > max_chars:
            raise ValueError(f"oversized split: {len(piece)} > {max_chars}")
        out.append(piece)
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return out


def chunk_pages(pages):
    stream = []
    for page_no, page in enumerate(pages, start=1):
        page = clean(page)
        if len(page) < 20:
            continue
        for paragraph in re.split(r"\n\n+", page):
            paragraph = paragraph.strip()
            if not paragraph:
                continue
            for unit in split_long_unit(paragraph):
                stream.append((page_no, unit))

    chunks = []
    cur = ""
    cur_pages = []
    for page_no, unit in stream:
        candidate = (cur + "\n\n" + unit).strip()
        if len(candidate) > MAXC and cur:
            chunks.append((cur, cur_pages[0], cur_pages[-1]))
            tail = cur[-OVERLAP:].strip()
            cur = (tail + "\n\n" + unit).strip() if tail else unit
            cur_pages = [cur_pages[-1], page_no]
            # Tail + unit can exceed MAXC. Flush bounded pieces immediately.
            if len(cur) > MAXC:
                bounded = split_long_unit(cur)
                for piece in bounded[:-1]:
                    chunks.append((piece, cur_pages[0], cur_pages[-1]))
                cur = bounded[-1]
        else:
            cur = candidate
            cur_pages.append(page_no)

        if len(cur) >= TARGET and cur.rstrip().endswith((".", ":", "!", "?")):
            chunks.append((cur, cur_pages[0], cur_pages[-1]))
            cur, cur_pages = "", []

    if cur.strip():
        chunks.append((cur, cur_pages[0] if cur_pages else 1, cur_pages[-1] if cur_pages else 1))

    for content, _, _ in chunks:
        if not content.strip() or len(content) > MAXC:
            raise ValueError(f"invalid emitted chunk length={len(content)}")
    return chunks


def main():
    docmap = json.load(open("docmap.json"))
    all_chunks = []
    for base, doc_id in docmap.items():
        path = f"text/{base}.txt"
        if not os.path.exists(path):
            print("missing", path)
            continue
        pages = open(path).read().split("\f")
        if base == "electribe2_2s_OM_EFGSCJ3":
            pages = pages[:29]
        chunks = chunk_pages(pages)
        for idx, (content, p0, p1) in enumerate(chunks):
            all_chunks.append({
                "document_id": doc_id,
                "chunk_index": idx,
                "content": content,
                "page_start": p0,
                "page_end": p1,
            })
        print(base, len(chunks), "chunks", "max", max((len(c[0]) for c in chunks), default=0))

    bad = [c for c in all_chunks if len(c["content"]) > MAXC]
    if bad:
        raise SystemExit(f"FAIL: {len(bad)} chunks exceed MAXC={MAXC}")
    json.dump(all_chunks, open("chunks.json", "w"))
    print("TOTAL", len(all_chunks), "validated_max", MAXC)


if __name__ == "__main__":
    main()
