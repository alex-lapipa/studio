# Central music service — 8 November 2026

## Delivered

Studio's Supabase project hosts `music-tidal`, an authenticated read-only API backed by one TIDAL OAuth grant in encrypted Vault storage. The current deployed function is version 3. Tokens refresh in the hosted service and no longer depend on the Mac. The old local token copy was removed after hosted verification; the existing Sonic Lawton CLI delegates to the hosted API.

| Client | Backend | Verified state |
|---|---|---|
| Studio | klbzvbwudekstddlgnjy | Live playlist read, credential refresh, reference reads |
| Lawton / Idiomas.io | rccobdhbcjkosszgqwou | Scoped credential installed in backend secrets; reference read passed |
| La Pipa AI | dzfkzvcaxxctqisbltzi | Scoped credential installed in backend secrets; reference read passed |
| La Pipa Web | umgpondoagshuagxurqe | Scoped credential installed in backend secrets; reference read passed |
| ReMOTIVE | jtwqkpmgtvtuuetptmto | Scoped credential installed in backend secrets; reference read passed |

Other backend secrets are `MUSIC_SERVICE_URL`, `MUSIC_SERVICE_PROJECT` and `MUSIC_SERVICE_KEY`. Keys differ by project and are not included here. Successful client tests exercised the central API using each scoped credential; they do not prove that existing website or agent code has started calling the service.

## Evidence

- Hosted LAWTON SCHOOL read returned 27 playlist entries over two pages, preserving duplicates. There were 23 distinct track IDs; duplicates were not removed.
- Forced hosted token refresh returned HTTP 200 and saved the new session to Vault.
- Requests without credentials returned HTTP 401.
- Studio credentials requesting Lawton were rejected with HTTP 403; Lawton credentials requesting Studio were also rejected.
- All five project credentials returned HTTP 200 for their own reference request.
- Deno type checking and all four regression tests passed, including refresh client ID, upstream URL restrictions, read-only action validation and pagination.
- Private token/session RPCs are executable by service_role only. Private tables deny direct access; public reference tables use owner read policies.
- Import-only environment secret was removed. Credentials were never included in code, reports or chat output.
- Security advisors reported no new service findings after hardening. An existing Auth warning remains: leaked-password protection is disabled. It was not changed as part of the music integration. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Studio plugin

ANTAINE·STUDIO was updated to version 0.77.2 with hosted-connection operating instructions. Its existing identity, app bindings, prompts, knowledge files and sharing were preserved. The saved source was read back successfully. This updates its instructions; it does not register a new native TIDAL tool or establish a new ChatGPT tunnel connection. Operator calls use the plugin's existing Remote Desktop Commander capability and the tested hosted client script.

## Remaining scope

- Account-wide playlist discovery remains incomplete. Known playlist reads work; do not claim full-library access.
- Website UI and existing agent/orchestrator call sites have not been modified. They can now use their own backend credential; no TIDAL token needs to be copied to them.
- Native ChatGPT tunnel registration remains pending because browser policy blocks the settings page. It is optional for the hosted API.
- The local tunnel still requires the Mac; the hosted API does not. Mac automatic startup remains disabled after the earlier unverified LaunchAgent test.
- No audio streaming/downloads, playlist editing, lyrics ingestion, catalogue embeddings or permanent track caches were added.
- Existing websites, Vercel deployments, Studio RAG, YouTube and hardware routing were not changed.

Source and operation details are in README.md. The archive contains no credentials or private runtime configuration.
