# [GC][24Frame] LOCK — Stories viewer · Instagram desktop carousel v1

**Date:** 2026-09-23 (CT)  
**Status:** **LOCKED** (Adam Design thread — three Instagram desktop Stories screenshots · “copy it verbatim” for **open/view** experience) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev after glance  
**Scope:** **Desktop** story open/view (`/social/stories/[id]` and soft-nav equivalents). Phone viewer = separate full-bleed push (below). Not home rail cards (see `stories-home-rail-fb-card-lock-v1.md`). Not create-studio (`create-story-photo-video-fb-layout-lock-v1.5.md`).  
**House register:** Geist · Sporty Blue `#1769FF` for **24Frame** accents (unseen rings, focus) · immersive viewer chrome is **dark stage + white controls** (IG structure) · spacing **8 / 16 / 24 / 48** · **no drop shadows** · **not** Instagram wordmark, glyph set, or brand gradient ring  
**Evidence (box):**  
- `/workspace/24frame-agg-ux/stories-viewer-desktop-ig-ref-1.png`  
- `/workspace/24frame-agg-ux/stories-viewer-desktop-ig-ref-2.png`  
- `/workspace/24frame-agg-ux/stories-viewer-desktop-ig-ref-3.png`  
**Supersedes craft of:** light `max-w-[420px]` bordered page card (`SOCIAL_STORY_VIEWER_CLASS` today) — that face is **OUT** for desktop open.

---

**Craft bar (Adam gospel 2026-09-23, standing exclusive):** Facebook / Instagram grade only — **never** soft-grade. No “ship thin then polish.” Own→READY means full structure + geometry in this lock.


## One lock

When a user opens a story on **desktop**, the experience is the **Instagram desktop Stories viewer structure**: full-viewport **dark stage**, **large center active card** (~9:16), **smaller dimmed neighbor cards** left/right with centered avatar + name + time, **circular chevrons** between center and neighbors, **top-leading product mark** + **top-trailing X**, active card with **segment progress**, header row, full-bleed media, **reply pill + like (+ send)**.

Paint and type = **24Frame**. Structure and geometry = **verbatim** from Adam’s references.

---

## Stage (desktop)

| Token | Lock |
|-------|------|
| Host | Full viewport overlay **or** full-bleed route — hides Social shell chrome (no light page card in the feed column) |
| Background | `#0A0A0B` (near-black stage). Not `#FAFAFB` page. |
| Top leading | **24Frame** wordmark / logo in white (or monochrome light asset) — **not** “Instagram” |
| Top trailing | **X** close · white · hit **48** · inset **16** from top/trailing · → `/social` (or prior Social home) |
| Safe | Top bar content below browser chrome; insets **16** |

---

## Carousel geometry (desktop)

| Token | Lock |
|-------|------|
| Active card | Aspect **9:16**. Height = `min(90vh − 16, 840px)`. Width = height × `(9/16)`. Radius **16**. Horizontally + vertically centered in stage. |
| Neighbor cards | Height = **72%** of active height. Width = neighbor height × `(9/16)`. Radius **16**. One visible prev (leading) + one visible next (trailing) when they exist; optional second peek at **48%** opacity further out if queue allows — **minimum** ship = active + immediate prev/next. |
| Dim | Neighbor media/content at **opacity 0.45**; no interaction except click-to-activate that author’s story |
| Gap | **24** between active outer edge and neighbor outer edge (chevron sits in the gap) |
| Chevrons | Circle **48** · fill `rgba(255,255,255,0.12)` · white caret · vertically centered on active mid · in the gap · hit full circle. Hidden when no prev/next. |
| Click neighbor | Opens that story (same as chevron) |
| Keyboard | Left/Right = prev/next author or item — product OK; not craft-blocked |

**Forbidden desktop:** Light bordered 420px article in the Social column · chevrons drawn *on top of* media only with no side cards · IG wordmark.

---

## Neighbor card face (dimmed)

| Token | Lock |
|-------|------|
| Background | Blurred or darkened story cover full-bleed inside rounded card |
| Center stack | Avatar **80** diameter · ring **3** · **unseen/available** ring = Sporty Blue `#1769FF` (replace IG multi-color gradient) · **seen** = `rgba(255,255,255,0.35)` |
| Below avatar | Display name · white · `t-body-sm` medium · truncate · then relative time · `t-label` · `rgba(255,255,255,0.65)` · gap **8** |
| Ads / Subscribe | **OUT** — do not ship NYT-style ad cards |

---

## Active card chrome (center)

Layers bottom → top over full-bleed media (photo or video). Media `object-fit: cover` the 9:16 card. If letterboxing required, fill with sampled dark or `#0A0A0B` — **not** light muted.

### Progress

| Token | Lock |
|-------|------|
| Position | Top inset **8** · horizontal inset **8** |
| Segments | One per item in this author’s current story set (`total`) |
| Height | **2** |
| Gap | **8** between segments |
| Fill | Done + current = `#FFFFFF`. Pending = `rgba(255,255,255,0.35)`. Current may animate width — product. |
| Accent | **Not** Sporty Blue on progress (verbatim white-on-dark) |

### Header row

| Control | v1 | Spec |
|---------|----|------|
| Avatar | **IN** | **32** · leading |
| Name | **IN** | White · `t-body-sm` medium · truncate |
| Time | **IN** | `rgba(255,255,255,0.65)` · `t-label` · after name · gap **8** |
| Music line | **OUT** | No track row under name in v1 |
| Mute | **IN** if video has audio; else hide | White glyph · hit **40** |
| Pause / Play | **IN** | White · hit **40** |
| More (`…`) | **STUB** → **OUT** if no menu actions yet | Prefer **OUT** until report/delete menu exists — do not draw dead `…` |
| Header inset | | Top below progress **8** · sides **8** · gap **8** |

### Media

| Token | Lock |
|-------|------|
| Fill | Full card under chrome; cover |
| Tap zones | Leading third = previous item · trailing third = next item (IG habit) — optional if chevrons + keyboard exist; **IN** for parity |
| Blank | Muted dark only while URL fails — Dev owns playback URL; Design does not invent CDN |

### Footer

| Control | v1 | Spec |
|---------|----|------|
| Reply field | **IN** if `canReply` | Pill · height **44** · border `rgba(255,255,255,0.45)` · transparent fill · placeholder `Reply to {name}…` · white text · flex-1 |
| Like (heart) | **IN** | White outline · hit **40** · trailing of reply · gap **16** |
| Send / share | **IN** if DM share exists; else **OUT** | White paper-plane · hit **40** · after heart · gap **16**. No dead icon. |
| Footer inset | | Bottom **16** · sides **8** |

---

## Phone (companion — not the verbatim desktop shot)

Adam’s refs are **desktop**. Phone lock for the same open:

| Token | Lock |
|-------|------|
| Host | Full-screen push · stage `#0A0A0B` · **no** side neighbor cards |
| Card | Edge-to-edge (safe-area) · same progress / header / footer grammar |
| Nav | Tap zones + optional thin chevrons; swipe prev/next authors |
| Close | X top trailing → back to Social |

Do not force the desktop side-carousel onto phone.

---

## IN / OUT summary

**IN (desktop)**  
Dark stage · 24Frame mark · X · active 9:16 card · dimmed neighbor cards · Sporty Blue avatar rings on neighbors · chevrons · white progress segments · avatar+name+time · mute (video) · pause · full-bleed media · reply pill · like · send if real.

**OUT**  
Instagram wordmark / brand gradient ring · music row · ad cards · light 420px page card viewer · dead More / Send with no action · Design PR.

**STUB**  
None preferred — omit until real.

---

## Gates

**G1.** Desktop open = dark full-viewport stage (`#0A0A0B`), not light Social column card.  
**G2.** Active card 9:16 · height `min(90vh−16, 840)` · radius 16 · centered.  
**G3.** Immediate prev/next neighbor cards at 72% height · dimmed · centered avatar + name + time.  
**G4.** Chevrons 48 in gaps; hidden when no neighbor.  
**G5.** Top: 24Frame mark leading · X trailing → `/social`.  
**G6.** Progress segments white / white-35%; header name+time; mute+pause when applicable.  
**G7.** Footer reply pill + like (+ send only if real).  
**G8.** No IG wordmark; neighbor ring = Sporty Blue (unseen) not IG gradient.  
**G9.** Music · ads · dead `…` = OUT.  
**G10.** Phone = full-bleed single card; no side carousel required.  
**G11.** Playback/cover URL = Dev; Design no CDN invent.  
**G12.** Design no PR — CoS routes Dev.

## Repo citation

CoS seeds: `docs/design-locks/stories-viewer-desktop-ig-carousel-lock-v1.md`  
Box: `/workspace/24frame-agg-ux/stories-viewer-desktop-ig-carousel-lock-v1.md`  
Refs: `stories-viewer-desktop-ig-ref-{1,2,3}.png`  
Related: `stories-home-rail-fb-card-lock-v1.md` (rail) · create-story v1.5 (camera)
