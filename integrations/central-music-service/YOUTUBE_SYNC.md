# BUBBLEZ → Bubbles Sheep YouTube

TIDAL stays read-only. Source playlist `cd605171-0e84-423c-ab7e-59aaa6568191` maps only to channel `UCLVXedWkGtD3C5VZQyQWTdg`. Bubbles has a separate credential for the central Studio music API.

The YouTube function `music-youtube-sync` runs in the existing Lawton Google integration project `rccobdhbcjkosszgqwou` so its OAuth client secret stays in its existing server-side environment. Bubbles' OAuth grant is separate, channel-checked and encrypted in that project's Vault. Existing Lawton grants and channel locks are not modified. This is a shared integration host, not a transfer of Bubbles content to the Lawton YouTube channel.

## Operator workflow

1. Run `node youtube-client.mjs status`. It must show the intended channel and client configuration.
2. Run `node youtube-client.mjs auth`. A listener binds only to `127.0.0.1:8768/callback`; Google consent opens in the browser. The owner must select **Bubbles Sheep** and approve YouTube management access. The callback verifies expiring, one-use PKCE state. Neither client secrets nor OAuth tokens are returned to the operator.
3. Run `node youtube-preview.mjs`. It reads the complete TIDAL playlist, finds YouTube candidates, penalises alternate/live/cover versions, preserves source order and duplicate entries, and prints a review preview. It does not persist a catalogue or publish videos.
4. Review all matches. Missing or ambiguous tracks must be resolved explicitly. Prepare an identifier-only JSON file with `entries`: each item contains zero-based `position`, TIDAL `trackId`, and reviewed YouTube `videoId`.
5. Run `node youtube-client.mjs plan <reviewed-entries.json>` to save an immutable hashed plan. Confirm the exact playlist entries, destination channel, unlisted visibility and additions-only mode with the user.
6. Only after the user approves that concrete plan, run `node youtube-client.mjs approve <plan-hash> --confirm-reviewed`.
7. Run `node youtube-client.mjs apply <plan-hash>` to add at most five entries. Repeat until remaining is zero. Each run verifies destination ownership and reconciles the existing prefix; it stops on manual changes. It never deletes videos, downloads TIDAL audio or uploads recordings.

No timer or background job is enabled. Scheduling, public visibility, deletions, reorder operations and additional channels require separate configuration. Google API quota applies to searches and writes. Source metadata and matching responses are ephemeral; stored plans contain identifiers and approval state only.

The API requires the separate owner-only `x-music-operator` credential; the ordinary TIDAL read key cannot approve or publish a YouTube plan. Operator configuration is outside the repository at `~/.config/central-music/youtube-sync.json`, mode 0600. Do not print or commit it.

## Rollback

Disable the operator credential or remove only the new function to stop sync. Revoke only the Bubbles grant when disconnecting it; do not revoke or replace the existing Lawton grant. Disable the Bubbles row in central `music_private.clients` to stop its TIDAL client. Preserve existing sites, Shopify catalogue, fulfilment and YouTube content.
