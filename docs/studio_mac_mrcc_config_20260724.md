# Studio Mac ↔ MRCC MIDI Configuration (Studio Facts, 2026-07-24)

Authoritative record of Alex's Mac-side setup and the recommended MRCC sync configuration. Grounded in the MRCC manual (page refs) and the verified app dossiers in this KB; items marked *recommended* are configuration choices, not manual facts.

## Studio facts (stated by Alex, 2026-07-24)

The **Conductive Labs MRCC is THE MIDI interface for the entire studio** — all MIDI, hardware and software, routes through it. Installed on the studio Mac: **Logic Pro**, **Bitwig Studio**, **Arturia Analog Lab V**, and the three Moog apps — **Animoog Z, Minimoog Model D, Model 15 — all PAID/unlocked full versions** (macOS builds). The Arturia MiniLab 3 is the hardware controller, connected to an MRCC USB host port.

## How the Mac connects (MRCC manual, p13/p21)

The Mac connects to the MRCC's **USB-C DEVICE port ("PC" port)**. This single cable carries **12 inbound and 12 outbound "virtual cables"** — the Mac sees the MRCC as a multi-port MIDI device in Audio MIDI Setup, and each virtual cable is routable inside the MRCC like any physical port. USB host ports (A–D, where the MiniLab 3 lives) each carry 4 inbound + 1 outbound virtual cables. Practical meaning: **the Mac gets 12 independent MIDI outputs into the studio and 12 independent inputs from it, over one cable, with no extra interface.**

## Recommended virtual-cable plan (*recommended*, consistent with the KB channel plan)

Outbound from Mac (DAW/app → MRCC → hardware):
- Cable 1 → Tanzbär port (ch 1/2 CV tracks, ch 3 drums — fixed channels)
- Cable 2 → MB33 (ch 4) and TD-3-MO (own channel; accent = velocity ≥ threshold on both — velocity ≥120 accents the MB33)
- Cable 3 → Subsequent 37 (ch 5) · Cable 4 → Mother-32 (ch 6) · Cable 5 → Subharmonicon (ch 7)
- Cable 6 → Electribe 2 (its own port; parts 1–16 = ch 1–16)
- Cable 12 → clock-only lane (see Clock below)

Inbound to Mac (hardware → MRCC → Mac):
- MiniLab 3 (USB host port) routed BOTH to hardware routes AND to an inbound PC virtual cable — so the same keyboard plays hardware and the Moog apps/Analog Lab V/DAW tracks without replugging. Select the corresponding "MRCC" port as MIDI input in each app.
- Electribe 2 / Tanzbär sequencer outputs routed to inbound cables when recording hardware sequences into Logic/Bitwig.

Label the routes as MRCC preset patches ("Mac→Rig", "MiniLab→Apps", "Rig→DAW") and switch from the front panel.

## Moog apps + Analog Lab V MIDI settings (from the verified dossiers)

- Each app: select the MRCC virtual port as MIDI input; map MiniLab 3 knobs via **MIDI Learn / CC mapping** (all three Moog apps support it; Analog Lab V auto-maps the MiniLab 3 natively).
- **MPE is off by default in all three Moog apps — enable explicitly in settings** if using an MPE controller. On **Model 15, never configure an MPE controller through CC-learn** (changes apply globally, not per-voice) — use its MPE mode.
- **Hosting: Logic Pro loads the Moog apps as AUv3 directly. Bitwig hosts NO Audio Units** — install Moog's official VST3 wrappers (URLs in the Moog apps dossier), open each standalone app once first, and choose the "(wrapped)" plugin entries. Analog Lab V is native VST3/AU in both DAWs.
- **MIDI out from apps:** Animoog Z's keyboard and Model 15's sequencer/keyboards (MIDI Bridge module, "use as a MIDI controller") can send MIDI back out — route an outbound app port through the MRCC to play hardware from the apps. Model D has no MIDI out.

## Clock and sync (*recommended*, grounded in KB clock research)

Two valid masters — pick per session:
1. **DAW as master (recording sessions):** Bitwig or Logic sends MIDI clock out one dedicated PC virtual cable (cable 12); MRCC's clock-routing page distributes it to Tanzbär, Electribe, Sub 37, Mother-32, Subharmonicon; Mother-32 ASSIGN out (clock) → DFAM ADV/CLOCK, or MRCC analog clock out at 4 PPQ for the DFAM.
2. **Electribe 2 as master (dawless sessions):** as per the studio integration research doc — Electribe MIDI out → MRCC → everything, including an inbound PC cable so the DAW can chase/record.

Rules that prevent the classic failures: only ONE route into any merged destination may carry clock (strip clock with MRCC per-route filters everywhere else); the Tanzbär stops sending MIDI clock when stopped; Moog apps sync via host (in-DAW) or Ableton Link (standalone — Bitwig also speaks Link, Logic does not).

## Audio note

The MRCC carries MIDI only. Moog app audio comes out of the Mac's audio interface into the Xone:92; hardware audio arrives on the 92's line inputs as per the integration research doc. Latency: when playing hardware from the DAW alongside app instruments, enable DAW latency compensation and prefer direct-monitoring the hardware through the 92.
