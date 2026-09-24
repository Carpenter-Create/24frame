# [GC][24Frame] LOCK — DM thread message format v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam 2026-09-24 — *“Update the design on direct messages… more in a message format where you see the date and time”* · FAIL shots attached) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation:** `docs/design-locks/dm-thread-message-format-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/dm-thread-message-format-lock-v1.md`  
**Adam FAIL (center log · no date/time):**  
`/workspace/24frame-agg-ux/dm-thread-refs/01-adam-fail-center-log-header.png`  
`…/02-adam-fail-center-story-stack.png`  
`…/03-adam-fail-mixed-bubble-center-share.png`  
`…/04-adam-fail-center-share-composer.png`  
**IG PASS (date · time · side-aligned share):**  
`/workspace/24frame-agg-ux/dm-thread-refs/05-ig-pass-date-time-side-share.png`  
(= `ig-send-refs/06-dm-story-card.png`)  
**Doctrine:** **Media Immersion Doctrine** (Adam 2026-09-24) — story shares stay immersive live media, never flat thin cards pasted into a center activity log.  
**Bar:** IG DM thread grammar · house light shell · Sporty Blue accent where mine CTA already is. Soft / flat / pasted = FAIL.  
**Cites (do not reopen):** `stories-send-dm-craft-lock-v1.md` **v1.5** — card 168 / 9:16 live · optional comment bubble · copy **You sent @{authorHandle}’s story** · same-host fullscreen · behind-sheet pause.  
**Out of scope:** Send sheet / #677 focus-crash (Dev) · heart · #664 · inbox list · ADD PEOPLE / group-admin chrome · inventing dark-mode thread · redesigning composer icons beyond sticky bottom Message row

---

## One lock

DM conversation is a **chat thread**, not a center-aligned activity log. Day and time are always visible. Mine content trails right; theirs leads left. Story-share groups follow the same side rules and keep the immersive 168 / 9:16 live card from Send craft v1.5.

---

## A) Thread column

| Token | Lock |
|-------|------|
| Surface | Light · bg `#FAFAFB` / surface `#FFFFFF` · ink `#14171A` |
| List | Single vertical column · full width · pad horizontal **16** · gap between groups **8** · gap within group **4** |
| Center log | **OUT** — no `align-items: center` stack of story cards + system lines |
| Scroll | Newest at bottom · stick to bottom on send |

---

## B) Date + time (Adam requirement — always visible)

IG cite (ref 05): centered **date** cluster headers and centered **time** cluster headers; content stays side-aligned under them.

| Token | Lock |
|-------|------|
| Day separator | When calendar day changes · **centered** · `t-body-sm` · secondary `#5E646E` · uppercase tracked OK |
| Day format | **Today** · **Yesterday** · else **Sep 24, 2026** (user locale · America/Chicago) |
| Time separator | When sender burst gap ≥ **5 min** OR first item after a day separator · **centered** · `t-body-sm` · secondary |
| Time format | **10:09 AM** (user locale 12h) |
| Placement | Between clusters · never only on long-press · never hidden |
| Per-bubble clock | **OUT** as the only time (IG cluster time is the SoT) · optional tiny trailing time under last bubble in a burst is OK **in addition**, same format, secondary `t-label` · side-aligned with that burst |
| Missing timestamp data | Dev must render real `created_at` · fixture OK in sketch only if labeled FIXTURE |

---

## C) Alignment — message format

| Kind | Mine (viewer sent) | Theirs (received) |
|------|--------------------|-------------------|
| Text bubble | Trailing / right · max-width **75%** | Leading / left · max-width **75%** |
| Story-share group | Trailing / right | Leading / left |
| System share line | Same side as group · **not** viewport-center | Same |
| Avatar (theirs only) | — | **28** circle left of first bubble in burst · omit on consecutive |

### Text bubble chrome (keep house · fix format)

| Token | Lock |
|-------|------|
| Mine fill | Muted `#F4F4F6` (existing “Testing” keep) · ink text |
| Theirs fill | `#FFFFFF` · hairline `#ECEDF0` · ink text |
| Radius | **18** |
| Pad | **8** / **12** |
| Type | `t-body` `0.9375rem` |
| Sporty Blue text bubble | **OUT** this lock (accent stays Send CTA / checks elsewhere) |

---

## D) Story-share group (amends presentation only; card geometry stays v1.5)

Order top → bottom inside the side-aligned group:

| # | Element | Lock |
|---|---------|------|
| 1 | Optional comment | Mine/theirs text bubble with typed comment (Send lock C) |
| 2 | System line | **You sent @{authorHandle}’s story** (mine) · **Sent you a story** / **{displayName} sent @{authorHandle}’s story** (theirs) · `t-body-sm` secondary · **side-aligned with group** · max-width = card width |
| 3 | Story card | Width **168** · media **9:16** `object-cover` · radius **8** · hairline · **live** `SocialFeedVideo` / photo cover · author chip avatar **24** + handle + **Story** · Media Immersion — not a thin pasted feed tile |
| 4 | Tap | Same-host fullscreen / Stories viewer per Send lock |

| Token | Lock |
|-------|------|
| Centered story stack | **OUT** (Adam FAIL 01–04) |
| Raw URL | **OUT** |
| Card wider than 168 to “fill” center | **OUT** |

---

## E) Composer (thread chrome only — no invent)

| Token | Lock |
|-------|------|
| Host | Sticky bottom above phone tab / safe-area |
| Field | Single pill/row **Message…** · height **40** · radius **20** · muted fill or hairline |
| Send | Trailing icon or compact control · **not** a second full-width Sporty Blue block stacked under a tall textarea (FAIL shot 04 pattern) |
| Focus | Must **not** navigate away from the thread (Dev #677 crash is separate; this lock forbids route-out as craft PASS) |

---

## Dev ship checklist (one line)

**Ship:** DM thread = chat · day + time cluster headers always visible (Today/Yesterday/Sep 24, 2026 · 10:09 AM) · mine right / theirs left · story-share groups side-aligned with 168/9:16 live card · system line side-aligned · center activity log OUT · cite Send craft v1.5 for card/copy · Media Immersion · no #677 sheet invent · no #664.

---

## FAIL / PASS

**PASS:** Looks like a message thread · date and time readable without long-press · shares sit on the sender’s side · card still immersive.  
**FAIL:** Center-aligned log (Adam shots) · no date · no time · flat pasted center cards · soft-grade cousin · restarting Send sheet craft.

---

## Keep closed

- `stories-send-dm-craft-lock-v1.md` v1.5 — send flow + card geometry + pause  
- `stories-viewer-ig-actions-lock-v1.md` — heart / reply / plane  
- `stories-viewer-ig-parity-lock-v1.md` — #664  

---

## Label

**[Global Content][24Frame]** DM thread message format v1 — chat alignment + visible date/time
