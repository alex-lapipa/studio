import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const session = new Supabase.ai.Session("gte-small");

async function embed(text: string): Promise<number[]> {
  const out = await session.run(text, { mean_pool: true, normalize: true });
  return out as number[];
}

Deno.serve(async (req: Request) => {
  try {
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
      const query_embedding = await embed(query);
      const { data, error } = await supabase.rpc("search_knowledge", {
        query_text: query,
        query_embedding,
        match_count,
        filter_gear,
      });
      if (error) throw error;
      return json({ results: data });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
