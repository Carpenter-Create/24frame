# [GC][24Frame] LOCK — Stories send DM craft v1.4

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam HARDEN 2026-09-24 — *“parody, but literally do everything precisely like that including the design”* · sheet morph · optional comment) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS re-routes Dev  
**Repo citation:** `docs/design-locks/stories-send-dm-craft-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/stories-send-dm-craft-lock-v1.md`  
**Pixel SoT (Adam IG, order 1→6):**  
`/workspace/24frame-agg-ux/ig-send-refs/01-viewer-paper-plane.png`  
`…/02-share-sheet-grid.png`  
`…/03-search-self.png`  
`…/04-select-message-send.png`  
`…/05-centered-sent-toast.png`  
`…/06-dm-story-card.png`  
**Bar:** Precise Instagram parity for Stories **Send** — workflow **and** visual. **Not** house-soft approximation. **Not** “inspired by.” Fail = soft-grade. E8 / FB-IG highest commercial grade.  
**Supersedes:** v1.3 white AppSheet soft sheet · bottom toast (already out) · list-only picker · missing same-sheet morph · missing DM comment placement  
**Keeps:** self recipient · live `SocialFeedVideo` / same-host fullscreen · no raw URL · #677 · heart untouched · no #664  
**Accent parody:** IG blue → house **Sporty Blue `#1769FF`** only (Send CTA · selection check). Everything else matches IG dark send chrome from refs.  
**Out of scope:** #664 · thumbs · public comments thread · share-to-feed / Copy link / Add to story / Facebook / OS Share row · inventing a **second** modal after select

---

## One lock

Paper plane opens one **IG-dark share drawer** over the story. Recipient select **morphs that same drawer** (checkmark · Write a message… · Send) — **never** a different modal. Success → **centered dark Sent** toast on the undimmed story. DM shows optional comment + **You sent @{author}’s story** + live story card.

---

## A) Sheet — one host, two states (morph)

**Host:** one bottom drawer over the Stories viewer for the whole send. Phone: bottom sheet. Desktop: same visual grammar centered/docked as a single overlay — **still one host**, not Dialog-then-another-Dialog.  
**Motion:** expand/collapse footer on select **≤220 ms** ease · no remount flash · no route change.

### Measured chrome (from refs 02 / 04 · ~1206×2622)

| Token | Lock (precise) |
|-------|----------------|
| Sheet fill | Near-black **`#181818`** (sampled ~`#181818` / `#282830`) · slight translucency OK · story visible above |
| Top radius | **16** |
| Grab | Centered pill ~**36×4** · white @ ~40% |
| Height | ~**65–75%** viewport (content) · max **90vh** · body scrolls |
| Scrim above sheet | Story dimmed while sheet open (ink @ ~**40%**) |
| Pad | Horizontal **16** · top under grab **16** · bottom **16** + safe-area |
| Shadow | **None** |

### State 0 — pick (refs 02 · 03)

| Token | Lock |
|-------|------|
| Search row | Height **40** · radius **20** (pill) · fill `#2A2A2E` · icon + placeholder **Search** white/secondary · trailing **create-group** control hit **40** (people+ icon) — precise IG affordance |
| People | **3-column** grid · column gap **16** · row gap **16** |
| Avatar | **56** circle |
| Name | Under avatar · `t-body-sm` · white · 1-line truncate · center |
| Self | **Required** in grid + searchable (note-to-self) · same cell · no special badge except selection check |
| Search results | List rows when query active (ref 03): avatar **40** · display `t-body` medium · `@handle` `t-body-sm` secondary · Cancel trailing · includes self hits |
| Meta platform row | **OUT** (Copy link / Add to story / Facebook / Share to…) — paper plane = send-via-DM only |

### State 1 — selected (ref 04) — **same drawer morphs**

| Token | Lock |
|-------|------|
| Trigger | Tap a person (incl. self) |
| Forbidden | Opening a **new** modal/sheet/page for compose |
| Check | Sporty Blue `#1769FF` circle **20** · white check · avatar **bottom-right** |
| Select rule | **Single** recipient (one check); tap other moves check; tap same clears → back to State 0 |
| Grid | Stays visible (may compress/scroll) — IG-like context retained |
| Message field | **Appears** in sheet footer · placeholder **Write a message…** · height **40** · radius **20** pill · fill `#2A2A2E` · white text · **optional** |
| Send CTA | Full width · height **48** · radius **24** (pill) · bg **Sporty Blue `#1769FF`** · label **Send** white medium · disabled until one recipient selected |
| Empty comment | **Send still works** — story card only in DM |

---

## B) Sent toast (ref 05) — supersedes any bottom toast

| Token | Lock |
|-------|------|
| When | Success only · after sheet fully dismissed |
| Placement | **Exact center** of viewport over Stories viewer |
| Story | **Visible + undimmed** (scrim gone) |
| Shape | Capsule · content-hug · pad **8** / **16** · radius **8** (full pill OK) |
| Fill | Ink-dark **`#181820`** (sampled near `#181820` / `#404040` edge) |
| Type | **Sent** · white · `t-body-sm font-medium` · **no** icon |
| Life | **2000 ms** autodismiss |
| A11y | `role="status"` · `aria-live="polite"` |
| OUT | Bottom `InlineNotice` · green success · checkburst · recipient name in toast |

---

## C) DM thread (ref 06 + optional comment ADD)

Order in the outgoing send group (**top → bottom**):

| # | Element | Lock |
|---|---------|------|
| 1 | Optional comment | If non-empty: **sender text bubble** (house DM bubble · mine alignment) with the typed comment · `t-body` · **above** the story share |
| 2 | System line | **You sent @{authorHandle}’s story** · `t-body-sm` · `text-ink-2` / secondary-on-dark · **centered** above the card (IG) |
| 3 | Story card | Width **168** · media **9:16** `object-cover` · radius **8** · hairline · **live** `SocialFeedVideo` for video · photo cover for still · author chip on card (avatar **24** + handle + meta **Story** or duration) |
| 4 | Tap | Video → fullscreen via **same** `SocialFeedVideo` / Mux / native host only · Photo → Stories viewer |

| Token | Lock |
|-------|------|
| Empty comment | Skip row 1 — system line + card only |
| Inbox excerpt | Prefer comment trunc · else **You sent @{author}’s story** · never raw URL |
| Raw URL body | **OUT** |

---

## D) Entry (ref 01)

Viewer bottom: keep reply pill · heart · **paper plane** (IG actions lock). Paper plane → this sheet State 0.

---

## Dev ship checklist (one line)

**Ship:** one IG-dark `#181818` drawer over story · Search+3-col+self+create-group icon · **same-sheet morph** on select (check · Write a message… · Sporty Blue Send pill 48) · empty comment OK · success → **centered** dark **Sent** 2000ms · DM = optional bubble → You sent @{author}’s story → 168/9:16 live card · same-host fullscreen · no second modal · no Meta share row · #677 only.

---

## FAIL / PASS

**PASS:** Pixel-close to refs 01–06 · same drawer morphs · self works · centered Sent · comment appears with card when typed · live video card.  
**FAIL:** White soft house sheet as the SoT · new modal after select · bottom toast · missing comment path · raw URL · soft-grade “inspired by.”

---

## Keep closed

- `stories-viewer-ig-actions-lock-v1.md` — heart / reply / plane entry  
- `stories-viewer-ig-parity-lock-v1.md` — #664  
- `SocialFeedVideo` / `SocialMuxPlayer` — fullscreen host  

---

## Label

**[Global Content][24Frame]** Stories send DM craft v1.4 — precise IG parody
