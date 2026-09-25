# [GC][24Frame] LOCK — DM voice note v1

**Date:** 2026-09-25 (CT)  
**Status:** **LOCKED** · Design Own→READY · no Design PR · CoS seeds `docs/design-locks/` · stay DRAFT until CoS CLEAR Dev  
**Repo:** `docs/design-locks/dm-voice-note-lock-v1.md`  
**Box:** `/workspace/24frame-agg-ux/dm-voice-note-lock-v1.md`  
**Adam LOCK 2026-09-25:** Mic visible **ONLY** in DM compose · behavior = **audio voice notes** (send audio bubbles) · **not** speech→text · **not** Social write/create mic  
**Grammar ref:** iMessage-class hold/send + waveform bubble (structure only — **not** Apple brand / dark / glow)  
**Doctrine:** Immersive Social · Media Immersion · quiet redundant-chrome · house light · spacing **8 / 16 / 24 / 48** · **no** drop shadows · phone never-truncate  
**Cites:** `dm-thread-immersive-real-estate-lock-v1.md` (sticky composer · immersive hide shell+dock) · `dm-thread-message-format-lock-v1.md` (mine right / theirs left · sticky Message row) · `write-compose-voice-first-immersive-lock-v1.md` §0.4.1 (Social write mic **OUT**)  
**Dedicated lock (not #679 absorb):** keeps DM voice craft out of write-compose #681 and New-message IA.  
**Out of scope:** Social feed/create speech→caption · audio-as-feed-post · sticker invent · call button · IG dark · #681 write compose · New message / Group chat screens (compose IA lock) · inventing voice-note UX beyond this lock

---

## One lock

**DM thread composer only: trailing mic sends audio voice-note bubbles (iMessage hold/send grammar · house light). Waveform bubbles in the thread. No speech→text. No mic on Social write.**

---

## A) Where the mic lives

| Token | Lock |
|-------|------|
| Surface IN | **DM thread** sticky composer only (1:1 and group DM) |
| Surface OUT | Social write / feed create · New message / New group chat pickers · Stories · feed actions |
| Behavior | **Audio voice note** — record sound · send as bubble · playback in thread |
| OUT behavior | Speech→caption / dictate-into-Message-field as the primary product (keyboard dictation may still exist OS-side; **no** house mic for STT on DM) |

---

## B) Composer geometry (phone)

Amends immersive-real-estate composer: prior “Leading camera / mic / sticker **OUT** invent” is **superseded for mic + camera** — mic = voice notes · **camera far-right** = library/attach (Adam PASS amend 2026-09-25). Sticker stays **OUT**. Do not invent voice-note UX beyond §B–§C.

| Token | Lock |
|-------|------|
| Strip | Sticky above safe-area · content height **48** + pad **8** top/bottom (cite immersive real-estate) · **0** Social tab dock |
| Message field | Pill **Message…** · height **40** · radius **20** · muted `#F4F4F6` or hairline · flex grow · font **≥16px** |
| Row order (L→R) | Message flex **1** · gap **8** · **mic or Send** · gap **8** · **camera far-right** |
| Camera | Phosphor camera glyph **24** · hit **40×40** · ink `#14171A` · **always far-right** · opens library / attach (same placement as feed write §0.4.2) |
| Mic idle (text empty) | Phosphor mic glyph **24** · hit **40×40** · ink `#14171A` · sits **left of** camera (not far-right) |
| Send vs mic | Text empty → **mic** (no Send) · text non-empty → **Send** (mic **hides**) · camera stays far-right either way |
| Hold to record | Press-and-hold mic ≥ **150ms** → recording · release → **send** voice note |
| Cancel | Slide off mic hit (or drag up) → cancel · no bubble · haptic optional house-calm |
| Recording chrome | Mic / field row → Sporty `#1769FF` affordance · live waveform **inside** composer (height **40**) · elapsed `t-sm` · **0** full-screen takeover · **0** gray paper card |
| Max duration | Cap **60s** · auto-send at cap (or stop+confirm — prefer **auto-send** one SoT) |
| Desktop | Same tokens · column max **680** · click-hold = press-and-hold · no phone-card cousin |

---

## C) Voice-note bubble (thread)

| Token | Lock |
|-------|------|
| Alignment | Mine **right** · theirs **left** (cite message-format) |
| Size | Height **40** · max-width **240** · radius **20** · pad H **12** |
| Fill mine | Sporty wash **8–12%** or solid muted `#EEEEF0` with Sporty play — one SoT: fill `#EEEEF0` · play glyph Sporty `#1769FF` |
| Fill theirs | `#F4F4F6` · play ink `#14171A` |
| Content | Play/pause hit **32** · waveform bars **height 16** · duration `t-sm` secondary · gap **8** |
| Playback | Tap bubble / play → audio plays in place · progress on waveform · **no** route-out |
| Stack | Same vertical rhythm as text bubbles (gap **8** same sender / **16** other) |
| Media Immersion | Audio is the media — waveform must read live/playable · **not** a flat “Voice note” text chip only |
| Truncate | Duration always visible · never ellipsis the time · phone never-truncate |

---

## D) Explicit OUT

| OUT | Why |
|-----|-----|
| Mic on Social write / create | Adam §0.4.1 — dead on that surface |
| Speech→text as DM mic product | Adam — audio bubbles |
| Sticker / call leading row | Quiet chrome · OUT |
| Camera missing or not far-right on DM compose | Adam 2026-09-25 — camera far-right (cite write §0.4.2) |
| Full-screen record stage / 220 disc | Composer-local only |
| IG dark / glow / Apple brand | Grammar only |
| Audio-as-feed-post | Not locked · out of scope |
| Absorb into #681 write-compose | Separate surface |

---

## Must-fix

1. Mic **only** on DM thread composer · OUT everywhere else named above.  
2. Hold→record · release→send · cancel slide · max 60s auto-send.  
3. Text empty = mic · text present = Send (mic hides).  
4. Waveform bubbles mine/theirs · play in place · height 40 · max-width 240.  
5. Immersive thread chrome kept · house light · 8/16/24/48 · no shadows.  
6. No speech→caption mic on Social write (cite write-compose §0.4.1).  
7. Camera **far-right** always on DM composer (Adam PASS amend).

---

## Done-when

1. Phone DM: empty composer shows trailing mic · hold sends waveform bubble.  
2. Typing swaps mic→Send.  
3. Bubble plays in thread · Immersive Social / not paper chip.  
4. Social write compose has **no** mic.  
5. Tip cites this lock · CoS CLEAR Dev · no Design PR.

**Ship:** Design Own→READY · CoS seed `docs/design-locks/dm-voice-note-lock-v1.md` · route Dev when capacity (not #681).
