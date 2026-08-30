import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const session = new Supabase.ai.Session("gte-small");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function embed(text: string): Promise<number[]> {
  const out = await session.run(text, { mean_pool: true, normalize: true });
  return out as number[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  try {
    if (req.method !== "POST") return json({ error: "method not allowed" }, 405);
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    const { data: auth, error: authError } = await supabase.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "authenticated studio session required" }, 401);
    const body = await req.json();
    const action = body.action;

    if (action === "sign") {
      const { bucket, paths, expires_in = 3600 } = body;
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrls(paths, expires_in);
      if (error) throw error;
      return json({ urls: data });
    }

    if (action === "ingest_chunks") {
      const { document_id, chunks } = body;
      const rows = [];
      for (const c of chunks) {
        const embedding = await embed(c.content.slice(0, 4000));
        rows.push({
          document_id,
          chunk_index: c.chunk_index,
          content: c.content,
          section: c.section ?? null,
          page_start: c.page_start ?? null,
          page_end: c.page_end ?? null,
          embedding,
        });
      }
      const { error } = await supabase.from("chunks").upsert(rows, {
        onConflict: "document_id,chunk_index",
      });
      if (error) throw error;
      return json({ inserted: rows.length });
    }

    if (action === "search") {
      const { query, match_count = 8, filter_gear = null } = body;
      if (typeof query !== "string" || !query.trim()) return json({ error: "query required" }, 400);
      const query_embedding = await embed(query.slice(0, 4000));
      const safeMatchCount = Math.min(Math.max(Number(match_count) || 8, 1), 20);
      const { data, error } = await supabase.rpc("search_knowledge", {
        query_text: query,
        query_embedding,
        match_count: safeMatchCount,
        filter_gear,
      });
      if (error) throw error;
      return json({ results: data });
    }

    // --- added v4 (additive): repair vector coverage of over-long chunks ---
    // kb embeds content.slice(0,4000) but stores the full text, so anything past
    // 4000 chars is keyword-reachable but not vector-reachable. This creates
    // ADDITIONAL overflow rows carrying the tail. It never modifies or deletes an
    // existing row: overflow rows live at chunk_index + OVERFLOW_BASE.
    if (action === "fix_overflow") {
      const limit = body.limit ?? 4000;
      const window = body.window ?? 3800;
      const overlap = body.overlap ?? 200;
      const OVERFLOW_BASE = 100000;
      const dryRun = body.dry_run === true;
      const maxRows = Math.min(Math.max(Number(body.max_rows) || 4, 1), 10); // bound edge CPU work per call

      const { data: over, error: selErr } = await supabase
        .from("chunks")
        .select("id, document_id, chunk_index, content, section, page_start, page_end")
        .lt("chunk_index", OVERFLOW_BASE)
        .order("id");
      if (selErr) throw selErr;

      const targets = (over ?? []).filter((c) => (c.content as string).length > limit);
      const planned: Array<Record<string, unknown>> = [];
      for (const c of targets) {
        const text = c.content as string;
        let start = limit - overlap;
        let part = 0;
        while (start < text.length) {
          planned.push({
            source_chunk_id: c.id,
            document_id: c.document_id,
            chunk_index: OVERFLOW_BASE + (c.chunk_index as number) * 10 + part,
            content: text.slice(start, start + window),
            section: ((c.section as string | null) ?? "") + `[overflow ${part + 1} of source chunk ${c.chunk_index}]`,
            page_start: c.page_start,
            page_end: c.page_end,
          });
          start += window;
          part += 1;
        }
      }

      if (dryRun) {
        return json({
          targets: targets.length,
          planned_rows: planned.length,
          plan: planned.map((p) => ({
            source_chunk_id: p.source_chunk_id,
            new_chunk_index: p.chunk_index,
            chars: (p.content as string).length,
          })),
        });
      }

      // skip overflow rows that already exist (idempotent, resumable)
      const { data: existing } = await supabase
        .from("chunks")
        .select("document_id, chunk_index")
        .gte("chunk_index", OVERFLOW_BASE);
      const have = new Set((existing ?? []).map((e) => `${e.document_id}:${e.chunk_index}`));
      const todo = planned.filter((p) => !have.has(`${p.document_id}:${p.chunk_index}`));
      const batch = todo.slice(0, maxRows);

      const written = [];
      for (const p of batch) {
        const embedding = await embed((p.content as string).slice(0, limit));
        const { error } = await supabase.from("chunks").upsert([{
          document_id: p.document_id,
          chunk_index: p.chunk_index,
          content: p.content,
          section: p.section,
          page_start: p.page_start,
          page_end: p.page_end,
          embedding,
        }], { onConflict: "document_id,chunk_index" });
        if (error) throw error;
        written.push({ source_chunk_id: p.source_chunk_id, chunk_index: p.chunk_index, chars: (p.content as string).length });
      }
      return json({
        targets: targets.length,
        planned_rows: planned.length,
        already_present: planned.length - todo.length,
        written: written.length,
        remaining: todo.length - batch.length,
        rows: written,
      });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}
