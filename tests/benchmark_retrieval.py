"""Read-only Studio Brain retrieval benchmark.

Calls the existing Supabase `kb` Edge Function search action and evaluates expected
source-document recall. It never writes to Supabase.

Environment:
  SUPABASE_URL
  SUPABASE_ANON_KEY
Optional:
  STUDIO_BENCH_TOKEN   authenticated JWT if the deployment requires it
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

FIXTURE = Path(__file__).with_name("retrieval_regression.json")
DEFAULT_K = 8


def search(query: str, k: int = DEFAULT_K) -> tuple[list[dict], float]:
    base = os.environ["SUPABASE_URL"].rstrip("/")
    anon = os.environ["SUPABASE_ANON_KEY"]
    token = os.environ.get("STUDIO_BENCH_TOKEN", anon)
    body = json.dumps({"action": "search", "query": query, "match_count": k}).encode()
    req = urllib.request.Request(
        f"{base}/functions/v1/kb",
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "apikey": anon,
            "Authorization": f"Bearer {token}",
        },
    )
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.load(resp)
    latency_ms = (time.perf_counter() - t0) * 1000
    if isinstance(payload, dict):
        rows = payload.get("results", payload.get("data", payload))
    else:
        rows = payload
    if not isinstance(rows, list):
        raise RuntimeError(f"Unexpected search payload: {type(rows).__name__}")
    return rows, latency_ms


def title(row: dict) -> str:
    return str(row.get("document_title") or row.get("title") or "")


def main() -> int:
    cases = json.loads(FIXTURE.read_text())
    runnable = [c for c in cases if c.get("status") not in {"pending_source_ingest"}]
    outcomes = []
    for case in runnable:
        try:
            rows, latency = search(case["query"])
            titles = [title(r) for r in rows]
            expected = case.get("expected_sources", [])
            hits = [e for e in expected if e in titles]
            passed = bool(hits) if expected else True
            outcomes.append({
                "id": case["id"], "pass": passed, "latency_ms": round(latency, 1),
                "expected": expected, "hits": hits, "top_titles": titles,
            })
            print(("PASS" if passed else "FAIL"), case["id"], f"{latency:.1f}ms", hits)
        except (urllib.error.URLError, RuntimeError, KeyError) as exc:
            outcomes.append({"id": case["id"], "pass": False, "error": str(exc)})
            print("ERROR", case["id"], exc, file=sys.stderr)

    passed = sum(1 for o in outcomes if o.get("pass"))
    total = len(outcomes)
    latencies = [o["latency_ms"] for o in outcomes if "latency_ms" in o]
    report = {
        "metric": "expected-source recall@8 (at least one expected source)",
        "passed": passed,
        "total": total,
        "pass_rate": (passed / total if total else 0),
        "mean_latency_ms": (sum(latencies) / len(latencies) if latencies else None),
        "outcomes": outcomes,
    }
    out = Path("retrieval_benchmark_report.json")
    out.write_text(json.dumps(report, indent=2))
    print(json.dumps({k: v for k, v in report.items() if k != "outcomes"}, indent=2))
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
