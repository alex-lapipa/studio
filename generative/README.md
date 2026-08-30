# Local generative engine

Mac-local bridge for cloud generative music providers. The real-time audio engine runs here, not in Vercel/Next.js.

Current provider: Google Lyria RealTime (`models/lyria-realtime-exp`).

## Evidence state
- **Observed:** local Python 3.13.5 environment; Google Gen AI SDK 2.20.0; sounddevice 0.5.6; Core Audio devices can be enumerated; Scarlett 2i2 USB accepts 48 kHz / 16-bit / stereo output settings; MRCC is visible over USB; an authenticated `v1alpha` Lyria RealTime SDK session connected successfully on 2026-08-30.
- **API documented:** Lyria RealTime uses a persistent bidirectional WebSocket. Current Google documentation is inconsistent: the high-level Python example uses `v1beta`, while the dedicated Live Music WebSocket reference identifies the `BidiGenerateMusic` endpoint as `v1alpha`. Output technical details also conflict with a JavaScript sample on sample rate. Full generation config must be resent on updates; BPM or scale changes require context reset.
- **Configured:** bounded local PCM buffering, explicit Core Audio output selection, transport controls, weighted prompts, documented generation parameters, status metrics, reconnect state restoration, and signal-aware shutdown.
- **Configured:** provider API version is `v1alpha`, because that exact SDK path was observed to connect while the same model through `v1beta` returned HTTP 404. No credential is stored in the repo.
- **Blocked:** end-to-end PCM playback verification still requires running the CLI from a process that inherits the user's authenticated Terminal environment.
- **Unknown:** downstream MRCC MIDI routes and physical audio/CV topology.

Google's current Lyria documentation contains two material inconsistencies. First, a high-level Python example selects `v1beta`, but the dedicated Live Music WebSocket API reference names the `v1alpha` `BidiGenerateMusic` endpoint; local testing reproduced HTTP 404 through `v1beta` and a successful connection through `v1alpha`, so this implementation uses `v1alpha`. Second, a JavaScript sample is configured for 44.1 kHz while technical details elsewhere specify 48 kHz. The audio implementation retains 48 kHz until end-to-end streamed PCM is measured and verified; the conflict is recorded rather than silently reconciled.

## Safety
No API credentials belong in this repository. Do not encode MRCC routes until they are physically observed and verified.

## Local commands
```bash
cd generative
uv sync --dev
uv run studio-generative devices
uv run studio-generative run --output "Scarlett 2i2 USB" --prompt "1:minimal techno"
```

Multiple initial weighted prompts are supported by repeating `--prompt WEIGHT:TEXT`. Generation starts stopped; use the interactive shell to `play`, `pause`, `stop`, `reset`, replace the weighted prompt, change configuration, inspect prompts, or print structured `status`.

Configuration fields supported by `set NAME VALUE`: `guidance`, `bpm`, `density`, `brightness`, `temperature`, `top_k`, `seed`, `scale`, `music_generation_mode`, `mute_bass`, `mute_drums`, `only_bass_and_drums`.

BPM and scale updates send the complete configuration first, then call `reset_context()` as required by Google's current RealTime documentation. Other configuration updates do not reset context.

## MiniLab 3 live control (PR #4)

The Lyria listener is **receive-only CoreMIDI** and is designed to coexist with the native Arturia/Analog Lab setup. It does not alter Arturia factory mappings, transmit MIDI, or involve MRCC. On the synchronized MiniLab capture, channel 1 emitted CC74, CC71, CC76, CC93, CC77, CC18, CC16, CC19, CC82, and CC83. The conservative Lyria map enables only four observed CCs:

| CC | Lyria parameter | Range |
| --- | --- | --- |
| 74 | `brightness` | 0.0..1.0 |
| 71 | `density` | 0.0..1.0 |
| 76 | `guidance` | 0.0..6.0 |
| 93 | `temperature` | 0.0..3.0 |

The exact physical knob identity for these CCs still needs in-session confirmation, so the remaining observed CCs stay ignored. CLI and MIDI configuration writes are serialized and start from the latest provider-acknowledged config, preventing one control path from overwriting newer values from the other.

Example using the previously observed MiniLab source UID:

```bash
uv run studio-generative run --output "Scarlett 2i2 USB" --prompt "1:minimal techno" --midi-source-uid -1941136562 --midi-channel 1
```

Re-enumerate CoreMIDI and update the UID if macOS changes it after reconnect/reboot. Generation remains stopped until `play`.
