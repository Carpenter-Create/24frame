# [GC][24Frame] LOCK — Social Home composer FB-row+sheet v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam 2026-09-24 · #681 composer FAIL · CoS Own→READY · Design picks **one** pattern) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · Adam glances lock before Dev ships · CoS CLEAR → Dev amend #681 (stay DRAFT)  
**Repo citation:** `docs/design-locks/social-home-composer-fb-row-sheet-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/social-home-composer-fb-row-sheet-lock-v1.md`  
**Pattern chosen:** **FB-row+sheet** (not X-style)  
**Why (one line):** One FB Home row with icon-only media hits right of the field kills the clunky two-row stage without inventing X compose that fights the Create dock and locked Immersive Home spine.  
**Adam glance fail:** `/workspace/24frame-agg-ux/social-home-681-adam-glance.png` — rest of Home good · composer two-row PHOTO/CAMERA = **FAIL** (“too clunky”)  
**Refs:** `/workspace/24frame-agg-ux/home-composer-ref-fb-row.png` (FB Home row) · `/workspace/24frame-agg-ux/home-composer-ref-24frame-figma-row.png` (24Frame single-row craft) · existing Create sheet = FB New post analogue  
**Supersedes (composer stage only):** `social-home-spine-density-lock-v1.1.md` §A (two-row Photo · Camera under pill) — **B Stories / C Topics / D packing / feed bleed stay**  
**Keeps:** `social-home-composer-share-copy-lock-v1.md` (**Share something**) · spine density v1.1 Stories **136×240** / Topics **32** / gaps **8** / bleed · `stories-home-rail-card-identity-lock-v1.md` (avatar-only user cards) · Create dock  
**Gospels:** Launch-great ASAP · Media Immersion · Immersive Social / Home north star · quiet redundant-chrome (icon XOR label — icons only here) · spacing 8/16/24/48 · phone never-truncate · never-patch  
**Out:** Current two-row stage as final · Live/Feeling Meta strip · multicolor glyph strip · X-style compose invent · Dev guessing · **Write something** · soft polish on the clunky row · labeled Photo · Camera text under the pill

---

## One lock

Phone Social Home composer is a **single FB-style row**: avatar + **Share something** pill + **icon-only** Photo and Camera **right of** the field. Tap prompt/avatar opens the **existing** Create sheet (FB New post analogue). Tap Photo / Camera opens that sheet on the matching face. No second affordance row. No X compose product.

---

## Pattern decision

| Option | Verdict |
|--------|---------|
| **FB-row+sheet** | **OWN** — familiar Home grammar · one-fold · media hits without stacked labels · sheet already ships |
| X-style compose | **OUT** — replaces the locked Home share stage · competes with Create dock · bigger invent for the same Adam miss |

---

## Phone SoT (concrete)

| Token | Lock |
|-------|------|
| Host | Surface `#FFFFFF` · hairline `#ECEDF0` · radius **16** · pad **16** · full center width |
| Layout | **One row** · `flex` · `align-items: center` · gap avatar→pill **12** · gap pill→icons **8** |
| Avatar | **40** · left · tap = Create sheet default |
| Pill | Flex **1** · min-width **0** · height **40** · radius **20** · fill `#F4F4F6` · pad H **16** · **Share something** · `t-body` / `text-ink-2` · tap = Create sheet default (current 24Frame text / Write face — **do not** invent a new sheet) |
| Icons | **Right of** the pill (outside the pill, same row) · order **Photo** then **Camera** · **two hits only** |
| Icon chrome | Icon glyph **20** · hit **40×40** · gap between hits **8** · stroke/fill **ink-2** / greyscale · **no** text labels · **no** Sporty Blue fill on idle icons |
| Press Photo | Existing Create sheet on **Photo / library** face — no new upload product |
| Press Camera | Existing Create sheet on **Take / camera** face — no new camera product |
| Stage height | ~**72** (16+40+16) — recovers the ~48 vertical tax of the two-row stage |
| Create dock | Unchanged |
| Desktop | Same row grammar · same icons right of field · same sheet targets (scale follows house desktop composer width — **no** separate invent) |

---

## Quiet redundant-chrome cite

Photo and Camera are **icon-only**. Do **not** also burn a second row of **PHOTO / CAMERA** labels. Same class as Stories rail avatar XOR name and DM name XOR handle. Soft “keep labels for clarity” = **FAIL**.

---

## Explicit OUT

| OUT | Why |
|-----|-----|
| Two-row stage (prompt + Photo · Camera labels under) | Adam FAIL — too clunky |
| Live / Feeling / Activity Meta strip | Loud · not 24Frame · not asked |
| Multicolor FB glyph pack | House = greyscale + one Sporty Blue accent elsewhere — not here |
| X full-screen / compose-first Home | Pattern rejected for this miss |
| Thin single pill with **no** media hits | Loses media share affordance Adam still wants via FB-row |
| Inventing a new New-post sheet | Use current Create sheet |
| **Write something** prompt | Share-copy lock |

---

## FAIL / PASS

| PASS | FAIL |
|------|------|
| One row · Share something · Photo + Camera icons right of field | Two-row PHOTO/CAMERA under pill |
| Icons unlabeled · ink-2 | Labeled second row or Meta color strip |
| Tap opens existing Create sheet (default / photo / camera faces) | New compose product or X invent |
| Stage ~72 · Stories/Topics densify from v1.1 still visible | Soft polish on clunky row |
| Share something kept | Write something returns |

---

## Amend note (spine density)

`social-home-spine-density-lock-v1.1.md` §A is **superseded** by this lock. Keep §B Stories **136×240**, §C Topics chip **32**, §D gaps **8** + feed bleed. Dev amend #681 cites **this** lock for composer + v1.1 for the rest.

---

## Done-when (CoS → Adam glance → Dev)

1. Phone Home composer = **one** FB-row · avatar + **Share something** + icon-only Photo · Camera right of field.  
2. Prompt/avatar → existing Create sheet · Photo/Camera → matching faces.  
3. No two-row stage · no Live/Feeling · no X invent · no Write something.  
4. Spine Stories/Topics/gaps/bleed + rail identity locks unchanged.  
5. Adam glances **this lock** (pass) before Dev ships · #681 stays DRAFT until then.  
6. No Design PR.

**Ship:** Design Own→READY · CoS CLEAR after Adam lock glance · Dev amend #681 · Design HOLD invent else.
