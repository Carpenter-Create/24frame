# [GC][24Frame] LOCK — Stories viewer mute control v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam phone — silent play · speaker flash-and-gone · CoS fold Dev RCA · Own→READY) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation:** `docs/design-locks/stories-viewer-mute-control-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/stories-viewer-mute-control-lock-v1.md`  
**Bar:** Instagram / Facebook — muted autoplay OK; **mute control stays visible and tappable** for the whole video item; unmute restores sound when media has audio.  
**Cite tip:** `main` @ `95ef9620` · `src/components/social/social-story-viewer.tsx` (`StoryVideo` · `audible` · `data-social-story-mute`)  
**HOLD invent:** **No new speaker UI / chrome family** — keep existing header mute control; fix presence logic only.  
**Out of scope:** Volume slider · EQ · create-studio mute · feed Mux · #664 advance/progress/9:16 reopen · open-index · glass reply (actions amend — separate, already Own→READY)

---

## One lock

Keep the existing Stories mute control. It must stay mounted and tappable for the entire video item. Do **not** unmount it because Safari reports empty `audioTracks`.

---

## Adam miss + Dev RCA (cite — no invent)

| Symptom | Root (tip `social-story-viewer.tsx`) |
|---------|--------------------------------------|
| Silent play; refresh → speaker flashes then **gone**; cannot unmute | Mute btn mounts only when `video && audible` |
| | `audible` starts **true**; `StoryVideo` `onLoadedMetadata` → `onAudible(false)` if `audioTracks.length === 0` |
| | Safari / iOS often has **empty `audioTracks` at metadata** even when the clip has audio → control unmounts after flash |
| | `onAudible(true)` never fires; `audible` **not reset** on item change |
| Separate OK path | Autoplay fails → `onForcedMute()` leaves **speaker-slash tappable** — disappear is **`audible === false` hide**, not force-mute |

---

## Behavior (concrete — IG-grade)

| Token | Lock |
|-------|------|
| Default | Autoplay **muted** / force-mute policy **OK** |
| Control presence | For every **video** item: control **stays visible + tappable** for the **whole item** (muted or unmuted) |
| Empty `audioTracks` | **Do NOT** treat empty / missing `audioTracks` as no-audio · **do not** call hide / `onAudible(false)` from that alone |
| Item change | **Reset** audible (or equivalent presence) on item change so the next video gets a fresh stay-mounted control |
| Unmute | Tap unmute → restore sound when media has audio |
| Force-mute | Autoplay-fail → force muted **OK** · control **remains** speaker-slash and tappable |
| Photo / non-video | No mute control (existing) |
| Forbidden | Flash-and-gone · hide after metadata · soft-grade missing unmute · new speaker family |

---

## Placement (existing chrome only)

| Token | Lock |
|-------|------|
| Host | **Existing** header control `data-social-story-mute` (top row with pause / Close) — **keep** |
| Icons | Existing Phosphor **speaker-slash** / **speaker-high** size **20** · hit **40×40** |
| OUT | New speaker dock · bottom-bar mute invent · second mute family · redesign of mute chrome |

---

## Do not reopen (cite only)

| Lock | Owns |
|------|------|
| `docs/design-locks/stories-viewer-ig-parity-lock-v1.md` | #664 advance · segments · hold · next/prev · 9:16 fill |
| `docs/design-locks/stories-viewer-desktop-ig-carousel-lock-v1.md` | Stage / neighbors |
| `docs/design-locks/stories-viewer-open-index-lock-v1.md` | Oldest-live open (CLEARED) |
| `docs/design-locks/stories-viewer-ig-actions-lock-v1.md` | Heart · send · glass reply others-only amend |

---

## FAIL / PASS

| PASS | FAIL |
|------|------|
| Video: mute control stays full item · unmute hears audio | Speaks flashes then gone (`audible=false` from empty tracks) |
| Force-mute still shows tappable slash | Soft-grade / new speaker UI invent |
| Audible presence reset on item hop | Stale `audible=false` across items |

---

## Done-when (CoS → Dev)

1. Control stays **visible + tappable** for the whole video item (muted or not).  
2. Do **not** treat empty / missing `audioTracks` as no-audio.  
3. **Reset** audible (presence) on item change.  
4. Autoplay-muted / force-mute policy OK; **unmute restores sound** when media has audio.  
5. **OUT:** new speaker family · soft grade.

**Ship:** Design Own→READY · CoS CLEAR → 24Frame Dev (fix presence only · no chrome invent) · Design HOLD invent else.
