# [GC][24Frame] LOCK — Preferences drill nested slugs v1

**Date:** 2026-09-23 (CT)  
**Status:** **LOCKED** (Adam hard-refresh Gate 2 FAIL on #653+#655 · product lock 2026-09-23) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Scope:** **URL / IA path grammar** for Preferences drill-in pages only. Row chrome stays `preferences-settings-row-grammar-lock-v2.md`. Theme modes / store / picker stay `theme-sot-auto-lock-v1.md` + `theme-chrome-avatar-only-lock-v1.md` (path citations below are **amended**).  
**Fail:** Theme drill opens flat `/settings/theme` instead of nested under Preferences.  
**House:** Family tree · never-patch · craft lanes

## One lock

Every Preferences drill-in page lives under Preferences:

**`/settings/preferences/<drill>`**

Theme is **not** a flat Settings sibling. Canonical Theme page:

**`/settings/preferences/theme`** — **not** `/settings/theme`.

---

## Canonical inventory (Preferences family)

| Drill | Canonical href | Notes |
|-------|----------------|-------|
| Preferences hub | `/settings/preferences` | Parent of all drills below |
| Location | `/settings/preferences/location` | Already nested — keep |
| Theme | `/settings/preferences/theme` | **Move** off flat `/settings/theme` |
| Notifications | `/settings/preferences/notifications` | Already nested — keep |

Future Preferences drills (if Adam adds any) use the **same** pattern: `/settings/preferences/<slug>`. Do **not** invent flat `/settings/<slug>` cousins for Preference-owned panes.

Hub sections that are **not** Preferences drills stay as they are: `/settings/profile…`, `/settings/organization…`, `/settings/security`, Profile doors (`/settings/agreements`, `/settings/refer`). This lock does **not** re-parent those.

---

## Theme — entries → one nested page

| Entry | Behavior after this lock |
|-------|--------------------------|
| Preferences PrefDrillGroup → Theme | `href` = `/settings/preferences/theme` |
| Avatar menu → Theme drill | Same page href = `/settings/preferences/theme` (still one picker / one `gc-theme` SoT) |
| In-menu nested Theme face (if product keeps a non-route face) | Same option list component as the nested page — **no** second store |

Do **not** keep a live flat Theme route as a twin of the nested page.

---

## Old `/settings/theme` (redirect — do not invent)

Prior SoT comments said hard-cut / 404 and explicitly retired `/settings/preferences/theme`. **Adam 2026-09-23 overrides that.**

| Old path | Required |
|----------|----------|
| `/settings/theme` | **Permanent redirect** (308 or Next.js permanent redirect) → `/settings/preferences/theme` |
| `/settings/theme/*` | Same redirect into the nested Theme page (no leftover flat subtree) |

**Forbidden invent:**

- Leave `/settings/theme` as a 404  
- Keep both pages rendering the picker  
- Soft/client-only swap with no server redirect  
- A third path (`/settings/appearance`, `/account/theme`, etc.)

Update path SoT in `src/lib/settings.ts` and `src/lib/user-menu.ts` (`themeHref` / comments) so constants point at the nested href. Move the App Router page from `src/app/(app)/settings/theme` → `src/app/(app)/settings/preferences/theme`. Tests that assert `/settings/theme` update to the nested path (and cover the redirect).

---

## Chrome / rail / back (path consequences only)

| Token | Lock |
|-------|------|
| Rail wash on Theme page | **Preferences** (family tree) — Theme is no longer a non-hub orphan that washes nothing |
| Mobile page-lead back on Theme | Parent **Preferences** → `/settings/preferences` · label Preferences |
| Desktop Settings rail | Preferences active while on any `/settings/preferences/**` path including Theme |
| Visual chrome | **Unchanged** by this lock (no new header controls, no row geometry fork) |

---

## Ranked miss list (Gate 2)

| Rank | Miss | Fix |
|------|------|-----|
| **P0** | Theme page / Theme `href` is `/settings/theme` | Nested `/settings/preferences/theme` everywhere Theme navigates |
| **P0** | Flat Theme route still serves the picker | Move page; permanent redirect old path |
| **P1** | PrefDrillGroup Theme `href` still flat while Location nested | Both PrefDrillGroup drills nest under Preferences |
| **P1** | Avatar Theme `href` still flat | Same nested Theme href (one SoT page) |
| **P2** | Comments / ABSENT lists still ban `/settings/preferences/theme` | Rewrite SoT comments to match this lock |

---

## Explicit OUT

- Do **not** change PrefDrillGroup row geometry (v2)  
- Do **not** change Theme modes, store, or picker option order  
- Do **not** re-add header sun/moon  
- Do **not** nest Profile / Organization / Security drills under Preferences  
- Do **not** invent unrelated chrome  
- Design does **not** open a PR  

## Gates

**G1.** Preferences Theme drill URL (address bar + `href`) = `/settings/preferences/theme`.  
**G2.** Flat `/settings/theme` permanently redirects to `/settings/preferences/theme` (no twin page).  
**G3.** Location + Notifications remain under `/settings/preferences/<drill>`; no new flat Preference cousins.  
**G4.** Avatar Theme navigation lands on the same nested Theme page (or same picker component with that canonical href).  
**G5.** On the Theme page, Settings rail washes **Preferences**; mobile back parent is Preferences.  
**G6.** No Design PR; CoS routes one Dev PR to this lock only.

## Repo citation

CoS seeds: `docs/design-locks/preferences-drill-nested-slugs-lock-v1.md`  
Box draft: `/workspace/24frame-agg-ux/preferences-drill-nested-slugs-lock-v1.md`

## Amends (path only)

- `theme-chrome-avatar-only-lock-v1.md` — replace `/settings/theme` citations with `/settings/preferences/theme`  
- `theme-sot-auto-lock-v1.md` — Preferences Theme opens nested Theme page (same picker)  
- Prior `settings.ts` / `user-menu.ts` comments that forbid `/settings/preferences/theme` or treat Theme as a flat non-hub door — **superseded** for path IA  
