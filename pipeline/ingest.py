import json, time, urllib.request, urllib.error, os

import os
ANON = os.environ.get('SUPABASE_ANON_KEY') or open('.anon').read().strip()
BASE = "https://klbzvbwudekstddlgnjy.supabase.co/functions/v1/kb"
chunks = json.load(open('chunks.json'))
state = json.load(open('state.json')) if os.path.exists('state.json') else {'done': 0}
start = time.time()

def send(c):
    payload = {"action":"ingest_chunks","document_id":c['document_id'],
      "chunks":[{k:c[k] for k in ('chunk_index','content','page_start','page_end')}]}
    req = urllib.request.Request(BASE, data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {ANON}", "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=90).read())

i = state['done']
errors = 0
while i < len(chunks) and time.time() - start < 32:
    try:
        send(chunks[i])
        i += 1; errors = 0
        state['done'] = i; json.dump(state, open('state.json','w'))
    except urllib.error.HTTPError as e:
        errors += 1
        if errors > 5: raise
        time.sleep(3 * errors)
print(f"done {state['done']}/{len(chunks)}")
