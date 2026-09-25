# [GC][24Frame] LOCK — Stories viewer open index (oldest live) v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam confirm 2026-09-24 — FB/IG standard · phone own Stories opened on **most recent** · correct = **oldest still-live** · CoS Own→READY) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation:** `docs/design-locks/stories-viewer-open-index-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/stories-viewer-open-index-lock-v1.md`  
**Bar:** Facebook / Instagram — start on the **oldest still-live** item in that author’s current **24h** set, then auto-advance toward newest.  
**TTL cite:** `STORY_TTL_HOURS = 24` · `isStoryLive` · active + unexpired only  
**Out of scope:** Auto-advance clocks · progress segments · hold-pause · next/prev morph · 9:16 fill · desktop carousel · Home rail card craft · Create · Send · **inventing new view-state product**

---

## One lock

Home / Stories tray card → open viewer on that author’s **oldest live** item. Playback then walks **oldest → newest** (existing #664 advance).

---

## Adam miss (why)

| What happened | Cause (cite only) | Correct (Adam) |
|---------------|-------------------|----------------|
| Phone: tapped **own** Stories → viewer on **most recent** | Rail href `socialStoryHref(card.latest.id)` · `loadLiveStories` orders `created_at` **desc** · `latest = rows[0]` | Start on **oldest still-live** in that author’s 24h set, then advance toward newest |

Viewer in-author sequence already sorts ascending for prev/next — **entry href / initial id** is the miss, not advance direction.

---

## Author item order (SoT)

Within one author’s **live** set (status active · `expires_at` > now · 24h window):

| Token | Lock |
|-------|------|
| Sort | **Oldest → newest** by `created_at` ascending · tie-break `id` ascending |
| Expired / inactive | **OUT** of the set |
| Advance after open | Next = newer · Prev = older · tray-end → next author (#664 IG parity — do not reopen) |

---

## Open index (concrete)

### 1) Own tray open

| Token | Lock |
|-------|------|
| Open id | **Oldest live** item in that author’s current 24h set (index **0**) |
| Forbidden | Open on newest · open on middle · open on `latest` rail id |

### 2) Other author tray open

| Token | Lock |
|-------|------|
| Open id | **Same** — **oldest live** in that author’s current 24h set |
| Forbidden | Open on newest · open on middle |

### 3) Explicit OUT

| OUT | Why |
|-----|-----|
| **Open-on-newest** | Adam FAIL · current `card.latest.id` |
| **Open-on-middle** | Not FB/IG |
| New view-state product | Do **not** invent |

### 4) Unviewed SoT — note only (no invent)

Already shipped elsewhere (cite only — **not** a new product in this lock):

- Rail chrome unseen: `story_views` · `loadViewedStoryIds` · `storyRailUnseen` · `markSocialStoryViewed`
- `#664` IG parity Entry line once named “first unseen (or tapped)”

**This lock’s shippable open index is oldest-live for own and other.** Do not invent a separate first-unviewed open product here. Leave those cites as-is for rail chrome / prior Entry wording; CoS may absorb Entry later — HOLD invent else.

---

## Rail / href (ship implication — Design does not PR)

Tray card link must resolve to the author’s **oldest live** id — **not** `card.latest.id` when `latest` means newest.

Card **preview face** may still show newest media for rail chrome — that is rail craft, not open index.

---

## Do not reopen (#664 lane — cite only)

| Lock | Owns |
|------|------|
| `docs/design-locks/stories-viewer-ig-parity-lock-v1.md` | Persistent host · photo 5.0s / video duration · progress segments · auto-advance · hold-pause · tray→author→close · **220ms** next/prev morph |
| `docs/design-locks/stories-viewer-desktop-ig-carousel-lock-v1.md` | Stage / **9:16** / neighbors |
| `docs/design-locks/stories-viewer-advance-ig-lock-v1.md` | Advance absorb (if still cited) |
| `docs/design-locks/stories-home-rail-fb-card-lock-v1.md` | FB tall rail cards |
| `docs/design-locks/stories-viewer-ig-actions-lock-v1.md` / Send craft | Reply · heart · Send |
| `docs/design-locks/create-story-photo-video-fb-layout-lock-v1.5.md` | Create Take/Upload |
| `docs/design-locks/stories-upload-success-immersive-lock-v1.md` | Post success confirm |

This lock owns **open-at / entry index only**. Motions, segments, next/prev, and 9:16 stay closed.

Supersedes only the broken **open-on-newest** tray entry. Does **not** reopen or rewrite #664 motion/geometry sections.

---

## FAIL / PASS

| PASS | FAIL |
|------|------|
| Own tray → oldest live, then newer | Own tray → newest first |
| Other tray → oldest live, then newer | Other → newest or middle |
| Advance still oldest→newest after open | New view-state invent · reopen #664 motions |

---

## Done-when (CoS → Dev)

1. Tap **own** Home Stories with 2+ live items → opens on **oldest still-live** · progress/auto-advance walk toward newer.  
2. Tap **other** author tray → opens on **oldest live** (same).  
3. No tray **open-on-newest** · no **open-on-middle**.  
4. No new view-state product invent.  
5. #664 auto-advance · segments · next/prev · 9:16 unchanged.

**Ship:** Design Own→READY · CoS CLEAR · one Dev PR citing this lock only · Design HOLD invent else.
