# [GC][24Frame] LOCK — Create story photo + video (FB stage) v1.4

**Date:** 2026-09-23 (CT)  
**Status:** **LOCKED** (Adam product · liberty v1.1 · camera A v1.2 · both Upload+Take v1.3 · **Adam glance #664 preview ~6:05 PM CT — viewfinder**) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS re-routes Dev (same #664 or follow-up)  
**Supersedes:** `create-story-photo-video-fb-layout-lock-v1.3.md` — Take photo **and** Record video live faces: **OUT** circular face guide / framing ring / blue progress arc over the subject; **IN** Instagram-normal rectangular **full-bleed** live viewfinder. 24Frame register (not pixel-clone).  
**Scope:** Create-story entry + media-path grammar (v1.3) **+** live camera viewfinder geometry (Take photo · Record video).  
**House register:** Geist · Sporty Blue `#1769FF` · Coinbase-calm · spacing **8 / 16 / 24 / 48** · **no drop shadows**  
**Cites:** v1.3 both-paths · Adam iPhone Safari reject on #664 preview (Story studio circle + “Hold or tap to record”) · Instagram-normal viewfinder grammar

## One lock

Full-page FB-structure create stage in 24Frame register: **Your story** rail + two kind cards (photo · video). **No text story.**

Stories must support **both** paths for **photo and video**:

1. **Upload** — OS / library file pick — honest **Upload** / **Choose** / **Add** copy  
2. **Take** / **Record** — live `getUserMedia` / camera — must **actually open camera**, not the file picker  

**Not** upload-only. **Not** camera-only.

When Take / Record is live, the camera face is an **Instagram-normal rectangular full-bleed viewfinder** — live feed fills the stage rectangle edge-to-edge (respecting safe chrome only: close, shutter / hold-to-record control, house error). **No** circular face guide, framing ring, or progress arc drawn over the subject.

## Entry + URL

| Token | Lock |
|-------|------|
| URL | **`/social/stories/new`** |
| Close | → **`/social`** |
| Forbidden | Small Dialog entry · third create URL |

Desktop chrome / card geometry / liberty: same as v1.1–v1.3 (full stage · rail ~320 · two cards · house gradients · slight size liberty on 8/16/24/48).

## Card set → secondary faces (hard)

**Stage (exactly two cards):**

| Order | Label | Opens |
|-------|-------|-------|
| 1 | **Create a photo story** | Photo secondary face — **both** controls below |
| 2 | **Create a video story** | Video secondary face — **both** controls below |

### Photo secondary face — **both required**

| Control | Behavior (hard) |
|---------|-----------------|
| **Take a photo** | Live camera — `getUserMedia` / equivalent live still capture with preview. **Forbidden:** OS file picker / `<input type="file">` under this label. Viewfinder: see **Live viewfinder** below. |
| **Upload a photo** (or **Choose** / **Add a photo**) | OS file / library picker. Honest label only. **Required** — not optional. |

### Video secondary face — **both required**

| Control | Behavior (hard) |
|---------|-----------------|
| **Take a video** / **Record a video** | Live camera + mic capture (`getUserMedia` / equivalent). **Forbidden:** file picker under this label. Viewfinder: see **Live viewfinder** below. |
| **Upload a video** | OS file / library picker. Honest label. **Required**. |

Permission deny / no camera: house error on Take/Record; **Upload** stays available. Never relabel Take as Upload in place. Never silently route Take → file picker.

## Live viewfinder (Take photo · Record video) — **hard**

Adam reject (#664 preview, iPhone Safari): white circle / face ring (+ blue arc) around the subject while recording (same defect likely on Take photo).

| Token | Lock |
|-------|------|
| Shape | **Rectangular** full-bleed live feed — Instagram-normal grammar |
| Fill | Camera preview fills the create-stage media area edge-to-edge (phone: full-screen push content area; desktop: stage media pane). Object-fit cover; no letterbox unless device aspect forces a temporary gap filled with `#14171A` only — never a decorative oval crop. |
| OUT | Circular face guide · framing ring · oval mask over subject · blue / Sporty Blue **progress arc** around the face · any ring that frames the person as a circle |
| IN | Flat rectangular viewfinder; shutter / **Hold or tap to record** (or house equivalent) sits in chrome **outside** or as a discrete control on the bleed — **not** as a ring around the face |
| Progress | If record duration needs feedback: discrete chrome (bar, timer text, or shutter fill) — **never** a circular arc around the subject |
| Register | 24Frame (Geist · Sporty Blue · Coinbase-calm · no drop shadows · 8/16/24/48). **Not** a pixel clone of Instagram chrome; only the **viewfinder geometry** (rect full-bleed, no face circle) is locked to that grammar |

Applies equally to **Take a photo** preview and **Record a video** live face.

## Phone vs desktop

Same **both** controls + same rectangular full-bleed viewfinder on phone and desktop. Hosts unchanged: phone full-screen push · desktop full create stage. Never truncate labels.

## Forbidden

- Text story card  
- Upload-only product (Design **B**)  
- Camera-only product  
- Take/Record → file picker  
- Circular face guide / framing ring / progress arc over the subject on Take or Record  
- BEFORE Video-only modal as entry  
- Design PR  
- Dev inventing alternate chrome before this lock is seeded  

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
**G10.** Take photo **and** Record video live faces: rectangular full-bleed viewfinder — **no** circular face guide / framing ring / progress arc over the subject.  
**G11.** Record progress (if any) is discrete chrome — not a face-ring arc.  
**G12.** Design no PR — CoS routes Dev to **v1.4** (amend #664 or follow-up).

## Repo citation

CoS seeds: `docs/design-locks/create-story-photo-video-fb-layout-lock-v1.4.md`  
Box: `/workspace/24frame-agg-ux/create-story-photo-video-fb-layout-lock-v1.4.md`  
Prior: v1.3 superseded for viewfinder geometry (media-path grammar from v1.3 retained)
