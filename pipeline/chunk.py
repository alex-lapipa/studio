import json, re, os

docmap = json.load(open('docmap.json'))
TARGET, MAXC, OVERLAP = 1400, 1900, 180
all_chunks = []

def clean(s):
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s.strip()

for base, doc_id in docmap.items():
    path = f'text/{base}.txt'
    if not os.path.exists(path): print('missing', path); continue
    pages = open(path).read().split('\f')
    if base == 'electribe2_2s_OM_EFGSCJ3':
        pages = pages[:29]  # English section only
    # build page-tagged stream
    stream = []  # (page_no, paragraph)
    for i, pg in enumerate(pages, start=1):
        pg = clean(pg)
        if len(pg) < 20: continue
        for para in re.split(r'\n\n+', pg):
            para = para.strip()
            if para: stream.append((i, para))
    chunks, cur, cur_pages = [], '', []
    for pno, para in stream:
        cand = (cur + '\n\n' + para).strip()
        if len(cand) > MAXC and cur:
            chunks.append((cur, cur_pages[0], cur_pages[-1]))
            tail = cur[-OVERLAP:]
            cur = tail + '\n\n' + para
            cur_pages = [cur_pages[-1], pno]
        else:
            cur = cand; cur_pages.append(pno)
        if len(cur) >= TARGET and cur.rstrip().endswith(('.', ':', '!', '?')):
            chunks.append((cur, cur_pages[0], cur_pages[-1]))
            cur, cur_pages = '', []
    if cur.strip(): chunks.append((cur, cur_pages[0] if cur_pages else 1, cur_pages[-1] if cur_pages else 1))
    for idx, (content, p0, p1) in enumerate(chunks):
        all_chunks.append({'document_id': doc_id, 'chunk_index': idx, 'content': content,
                           'page_start': p0, 'page_end': p1})
    print(base, len(chunks), 'chunks')

json.dump(all_chunks, open('chunks.json','w'))
print('TOTAL', len(all_chunks))
