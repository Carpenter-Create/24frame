# [GC][24Frame] LOCK — Write compose voice-first immersive v1

**Date:** 2026-09-25 (CT)  
**Status:** **LOCKED** · Design Own→READY cite-only · **Amend:** media-attached preview (Adam 2026-09-25) · Design no PR · CoS tip-first CLEAR Dev #681 · stay DRAFT  
**Repo:** `docs/design-locks/write-compose-voice-first-immersive-lock-v1.md`  
**Box:** `/workspace/24frame-agg-ux/write-compose-voice-first-immersive-lock-v1.md`  
**FAIL:** `/workspace/24frame-agg-ux/write-compose-thin-card-adam-fail-2026-09-25.png` (thin CAPTION) · `/workspace/24frame-agg-ux/write-compose-photo-attach-no-preview-adam-fail-2026-09-25.png` (text-only Photo·Remove · **no** image face)  
**Grammar ref only:** `/workspace/24frame-agg-ux/write-compose-voice-first-chatgpt-ref-2026-09-25.png` (big voice center · compact bottom Ask-bar — **not** ChatGPT brand / orb / dark)  
**Media grammar ref only:** `/workspace/24frame-agg-ux/write-compose-photo-preview-instagram-ref-2026-09-25.png` (preview **above** caption — **not** IG dark / brand / New-post chrome invent)  
**Keeps from** `write-compose-immersive-icons-lock-v1.md`: edge-to-edge · hide Social header+dock · media icons-only · X + Post  
**Entry unchanged:** `share-something-text-write-direct-lock-v1.md`  
**Standing:** Immersive Social · Media Immersion · launch-great · quiet redundant-chrome · phone never-truncate · spacing **8 / 16 / 24 / 48**

---

## One lock

**House-light full-viewport write compose is voice-hero first (no media). When photo/video is attached, show a real preview above the caption — caption stays the write focus. Kill thin CAPTION card and text-only Photo·Remove.**

---

## 1 — Host (immersive)

| Token | Lock |
|-------|------|
| Fill | House light **`#FFFFFF`** edge-to-edge (safe-area only) |
| Gutters | **0** side · **0** floating card · **0** grey page ring |
| Kill | Bordered CAPTION box · **CAPTION** label · form-well chrome · dead empty white under a short card (`write-compose-thin-card-adam-fail-2026-09-25.png`) |
| Shell | Hide Social top chrome + bottom tab dock while open · restore on dismiss (same as v1) |
| Author | Optional quiet identity under top chrome (avatar **32** + name) — **no** form section plate |

**Desktop:** one immersive full overlay / centered column (**max 680** ok) — same voice-hero + bottom bar grammar · **no** phone-card-with-gutters cousin.

---

## 2 — Voice hero (primary)

| Token | Lock |
|-------|------|
| Placement | **Centered** in the viewport above the bottom bar (optical center of remaining stage) |
| Size | Soft face **192×192** circle (diameter **192**) |
| Glyph | House Phosphor **microphone** idle weight · glyph **48** centered — **or** soft house voice viz (muted wash / ring). **NOT** ChatGPT orb mark · not their chrome |
| Fill idle | Muted `#F4F4F6` · ink/`text-ink-2` mic |
| Listening | Soft Sporty Blue `#1769FF` ring **2px** outside face · calm pulse ≤ house motion (no parody glow orb) |
| Recording | Same face · stronger Sporty Blue wash (~8–12% fill) + ring · still house-calm |
| Hit | Full **192** face is the tap target (start/stop voice) · `aria-label` Voice / Stop |

---

## 3 — Text secondary (compact bottom bar)

| Token | Lock |
|-------|------|
| Role | Secondary to voice — ChatGPT **“Ask…”** grammar only (compact bar · expands on type) |
| Idle bar | Height **48** · radius **24** (pill) · fill `#F4F4F6` · pad H **16** · inset from edges **16** · above safe-area / keyboard |
| Placeholder | `t-body` · `text-ink-2` · **Share something** (cite share-copy — not “Ask ChatGPT”) |
| Expand | Tap bar → keyboard · bar grows to multi-line compose (min height **48** → content; max ~40vh) · voice hero may scale down or hold · **no** return to bordered CAPTION card |
| Mic-in-field | **OUT** — no microphone inside a caption text box |

---

## 4 — Chrome keep (cite v1)

| Token | Lock |
|-------|------|
| Close | **X** top-leading · hit **44×44** · glyph **22** |
| Post | Sporty Blue primary · top-trailing (compose chrome — **not** thin-card footer floating in dead white) |
| Following / audience | Keep if already on face · **don’t** redesign IA this tip |
| Media icons | Photo + video · glyph **24** · hit **40** · gap **8** · icons only · sit in bottom cluster (above or leading the text bar) · aria ok |

---


## 5 — Media attached (Adam amend NOW)

Instagram **New post** grammar only: **visible media preview above caption**. Caption stays the primary write focal point. Voice hero **yields**.

| Token | Lock |
|-------|------|
| When | Any photo or video attached on this compose |
| Preview | **Real image/video face** object-cover · full width minus inset **16** · radius **16** · max-height **50vh** · sits **above** the caption/write focus |
| Order (top→bottom) | X/Post chrome → (quiet author) → **media preview** → **caption write** → media icons / Following as kept |
| Caption | Primary write focal point under preview · house light · **no** CAPTION label · **no** bordered form well · expandable field / bottom bar grown for type |
| Voice hero | **Yields** — hide or collapse the **192** voice face while media is attached · restore when all media removed |
| Remove | Control **on/near** preview (corner hit **40** · glyph **20** X or trash · or quiet “Remove” beside preview) — never text-only **Photo · Remove** with **no** image |
| Video | Same preview slot · show poster/frame · play chevron optional calm · not a second layout |
| House | Light `#FFFFFF` stage · Sporty Blue only for Post / active — **OUT** IG dark theme |

**FAIL:** `write-compose-photo-attach-no-preview-adam-fail-2026-09-25.png` — “Photo · Remove” text row · no preview face.  
**PASS:** Attached media reads as a post preview above caption (IG order · house light).

## Explicit OUT

| OUT | Why |
|-----|-----|
| ChatGPT brand / orb mark / “Ask ChatGPT” copy | Grammar only |
| Dark theme invent | House light |
| Bordered CAPTION + label form chrome | Adam thin FAIL |
| Mic inside caption field | Voice hero owns mic |
| Layout menu / soft card cousins | Adam already picked |
| Groups · undraft | Not this |
| #682 · #683 | Separate |
| Changing Share something entry | Cite entry lock only |
| Text-only “Photo · Remove” (no preview face) | Adam media FAIL |
| IG dark / IG brand / New-post chrome invent (Poll/Prompt/audio) | Grammar = preview-above-caption only |

---

## Must-fix (vs tip FAIL)

1. Kill CAPTION label + bordered field + mic-in-field.  
2. Big centered voice face **192** · idle / listening / recording.  
3. Compact bottom Share something bar · expand on type only.  
4. Edge-to-edge `#FFFFFF` · shell+dock hidden · Post/X in chrome.
5. Media attached → visible preview **above** caption · voice hero yields · Remove on/near preview.

---

## Done-when

1. Phone glance = voice-hero immersive · not thin form card.  
2. Tokens above match (192 · bar 48/24/16 · icons 24/40/8 · X 44).  
3. Media attached shows preview above caption · no text-only Photo·Remove.  
4. Tip cites this lock · stay DRAFT · no Design PR.

**Ship:** Design Own→READY · CoS CLEAR Dev tip-first #681.
