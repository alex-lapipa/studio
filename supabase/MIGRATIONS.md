# Applied migrations — source of truth

Verified against `list_migrations` on `klbzvbwudekstddlgnjy`, 2026-07-25.

| Applied version | Name | Repo file |
|---|---|---|
| `20260724165503` | `studio_kb_schema` | `supabase/migrations/20260724190000_studio_kb_schema.sql` |
| `20260724205301` | `vault_secret_accessor_for_edge` | `supabase/migrations/20260724210000_vault_secret_accessor.sql` |
| `20260725...`    | `documents_checksum_and_fk_index` | `supabase/migrations/20260725_documents_checksum_and_fk_index.sql` |

**Known discrepancy (documented, not repaired):** the two original repo filenames carry timestamps
(`...190000`, `...210000`) that do NOT match the versions actually applied to the database
(`...165503`, `...205301`). Filenames were never renamed because renaming is a destructive git
operation and this repo is additive-only. Treat the table above as authoritative, not the filenames.
