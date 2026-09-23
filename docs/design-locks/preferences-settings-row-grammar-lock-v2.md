# [GC][24Frame] LOCK — Preferences settings-row grammar v2

**Date:** 2026-09-22 (CT)  
**Status:** **LOCKED** (Adam REJECT post-#651) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Supersedes (geometry only):** PrefDrillGroup **row layout**, **chevron alignment**, **inter-row rhythm**, and **column width** from `preferences-settings-row-grammar-lock-v1.md`. Block types (PrefDrillGroup vs PrefControlSection) and type steps from v1 **stay**.  
**Theme face value:** cites / hardens `theme-sot-auto-lock-v1.md` G4 (stored preference, not resolved appearance).  
**Evidence reject:** `/workspace/24frame-agg-ux/preferences-craft-reject-adam-2026-09-22.png` (Adam 2026-09-22 post-#651 — “looks wrong”)  
**Live:** `app.24frame.co/settings/preferences`  
**House:** Coinbase register · never-patch · phone never truncate · spacing 8 / 16 / 24 / 48

## One lock

Preferences PrefDrillGroup rows are **Coinbase horizontal drills**: one baseline — **label left**, **value + chevron trailing**, **vertically centered as a unit**. Not a stacked label-over-value with the chevron pinned to the label line.

PrefDrillGroup and the Notifications control card share **one column width** (same left and right edges).

---

## Ranked miss list (confirm / kill vs Adam reject shot)

| Rank | Observation | Verdict | Fix |
|------|-------------|---------|-----|
| **P0** | Stacked label-over-value + chevron on the **label** line | **CONFIRM** | Horizontal drill: label \| value + chevron; `items-center` on the full row |
| **P0** | PrefDrillGroup wider than Notifications card (right edges diverge) | **CONFIRM** | Both blocks = **100%** of settings content measure; same right edge |
| **P1** | Tall / loose air between Location and Theme inside the group | **CONFIRM** | Hairline only between rows; row `py` **12** only — no extra gap / margin |
| **P1** | Theme face shows **Light** | **CONFIRM rule** (shot may be accurate if preference is Light) | Face **must** show **stored** preference `Light` \| `Dark` \| `Auto` — **never** resolved appearance. If store is `auto`, face reads **Auto** even when OS resolved Light |

---

## PrefDrillGroup — structure (unchanged from v1)

1. Optional quiet group label above — **omit** when first Preferences block holds only Location · Theme.  
2. One muted inset module: `HOUSE_MODULE` / `SETTINGS_GROUP` · muted `#F4F4F6` · house module radius · horizontal pad **16**.  
3. Rows: hairline **between** rows only · **no** drop shadow · **no** extra vertical gap beyond row pad.

Inventory (order locked): **Location** then **Theme** — one group. No bare orphan rows on page white.

---

## SettingsDrillRow — geometry v2 (concrete)

### Default (desktop + phone when value fits one line)

| Token | Lock |
|-------|------|
| Layout | **Row** `display:flex` · `align-items:center` · `justify-content:space-between` · gap **16** |
| Hit | Min height **44** · vertical pad **12** (`space-3`) · full row press |
| Leading | Label only — **`t-body`** / 0.9375rem · ink `#14171A` · regular · one line |
| Trailing cluster | Value + CaretRight · `display:flex` · `align-items:center` · gap **8** |
| Value | **`t-body-sm`** / 0.8125rem · secondary `#5E646E` · one line · **right-aligned** in cluster |
| Chevron | Phosphor CaretRight **16** · ink-3 · optical center with value (not with label alone) |
| Horizontal | Group already pads **16**; no second competing row pad |

**Forbidden (Adam reject):** label stacked over value with chevron `align-self:start` / top-aligned to the label.

### Phone overflow only (never truncate)

When Location (or any value) cannot fit on one line beside the label without ellipsis:

| Token | Lock |
|-------|------|
| Layout | Left stack: label then value · gap **4** · stack takes remaining width |
| Chevron | Still **vertically centered on the full stack height** (`align-items:center` on the outer row) — never top-aligned to label |
| Value | Wrap fully · **no** ellipsis-as-escape |

Desktop stays horizontal; do not invent a second desktop stacked cousin.

---

## Inter-row rhythm

| Token | Lock |
|-------|------|
| Between Location and Theme | **1px hairline** only · **0** extra margin / padding between rows |
| Row internal | `py` **12** only |
| Group vertical pad | **0** beyond first/last row’s own `py` (or match existing SETTINGS_GROUP list SoT if it already uses **0** outer — do not add **24**/loose air inside the muted card) |

Kill the tall air visible in the reject shot between the two drills.

---

## Column width (PrefDrillGroup ↔ Notifications)

| Token | Lock |
|-------|------|
| Settings content measure | Both PrefDrillGroup **and** PrefControlSection body (Notifications muted card) are **100% width** of the same settings content column (`SETTINGS_CONTENT_MEASURE` / house settings measure — one token) |
| Right edge | PrefDrillGroup right edge **==** Notifications card right edge |
| Forbidden | Any child `max-width` / table shrink that shortens Notifications relative to PrefDrillGroup (or the reverse) |

Left edges already align in the reject shot; **right** edge is the miss.

---

## Type steps (keep from v1)

| Role | Lock |
|------|------|
| Drill label | `t-body` — **not** `t-heading`, not `t-label` |
| Drill value | `t-body-sm` ink-3 |
| Notifications title | `t-heading` / 1.5rem · helper `t-body-sm` · title→body **24** |

---

## Theme face on Preferences row

| Token | Lock |
|-------|------|
| Value string | Stored preference label only: **`Light`** · **`Dark`** · **`Auto`** |
| Not allowed | Resolved appearance (e.g. store=`auto` + OS light → show **Light**) |
| Cite | `theme-sot-auto-lock-v1.md` G4 — this miss list makes the fail visible on the Preferences summary row |

Header sun/moon still flips explicit light/dark and exits Auto (unchanged).

---

## Phone vs desktop

| | Phone | Desktop |
|--|-------|---------|
| PrefDrillGroup | Full content width · same inset group | Same group · same measure as Notifications |
| Row | Horizontal when fits; overflow stack + centered chevron | **Always** horizontal Coinbase drill |
| Notifications | PrefControlSection on-page **or** drill row per product — grammar must match block type | PrefControlSection on-page · card width matches PrefDrillGroup |

Hub list (Profile · Rights Holder · Preferences · Security) stays family **B** — out of scope.

---

## Explicit OUT

- Do **not** keep stacked label/value + top-aligned chevron as the default PrefDrillGroup row  
- Do **not** leave PrefDrillGroup and Notifications on different column widths  
- Do **not** add loose vertical gap between Location and Theme beyond hairline + row `py`  
- Do **not** show resolved theme on the Preferences Theme face  
- Do **not** restyle Notifications matrix as PrefDrillGroup chevron rows on desktop  
- Do **not** open a Design PR · do not invent a third Preferences block type  

## Gates

**G1.** Location + Theme = one PrefDrillGroup; horizontal Coinbase drill (or phone overflow stack with centered chevron).  
**G2.** Chevron vertically centered on the **full** row / stack — never label-line only.  
**G3.** PrefDrillGroup and Notifications card share identical content-column width (aligned right edges).  
**G4.** Inter-row = hairline only; row `py` **12**; min height **44**.  
**G5.** Theme face value = stored `Light` \| `Dark` \| `Auto`.  
**G6.** Drill label `t-body`; Notifications title `t-heading`.  
**G7.** Phone never truncates Location / Theme values as the default escape.

## Repo citation

CoS seeds: `docs/design-locks/preferences-settings-row-grammar-lock-v2.md`  
Box draft: `/workspace/24frame-agg-ux/preferences-settings-row-grammar-lock-v2.md`  
Evidence: `/workspace/24frame-agg-ux/preferences-craft-reject-adam-2026-09-22.png`
