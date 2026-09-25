# [GC][24Frame] LOCK — Social Home post action icons even align v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam phone glance FAIL 2026-09-24 · heart optically higher · uneven heart→bubble vs bubble→plane gaps · CoS tip-first CLEAR Dev · Design seed parallel/after · house speed — no invent bounce) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · Design HOLD invent else  
**Repo citation:** `docs/design-locks/social-home-post-actions-align-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/social-home-post-actions-align-lock-v1.md`  
**Adam miss shot:** `/workspace/cloud-agent-artifacts/adam-glance/post-actions-uneven-fail.png`  
**Scope:** Social Home **post action row** only — Like (heart) · Comment (bubble) · Share (plane). Same component on phone + desktop.  
**Hold (do not reopen):** `social-home-composer-fb-row-sheet-lock-v1.6.md` · `social-home-topics-vertical-center-lock-v1.md` · `social-mobile-full-bleed-lock-v1.md`  
**Out of this tip:** Stories (#682) · invent other Home chrome · production PR from Design  
**Gospels:** Launch-great ASAP · Immersive Social · quiet redundant-chrome · Mercury sharpness + Circle air · spacing **8 / 16 / 24 / 48**

---

## One lock

Like · Comment · Share read as **one even triplet**: **equal horizontal gaps** and a **shared vertical / optical baseline**. No heart sitting high. No first gap wider than the second.

---

## Concrete SoT (phone + desktop — same component)

| Token | Lock |
|-------|------|
| Row | `flex` · `items-center` · `flex-row` · order L→R: **Heart** · **Comment** · **Share** |
| Hit | **Identical** for all three: **40×40** |
| Glyph | **Identical** painted box for all three: **24×24** centered in the hit |
| Gap hit↔hit | **16** (equal — heart→bubble **===** bubble→plane) |
| Vertical | Hits share one centerline (`items-center`). Glyphs **optically centered** in each hit so ink mass reads on one baseline — heart must not sit higher than bubble or plane |
| Optical nudge | Prefer equal viewBox / equal SVG box first. If a glyph’s mass still reads high (common on Heart), nudge **that glyph only** inside its 24 box by **≤1px** — never change hit size or gap to fake align |
| Ink idle | Secondary / `#5E646E` outline · no fill plate · no Sporty Blue idle |
| Liked | Heart fill + stroke **Sporty Blue `#1769FF`** (existing like behavior) · Comment/Share unchanged |
| Press | Opacity **0.7** only · **no** bounce / scale pop |
| Pad under media / under author | Keep existing inset from full-bleed lock (actions stay inset · media/dividers full-bleed) — **do not** invent new row pad this tip |
| Counts | Keep **below** the icon row (e.g. “1 likes”) — **do not** invent count beside heart this tip |

**Feel bar:** Quiet IG-feed triplet — even, sharp, launch-great. Same job → same number.

---

## Explicit OUT

| OUT | Why |
|-----|-----|
| Unequal gaps (heart→bubble ≠ bubble→plane) | Adam FAIL |
| Heart optically higher than bubble / plane | Adam FAIL |
| Different hit sizes or ad-hoc padding per icon | Causes uneven gaps |
| Gap invent off scale (12, 10, 14…) | House scale only — lock is **16** |
| Composer / Topics / full-bleed reopen | Hold — PASS surfaces |
| Stories viewer / #682 fold-in | Separate tip |
| Labels under icons · fourth action invent | Not asked |

---

## FAIL / PASS

| PASS | FAIL |
|------|------|
| Three 40 hits · 24 glyphs · gap **16** equal | Uneven gaps or mixed hit sizes |
| Heart · bubble · plane share one optical baseline | Heart sits high |
| Phone + desktop same component tokens | Desktop cousin invent |
| Composer + full-bleed untouched | Scope creep |

---

## Done-when

1. Heart / bubble / plane optically level.  
2. Horizontal gaps equal at **16** between identical **40** hits.  
3. Adam glance: even triplet under post media.  
4. No Design PR · tip-first already CLEARED.

**Ship:** Design Own→READY (parallel/after) · CoS cite → Dev · Design HOLD invent else.

---

## Report (for CoS)

- **READY:** Social Home post actions even align — equal gap **16** · hit **40** · glyph **24** · shared optical baseline  
- **Lock path:** `/workspace/24frame-agg-ux/social-home-post-actions-align-lock-v1.md` → `docs/design-locks/social-home-post-actions-align-lock-v1.md`
