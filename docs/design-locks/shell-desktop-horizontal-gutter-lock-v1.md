# [GC][24Frame] LOCK — Desktop shell horizontal gutters (Coinbase) v1

**Date:** 2026-09-23 (CT)  
**Status:** **SUPERSEDED** by [`shell-desktop-horizontal-gutter-lock-v2.md`](shell-desktop-horizontal-gutter-lock-v2.md) (Adam amend 2026-09-23 — L = R = **32**). Historical record of the #661 **32 / 44** pair. Do not implement 32 / 44.  
**Scope:** Desktop **shell chrome horizontal gutters only** — viewport edge → logo ink (L) and viewport edge → avatar ink (R), and **content column edges that share those gutters**. Not Soft-nav. Not Settings IA. Not phone.  
**Evidence (Adam shots, both 2880×1800 @2× → CSS ≈ device/2):**  
- Coinbase SoT: `/workspace/24frame-agg-ux/shell-gutter-sot-coinbase-2026-09-23.png`  
- 24Frame BEFORE: `/workspace/24frame-agg-ux/shell-gutter-before-24frame-2026-09-23.png`  
**Measured (viewport edge → chrome ink):**

| Surface | Left (CSS px) | Right (CSS px) |
|---------|---------------|----------------|
| **Coinbase** (SoT) | **~31–32** (dev ~62–64 to blue C) | **~44** (dev ~88 to avatar) |
| **24Frame today** | **~16** (dev ~32) | **~19** (dev ~38) |

Box re-measure on same files: 24Frame L **16** / R **~18.5–19**; Coinbase L **~30** (range) / R **~43** — agrees with Adam/CoS within ±2 CSS.  
**House:** Geist · Sporty Blue · Coinbase-calm · spacing scale **8 / 16 / 24 / 48** · **no drop shadows**  
**Cites:** house chrome unify lead (logo one inset across workspaces) · Soft-nav stays as shipped (#658) — **do not invent Soft-nav** in this PR

---

## One lock

Desktop shell horizontal gutters match **Coinbase’s measured pair**:

| Edge | SoT inset (CSS px) | Notes |
|------|--------------------|-------|
| **Left** | **32** | Viewport → logo ink (and left content column edge that shares the gutter) |
| **Right** | **44** | Viewport → avatar ink (and right content / news column edge that shares the gutter) |

**32** = 4×8 (on the house multiple-of-8 grid). **44** = optical Coinbase right measure (not forced to 48 — Adam wants Coinbase match, not a rounded house guess that drifts).

Do **not** keep today’s ~16 / ~19 pair.

---

## What must share the gutter

Same L **32** / R **44** SoT for:

1. **Header lead** — logo (and workspace lead cluster start)  
2. **Header trail** — avatar (outermost utility)  
3. **Primary content column** left edge under the lead (e.g. “Hi, Adam” / page title / first card column) when that page uses full-bleed shell gutters  
4. **Trailing content column** right edge (e.g. Industry news) when it shares shell gutter with the avatar  

One shell token / CSS variable preferred (e.g. `--shell-gutter-inline-start: 32px` · `--shell-gutter-inline-end: 44px`) so Aggregation · Social · Education · Settings do not drift.

---

## Explicit OUT

- Soft-nav invent / Soft-nav geometry reopen  
- Settings drill-in IA (already locked separately)  
- Phone gutters (separate if Adam raises)  
- Facebook shell insets (wrong SoT — Adam corrected to Coinbase)  
- “Just use 48 both sides” or “16 is fine” — fails measured Coinbase  
- Pixel-cloning Coinbase brand (blue C, rail layout) — **insets only**

---

## Supersedes (horizontal shell inset only)

Older miss-list lines that said page/section edge air **48** (or **16**) for **desktop shell chrome L/R** yield to **32 / 44** here. In-card pad **16**, section gaps **24**, module radius, etc. stay on house scale elsewhere.

---

## Gates

**G1.** Desktop left shell gutter = **32** CSS px (viewport → logo ink).  
**G2.** Desktop right shell gutter = **44** CSS px (viewport → avatar ink).  
**G3.** Content columns that share shell gutters align to the **same** L/R pair (not a tighter inner 16).  
**G4.** One shared shell gutter SoT across workspaces using house lead chrome — logo inset does not drift by workspace.  
**G5.** BEFORE ~16 / ~19 gone on desktop shell.  
**G6.** No Soft-nav invent in this PR.  
**G7.** Design no PR — CoS routes one Dev PR to this lock.

## Repo citation

CoS seeds: `docs/design-locks/shell-desktop-horizontal-gutter-lock-v1.md`  
Box draft: `/workspace/24frame-agg-ux/shell-desktop-horizontal-gutter-lock-v1.md`
