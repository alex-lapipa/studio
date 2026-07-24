import json, urllib.request, os, sys

import os
ANON = os.environ.get('SUPABASE_ANON_KEY') or open('.anon').read().strip()
BASE = "https://klbzvbwudekstddlgnjy.supabase.co/functions/v1/kb"

def call(payload):
    req = urllib.request.Request(BASE, data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {ANON}", "Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=60).read())

bucket = sys.argv[1]
files = sys.argv[2:]
resp = call({"action":"sign","bucket":bucket,"paths":files,"expires_in":7200})
for u in resp["urls"]:
    if u.get("error"): print("SIGN ERR", u["path"], u["error"]); continue
    dest = "pdfs/" + u["path"]
    if os.path.exists(dest) and os.path.getsize(dest) > 0: print("skip", dest); continue
    urllib.request.urlretrieve(u["signedUrl"], dest)
    print("ok", dest, os.path.getsize(dest))
