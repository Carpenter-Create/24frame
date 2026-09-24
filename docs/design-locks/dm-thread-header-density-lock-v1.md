# [GC][24Frame] LOCK — DM thread header density v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam 2026-09-24 — name + handle eat too much real estate · avatar + **one** label) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation:** `docs/design-locks/dm-thread-header-density-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/dm-thread-header-density-lock-v1.md`  
**Adam FAIL (stacked name + handle · wasteful real estate):**  
`/workspace/24frame-agg-ux/dm-thread-refs/01-adam-fail-center-log-header.png`  
**IG cite (compact peer chrome):**  
`/workspace/24frame-agg-ux/dm-thread-refs/05-ig-pass-date-time-side-share.png`  
**Principle:** Social → efficient real estate / density (Adam verbal 2026-09-24).  
**Companion to:** `dm-thread-message-format-lock-v1.md` (thread body · date/time · sticky composer §E) — **does not reopen** body/composer.  
**Out of scope:** #677 Send sheet · #678 sticky composer tip · #664 · inbox list · inventing group ADD PEOPLE IA · dark-mode invent

---

## One lock

Thread peer chrome is **one compact row**: back · **avatar 32** · **display name only** (1-line truncate) to the right of the avatar. Handle is **OUT** of the header. Phone and desktop share the same geometry.

---

## Label winner (concrete — not a menu)

| Choice | Lock |
|--------|------|
| **Wins** | **Display name** (e.g. Joshua K. Carpenter) |
| **Out of header** | Handle (`@theofficialJKC`) — live on profile, not the bar |
| Why | IG/Messenger chat bars lead with human name; handle is identity detail, not chrome |

Fallback if display name empty: show handle **without** `@` prefix as the single label (still one line — never both).

---

## Geometry (phone = desktop)

| Token | Lock |
|-------|------|
| Host | Sticky under app shell / workspace chrome · full width · surface `#FFFFFF` · bottom hairline `#ECEDF0` · **no** drop shadow |
| Row height | **48** |
| Pad inline | **16** |
| Back | Leading chevron · hit **40** · icon 20 · ink |
| Avatar | **32** circle · gap after back **8** · gap avatar→label **8** |
| Label | Display name · `t-body` `0.9375rem` · medium · ink `#14171A` · **1-line truncate** · grows/shrinks in remaining width |
| Trailing | Optional overflow/info hit **40** only if product already has it — **do not invent** new trailing icons this lock |
| Stacked hero | **OUT** — no large title block under the bar with name + handle (+ ADD PEOPLE) eating the message viewport |
| Second line handle | **OUT** |
| Name and handle both | **OUT** |

---

## Interaction

| Token | Lock |
|-------|------|
| Tap avatar or name | Navigate to that user’s profile |
| Tap handle | N/A in header (handle not shown) |

---

## Dev ship checklist (one line)

**Ship:** DM thread sticky peer row 48 · back 40 · avatar **32** · **display name only** (truncate) · handle OUT of header · same phone/desktop · kill stacked name+handle hero · cite message-format lock for body/composer · no Send/#664 invent.

---

## FAIL / PASS

**PASS:** One dense row · name beside avatar · messages get the viewport.  
**FAIL:** Name + handle both in chrome · stacked hero under bar · oversized title · handle-only when a display name exists · different loose desktop cousin.

---

## Keep closed

- `dm-thread-message-format-lock-v1.md` — body · date/time · composer sticky  
- `stories-send-dm-craft-lock-v1.md` v1.5 — Send  

---

## Label

**[Global Content][24Frame]** DM thread header density v1 — avatar + display name only
