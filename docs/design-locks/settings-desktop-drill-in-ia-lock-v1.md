# [GC][24Frame] LOCK — Desktop Settings IA = drill-in (not FB accordion) v1

**Date:** 2026-09-23 (CT)  
**Status:** **LOCKED** (Adam OK 2026-09-23 · CoS recommended drill-in vs FB Notifications accordion) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev only if a retrofit is needed  
**Scope:** **Short IA freeze** for desktop Settings — navigation pattern only. Not full craft geometry (row sizes stay in Preferences row locks).  
**Context:** Adam compared Facebook Notifications **accordion** (expand-in-list · status summary · inline toggles) vs **drill-in**. Product choice: **drill-in**.  
**Cites (already locked — do not reopen):**  
- `preferences-drill-nested-slugs-lock-v1.md` — `/settings/preferences/<drill>`; Theme = `/settings/preferences/theme`  
- `preferences-settings-row-grammar-lock-v2.md` — Coinbase horizontal drill rows  
- `theme-chrome-avatar-only-lock-v1.md` / `theme-sot-auto-lock-v1.md` — Theme entry → same nested picker  
**House:** Coinbase-calm · Soft-nav selected-state on **real hrefs** · Geist · Sporty Blue `#1769FF` · no drop shadows

---

## One lock

**Desktop Settings SoT = drill-in destinations.**

Rail / index row → **dedicated pane** (own URL). Do **not** expand Settings siblings in-place like Facebook’s Notifications accordion.

---

## Pattern

| Token | Lock |
|-------|------|
| Index | Settings rail or section list — each drillable row is a **real href** |
| Destination | Dedicated pane / page for that setting family |
| Selected state | Soft-nav / Coinbase-calm active on the **href that is open** — not an accordion open flag with no route |
| Nested Preferences | Already locked: `/settings/preferences/<drill>` (Location · Theme · Notifications) |
| Account / Profile / Security / org panes | Stay drill-in destinations — **do not** collapse them into accordion sections on the Preferences hub |

---

## Explicit forbid (this freeze)

| Forbidden | Why |
|-----------|-----|
| Retrofit **Preferences** / **Theme** / **Account** (or sibling Settings hubs) to FB-style **expand-in-list accordion** | Adam locked drill-in |
| Inline expand that keeps you on one URL while revealing Theme / Location / Account bodies | Breaks nested-slug + Soft-nav href SoT |
| Status-summary + inline toggles **as the desktop Settings IA replacement** for drill panes | FB Notifications pattern — out of scope here |
| CoS/Dev “just for Notifications on Preferences” accordion without a **new** Adam lock | Separate product raise required |

---

## Future (not this lock)

Facebook accordion **may** be considered later **only** for a true “many siblings + inline channels” surface (e.g. a future Notifications **matrix**). That needs a **separate** Adam lock if/when raised. Until then: drill-in.

---

## Relation to existing locks

| Lock | Owns |
|------|------|
| **This file** | Settings **IA pattern**: drill-in vs accordion |
| Nested slugs v1 | Preferences **path grammar** |
| Row grammar v2 | Drill **row chrome** |
| Theme chrome / SoT | Theme **entry + store** |

No conflict: those locks already assume drill-in. This freeze makes the anti-accordion rule explicit so Dev does not “improve” Settings toward FB accordion.

---

## Gates

**G1.** Desktop Settings navigation = drill-in (index row → dedicated pane / real href).  
**G2.** Do **not** ship FB-style accordion for Preferences / Theme / Account (or Settings hub siblings).  
**G3.** Preferences drills stay nested under `/settings/preferences/<drill>` (cite nested-slugs lock).  
**G4.** Soft-nav / selected state tracks **real hrefs**, not accordion-open state.  
**G5.** Accordion for a future Notifications matrix = **out** until Adam raises a separate lock.  
**G6.** Design no PR — CoS routes Dev only if code is drifting toward accordion.

## Repo citation

CoS seeds: `docs/design-locks/settings-desktop-drill-in-ia-lock-v1.md`  
Box draft: `/workspace/24frame-agg-ux/settings-desktop-drill-in-ia-lock-v1.md`
