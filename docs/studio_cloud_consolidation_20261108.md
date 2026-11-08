# Studio cloud consolidation — 8 November 2026

Canonical repository: alex-lapipa/studio. Primary Supabase project: klbzvbwudekstddlgnjy. Vercel dashboard: studio, www.zetazeta.xyz.

The TIDAL session, project registry, scoped clients and reference notes are hosted in Studio Supabase. The authenticated Music panel calls music-hub using the existing Studio user session. The hub verifies the owner before routing reads to music-tidal. No service credentials enter the browser.

The Bubbles YouTube adapter currently runs alongside the existing Google client secret in the Lawton integration host. Its grant is separately encrypted and channel-locked. Studio exposes authenticated status through music-hub; provider write operations remain in the reviewed operator workflow. This credential boundary avoids exporting Google client secrets and does not change the Lawton grant. Full physical migration of that adapter requires secure Google client provisioning in Studio and separate validation.

## Hardware scope
Alex confirmed the MRCC and USB connection are intentionally off during this cloud setup and the existing studio configuration works. No MIDI/audio presets, drivers, cabling, clock settings or DAW templates are changed by this release. The saved routing documentation remains relevant; a powered-off inventory is not a malfunction report. Real-time audio, Lyria and MIDI execution remain local.

## Knowledge continuity
Preserve the existing 25 documents, 836 embedded chunks and 20 document-to-gear graph edges. The deployed knowledge function uses gte-small with vector(384); this release does not change embedding models or re-embed the corpus.

## Release checks
Run the existing Python tests, the music function type checks and tests, npm audit, dashboard type checking and production build. Merge the reviewed PR only after its current commit checks pass, then verify Vercel production and authenticated API rejection behavior. Native Google channel consent and approval of actual video matches remain separate gates; no background publication is enabled.
