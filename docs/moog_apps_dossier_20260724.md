# Moog Software Instruments — Verified Reference Dossier

**Compiled:** 24 July 2026 · **Scope:** Animoog Z, Minimoog Model D App, Model 15 Modular Synthesizer App · **Method:** all claims taken directly from fetched sources (US Apple App Store listings, Moog freshdesk knowledge base, Moog software store, official web manuals, Bitwig official support). Confidence flags: **[certain]** = read directly from an official source; **[reported]** = press/community or Moog marketing quoted by third parties; **[unverified]** = could not be confirmed.

## 0. Corporate and availability context (all three Moog apps)

- Moog Music was acquired by inMusic in 2023 **[reported — Synthanatomy]**.
- As of July 2026, **all three apps remain available on the Apple App Store**, sold by "Moog Music Inc.", all updated December 2025 (Animoog Z 1.3.2, Model 15 2.4.3) or June 2026 (Model D 1.5.4) **[certain — App Store listings fetched 2026]**.
- Moog's current official software storefront **software.moogmusic.com** lists Animoog Z, Minimoog Model D, Model 15, Animoog Galaxy (Vision Pro) and the Mariana bass plugin **[certain]**.
- App support KB: **moogmusic-help.freshdesk.com** (mirrored at inmusicsupport.freshdesk.com, same article IDs) **[certain]**.
- The **original Animoog (v1) app was removed from the App Store**; Animoog Z is its successor with backward preset compatibility **[certain]**.
- All three are **Apple-ecosystem only** (iOS/iPadOS/macOS/visionOS); no Windows or Android **[certain]**.

Sources: apps.apple.com IDs 1586841361 / 1339418001 / 1041465860 · software.moogmusic.com/synthesizers · moogmusic-help.freshdesk.com · synthanatomy.com (inMusic statement, Sept 2023).

## 1. Animoog Z Synthesizer

**Engine/platforms/price [certain]:** 16-voice polyphonic synth on Moog's **Anisotropic Synth Engine (ASE)** — an "orbit system" expanding wavetable and vector synthesis through X/Y/Z axes. Timbre library mixes digital/spectral sources with waveforms recorded from classic Moog circuits; built-in **Timbre Editor** records your own timbres and **imports WAV files**. Current version 1.3.2 (8 Dec 2025). Platforms: iOS/iPadOS 14.4+, macOS 11.2+, visionOS; universal purchase shares presets/timbres/IAPs across devices. Price: free with limited functionality; **$29.99 "Unlock Full App" IAP**; preset packs $0.99–$4.99. Formats: standalone + **AUv3** (plus an "Animoog Z Effect" AUv3 for effects use); no Inter-App Audio.

**Documentation [certain]:** official web manual **animoog-z-manual.webflow.io** (Presets, Orbs, Timbres, Timbre Editor, ENV/LFO, Mod, Effects, Settings, AUv3 Integration, Importing Legacy Presets, keyboard shortcuts). No Animoog Z PDF exists; the AnimoogManual.pdf on api.moogmusic.com is the original Animoog, not Z.

**MIDI [certain]:** MIDI input from any controller with **full MPE support — but since v1.0.24 MPE must be explicitly enabled** in settings/MCM; **MIDI out** (its expressive keyboard can control external instruments); "exhaustive MIDI CC mapping system featuring MIDI Learn, multiple destinations for a single CC, and detailed control of which presets are loaded with program change" (SETUP > MAP CCs; mappable controls outline in red; save preset and CC map after); **Ableton Link**, global BPM, tap tempo, bank-change messages for preset categories.

**Presets [certain]:** browser with groups/tags/favourites, preset sharing, random presets; **iCloud auto-backup** of saved presets; on macOS the Presets page has an **OPEN DIRECTORY** button revealing the user-preset folder (literal path not published **[unverified]**); backwards-compatible with original Animoog presets and timbres.

**Studio integration:** Logic Pro loads the AUv3 directly **[certain]**. **Bitwig does not host Audio Units at all** (Bitwig FAQ; it supports VST2.4/VST3/CLAP) **[certain]** — use Moog's official **AUv2/VST3 wrapper DMG** (moogconnect.net/downloads/animoog/AnimoogZ_AUv2_VST3_20221116.dmg): drag "Animoog Z.vst3" (+ Effect) into /Library/Audio/Plug-Ins/VST3, **open the standalone app once before using the plugins**, and pick the "(wrapped)" entries if the plain ones show a black window **[certain — Moog support]**. Hardware control: any class-compliant CoreMIDI source (MiniLab 3 via MRCC USB) with MIDI Learn; Bluetooth-LE MIDI documented. No CV features **[certain by absence]**.

**Quirks [community]:** GUI/touch lock-up bug on newer devices fixed in 1.3.1/1.3.2; on-screen keyboard cannot be hidden (awkward as plugin); limited mod destinations (no amp-envelope destination); cross-device IAP unlock may need re-clicking the purchase with the same Apple ID (resolves free).

## 2. Minimoog Model D Synthesizer App

**Engine/platforms/price [certain]:** recreation of the 1970 Minimoog Model D, extended with **up to 4-note polyphony**, arpeggiator (note-hold, chord latch), real-time looper with unlimited overdub, tempo-syncable stereo ping-pong delay, "Bender" stereo time-modulation effect, selectable envelope shapes/triggering, reworked feedback/overload path; 160+ presets. Current version 1.5.4 (8 Jun 2026 **[interpretation of undated listing]**); macOS universal version since 1.3.11 (Sep 2022). Platforms: iOS/iPadOS 14.4+, macOS 11.2+, visionOS. Price: **$14.99** + preset packs. Formats: standalone + **AUv3**, Inter-App Audio, Audiobus.

**Documentation [certain]:** official web manual **model-d-ios-manual.webflow.io** (Installation, Navigation, Top Bar, Features & Controls, Effects, AUv3 Integration). Do not confuse with the hardware Minimoog reissue PDF on cdn.inmusicbrands.com.

**MIDI [certain]:** **MPE support (explicit enable required since 1.3.17)** · MIDI CC mapping · **7- and 14-bit MIDI** · MIDI Program Change + Bank Change · Bluetooth LE MIDI · **Ableton Link**. **No MIDI output** to external gear listed (unlike Animoog Z / Model 15) **[certain by absence]**.

**Presets [certain]:** share presets/recordings via AirDrop/Mail; **iCloud preset backup**; redesigned browser since 1.3.11. macOS preset path **[unverified]**.

**Studio integration:** Logic Pro direct AUv3 **[certain]**. Bitwig: official **AUv2/VST3 wrapper** from the app's **Help menu** or inmusic.to/modeld-vst-download; install Model D.vst3 to /Library/Audio/Plug-Ins/VST3; open app once first; prefer "(wrapped)" entries **[certain — Moog support 69000840586]**. Hardware control via any CoreMIDI source (MRCC USB → macOS); dedicated article for DAW use (69000840582). No CV features **[certain by absence]**.

**Quirks [community/release notes]:** standalone ARP MIDI-clock sync buggy until 1.5.1 (Dec 2024); GUI lock-up workaround in 1.5.2 (family-wide bug); universal-purchase price display confusion documented by Moog support.

## 3. Model 15 Modular Synthesizer App

**Engine/platforms/price [certain]:** recreation of the Moog Model 15 modular — 921-series oscillators, 904A Low Pass Filter, 907 Fixed Filter Bank — with virtual patch cables, built on Apple Metal. **Mono and 4-voice poly**; four controllers: Moog keyboard, **1150 ribbon controller**, 8-step sequencing arpeggiator, **Animoog keyboard** (22 scales, polyphonic modulation). Extensions: master ping-pong delay, looping recorder with overdub, extension cabinet (extra amplifiers, voltage-controlled reversible attenuators for ring-mod-style effects), tutorial patches, 160+ presets. Current version 2.4.3 (8 Dec 2025); MPE zones since 2.2.11 (Oct 2021); 2.4.1 (Dec 2024) fixed MIDI-bridge unwiring and ARP clock sync. Platforms: iOS 12.4+, macOS 11.0+, visionOS; ~898 MB. Price: **$29.99** + preset packs (incl. Richard Devine, Sascha Dikiciyan). Formats: standalone + AUv3, Inter-App Audio, Audiobus, AudioCopy/AudioShare.

**Documentation [certain]:** official web manual **model-15-user-manual.webflow.io**. Moog support's canonical link points at moogmusic.com/products/apps/model-15-app#downloads-tab, which returned empty content in July 2026 (post-inMusic site redesign) — treat the Webflow manual as the working copy.

**MIDI [certain]:** "Total MIDI integration, assignment for external control, **use as a MIDI controller**, dedicated **Audio Bridge and MIDI Bridge modules**" · **MPE zones (explicit enable since 2.2.19)** · Ableton Link · 7/14-bit MIDI · Program Change · Bluetooth LE MIDI · CC mapping (article 69000840653) · QWERTY musical typing. The MIDI-out/controller capability means the app's keyboards/sequencer can drive external hardware — relevant for sequencing the Moog semi-modulars from the app.

**Presets [certain]:** share presets/recordings; tutorial patches; preset packs via IAP. macOS preset path **[unverified]**.

**Studio integration:** Logic Pro direct AUv3 **[certain]**. Bitwig: official wrappers at bit.ly/model15-vst-download — three plugins: "Model 15", "Model 15 AudioBridge Trunk", "Model 15 AudioBridge Insert" (VST3s into /Library/Audio/Plug-Ins/VST3; Moog's article has an apparent AUv2/VST3 filename typo, flagged); open the app once first; "(wrapped)" versions where plain AUv3 shows a black window; non-wrapped performs better where it works **[certain — Moog support 69000840526]**. No hardware CV I/O — patching is virtual only **[certain by absence]**.

**Quirks [Moog support/community]:** heaviest CPU of the three — dedicated "glitches and crackles" support article; **MPE gotcha: configuring an MPE controller through MIDI CC Learn makes changes global, not per-voice** — configure MPE as MPE, never CC-map it; historical iOS Metal/throttling stutters resolved in later releases.

## 4. Animoog ↔ Theremini relationship

Moog's own marketing for the Theremini states its "powerful sound engine [is] derived from Moog's award-winning synthesizer, Animoog" (32 wave/wavetable presets, pitch-CV out, USB MIDI) **[certain as Moog-originated marketing/engineering lineage]**. This refers to the **original Animoog engine** — the Theremini shipped in 2014, seven years before Animoog Z; internal code lineage beyond the marketing statement **[unverified]**.

## 5. Direct documentation URLs

| Doc | URL |
|---|---|
| Animoog Z manual (official, web) | animoog-z-manual.webflow.io |
| Minimoog Model D App manual (official, web) | model-d-ios-manual.webflow.io |
| Model 15 App manual (official, web) | model-15-user-manual.webflow.io |
| Original Animoog manual (legacy PDF) | api.moogmusic.com/sites/default/files/2018-10/AnimoogManual.pdf |
| Animoog Z AUv2/VST3 wrappers (DMG) | moogconnect.net/downloads/animoog/AnimoogZ_AUv2_VST3_20221116.dmg |
| Model D AUv2/VST3 wrappers | inmusic.to/modeld-vst-download (also in-app Help menu) |
| Model 15 AUv2/VST3 wrappers | bit.ly/model15-vst-download |
| Moog app support KB | moogmusic-help.freshdesk.com (mirror: inmusicsupport.freshdesk.com) |
| Moog software store | software.moogmusic.com/synthesizers |

## 6. Not verified

macOS filesystem paths for user presets (all three); whether the 2022–2023 wrapper builds match current app versions (Animoog Z DMG dated 2022-11-16); non-US pricing; whether moogmusic.com app product pages still exist (empty fetch, possibly JS-rendered); Model D 1.5.4 release year (interpreted as 2026); Theremini internal engine lineage beyond Moog's statement.

**Key studio fact:** Bitwig hosts no AUv3/AU at all — Moog's official AUv2/VST3 wrappers are mandatory in Bitwig; Logic Pro loads the AUv3s directly. All three apps: MIDI Learn/CC mapping, MPE off-by-default, Ableton Link. Animoog Z and Model 15 send MIDI out; Model 15 adds MIDI/Audio Bridge modules. No hardware CV in any app.
