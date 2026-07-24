import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function getToken(): Promise<string> {
  const { data, error } = await supabase.rpc("internal_get_secret", {
    secret_name: "github_pat_studio_kb",
  });
  if (error || !data) throw new Error("vault: " + (error?.message ?? "secret not found"));
  return data as string;
}

async function gh(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch("https://api.github.com" + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "studio-kb-sync",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    const action = body.action;
    const token = await getToken();

    if (action === "whoami") {
      const me = await gh(token, "GET", "/user");
      const repos = await gh(token, "GET", "/user/repos?sort=created&per_page=20");
      const repoList = Array.isArray(repos.json)
        ? (repos.json as Array<Record<string, unknown>>).map((r) => ({
            full_name: r.full_name, private: r.private, created_at: r.created_at,
            default_branch: r.default_branch, permissions: r.permissions,
          }))
        : repos.json;
      return json({ user: (me.json as Record<string, unknown>)?.login ?? me.json, repos: repoList });
    }

    if (action === "put_files") {
      // { repo: "owner/name", branch?, files: [{path, content_b64, message?}] }
      const { repo, branch, files } = body;
      const results = [];
      for (const f of files) {
        const existing = await gh(token, "GET", `/repos/${repo}/contents/${f.path}` + (branch ? `?ref=${branch}` : ""));
        const sha = existing.status === 200 ? (existing.json as Record<string, unknown>).sha : undefined;
        const put = await gh(token, "PUT", `/repos/${repo}/contents/${f.path}`, {
          message: f.message ?? `chore: sync ${f.path}`,
          content: f.content_b64,
          ...(branch ? { branch } : {}),
          ...(sha ? { sha } : {}),
        });
        results.push({ path: f.path, status: put.status,
          error: put.status >= 300 ? (put.json as Record<string, unknown>)?.message : undefined });
      }
      return json({ results });
    }

    if (action === "get_repo") {
      const { repo } = body;
      const r = await gh(token, "GET", `/repos/${repo}`);
      return json({ status: r.status, repo: r.json });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
