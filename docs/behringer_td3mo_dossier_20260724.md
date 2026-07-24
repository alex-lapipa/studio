# Behringer TD-3-MO ("Modded Out") — Verified Reference Dossier

Compiled 2026-07-24. Substitutes for the missing full manual (Behringer only ever published a Quick Start Guide). Confidence flags: **[certain]** = from official Behringer material or directly quoted primary/press source; **[reported]** = credible secondary/press or single community source consistent with official info; **[unverified]** = could not be confirmed in any fetched source. All sources listed per section.

## 1. What the Behringer TD-3-MO is

The Behringer TD-3-MO is a "'Modded Out' Analog Bass Line Synthesizer with VCO, MIDI-Controllable VCF and Sub-Harmonics Oscillator" — Behringer's official subtitle **[certain]**. It is a variant of the Behringer TD-3 (itself a clone of the Roland TB-303 Bassline) with additional circuitry reproducing the **Devil Fish** TB-303 modifications designed by Robin Whittle of Real World Interfaces (first version 1993; version 2, on which current mods are based, 1996) **[certain — SOS, firstpr.com.au]**.

- Whittle's own characterisation: "Apart from the sub-oscillator, this is a direct unauthorised copy of the Devil Fish circuitry — though I have not seen one… They mis-attribute the design to 'third party mods'… They were too dim to provide MIDI control of filter frequency." **[certain — direct quote, firstpr.com.au main Devil Fish page]**. Note: the shipped TD-3-MO *does* implement MIDI CC control of filter cutoff (see §4); Whittle's last remark refers to the negotiation-era TD-3 and/or his PWM implementation proposal **[reported]**.
- Sound On Sound (Robin Vincent, Sept 2021 review): "it's a completely different instrument… these modifications change the nature of the tone at some sort of fundamental level"; SOS found "all the features and functions on the TD-3-MO work as described in the Devil Fish documentation" **[certain — SOS]**.
- History of the dispute: Uli Behringer approached Whittle on 10 Nov 2019 proposing collaboration. Whittle proposed a royalty arrangement, design approval rights, and a retail price ~2× the TD-3; Behringer offered a one-off USD $15k for a perpetual, unlimited licence, which Whittle rejected. In Feb 2020 Behringer posted a CAD mock-up of a "TD-3-DF 'Murdered Out'" on Facebook; Whittle's public response page opens: "there is more than a whiff of larceny… Short version: It sucks." **[certain — firstpr.com.au/rwi/dfish/behringer-unauthorised/]**
- Release and price: announced/available July 2021 at **$199 USD**; SOS Sept 2021 lists **£159 inc. VAT / $199**. Thomann shows European availability since February 2022 and (as of July 2026) prices around $149 (TD-3-MO) / $144 (TD-3-MO-SR) **[certain]**.
- Colour variants: **TD-3-MO-AM** (yellow/amber), **TD-3-MO-SR** (silver), **TD-3-MO-BK** (black); Behringer product codes 0718-ACF, 0718-ACE, 0718-ABX respectively; original launch model code P0EYG. All technically identical per Thomann **[certain]**. The QSG is titled "TD-3-MO-SR/TD-3-MO-AM" **[certain]**.
- Physical: 305 × 165 × 56 mm, 0.8 kg, external 9 V DC supply (included). Behringer counts "15 controls and 33 switches" **[certain]**. Power polarity: centre-negative 9 V **[reported — Thomann matching-PSU listing; not confirmed from Behringer text]**.

Sources: behringer.com/en/products/0718-ACE · soundonsound.com/reviews/behringer-td-3-mo · firstpr.com.au/rwi/dfish/behringer-unauthorised/ · firstpr.com.au/rwi/dfish/ · synthanatomy.com (July 2021) · synthtopia.com (9 July 2021) · thomannmusic.com/behringer_td_3_mo.htm

## 2. Control surface (complete)

### 2.1 Core TB-303-style controls (carried over from TD-3) [certain — behringer.com, SOS, Thomann]
- **Tune** — VCO tuning (community: ~±1 octave range around centre) **[reported — joit.de]**
- **Cutoff** — low-pass VCF cutoff. On the MO the range is extended: closes fully and extends higher than the TD-3 (Devil Fish spec: max doubled to 5 kHz, widened downward) **[certain for extension — SOS + firstpr; the 5 kHz figure is the Devil Fish spec, matching community measurement on the MO [reported]]**. Behringer's copy says "4-pole low-pass resonant filter" **[certain]**; community (joit.de) calls it 3-pole/18 dB per octave — the TB-303's diode ladder is famously ~18 dB/oct in practice; discrepancy flagged **[community-sourced]**.
- **Resonance** — filter resonance; on the MO the filter reaches self-oscillation with high Accent Sweep settings **[certain — SOS, firstpr]**
- **Env Mod** — depth of filter envelope on cutoff; Devil Fish spec extends range "to include zero and go as high as three times the normal maximum" **[certain — firstpr; SOS confirms interaction with Filter Tracking]**
- **Decay** — **changed function vs TD-3/TB-303**: on the MO this controls the **volume (VCA) envelope**, not the filter envelope, variable from ticks/blips down to zero up to indefinite drone while the gate is held (Devil Fish spec: 16 ms – 3 s – no decay) **[certain — SOS + firstpr]**
- **Accent** — intensity of accented notes (accent shortens filter decay, raises resonance) **[certain — behringer.com; behaviour detail Devil Fish docs]**
- **Volume**, **Tempo** knobs; **Waveform** switch (sawtooth/square; centre position mutes the main oscillator so the filter alone or an external signal can be used) **[certain for saw/square — behringer.com; mute-in-middle: community — joit.de, Elektronauts]**
- **Mode** knob (Pattern Play / Pattern Write / Track Play / Track Write), **Track/Pattern Group** knob, 16-button keyboard/step section with Time/Pitch modes, Write/Next, Back, Function, Clear, Start/Stop, Pattern A/B, Slide, Triplet, transpose keys — TD-3 sequencer surface **[certain that the workflow is the TD-3's — SOS]**

### 2.2 "Modded Out" additions [certain unless flagged]
Official summary (Thomann/Behringer): "Controls for soft attack, normal and accent decay, filter tracking, slide time and filter FM; switchable sub-oscillator; accent sweep and sweep speed switchable in 3 steps; Muffler (VCA soft clipping) switchable in 2 steps; manual Accent button; filter cutoff controllable via MIDI controller."

- **Soft Attack** — softens the attack of non-accented notes (Devil Fish spec: 0.3–30 ms vs ~3 ms stock) **[certain — SOS + firstpr]**
- **Normal Decay** — filter-envelope decay for non-accented notes (community figure: 16 ms – 3 s) **[certain control exists; range community]**
- **Accent Decay** — filter-envelope decay for accented notes, independent of Normal Decay (community figure: 30 ms – 3 s) **[certain; range community]**
- **Slide Time** — variable slide/portamento duration, "up to 6 times" longer than TD-3 **[certain — Behringer via Synth Anatomy/Thomann; original Devil Fish spec was 5×]**
- **Sweep Speed** (3-position: Fast / Normal / Slow) — speed of the Accent Sweep circuit pulsing the filter on accented notes; cumulative across consecutive accented notes (the classic "wow" build-up). Whittle: "Fast" = v1.x Devil Fish response, "Normal" = the TB-303's own response, "Slow" = "super wide and sloppy" **[certain — SOS + firstpr FAQ]**
- **Accent Sweep** switch (3 positions) — intensity/mode of the filter accent: 0 = no accent sweep, 1 = high-resonance mode, 2 = normal **[certain the 3-position switch incl. high-resonance mode exists — Behringer; 0/1/2 mapping community — joit.de, consistent with SOS]**
- **Filter Tracking** — keyboard tracking: note pitch drives cutoff; with oscillator muted and high resonance the self-oscillating filter can be played in tune like a sine oscillator **[certain — Behringer/Thomann + SOS; sine trick community]**
- **Filter FM** knob — AC-coupled frequency modulation of the filter from the audio output of the VCA (Devil Fish-unique design); adds harmonics at low settings, crunchy chaos at high; strongest on loud/accented/overdriven signals. Companion **Filter FM input** jack accepts external audio **[certain — SOS + firstpr + Synth Anatomy]**
- **Overdrive** — replaces the TD-3's Boss DS-1-style Distortion circuit, which is **absent on the MO**. Controls oscillator level driven into the filter (Devil Fish spec: zero to 66.6× normal). At/near zero it fully closes the signal path (see §8); SOS: "reintroduces the main signal at around the 2 mark and then pours on the warmth and saturation" **[certain — SOS + firstpr]**
- **Sub Osc** — three-octave sub-harmonics oscillator, switchable; SOS: "you can set to low, mid or high… there's no level control". The one headline mod that did **not** originate with Devil Fish **[certain — SOS]**
- **Muffler** (2-step switch plus off) — post-VCA diode-based soft-clip/compression stage taming overdriven accented notes, attenuating highs while retaining bass **[certain — Thomann/Synth Anatomy + firstpr]**
- **Accent button** (momentary, red) — manually engages accent while pressed, on any note **[certain — SOS + Synth Anatomy]**

### 2.3 Devil Fish options NOT included on the TD-3-MO [certain — SOS]
Dynamic Bank Switching (instant mid-pattern memory-bank switching); the Audio-In-to-filter momentary toggle; possibly none of the post-shipping Devil Fish ECO hardware fixes (Whittle's stated assumption — he had not inspected a unit).

Sources: behringer.com · soundonsound.com/reviews/behringer-td-3-mo · thomannmusic.com · firstpr.com.au/rwi/dfish/ · synthanatomy.com · joit.de/behringer-td-3-mo-manual (community)

## 3. Connectivity — I/O

From Thomann's official spec list plus SOS **[certain unless flagged]**:

**Audio:** Line output 6.3 mm jack (mono, rear); stereo headphone output 3.5 mm; audio input for processing external sources through the filter, 3.5 mm.

**MIDI / USB (rear):** MIDI DIN In and Out (SOS: "full-size MIDI I/O sockets"); Thomann's table lists "1x In, 1x Out, 1x Thru" **[certain]**. Thru behaviour (TD-3 family, community-documented): DIN In messages echoed to DIN Out *and* USB Out; USB In messages echoed to DIN Out only **[reported — 303patterns.com, TD-3]**. USB port (class-compliant USB MIDI; also used by Synthtribe for SysEx/firmware) **[certain port exists]**. 9 V DC power input.

**CV/Gate patchbay (3.5 mm jacks)** **[certain — Thomann list]**:
- Inputs: **CV In**, **Gate In**, **Accent In**, **Slide In**, **Filter CV In**, **Filter FM In**, **Sync In**, plus the audio input.
- Outputs: **CV Out**, **Gate Out**, **Accent Out**, **Filter Out** (filter audio out; pre-VCA in the original Devil Fish design **[reported for the pre-VCA detail; not confirmed for the MO]**).

**Published voltage specs: not verified.** No official voltage/scaling figures found in any fetched source. Reference points, flagged: SOS hands-on — a **±5 V LFO** into Filter CV works musically; playing via CV In gave only **about two octaves** of range (vs ~four octaves over MIDI) **[certain as SOS's observation]**. Original Devil Fish (TB-303) Slide CV spec: 2.3 V turns on Slide, >4 V ties notes via Gate **[certain for the original mod; unverified for the MO]**. 1 V/octave scaling on CV In/Out: **unverified** (widely assumed, not stated in any fetched source).

Sources: thomannmusic.com · soundonsound.com · firstpr.com.au · 303patterns.com/td3-midi.html (community, TD-3)

## 4. MIDI implementation

- **Official published implementation:** the Quick Start Guide contains a MIDI data-sheet; per an Elektronauts member reading it: "The manual MIDI data-sheet confirms, exactly one CC 74 for filter cutoff (not resonance or anything else)" **[certain that this is what the QSG states, via direct community quotation]**. "MIDI-Controllable VCF" is in the official product subtitle **[certain]**.
- **CCs:** **CC 74 = filter cutoff (0–127)**. midi.guide's community database additionally lists CC 120 as an accent trigger **[community-sourced; not in official docs as far as verified]**. No other CCs documented anywhere fetched.
- **Notes:** standard Note On/Off; ~4 octaves of range over MIDI (SOS) **[certain]**. Accent from velocity: notes above a threshold play accented; threshold configurable via SysEx on the TD-3 (default community-reported as >96 on the MO) **[reported]**. Slides: overlapping/legato notes (TD-3 firmware ≥1.2.6 required for correct MIDI slides) **[reported — 303patterns]**. Pitch bend supported (range settable 0–12 semitones via SysEx/Synthtribe on TD-3) **[reported]**.
- **Channel setting:** verified methods are (a) the **Synthtribe app** and (b) **SysEx** `F0 00 20 32 00 01 0A 0E <out> 00 <in> F7` documented for the TD-3 (separate In and Out channels) **[reported — 303patterns, TD-3; MO expected identical but unverified]**. A front-panel key-combo for MIDI channel: **not verified — do not assume one exists.**
- **Clock/sync:** responds to MIDI Start (FB), Stop (FC), Clock (F8). Clock source selectable Internal / MIDI DIN / USB / Trigger (Sync jack); trigger rates 1 PPS, 2 PPQ, 24 PPQ, 48 PPQ; polarity rise/fall — via SysEx/Synthtribe (TD-3-documented) **[reported]**. Front-panel method (community, MO): hold **Back + Write/Next**, then press the keyboard key for the sync source and the resolution key **[community-sourced — joit.de, consistent with 303patterns TD-3]**. The unit only obeys Start/Stop from the interface it is clocking from **[reported — 303patterns, TD-3]**.
- **DIN vs USB:** community documentation (MO): DIN input implements clock, note on/off and CC74 only; the full feature set (SysEx pattern dump/load, configuration, firmware, pitchbend/transport) requires USB **[community-sourced — joit.de, consistent with 303patterns TD-3]**.
- **SysEx (TD-3-documented, expected shared):** Behringer manufacturer ID `00 20 32`, device prefix `00 01 0A`; full unofficial command set (get model/firmware, pattern request/put, configuration incl. key priority, multi-trigger, transpose ±12, clock settings, test mode, DFU) at 303patterns.com **[reported — community reverse-engineering of the TD-3; TD-3-MO parity unverified]**.

Sources: elektronauts.com/t/behringer-td-3-mo-modded-out/156829 · midi.guide/d/behringer/td-3-mo/ · 303patterns.com/td3-midi.html · joit.de/behringer-td-3-mo-manual · behringer.com

## 5. Sequencer

- **Capacity:** 16-step sequencer + arpeggiator; **7 tracks**; up to **250 patterns** across **4 Groups**; patterns in A/B sections (A = 1–8, B = 9–16 per the TD-3 SysEx layout) **[certain — behringer.com; A/B layout reported]**. 16-note Poly Chain across multiple units **[certain]**.
- **Workflow:** faithful to the TB-303's split pitch/time programming (SOS: "faithfully reproduced"), with TD-3-era improvements: tap-in timing entry, random pattern generator, and full pattern editing via **Synthtribe** over USB **[certain — SOS + Thomann]**.
- **Community step-by-step (joit.de cheat sheet)** **[community-sourced]**: select pattern → Pattern Write mode; clear with Clear + pattern number; set step count with Function + step key; enter **Time mode** and program each step as note / tie / rest (auto-exits at the step count; timing cannot be edited afterwards — re-enter the pattern); enter **Pitch mode** and play pitches (rests are skipped; use transpose-down/up before the key for octaves); step with Write/Next, back with Back; add **Accent/Slide/Transpose** per note by holding Write/Next and pressing the modifier while stepping in Pitch mode; copy via Function + Copy / Function + Paste; chain patterns by pressing first and last pattern numbers together in Write mode; **Start/Stop + Clear** generates a random variation of the current pattern; live transpose in Pattern Play via Pitch mode + keyboard.
- **Differences from original TB-303 workflow:** tap timing entry, random generator, app-based editing, MIDI/USB pattern transfer, 250-pattern memory — TD-3-family additions **[certain]**. The MO omits the Devil Fish's mid-pattern Dynamic Bank Switching **[certain — SOS]**.

Sources: behringer.com · soundonsound.com · joit.de (community) · 303patterns.com (community)

## 6. Firmware & Synthtribe

- **Update procedure:** firmware updates run through Behringer's free **Synthtribe** app over USB; the app prompts when newer firmware exists, and also handles MIDI channel settings, pattern export/import, MIDI routing, Poly Chain and calibration for the TD-3 family **[certain that Synthtribe is the official updater]**.
- **Synthtribe versions:** TD-3-MO support added in Synthtribe **2.5.6** (19 Aug 2021) **[reported — app listings]**.
- **TD-3-MO firmware version numbers and changelogs: not verified.** No fetched source documents MO-specific firmware versions. For the plain TD-3: v1.2.4 (Feb 2020) through v1.3.7 (June 2021) observed; **v1.2.6 fixed broken MIDI slide behaviour** **[reported — 303patterns; TD-3 only]**.
- A raw SysEx DFU procedure exists (TD-3-documented) but is brick-risky; use Synthtribe **[reported]**.

Sources: 303patterns.com · Synthtribe app listings · thomannmusic.com

## 7. What each mod does musically (Devil Fish lineage)

Per Whittle's official Devil Fish documentation (the design the MO copies) and SOS's confirmation that the MO's functions "work as described in the Devil Fish documentation" **[certain]**:

- **Extended VCA decay** (16 ms–3 s–infinite): clicks/blips to endless drones.
- **Soft Attack** (0.3–30 ms): removes/reshapes the 303's click on non-accented notes.
- **Independent Normal/Accent filter decays**: accented and plain notes get different filter envelope lengths — groove-critical.
- **Accent Sweep + Sweep Speed**: the accent circuit's resonant filter pulse; cumulative across successive accents — programmed accent runs build from "wap" into screaming sweeps (SOS). "Normal" = stock TB-303 response; "Fast"/"Slow" extend beyond it.
- **Overdrive** (0–66.6× oscillator level into filter): silence (lets filter self-oscillation stand alone) → unity → heavily saturated drive.
- **Filter Tracking**: pitch-tracks cutoff; enables playing the self-oscillating filter as a tuned sine voice; works inversely with Env Mod (SOS).
- **Filter FM** (internal from VCA output, plus external input): harmonics → crunchy chaos; SOS: little effect until ~3 o'clock, then "trips into a crunchy bit of chaos"; not DX-style FM.
- **Muffler**: post-VCA diode soft-clip retaining bass; audible mainly on heavily overdriven accented material (SOS: settings 1–2 "take the edge off").
- **Accent button**: momentary manual accent for fills/live dynamics.
- **Extended cutoff (to ~5 kHz max, lower minimum), extended Env Mod (0 to 3× stock), improved bass response** (original mod enlarged coupling caps C20/C21 — the TB-303's "weedy bass" fix) **[certain for the Devil Fish; "bass boost" claimed by Behringer copy]**.
- **Sub-oscillator** (Behringer's own addition): massive low-end; SOS found it dominating, erasing residual 303 character while engaged — best used as a contrast switch.
- Overall character (SOS): keep a plain TD-3 for "cuddly acid"; the MO trades the classic 303 voice for a wilder, angrier, more hackable instrument.

Sources: firstpr.com.au/rwi/dfish/ · soundonsound.com · Devil Fish User Manual PDF: firstpr.com.au/rwi/dfish/Devil-Fish-Manual.pdf (SOS recommends it as the de-facto missing manual for the MO's controls)

## 8. Known quirks & issues — community-sourced

- **Overdrive at zero = no output** even with Volume maxed. Intended behaviour (matches the Devil Fish 0–66.6× design). Practical rule (joit.de): keep Overdrive open a little; balance Overdrive vs Volume for gain staging (Volume gets noisy near max).
- **Accent Sweep positions other than 2 sound very resonant**; one Thomann reviewer keeps it at 2 permanently.
- **Attack click / end-of-note hiss**: fast clicky attack is normal-ish for 303 clones; Soft Attack exists to tame it; hiss may be a headphone-output artifact — test the 1/4" line out (Elektronauts).
- **MIDI timing**: early external-sync latency complaints considered "a bit of a myth" by MO owners sequencing over MIDI (Elektronauts, 2022). Adjusting PPQN helps inter-gear sync.
- **Only CC74** implemented — no resonance/env CCs; common workflow complaint.
- **TD-3-family (not MO-verified) reports**: oscillator tuning drift requiring internal trimmer adjustment; Gate Out lacking a pulldown resistor so it may fail to trigger some Eurorack modules (workaround: attenuator/mult in the path).
- **Internal cutoff trimmer** exists for fine-tuning maximum cutoff (opening the case may void warranty) (joit.de).
- **Whittle's caveat** (primary source): the MO may not include the Devil Fish ECO fixes issued for problems discovered after original Devil Fishes shipped **[his stated assumption; unverified]**.

Sources: elektronauts.com · joit.de · thomannmusic.com customer reviews · Gearspace/ModWiggler TD-3 threads (TD-3, not MO-specific)

## 9. Integration notes (MRCC / MAM MB33 / Moog semi-modulars)

- **Conductive Labs MRCC:** the Behringer TD-3-MO has full-size MIDI DIN In/Out plus USB, so it patches into an MRCC DIN port pair directly. Route notes + clock + CC74 to DIN In; Start/Stop is only obeyed from the active clock source **[reported]**; pattern management/SysEx/firmware require USB (Synthtribe on a computer), not DIN **[reported/community]**. Keep the MO on its own MIDI channel; set channel via Synthtribe **[reported]**. Alternative: the MO's USB could plug into an MRCC USB host port for MIDI (class-compliant), though Synthtribe needs it on the computer for config sessions.
- **MAM MB33:** both are monophonic 303 voices driven over MIDI; separate channels behind the MRCC let one keyboard/sequencer stream drive either selectively. TD-3-MO accents from velocity above threshold **[reported]**; MB33 accents at velocity ≥120 — so a shared stream can accent both with velocity ≥120.
- **Moog semi-modulars (CV/gate):** the TD-3-MO exposes CV/Gate/Accent In+Out, Slide In, Filter CV In, Filter FM In and Filter (audio) Out on 3.5 mm jacks — the same format as the Mother-32-family patchbays. Verified data points: ±5 V LFO into Filter CV modulates cutoff musically; CV-In playing yielded only ~2 octaves (vs 4 via MIDI), so prefer MIDI for melodic control and use CV jacks for modulation (SOS: "the Accent circuit displays a whole new dimension once you start throwing in some modulated gates"); use CV/Gate/Accent **outputs** to drive external gear from the MO's sequencer — including its accent pattern as a modulation source **[certain — SOS]**. **1 V/oct scaling and gate voltages unverified** — calibrate by ear/tuner against the Moog oscillators; if an external module doesn't see Gate Out, try the attenuator/mult workaround. The 3.5 mm Audio In lets a Moog oscillator run through the MO's filter/overdrive chain (Overdrive at zero + Waveform switch centre = external-only path).

Sources: as §§3–4, 8 · soundonsound.com

## 10. Official documentation status

Behringer never published a full manual — only the 14-page English Quick Start Guide (V1.0, includes the MIDI data-sheet). Direct official PDF URLs (Music Tribe-hosted): P0EYG launch model `mediadl.musictribe.com/media/PLM/data/docs/P0EYG/TD-3-MO_QSG_WW.pdf`; TD-3-MO-BK `mediadl.musictribe.com/media/PLM/data/docs/0718-ABX/QSG_BE_0718-ABX_TD-3-MO_WW.pdf`; SR/AM `cdn.mediavalet.com/aunsw/musictribe/hAiDqyx4i0-36t05UD5gYw/B__rLp-Ag0iPQ8vTDPTuxg/Original/QSG_BE_0718-ACE_TD-3-MO_WW.pdf`. A viewable copy is at manua.ls/behringer/td-3-mo/manual. The de-facto supplementary manual is Robin Whittle's official **Devil Fish User Manual**: firstpr.com.au/rwi/dfish/Devil-Fish-Manual.pdf. Deeper configuration lives in the **Synthtribe** app.

**Not verified anywhere despite targeted searching:** TD-3-MO firmware version numbers/changelog; official CV voltage/scaling specs; any front-panel MIDI-channel procedure; NRPN support.
