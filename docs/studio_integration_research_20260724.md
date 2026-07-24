# Hardware Studio Integration Knowledge Base (Web Research, 2026-07-24)
**Studio: Moog DFAM / Mother-32 / Subharmonicon / Subsequent 37 / Theremini · Korg Electribe 2 & 2 Sampler · MAM MB33 · MFB Tanzbär · Arturia MiniLab 3 · Conductive Labs MRCC · Allen & Heath Xone:92**

## 1. Clock and Sync Architecture (master clock, MIDI clock → analog clock)

**Recommended topology.** The Conductive Labs MRCC is a router, not a clock generator — it distributes and converts clock but something must originate it. In this studio the best master clock is the **Korg Electribe 2** (or Electribe 2 Sampler): it has a solid internal clock, transport buttons under your hands, and MIDI DIN out into the MRCC. The chain is: Electribe 2 MIDI OUT → MRCC MIDI in → MRCC routes MIDI clock to Tanzbär, Subsequent 37, Subharmonicon and Mother-32 (all take MIDI clock over DIN), while the MRCC's **3.5 mm analog Clock Out** or the Mother-32's ASSIGN output feeds the Moog DFAM. The MFB Tanzbär can also act as master (it is a fully-featured sequencer with MIDI, DIN sync and analog sync), but keeping one master and radiating everything through the MRCC keeps start/stop behaviour predictable.

**PPQN is the whole game.** Every device in this rig speaks a different clock resolution:

| Device | Clock format |
|---|---|
| MIDI clock (Electribe, Tanzbär, Subsequent 37, Mother-32, Subharmonicon MIDI in) | 24 PPQN |
| Korg Electribe 2 / Volca 3.5 mm SYNC jacks | **2 PPQN**, 5 V pulses (~15 ms) |
| Moog DFAM ADV/CLOCK input | 1 pulse = advance 1 step (so 16th-note steps = 4 PPQN) |
| MFB Tanzbär DIN sync | 24 ticks per quarter (DIN24), divider configurable in Setup |
| MRCC analog Clock Out | selectable **1, 2, 4 or 24 PPQ** |

- The **MRCC analog Clock Out PPQ setting (1/2/4/24)** only affects the analog jack, not MIDI clock routing. Set it to **4 PPQ** to advance the Moog DFAM in 16th notes, one step per pulse. There is only one analog clock jack, so give the Korg gear MIDI clock over DIN instead of trying to share the analog output (Korg sync wants 2 PPQN — a 4 PPQ feed makes a Volca/Electribe run at double speed).
- **Mother-32 ASSIGN output trick:** in the Moog Mother-32 Setup mode, set the Assignable Output to a clock signal (options include full-rate clock and **Clock/4**, a 0–+5 V clock at one quarter rate). Patch ASSIGN OUT → DFAM **ADV/CLOCK** input, press RUN/STOP on both, and the DFAM steps in sync with the Mother-32 — even when the Mother-32 itself is slaved to MIDI clock from the MRCC. This is Moog's officially documented method and the most common studio pattern: MIDI clock into Mother-32, analog clock out to DFAM. When the Mother-32 is synced to external MIDI clock, its clock-division setting selects divisions of the incoming MIDI clock, so you can run the DFAM at musical divisions of the master tempo.
- **DFAM gotchas:** the ADV/CLOCK input wants a 0–+5 V pulse (+10 V tolerant); you must press the DFAM's RUN/STOP so the sequencer is armed to receive external advances, and the DFAM has no notion of "bar 1" — nudge the sequencer start position with the ADV button so step 1 lands on the downbeat. Note the DFAM's separate TRIGGER input fires on the **falling edge** of a gate, which can feel "late" with long gates from some sequencers.
- **Subharmonicon:** the Moog Subharmonicon's internal clock effectively runs at 1 PPQ until MIDI clock is detected; via its own CLOCK IN it advances per analog pulse (see Moog's support article on clocking the Subharmonicon with analog signals). Slaving it to MIDI clock from the MRCC is the low-friction option; its analog clock out/in is better reserved for cross-patching with the DFAM/Mother-32.
- **Tanzbär sync:** the MFB Tanzbär's Sync and Start mini-jacks are soft-configurable as inputs *or* outputs in Setup, and its clock divider setting ("divider off" = 24 ticks/quarter DIN-sync standard; "divider on" = uses the scale value) determines what its clock jack does. A known community gotcha: with the divider mis-set, an externally analog-synced Tanzbär advances one step per four pulses. In this rig, just slave the Tanzbär to MIDI clock from the MRCC and ignore its DIN sync.

Sources: Moog support (How do I sync DFAM & Mother-32; clocking Subharmonicon with analog signals), Moog Syncing DFAM with Mother-32 PDF, Mother-32 manual (Assignable Output), MRCC User Manual, JonDent modular clocks blog, Arduino Slovakia Korg sync-out signal analysis, ModWiggler DFAM ADV/CLOCK thread, DFAM manual.

## 2. Conductive Labs MRCC as Studio Hub — Routing Recipes, Channel Plan, Firmware

**Keyboard hub recipe.** Plug the Arturia MiniLab 3 into one of the MRCC's four **USB host ports** — the MiniLab 3 is USB MIDI class-compliant (no driver needed), which is the MRCC's only requirement for host-port devices; Conductive Labs maintains a USB Host Port Compatibility Tracker if in doubt. Then create routes from the MiniLab's virtual input to each hardware output: MAM MB33, Moog Subsequent 37, Moog Mother-32, Moog Subharmonicon, MFB Tanzbär (CV tracks), Korg Electribe 2. Save each as an MRCC **preset patch** ("MiniLab → MB33", "MiniLab → Sub37", etc.) and switch presets from the front panel — this replaces re-cabling with one button press.

**Suggested MIDI channel plan** (the MFB Tanzbär forces the design — its channels are **fixed**: CV track 1 = ch 1, CV track 2 = ch 2, all drum tracks = ch 3, non-configurable):
- Ch 1–3: reserved for Tanzbär (CV1 / CV2 / drums) — give the Tanzbär its own dedicated MRCC output port so nothing else collides with ch 1–3.
- Ch 4: MAM MB33 (set via the **DIP switches on the rear**).
- Ch 5: Moog Subsequent 37. Ch 6: Moog Mother-32. Ch 7: Moog Subharmonicon. Ch 8: Moog Theremini (MIDI over USB). Ch 10–16 (or 1–16 on its own port): Korg Electribe 2, whose parts map part 1 = ch 1 … part 16 = ch 16 — so, like the Tanzbär, the Electribe is happiest on its own dedicated MRCC out port.
- Leave the MiniLab 3 transmitting on ch 1 and use the MRCC's **channel remap modifier** per route to translate to each destination channel — you never touch the controller's channel setting again.

**Modifiers.** Each MRCC route can apply modifiers: message **filters** (strip clock, transport, CC, program change, aftertouch), **rechannelization**, and note/velocity **scaling**. Two critical filter recipes for this studio: (1) strip MIDI clock from every route except the ones deliberately carrying it — when merging two inputs to one output, never let both carry clock simultaneously; (2) filter program change on routes to the Electribe 2 so preset browsing on a controller doesn't yank patterns. Clock destinations are set with the dedicated out-port buttons/LED clock-routing page rather than normal routes.

**Firmware status (as of mid-2026).** The current MRCC firmware line is **v1.1.095 (September 2025)** — there is no "2.x"; treat any 2.x reference as the MRCC 880 sibling product or a misremembering. v1.1.095 raised simultaneous routes per patch from 50 to **255** (with a route counter on the Activity screen), fixed the MIDI Control Port setting not persisting for ports P07–P12 across power cycles, improved MIDI buffering and SysEx handling, and made multiple MRCCs enumerate as unique devices. Known post-update gotcha: **clear stale MRCC USB device names from your OS/DAW after updating**, since port naming changed (virtual ports now appear as child devices). There is at least one forum report of a bricked unit during update — update over a direct USB connection, not a hub, and follow the official procedure.

Sources: Conductive Labs MRCC firmware update page, Firmware Radar MRCC changelog, MRCC FAQs (USB host compatibility), MRCC User Manual, ModWiggler MRCC thread, Conductive Labs forum (bricked MRCC after update), Sound On Sound MFB Tanzbär review (fixed channels).

## 3. Moog Trio (DFAM + Mother-32 + Subharmonicon) — Community Recipes and Gotchas

**Sync recipes beyond the official sheet.**
- *Mother-32 as clock brain:* Mother-32 slaved to MIDI clock; ASSIGN OUT (set to clock or Clock/4) → DFAM ADV/CLOCK; Mother-32 or DFAM clock onward to Subharmonicon CLOCK IN. Clock divisions on the Mother-32 give the DFAM polymetric relationships to the master tempo.
- *DFAM as master (community favourite for jams):* DFAM VELOCITY or TRIGGER out → Mother-32 GATE/CLOCK in — the DFAM's per-step VELOCITY output doubles as a free 8-step CV sequencer for whatever you patch it into (filter cutoff on the Mother-32 is the classic).
- *Subharmonicon as polyrhythm brain:* its four rhythm generators are clock dividers of one master clock; patch its clock/trigger outputs into the DFAM ADV input for shifting, interlocking drum patterns.
- Registered Moog owners get an official patch book for Subharmonicon + Mother-32; community collections include Reverb's "20 Patches with Moog's Sound Studio" video, the DMS Generative 25-patch pack, Stellaterra's patch/sequence album, and 500+ user patches on patch-library.net.

**Known gotchas (community-verified):**
- **Subharmonicon rhythm-generator alignment:** rhythm generator outputs are always aligned to the incoming clock; a divider set fully clockwise (÷1) simply passes every clock pulse — so at the extremes the polyrhythm collapses and the sequence runs straight. The interesting behaviour lives in the middle of the knob range. Also note the Subharmonicon free-runs at an effective 1 PPQ internally until MIDI clock is detected.
- **DFAM trigger-vs-gate:** the DFAM external TRIGGER input responds on the **falling edge** of gates — long gates make hits land late; use short triggers. ADV/CLOCK wants clean 0–+5 V pulses (+10 V tolerant).
- **DFAM VCA DECAY CV** is summed with the panel knob; keep the knob near centre for the widest CV modulation range (patching Subharmonicon EG or Mother-32 ASSIGN CV into VCA DECAY is a standard dynamics trick).
- **RUN/STOP discipline:** externally clocked DFAM/Mother-32 still need their RUN state armed; and none of the three receive MIDI Start/Stop as transport in analog-clock mode — you align downbeats by ear/ADV button.
- **Levels:** Moog semi-modular outputs are hot synth-level signals; a patched mult of the same clock into audio inputs will click audibly — keep clock and audio patch cables tidy and separated.

Sources: Moog Syncing DFAM with Mother-32 official PDF, Reverb 20 Patches with Moog's Sound Studio, ModWiggler "Damn. DFAM." megathread, ModWiggler Subharmonicon polyrhythm threads, Moog official Subharmonicon with Mother-32 & DFAM video, patch-library.net Moog DFAM section.

## 4. Audio Path into the Allen & Heath Xone:92 (studio configuration)

The Allen & Heath Xone:92 is an all-analogue 4-stereo-channel mixer; each music channel has **two switchable inputs** (phono/RIAA or line). For synths, always use the **line** input — never the phono/RIAA input, which applies RIAA EQ and massive gain intended for turntable cartridges and will distort line-level synths. A sensible studio layout for this rig: Ch1 = Tanzbär main outs; Ch2 = Electribe 2 / Electribe 2 Sampler; Ch3 = Moog trio submix (DFAM + Mother-32 + Subharmonicon via a small line mixer or the Moog Sound Studio splitter/mixer accessories, since the 92 has only four stereo channels); Ch4 = Subsequent 37 + MB33 on the channel's two inputs (input-select switch flips between them). The Theremini can live on a return or share a channel input.

**Gain staging:** set each channel gain so the meter averages around **0 dB with peaks near +6**; the channel ON LED doubles as a peak warning (flashes red = back off the gain). Moog outputs and an accented, resonant MB33 run hot — leave headroom. Master out → audio interface line-ins for recording; booth out → monitors gives independent monitor level.

**Filters as studio tools:** the Xone:92's two independent analogue VCFs (switchable HPF/BPF/LPF, resonance up to self-oscillation, LFO with speed/depth) can be assigned per channel — treat them as two send-style analog filter processors, e.g. filter 1 permanently on the Moog trio channel, filter 2 sweeping the Electribe. Filter types can be combined for notch/complex responses.

**Sends/returns for hardware FX:** each channel has **two aux sends**, so run Aux 1 → delay unit → stereo return 1 and Aux 2 → reverb → return 2. This is the classic dawless-studio pattern: every synth gets independent access to both effects, and returning FX to a return (or a spare channel input for filterable FX) keeps the mix on the desk. In studio (non-DJ) use, leave every channel off the crossfader assignment.

Sources: Allen & Heath Xone:92 product page, Xone:92 User Guide PDF, ModWiggler Xone:92 synth-studio threads, DJTechTools forum Xone:92 aux send/return FX.

## 5. Korg Electribe 2 as Sequencer Hub vs the MRCC — Limitations and Sample Import

**External sequencing: capable but limited.** The Korg Electribe 2's 16-track sequencer can drive external MIDI devices and internal parts simultaneously, with part 1 → MIDI ch 1 … part 16 → MIDI ch 16. But community consensus (ModWiggler, Korg Forums) is that it is a *pattern* sequencer for external gear, not a *controller*: **motion sequences (recorded CC automation) are not transmitted to external units** — only real-time knob moves go out — and per the MIDI implementation chart **aftertouch and pitch bend are neither transmitted nor received**. Practical conclusion for this studio: use the Electribe 2 as **master clock and note-pattern sequencer** (it drives the MAM MB33 beautifully — velocity ≥120 steps give you accents), but route everything through the Conductive Labs MRCC and let the MRCC handle channelization, filtering and keyboard duties. When the Electribe is clock master for other Korg-sync gear, set **MIDI SEND FILTER = "Short + Program"** so slaves get clean clock without note spill.

**Sample import (Electribe 2 Sampler only).** The plain Electribe 2 cannot load user samples. The Electribe 2 Sampler workflow: samples live in a single bundle file **`e2sSample.all`** at `KORG/electribe sampler/sample/` on the SD card, loaded at boot. You can import WAVs one at a time from the card on-device, but the efficient path is a computer tool: **Sample Manager for Electribe Sampler** (macOS, drag-and-drop WAV/AIF into the .all file, auto-mono conversion, can overwrite factory samples) or the cross-platform **e2sEdit** (Java, sits next to the .all file). After editing, write the .all back to the card and restart the unit. Power users should know **Hacktribe**, the community firmware hack that (among other things) brings sampler features to the non-sampler Electribe 2 — flash at your own risk.

Sources: Noisegate (Sequence all the things with the Korg Electribe), ModWiggler Electribe 2 as MIDI sequencer, Korg Forums (routing MIDI to external synths; MIDI send filter), Korg official Electribe Sampler workflow, Sample Manager for Electribe Sampler, e2sEdit on GitHub, Hacktribe on GitHub.

## 6. Moog Theremini — CV Out, Editor, Pitch Correction for Studio Use

The Moog Theremini has a single rear-panel **CV output, unipolar 0–5 V**, assignable to either the pitch antenna or the volume antenna. Key behaviour: with pitch correction **off**, the CV out is a smooth continuous voltage (great as an expressive modulation source into the Mother-32, DFAM or Subharmonicon patch points — filter cutoff, VCA decay, etc.); with pitch correction **up**, the CV steps/quantizes to the selected scale — effectively a hands-free quantized CV controller. The front-panel Presets/settings determine whether pitch correction is applied to the CV out, and pitch CV can be quantized to a chosen scale or left linear. Note it is 0–5 V unipolar and not calibrated as tracked 1V/oct pitch CV for melodic control of the Moogs — treat it as a modulation/expression source, not a keyboard replacement.

**Editor:** the free **Theremini Editor** (Mac/Windows, plus an iPad version) connects over the mini-USB MIDI port and provides preset editing, librarian functions, and advanced settings not reachable from the panel (including the Animoog-derived wavetable engine parameters). Known limitation: the desktop editor has **no user-scale creation** — you pick from the built-in scale list. The Theremini also sends MIDI over USB/DIN, so it can register with the MRCC as another controller.

**Pitch correction in the studio:** correction amount is a continuous "difficulty" control — at maximum every note snaps perfectly to the selected scale/root (useful for takes that must sit in key); backing it off restores glissando and vibrato expressiveness. For recording melodic lines, a moderate setting plus the built-in tuner display gives the best trade-off; for the classic theremin sound, correction near zero.

Sources: Sound On Sound Moog Theremini review, Moog forum (Theremini CV out to analog synth), ModWiggler Theremini thread, Synthtopia (Theremini editor app).

## 7. MAM MB33 (303 Clone) — MIDI Quirks and Audio Notes

The MAM MB33 (Retro) is MIDI-in only with no sequencer, so it must be sequenced externally — ideal targets in this rig are the Korg Electribe 2 (pattern sequencing with per-step velocity) or the Arturia MiniLab 3 via the MRCC (live playing, and its arpeggiator). Key implementation facts:

- **MIDI channel is set by DIP switches on the rear panel** — hardware only, no software/UI setting. Match whichever channel the MRCC route delivers (ch 4 in the plan above) and label the unit.
- **Accent = velocity ≥ 120.** Any note received at velocity 120 or higher fires the accent circuit. On the Electribe 2, set accented steps' velocity to 120+; on the MiniLab 3, hard hits accent naturally.
- **Slide = overlapping (legato) notes.** Hold one note into the next for 303-style glide; there is no dedicated slide CC.
- **No MIDI CC support** on the Retro — cutoff, resonance, env mod, decay are knob-only. (The later MB33 MK II adds CC control of cutoff, resonance, env mod, accent, decay, distortion and autoslide — worth knowing if you see MK II-specific advice online; it does not apply to the Retro.)
- **Audio:** a mono synth-level output that gets aggressive with resonance and accent stacked; into the Allen & Heath Xone:92, use a line input with conservative gain and let the 92's channel EQ tame the resonant peaks. The classic pairing is MB33 → Xone:92 aux send → delay for instant acid.

Sources: Gearspace (303 clones with MIDI CC — MB33 Retro vs MK II), Dancetech MAM MB33 manual/notes, Vintage Synth Explorer MAM MB-33, MATRIXSYNTH MB33 MK II.

## 8. MFB Tanzbär — Firmware, MIDI Implementation, CV Outs to the Moogs

**MIDI implementation quirks.** The MFB Tanzbär's MIDI channels are **fixed and cannot be changed**: CV/synth track 1 sends and receives on channel 1, CV track 2 on channel 2, and **all drum instruments share channel 3** (distinguished by note number). Plan the studio channel map around this. The two CV tracks transmit notes on MIDI channels 1/2 **in parallel with** their CV/gate outputs, so a Tanzbär melodic sequence can drive the MAM MB33 or Moog Subsequent 37 over MIDI at the same time as a Moog semi-modular over CV.

**Sync.** Clock output divider lives in Setup: "divider off" (green LED) = 24 ticks per quarter, the DIN-sync standard; "divider on" (red) = divider follows the pattern scale value. The 3.5 mm Sync and Start jacks are soft-configured as inputs or outputs for analogue-sequencer sync. Community-reported gotcha: with mismatched divider settings an analog-synced Tanzbär advances only one step per four pulses — if analog sync misbehaves, check the divider first; in this rig, MIDI clock from the MRCC is the reliable path.

**CV/gate to the Moogs.** The two CV tracks output **1 V/oct CV plus gate** (gate ≈ 3.6 V per MFB support — comfortably above the Moog gate threshold). Patch CV1/Gate1 → Moog Mother-32 VCO 1V/OCT + GATE, or into the Subharmonicon's VCO/PLAY inputs, and the Tanzbär becomes the analog melodic sequencer for the Moog corner — with accent and even CC-recorded modulation available on the CV tracks. Its individual drum trigger behaviour also makes it a rhythmic companion: a spare drum track's output can advance the DFAM.

**Firmware.** The original Tanzbär shipped with OS around 1.03 documented in the manual; later official updates exist and are distributed as MIDI SysEx files from MFB. MFB's changelogs are famously sparse; known fixes in the family include MIDI CC handling repairs (e.g., Tanzbär II v1.05 fixed non-working MIDI CCs — Tanzbär II-specific, but indicative). MFB is a one-man operation: for current firmware, email MFB directly or check ModWiggler's Tanzbär threads, which are the de-facto knowledge base.

Sources: Sound On Sound MFB Tanzbär review, Tanzbär user manual, ModWiggler Tanzbär users thread (gate voltage, sync quirks), ModWiggler Tanzbär OS help, MFB Tanzmaus/Tanzbär Lite update procedure PDF, Gearspace Tanzbär DAW setup.

## 9. Quick-Reference: Recommended Studio Wiring

- **Clock:** Electribe 2 (master) → MRCC → MIDI clock to Tanzbär, Subsequent 37, Subharmonicon, Mother-32; Mother-32 ASSIGN OUT (clock) → DFAM ADV/CLOCK; MRCC analog Clock Out (4 PPQ) as alternate DFAM feed.
- **Notes:** MiniLab 3 → MRCC USB host → channel-remapped routes to MB33 (ch 4, DIP switches), Subsequent 37, Mother-32, Subharmonicon, Tanzbär CV tracks (ch 1/2 fixed), Electribe parts.
- **CV:** Tanzbär CV1/CV2 + gates → Mother-32 / Subharmonicon; Theremini CV (0–5 V) → modulation inputs; DFAM VELOCITY out → spare CV destination.
- **Audio:** all line inputs on the Xone:92 (never phono), gain to ~0 dB average/+6 peak, Aux 1/2 → hardware delay/reverb → returns, VCFs assigned per channel as performance filters, master → interface.

Caveats: MRCC firmware is the 1.1.x line (v1.1.095, Sept 2025) — no 2.x exists for the original MRCC. Tanzbär original-model firmware history is poorly documented publicly (fixed-channel and divider facts are solid; exact version numbers are not). Subharmonicon global PPQN specifics beyond the 1-PPQ-until-MIDI behaviour should be verified against the on-file manual.
