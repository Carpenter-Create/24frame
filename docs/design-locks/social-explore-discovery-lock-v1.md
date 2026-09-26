# [GC][24Frame] LOCK — Explore discovery (media-first) v1

**Date:** 2026-09-26 (CT)  
**Status:** **LOCKED** · Adam LOCK 2026-09-26 · Design Own→READY cite-only · Design no PR · No Dev ship until CoS CLEAR after READY  
**Repo:** `docs/design-locks/social-explore-discovery-lock-v1.md`  
**Box:** `/workspace/24frame-agg-ux/social-explore-discovery-lock-v1.md`  
**Standing:** Immersive Social · Media Immersion Doctrine · launch-great · rich-calm v1.4 · quiet redundant-chrome · spacing **8 / 16 / 24 / 48** · **no** drop shadows · Geist · Sporty Blue `#1769FF` · mobile never-truncate  
**Scope:** `/social` **Explore** only  
**Cites (no invent beyond Home grammar):** `social-mobile-full-bleed-lock-v1.md` · `social-feed-photo-scale-immersive-lock-v1.md` · `social-feed-text-media-caption-above-lock-v1.md` · `social-feed-multi-media-carousel-lock-v1.md` · `social-video-mux-only-lock-v1.md` · `social-home-post-actions-align-lock-v1.md`

---

## One lock

**Explore is media-first discovery (trending + search) as an IG-class media grid. Tap opens post chrome that cites Home Immersive Social (full-bleed face, caption-above, N≥2 carousel). No Facebook collage invent. No Explore-only post grammar.**

---

## A) Explore shell

| Token | Lock (one SoT) |
|-------|----------------|
| Route | Social **Explore** only · not Home / Profile / Create / Stories / DM |
| Default | **Trending** media grid (media-first — not a text feed) |
| Search | Top field · inset **H 16** · queries same grid · clear returns trending |
| Chrome | Quiet · page bg `#FAFAFB` · **no** paper card wrapping the grid · **no** website gutters around media cells |
| Tabs / modes | Trending (default) + Search results in **one** grid host — **no** extra invent modes |

---

## B) IG-class discovery grid

| Token | Lock (one SoT) |
|-------|----------------|
| Layout | **3-col** phone · **4-col** desktop Explore column |
| Gutter | Hairline **2** between cells · **0** outer inset on phone (full-bleed to viewport) · desktop flush to Explore column edges |
| Cell | Square · `object-fit: cover` · Media Immersion (fills cell — **not** flat pasted thumb on a card) |
| Video cell | Mux poster · mute glyph optional · cite Mux-only · **no** native mp4 |
| N≥2 cue | Small carousel / stack glyph on cell (IG grammar) · **not** FB mosaic inside the cell |
| Hit | Entire cell → open post (§C) |

**FAIL:** Soft/flat pasted thumbs · FB Explore mosaic/collage · text-first Explore wall.  
**PASS:** Dense IG-class media grid · app feel · Immersive Social edges.

---

## C) Open from Explore → Home grammar (cite only)

| Token | Lock (one SoT) |
|-------|----------------|
| Open | Tap cell → post detail / immersive using **Home** locks only |
| Media face | Full-bleed · cap `min(70vh, 560)` cover · cite photo-scale |
| Caption | Text+media → caption **above** media · cite caption-above |
| N≥2 | IG swipe carousel · dots / N-of-M · cite multi-media carousel |
| Actions | Cite post-actions align |
| Immersive | Tap media → photo-scale §B immersive |

**No Explore-specific caption/actions invent.**

---

## Explicit OUT

| OUT | Why |
|-----|-----|
| Home / Profile / Create / Stories / DM craft | Scope Explore only |
| FB collage / mosaic discovery | Adam: IG-class grid |
| Explore-only post chrome | Cite Home Immersive Social |
| N≥2 collage on Home feed | Already OUT — carousel lock |
| Paper cards around cells | Media Immersion FAIL |
| Design PR | CoS seeds · Dev after CLEAR |

---

## Must-fix

1. Explore = trending + search · media-first IG grid.  
2. 3-col phone / 4-col desktop · hairline gutters · full-bleed edges.  
3. Tap → Home grammar cites (caption-above · carousel · photo-scale · Mux).  
4. No invent beyond those cites.

---

## Done-when

1. Tip cites this lock · Adam glance: Explore feels IG discovery + Immersive Social.  
2. Design Own→READY · CoS CLEAR before Dev ship.

**Ship:** Design Own→READY · CoS routes Dev after CLEAR.
