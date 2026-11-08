# Central music service

One private, read-only TIDAL OAuth grant, hosted in Studio's Supabase project. Studio is the first verified client. Other authorised project backends use separate revocable credentials and the same service.

## API contract

`POST https://klbzvbwudekstddlgnjy.supabase.co/functions/v1/music-tidal`

Server callers send `x-music-key` with their own project credential. A signed-in Studio owner can instead send their Supabase user JWT in `Authorization: Bearer ...`. Service keys and TIDAL tokens must never enter frontend bundles, chat, source control or logs. Direct browser-origin requests to music-tidal are intentionally rejected. The authenticated Studio Music panel uses the owner-only music-hub gateway, which validates the Studio session before forwarding reads.

Request examples (credentials omitted):

```json
{"project":"studio","action":"status"}
{"project":"studio","action":"references"}
{"project":"studio","action":"playlists"}
{"project":"studio","action":"playlist","playlist":"d55ca97c-cd9d-4aad-aef0-ab44a498f4fe"}
```

Follow `nextCursor` by sending it back as `cursor` on the same playlist request. Responses contain at most 20 track details per call. Preserve duplicate playlist entries; a playlist may contain the same recording more than once. `playlists` is explicitly incomplete pending account discovery investigation. The CLI aggregates up to five pages.

Local operator client:

```bash
node music-client.mjs status
node music-client.mjs references
node music-client.mjs playlist d55ca97c-cd9d-4aad-aef0-ab44a498f4fe
node music-client.mjs status --project lawton
```

The CLI reads owner-only credentials from `~/.config/central-music/<project>.json`. It never prints them. Existing Sonic Lawton CLI/MCP calls delegate to this hosted service. Hosting and OAuth refresh no longer depend on the Mac; the optional local ChatGPT tunnel still does.

## Security and storage

- The OAuth session is encrypted in Supabase Vault, accessed through service-role-only RPCs.
- Project client credentials are hashed with SHA-256; random credentials have 256 bits of entropy. Each hash is bound to exactly one project and can be revoked independently.
- Project notes and identifiers have owner-only read policies. Token state and client hashes are in an unexposed private schema.
- A database lease serializes credential use and refresh. Calls are paced; upstream 429s return bounded Retry-After guidance. Clients are limited to 30 requests per minute.
- Only official TIDAL HTTPS API URLs and token endpoints are permitted. No audio, downloads, playlist writes or arbitrary upstream URLs.
- Playlist/track responses are ephemeral, with `Cache-Control: no-store`. No catalogue database, embeddings or lyrics are created. Knowledge hubs store user annotations and provider references only.
- The import-only bootstrap secret is removed after the encrypted session is initialized.
- The function validates user sessions or scoped client credentials itself, so its platform `verify_jwt` setting is false. This is not anonymous access.

## Verification and release

Run `deno check --config supabase/functions/music-tidal/deno.json supabase/functions/music-tidal/index.ts` and `deno test --config supabase/functions/music-tidal/deno.json supabase/functions/music-tidal/core_test.ts`.

Deploy only this function with an explicit project reference; do not prune other functions. No Docker is required. Include `deno.json` as the import-map path during management-API updates.

This source does not contain the OAuth session, project client hashes, local credential files or environment secrets. The SQL records the initial structure; verified project owners, references and credentials are seeded separately. Other project clients are enabled only after their credentials are installed. Existing Studio RAG, websites, hardware integrations and YouTube configuration are independent.

## Revocation and rollback

Disable one client in `music_private.clients` to revoke that backend. Disable a project in `music_projects` to block all its clients. Remove or roll back only `music-tidal` to stop the new service; leave existing functions intact. Revoke the TIDAL developer grant through TIDAL to disconnect the account globally. Do not restore obsolete local refresh tokens after the hosted service has rotated them; reauthorise if reverting to local hosting.


For Bubbles YouTube authorisation and review-first playlist mirroring, read YOUTUBE_SYNC.md. The TIDAL and YouTube functions deploy to different existing projects; specify the project explicitly.

## Studio dashboard gateway

The Music tab uses `music-hub` with the existing Studio user session. Deploy that function to Studio with JWT verification enabled and configure its owner ID and scoped YouTube operator credential server-side. The gateway exposes TIDAL reads and YouTube connection status only; publication remains in the reviewed operator workflow. See `../../docs/studio_cloud_consolidation_20261108.md` for deployment boundaries.
