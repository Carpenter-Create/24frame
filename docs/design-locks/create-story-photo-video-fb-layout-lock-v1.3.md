# [GC][24Frame] LOCK — Create story photo + video (FB stage) v1.3

**Date:** 2026-09-23 (CT)  
**Status:** **LOCKED** (Adam product · liberty v1.1 · camera A v1.2 · **Adam refine ~4:49 PM CT — both Upload + Take**) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS re-routes Dev  
**Supersedes:** `create-story-photo-video-fb-layout-lock-v1.2.md` — Upload is **required** (not optional) for photo **and** video; Take/Record remain live camera. Design interim **B** (upload-only) stays void. Camera-only is also void.  
**Scope:** Create-story entry face + desktop/phone **media path grammar** (Upload + live Take for photo and video).  
**House register:** Geist · Sporty Blue `#1769FF` · Coinbase-calm · spacing **8 / 16 / 24 / 48** · **no drop shadows**  
**Cites:** v1.1 liberty · v1.2 live-camera honesty · `SOCIAL_ROUTES.storiesNew` · dual-host · never-truncate

---

## One lock

Full-page FB-structure create stage in 24Frame register: **Your story** rail + two kind cards (photo · video). **No text story.**

Stories must support **both** paths for **photo and video** (FB create-story grammar — two distinct honest controls):

1. **Upload** a photo or video — OS / library file pick — honest **Upload** / **Choose** / **Add** copy  
2. **Take** a photo or video — live `getUserMedia` / device camera — must **actually open camera**, not the file picker  

**Not** upload-only. **Not** camera-only.

---

## Entry + URL

| Token | Lock |
|-------|------|
| URL | **`/social/stories/new`** |
| Close | → **`/social`** |
| Forbidden | Small Dialog entry · third create URL |

Desktop chrome / card geometry / liberty: same as v1.1–v1.2 (full stage · rail ~320 · two cards · house gradients · slight size liberty on 8/16/24/48).

---

## Card set → secondary faces (hard)

**Stage (exactly two cards):**

| Order | Label | Opens |
|-------|-------|-------|
| 1 | **Create a photo story** | Photo secondary face — **both** controls below |
| 2 | **Create a video story** | Video secondary face — **both** controls below |

### Photo secondary face — **both required**

| Control | Behavior (hard) |
|---------|-----------------|
| **Take a photo** | Live camera — `getUserMedia` / equivalent live still capture with preview. **Forbidden:** OS file picker / `<input type="file">` under this label. |
| **Upload a photo** (or **Choose** / **Add a photo**) | OS file / library picker. Honest label only. **Required** — not optional. |

### Video secondary face — **both required**

| Control | Behavior (hard) |
|---------|-----------------|
| **Take a video** / **Record a video** | Live camera + mic capture (`getUserMedia` / equivalent). **Forbidden:** file picker under this label. |
| **Upload a video** | OS file / library picker. Honest label. **Required**. |

Permission deny / no camera: house error on Take/Record; **Upload** stays available. Never relabel Take as Upload in place. Never silently route Take → file picker.

---

## Phone vs desktop

Same **both** controls on phone and desktop (platform capture pipeline on phone; getUserMedia on desktop Chrome/laptop). Hosts unchanged: phone full-screen push · desktop full create stage. Never truncate labels.

---

## Forbidden

- Text story card  
- Upload-only product (Design **B**)  
- Camera-only product  
- Take/Record → file picker  
- BEFORE Video-only modal as entry  
- Design PR  

## Gates

**G1.** Entry `/social/stories/new`; close → `/social`.  
**G2.** Full create stage — no small centered entry modal.  
**G3.** Exactly two stage cards (photo · video); zero text-story card.  
**G4.** Photo secondary face ships **both**: **Take a photo** (live camera) **and** **Upload/Choose/Add a photo** (file).  
**G5.** Video secondary face ships **both**: **Take/Record a video** (live) **and** **Upload a video** (file).  
**G6.** Labels match behavior — no camera label on file pick.  
**G7.** Not upload-only; not camera-only.  
**G8.** Phone + desktop same two-path grammar; never truncate.  
**G9.** Reads as 24Frame (Geist · Sporty Blue · Coinbase-calm · no drop shadows · 8/16/24/48).  
**G10.** Design no PR — CoS routes Dev to **v1.3**.

## Repo citation

CoS seeds: `docs/design-locks/create-story-photo-video-fb-layout-lock-v1.3.md`  
Box: `/workspace/24frame-agg-ux/create-story-photo-video-fb-layout-lock-v1.3.md`  
Prior: v1.2 / v1.1 superseded for media-path grammar
