# [GC][24Frame] LOCK — Theme chrome (avatar drill only) v1

**Date:** 2026-09-22 (CT)  
**Status:** **LOCKED** (Adam 2026-09-22) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Scope:** Where Theme **chrome** lives and how the avatar Theme **row** looks. Modes / store / picker face stay in `theme-sot-auto-lock-v1.md`. Preferences Theme **row chrome** cites `preferences-settings-row-grammar-lock-v2.md`. Desktop MenuSurface shell cites `desktop-avatar-menu-coinbase-lock-v1.md` (this lock **amends Theme row only**).  
**Evidence twin:** Header sun/moon **and** avatar Theme toggle both present (Adam shot 2026-09-22 — twin chrome fail).  
**House:** Coinbase register · never-patch · phone never truncate

## One lock

**Theme chrome = Avatar menu Theme drill only** (plus Preferences Theme row, already locked).

1. **Remove** the header sun/moon Theme control entirely (desktop + phone headers).  
2. **Avatar → Theme** is a **drill row** (not a toggle): label **Theme** · value = stored `Light` \| `Dark` \| `Auto` · trailing chevron → **same** picker as Preferences Theme (`/settings/theme` / `AppearanceThemePicker`).  
3. **Preferences → Theme** PrefDrillGroup row **stays**. One `gc-theme` store (`lib/theme.ts`).  
4. Header flip / “exit Auto” behavior **dies with the header control**. Auto changes **only** via the shared picker.

---

## Ranked miss list

| Rank | Miss | Fix |
|------|------|-----|
| **P0** | Header sun/moon ThemeToggle present (desktop + phone) | **Delete** from all headers / lead chrome — no replacement glyph |
| **P0** | Avatar Theme row is a **trailing toggle** (or any in-menu flip) | Replace with **drill**: value + CaretRight **16** · opens shared picker |
| **P0** | Twin Theme chrome (header + menu toggle) | One avatar drill + Preferences row only |
| **P1** | Avatar Theme face shows resolved appearance | Face = **stored** preference only (`theme-sot-auto-lock-v1` G4 · prefs v2 G5) |

---

## Entries (after this lock)

| Entry | Status |
|-------|--------|
| Header sun/moon | **REMOVED** |
| Avatar menu → Theme drill | **REQUIRED** |
| Preferences → Theme PrefDrillGroup row | **REQUIRED** (unchanged job) |
| Notifications / other chrome | **Forbidden** Theme entry |

---

## Avatar Theme row — geometry

Shared grammar with Preferences Theme drill (Coinbase horizontal):

| Token | Lock |
|-------|------|
| Job | Drill to Theme picker — **not** an on-row toggle |
| Label | **Theme** · `t-body` / 0.9375rem · ink |
| Value | Stored preference only: **`Light`** · **`Dark`** · **`Auto`** · `t-body-sm` · ink-3 |
| Trailing | Value + CaretRight **16** ink-3 · gap **8** · `items-center` |
| Hit | Min height **44** · full-row press |
| Opens | Same Theme face / `AppearanceThemePicker` as Preferences (`/settings/theme` or in-menu nested face that is the **same component**) |

### Desktop (`MenuSurface` account face)

| Token | Lock |
|-------|------|
| Shell | Unchanged: panel 280 · radius 12 · Sporty Blue top bar **4** · flat body rows · horizontal identity |
| Theme row | **Exception to “no chevrons on action rows”:** Theme uses value + chevron drill (this lock wins over desktop-avatar-menu v1 Theme-toggle note) |
| Leading icon | Optional moon/sun Phosphor **20** · same as other flat rows · **or** omit if product drops leading icons on this row — prefer **keep** leading icon for inventory continuity with Settings / Help |
| Forbidden | Trailing house toggle · any light↔dark flip inside the menu |

Other body rows (Settings · Get Help · Log out) stay flat **without** chevrons per desktop-avatar-menu v1.

### Phone (AccountSheet Family A)

| Token | Lock |
|-------|------|
| Host | Family **A** AppSheet / SheetGroup shell **unchanged** |
| Theme row | Inside the account SheetGroup: same drill grammar (label · stored value · chevron) — **not** a trailing toggle |
| Opens | Same Theme picker face (Family A sheet / push pane — dual-host for **host** only; options list = one component) |

---

## Header chrome

| Token | Lock |
|-------|------|
| ThemeToggle / sun / moon control | **Gone** from Aggregation · Social · Education · Staff · Home · Settings headers (desktop + phone) |
| Slot | Do **not** leave an empty reserved hit · close the gap so remaining header utilities (plus · bell · avatar) keep house rhythm |
| Behavior | No header path writes `gc-theme`. Auto is **not** exited by chrome flip anymore |

---

## Store / picker (cite, do not re-invent)

- Modes: Light · Dark · Auto — `theme-sot-auto-lock-v1.md`  
- One key: `gc-theme` via `lib/theme.ts`  
- Picker order Auto · Dark · Light · selected check Sporty Blue  
- Preferences Theme row geometry: `preferences-settings-row-grammar-lock-v2.md`  
- Face value everywhere = **stored** preference, never resolved appearance  

---

## Explicit OUT

- Do **not** keep header sun/moon  
- Do **not** keep a Theme **toggle** in the avatar menu  
- Do **not** invent a third Theme entry  
- Do **not** remove Preferences Theme row  
- Do **not** fork a second theme store or second picker list  
- Do **not** open a Design PR  

## Gates

**G1.** Zero header ThemeToggle / sun / moon on phone and desktop.  
**G2.** Avatar Theme = drill with stored value + chevron → shared picker.  
**G3.** No trailing Theme toggle in avatar menu (phone or desktop).  
**G4.** Preferences Theme row still present; same `gc-theme` SoT.  
**G5.** Avatar + Preferences Theme faces show stored `Light` \| `Dark` \| `Auto` only.  
**G6.** Desktop MenuSurface shell (280 / blue bar / flat non-Theme rows) unchanged except Theme row grammar.

## Repo citation

CoS seeds: `docs/design-locks/theme-chrome-avatar-only-lock-v1.md`  
Box draft: `/workspace/24frame-agg-ux/theme-chrome-avatar-only-lock-v1.md`

## Supersedes (chrome only)

- `theme-sot-auto-lock-v1.md` § Header sun/moon + Gate **G5** (header exits Auto) — **killed**  
- `desktop-avatar-menu-coinbase-lock-v1.md` Theme inventory “trailing house toggle” — **replaced** by this drill  
