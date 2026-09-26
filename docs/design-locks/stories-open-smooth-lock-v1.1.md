# [GC][24Frame] LOCK — Stories open smooth v1.1

**Date:** 2026-09-25 (CT)
**Status:** **LOCKED** (Adam FAIL · clunky open and multi-tap close · Design READY · CoS CLEAR tip-first #682) · Design does **not** open a PR · CoS seeds `docs/design-locks/`
**Repo citation:** `docs/design-locks/stories-open-smooth-lock-v1.1.md`
**Box draft:** `/workspace/24frame-agg-ux/stories-open-smooth-lock-v1.1.md` (not in this tree; this file records the CLEAR)
**Supersedes:** paint-only open in [`stories-open-smooth-lock-v1.md`](stories-open-smooth-lock-v1.md). Poster-hold until real pixels stays.
**Keep:** [`social-video-mux-only-lock-v1.md`](social-video-mux-only-lock-v1.md) · oldest-live open index · 220ms in-viewer morph from [`stories-viewer-ig-parity-lock-v1.md`](stories-viewer-ig-parity-lock-v1.md)

---

## Close

| Token | Lock |
|-------|------|
| Hit | **44×44** (`size-11`) |
| Glyph | Phosphor **X** **22** |
| Stack | Above the media tap and hold zones. Those zones do not take the pointer under the control |
| Leave | **First tap** goes to `/social` |

---

## Motion

Open, play, hop, and leave stay on the picture. No grey jump. No sticky hold after pixels are present.

| Moment | Lock |
|--------|------|
| Open | Rail still stays up until the viewer has pixels, then settles off in **220ms** ease-out |
| Hop | Horizontal slide **220ms** ease-out. The frame stays opaque |
| Leave | The close control navigates. It does not wait on a gesture |
| Reduced motion | Settle drops immediately. Hop animation is off |

---

## Out

Invent a second transition. Drop the poster before `loadeddata`. Play Social video from a file or proxy URL. Undraft. Groups.
