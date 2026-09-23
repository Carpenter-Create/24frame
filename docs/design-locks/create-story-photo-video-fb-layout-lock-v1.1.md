# [GC][24Frame] LOCK — Create story photo + video (FB stage) v1.1

**Date:** 2026-09-23 (CT)  
**Status:** **LOCKED** (Adam product 2026-09-23 · Adam refine liberty 2026-09-23) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Supersedes:** `create-story-photo-video-fb-layout-lock-v1.md` (same day) — product + structure unchanged; craft bar + liberty amended  
**Scope:** Create-story **entry face** only — chrome, card set, hosts, URL. Compose / trim / post studio after media pick can reuse existing Stories studio; this lock kills the small Video-only modal.  
**Refs (box):**  
- FB stage (structure reference only): `/workspace/24frame-agg-ux/create-story-ref-fb-stage.png`  
- FB Home Stories entry (entry pattern): `/workspace/24frame-agg-ux/create-story-ref-fb-home-rail.png`  
- 24Frame BEFORE modal (kill target): `/workspace/24frame-agg-ux/create-story-before-modal.png`  
**Cites:** `SOCIAL_ROUTES.storiesNew` = `/social/stories/new` · Social Home activity-feed lock · house dual-host · never-patch · phone never-truncate  
**House register (must read as 24Frame):** Geist only · Sporty Blue `#1769FF` · Coinbase-calm density · surfaces `#FAFAFB` / `#FFFFFF` / muted `#F4F4F6` · hairline `#ECEDF0` · ink `#14171A` · secondary `#5E646E` · spacing scale **8 / 16 / 24 / 48** · **no drop shadows**

---

## Adam liberty (craft bar)

**Copy Facebook’s create-story skeleton with a slight variation — make it look like 24Frame.**

| Layer | Rule |
|-------|------|
| **Product** | Hard lock — photo + video only · **no** text story · full-page create stage · **not** small Video-only modal · URL `/social/stories/new` · close → `/social` |
| **Structure intent** | Hard lock — FB create-stage **grammar**: left **Your story** identity rail + main stage + **two kind cards** (photo · video). That skeleton stays. |
| **Craft** | **Liberty** — do **not** pixel-clone FB. Slight variation from the size targets below is OK when it stays on the house spacing scale and still reads as 24Frame. Dev ships house chrome, not Meta chrome. |

**24Frame, not FB clone — forbidden craft:**

- Facebook brand blue (`#1877F2` / Meta blue) as accent or card wash  
- Meta pink / purple story gradients as the card fill language  
- FB / Meta logo, wordmark, or “f” mark anywhere on this surface  
- Drop shadows, FB Inter/system type, or FB-dense chrome that fights Coinbase-calm  
- Copy-paste of FB “Create a text story” / Aa card (product forbid + craft)

**Voice:** 24Frame labels (table below). Do not invent Meta marketing lines.

---

## One lock

Create story is a **full-page create stage** in FB **structure** grammar, finished in **24Frame** register: left **Your story** identity rail + main stage with **two large media cards** (photo · video). **Photo and video only. No text story.** Kill the small centered Video-only modal.

---

## Entry + URL

| Token | Lock |
|-------|------|
| URL | **`/social/stories/new`** — keep (Home Stories rail “Create story” / Your story + empty CTAs) |
| Entry | Home Stories rail Create story / Your story → this URL |
| Close | Returns to Social Home **`/social`** (not `/social/stories`) |
| Forbidden | New third create URL; keeping the small Dialog as the entry face |

---

## Desktop chrome (create stage — not overlay modal)

Replace Social dest-rail + empty white pane + tiny centered Dialog with a **dedicated create stage** (FB structure intent · house craft):

| Region | House target (slight variation OK on 8/16/24/48) |
|--------|--------------------------------------------------|
| Host | **Full Social viewport page** at `/social/stories/new` — **not** `HouseDialog` / small centered modal over Home |
| Left create rail | Width ~**320** · bg surface `#FFFFFF` · hairline right · pad **16** |
| Close | Circular hit ~**40** · Phosphor **X** ~**20** · top of rail · ink · press → `/social` |
| Title | **Your story** · `t-heading` / 1.5rem · Geist · ink · below close · gap **16** |
| Identity | Avatar ~**40** + display name `t-body` · gap **12** · `items-center` · gap **24** below title |
| Gear / settings | **Omit** — do not invent story settings |
| Main stage | Remaining width · bg muted `#F4F4F6` (or soft house stage wash) · cards centered as a pair |
| Shell | House lead (logo / workspaces / utilities) may stay; **Social dest-rail does not** compete beside the create rail |
| Forbidden | Drop shadow · FB logo clone · Meta purple/pink as brand · FB blue accent |

---

## Card set (one grammar)

**Exactly two cards. No third.**

| Order | Label (24Frame voice) | Icon (Phosphor, in white / surface circle ~**56**) | Opens |
|-------|----------------------|-----------------------------------------------------|-------|
| 1 | **Create a photo story** | Image / landscape | Photo library / still capture → existing share path |
| 2 | **Create a video story** | Video camera | Video path: **Record** or **Upload** on the **next** face — not a third stage card |

### Card geometry (desktop — house targets)

| Token | House target |
|-------|--------------|
| Layout | Side-by-side · gap **24** · vertically centered in stage |
| Size | Each card ~**min-width 220** · ~**max-width 280** · height ~**420** · radius **16** |
| Fill | **House** gradients only: Photo = Sporty Blue `#1769FF` → deeper blue; Video = ink `#14171A` → `#5E646E` (or calm house alternate on the same scale) — **never** Meta pink/purple clone |
| Type | Label white (or ink on light wash if variation stays legible) · Geist `t-body` / 0.9375rem · centered under icon · gap **16** icon→label · **wrap**, never truncate |
| Hit | Whole card press |

Slight size / radius / gap variation is allowed if it stays on **8 / 16 / 24 / 48** and the two-card stage still reads clearly. Product card count and kinds do **not** float.

### After card (video only — secondary face)

Do **not** put Record / Upload on the create stage as the first face. After **Create a video story**:

- Same stage or push: **Record a video** · **Upload a video** (existing copy OK) · house list/rows, not the old tiny modal shell  
- Photo path does **not** show Record/Upload video rows

### Forbidden cards / copy

- **Create a text story** / Aa card  
- Stage label **Video only**  
- Footnote **NO PHOTO STORY · NO TEXT STORY**  
- Single “photo or video” mega-card **instead of** the two-card set  
- Re-shipping the BEFORE stacked modal as the entry  

---

## Phone vs desktop hosts

| | Phone | Desktop |
|--|-------|---------|
| Host | **Full-screen push page** at same URL (prefer **page**; not skinny Dialog) | Full create stage (left rail + main) |
| Cards | **Stacked** full content width · gap **16** · pad **16** · card height ~**min 200** · same labels/icons/house fills | Side-by-side |
| Close | Top leading X / back → `/social` | Rail X |
| Type | Never truncate; wrap | Same |
| Dual-host | Same two options + same post-pick paths; no third phone-only story kind | Same |

Cite house dual-host: do not skin phone as desktop Dialog or desktop as phone sheet for this **page** job.

---

## Ranked miss list (BEFORE → AFTER)

| Rank | Miss | Fix |
|------|------|-----|
| **P0** | Small centered Video-only modal | Full create stage (rail + cards) |
| **P0** | Photo forbidden | Photo story card + photo pick path |
| **P0** | Text path / shout footnote | No text card; drop footnote |
| **P0** | Looks like Facebook skin | 24Frame register + liberty (this v1.1) |
| **P1** | Record/Upload as first face | Video card → then Record/Upload |
| **P1** | Dest-rail + empty canvas behind modal | Dedicated create chrome |

---

## Explicit OUT

- Do **not** ship text stories  
- Do **not** keep the BEFORE modal as entry  
- Do **not** pixel-clone FB chrome / color / type  
- Do **not** leave the house spacing scale (8/16/24/48)  
- Do **not** redesign Home Stories rail cards in this PR beyond entry `href` continuity  
- Do **not** invent `/social/home` or change Home activity-feed lock  
- Design does **not** open a PR  

## Gates

**G1.** Entry URL remains `/social/stories/new`; close → `/social`.  
**G2.** Desktop = full create stage (left Your story rail + stage) — **no** small centered entry modal.  
**G3.** Exactly two stage cards: **Create a photo story** · **Create a video story**; zero text-story card.  
**G4.** Photo path accepts stills; video path offers Record/Upload on a **secondary** face.  
**G5.** Phone = full-screen stacked cards; labels never truncate; same two kinds.  
**G6.** BEFORE copy gone: “Video only” subtitle + “NO PHOTO STORY · NO TEXT STORY” footnote.  
**G7.** Surface **reads as 24Frame** — Geist · Sporty Blue `#1769FF` · Coinbase-calm · no drop shadows · spacing on **8/16/24/48** · **no** FB blue / Meta pink-purple clone / FB logo.  
**G8.** Slight craft variation from size targets OK; product + structure intent (G1–G6) are not optional.  
**G9.** Design no PR — CoS routes one Dev PR to **this** lock (v1.1).

## Repo citation

CoS seeds: `docs/design-locks/create-story-photo-video-fb-layout-lock-v1.1.md`  
Box draft: `/workspace/24frame-agg-ux/create-story-photo-video-fb-layout-lock-v1.1.md`  
Prior v1 (superseded): `docs/design-locks/create-story-photo-video-fb-layout-lock-v1.md` / box sibling
