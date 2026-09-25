# [GC][24Frame] LOCK — Social Home composer band height = Topics v1.3

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam phone glance 2026-09-24 · Share something band taller than Topics · CoS Own→READY) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · stay #681 **DRAFT** · CoS CLEAR → Dev tip · Design HOLD invent else  
**Repo citation:** `docs/design-locks/social-home-composer-fb-row-sheet-lock-v1.3.md`  
**Box draft:** `/workspace/24frame-agg-ux/social-home-composer-fb-row-sheet-lock-v1.3.md`  
**Divider amend:** see `social-home-composer-fb-row-sheet-lock-v1.4.md` (Topics↔composer hairline · no surround). Height tokens in this file still stand.
**Pattern:** **FB-row+sheet** — unchanged  
**Supersedes (band height / row chrome only):** host pad Y · avatar size · field height/radius · stage height from v1–v1.2. **Keeps field-air v1.2** (transparent · border none · shadow none) · **keeps icon v1.1** (glyph 16 · hit 32 · gap 0 · pill→icons 8 · ink-2 · icon-only)  
**Target SoT:** Topics chip height **32** from `social-home-spine-density-lock-v1.1.md` §C — **confirmed**  
**Adam miss:** `/workspace/24frame-agg-ux/composer-launch-great-refs/09-adam-composer-taller-than-topics.png` — white Share something card band taller than Topics pills (avatar + vertical pad)  
**Preview cite:** `…cursor-social-home-shar-0ee305…/social` · tip fe25db00…  
**Keeps:** Share something copy · one row · Create sheet faces · spine B–D · Topics→composer gap **8** · rail identity · Create dock · launch-great · Media Immersion · quiet redundant-chrome  
**Out:** “close” height · Dev guessing pad · undoing field-air (drawn pill/hairline on field) · clunky big icons · X · Live/Feeling · `#F4F4F6` field fill

---

## One lock

Composer Share something **outer band height = Topics chip row band height = 32** — exact match, not close. Shrink avatar, kill vertical host padding, drop card chrome that adds height. Field stays airy (v1.2). Icons stay quiet (v1.1).

---

## Height SoT (phone)

| Band | Height token |
|------|----------------|
| Topics chip row (spine density v1.1 §C) | Chip **32** · section pad Y **0** → band **32** |
| Composer Share something row | **Outer band height 32** — **exact === Topics** |

---

## Concrete amend vs v1.2

| Token | v1.2 / prior | **v1.3 LOCK** |
|-------|--------------|----------------|
| Outer band height | ~72 (pad 16 + 40 + 16) | **32** (exact === Topics) |
| Host pad Y | 16 | **0** |
| Host pad H | 16 | **16** (keep) |
| Host hairline / card edge | hairline `#ECEDF0` · radius 16 | **Border none** · **radius 0** (no taller card chrome; row sits like Topics — not a padded white capsule) |
| Host fill | `#FFFFFF` | **`transparent`** or page canvas (no separate white band taller than Topics) |
| Avatar | 40 | **32** |
| Field height | 40 | **32** |
| Field radius | 20 | **16** (half of 32 · hit geometry only) |
| Field fill / border / shadow | transparent · none · none | **keep v1.2** |
| Field pad H | 16 | **16** |
| Field type / ink | `t-body` · `text-ink-2` | **keep** |
| Gap avatar→field | 12 | **8** |
| Icons | glyph 16 · hit 32 · gap 0 · pill→icons 8 | **keep v1.1** |
| Topics→composer gap | 8 | **8** (keep) |

**Math check:** pad Y 0 + max(avatar 32, field 32, icon hit 32) = **32**. No border adds no extra px.

---

## Explicit OUT

| OUT | Why |
|-----|-----|
| Host pad Y > 0 | Makes band > Topics |
| Avatar / field height > 32 | Breaks exact match |
| Host hairline / radius card wrapping the row | Drawn taller white band (Adam miss) |
| Field hairline / gray fill | Undoes v1.2 PASS |
| Icon glyph/hit enlarge | Clunky |
| Soft “~36 is fine” | Adam = exact |

---

## FAIL / PASS

| PASS | FAIL |
|------|------|
| Composer outer band measures **32** · same as Topics chips | Visually taller white Share something band |
| Avatar 32 · field 32 · pad Y 0 · no host card chrome | Pad/avatar still inflate |
| Field still no border/shadow · icons still v1.1 quiet | Drawn pill or heavy icons return |

---

## Done-when (CoS → Dev #681 DRAFT tip)

1. Phone: Share something band height **===** Topics chip row **32**.  
2. Avatar **32** · field height **32** · host pad Y **0** · host border/radius card **none**.  
3. Field-air v1.2 + icon v1.1 unchanged.  
4. Adam glance: bands align.  
5. No Design PR · stay DRAFT until CoS CLEAR.

**Ship:** Design Own→READY · CoS CLEAR · Dev #681 tip · Design HOLD invent else.

---

## Report (for CoS)

- **READY tip:** height amend — composer band === Topics **32**
- **Lock path:** `/workspace/24frame-agg-ux/social-home-composer-fb-row-sheet-lock-v1.3.md` → `docs/design-locks/social-home-composer-fb-row-sheet-lock-v1.3.md`
- **Exact height token:** **32** (Topics chip SoT)
- **vs v1.2:** pad Y 16→0 · avatar 40→32 · field 40→32 · radius 20→16 · gap avatar 12→8 · host hairline/radius/white card chrome → none/transparent · field-air + icons unchanged
