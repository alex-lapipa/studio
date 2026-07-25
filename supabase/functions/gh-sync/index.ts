import { createClient } from "jsr:@supabase/supabase-js@2";
import { createSign, createPrivateKey } from "node:crypto";

const APP_ID = "4388277";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

let cachedToken: { token: string; exp: number; mode: string } | null = null;

async function vaultSecret(name: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("internal_get_secret", { secret_name: name });
  if (error || !data) return null;
  return data as string;
}

function normalizePem(raw: string): string {
  let p = raw.trim();
  // repair flattened newlines from copy-paste into vault UI
  if (!p.includes("\n")) {
    p = p.replace(/-----BEGIN ([A-Z ]+)-----/, "-----BEGIN $1-----\n")
         .replace(/-----END ([A-Z ]+)-----/, "\n-----END $1-----")
         .replace(/(-----\n)([^\n]+)(\n-----)/, (_m, a, body, c) => a + body.replace(/ /g, "\n") + c);
  }
  return p;
}

function b64url(input: string | Uint8Array): string {
  const b = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let s = "";
  for (const c of b) s += String.fromCharCode(c);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function appJwt(pem: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: APP_ID }));
  const data = `${header}.${payload}`;
  const key = createPrivateKey(pem);
  const sig = createSign("RSA-SHA256").update(data).end().sign(key);
  return `${data}.${b64url(new Uint8Array(sig))}`;
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

async function appFlow(diag?: Record<string, unknown>): Promise<{ token: string; exp: number; mode: string } | null> {
  const raw = await vaultSecret("github_app_studio_key");
  if (diag) diag.pem_found = !!raw;
  if (!raw) return null;
  const pem = normalizePem(raw);
  if (diag) { diag.pem_header = pem.split("\n")[0]; diag.pem_lines = pem.split("\n").length; }
  try {
    const jwt = appJwt(pem);
    if (diag) diag.jwt = "signed ok";
    const insts = await gh(jwt, "GET", "/app/installations");
    if (diag) diag.installations_status = insts.status;
    if (insts.status !== 200 || !Array.isArray(insts.json) || insts.json.length === 0) {
      if (diag) diag.installations_body = JSON.stringify(insts.json).slice(0, 300);
      return null;
    }
    if (diag) diag.installations = (insts.json as Array<Record<string, unknown>>).map((i) => ({ id: i.id, account: (i.account as Record<string, unknown>)?.login }));
    const instId = (insts.json[0] as Record<string, unknown>).id;
    const tok = await gh(jwt, "POST", `/app/installations/${instId}/access_tokens`);
    if (diag) diag.token_status = tok.status;
    if (tok.status !== 201) { if (diag) diag.token_body = JSON.stringify(tok.json).slice(0, 300); return null; }
    const t = tok.json as Record<string, unknown>;
    return { token: t.token as string, exp: new Date(t.expires_at as string).getTime() / 1000, mode: "github_app" };
  } catch (e) {
    if (diag) diag.app_error = String((e as Error)?.message ?? e);
    return null;
  }
}

async function getToken(diag?: Record<string, unknown>): Promise<{ token: string; mode: string }> {
  const now = Date.now() / 1000;
  if (!diag && cachedToken && cachedToken.exp > now + 120) return cachedToken;
  const app = await appFlow(diag);
  if (app) { cachedToken = app; return app; }
  const pat = await vaultSecret("github_pat_studio_kb");
  if (!pat) throw new Error("no GitHub credential available in Vault");
  cachedToken = { token: pat, exp: now + 300, mode: "pat_fallback" };
  return cachedToken;
}

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json();
    const action = body.action;

    if (action === "auth_status") {
      const diag: Record<string, unknown> = {};
      const { mode } = await getToken(diag);
      return json({ auth_mode: mode, diag });
    }

    const { token, mode } = await getToken();

    if (action === "whoami") {
      const me = await gh(token, "GET", mode === "github_app" ? "/installation/repositories?per_page=100" : "/user/repos?sort=created&per_page=20");
      return json({ auth_mode: mode, result: me.json });
    }

    if (action === "put_files") {
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
      return json({ auth_mode: mode, results });
    }

    if (action === "get_repo") {
      const r = await gh(token, "GET", `/repos/${body.repo}`);
      return json({ auth_mode: mode, status: r.status, repo: r.json });
    }

    // --- read actions (added v5, additive; no existing behaviour changed) ---

    if (action === "list_tree") {
      const { repo, ref } = body;
      const branch = ref ?? "HEAD";
      const t = await gh(token, "GET", `/repos/${repo}/git/trees/${branch}?recursive=1`);
      if (t.status !== 200) return json({ auth_mode: mode, status: t.status, error: t.json }, 200);
      const tree = (t.json as Record<string, unknown>).tree as Array<Record<string, unknown>>;
      return json({
        auth_mode: mode,
        status: t.status,
        truncated: (t.json as Record<string, unknown>).truncated ?? false,
        count: tree.length,
        tree: tree.map((n) => ({ path: n.path, type: n.type, size: n.size, sha: n.sha })),
      });
    }

    if (action === "get_files") {
      const { repo, ref, paths } = body;
      const results = [];
      for (const p of paths as string[]) {
        const r = await gh(token, "GET", `/repos/${repo}/contents/${p}` + (ref ? `?ref=${ref}` : ""));
        if (r.status !== 200) { results.push({ path: p, status: r.status, error: (r.json as Record<string, unknown>)?.message }); continue; }
        const j = r.json as Record<string, unknown>;
        let content: string | null = null;
        if (typeof j.content === "string" && j.encoding === "base64") {
          try { content = new TextDecoder().decode(Uint8Array.from(atob((j.content as string).replace(/\n/g, "")), (c) => c.charCodeAt(0))); }
          catch { content = null; }
        }
        results.push({ path: p, status: r.status, sha: j.sha, size: j.size, content });
      }
      return json({ auth_mode: mode, results });
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
