# [GC][24Frame] LOCK — Stories send DM craft v1.1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam product override 2026-09-24 CT — send craft is the card and a calm sent toast, not a URL and not a poster pretending to be video) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation (ship):** `docs/design-locks/stories-send-dm-craft-lock-v1.md`  
**Supersedes:** poster-only send craft v1 (a still, or the story URL, standing in for the story). Heart, reply, and the viewer bottom row stay on `docs/design-locks/stories-viewer-ig-actions-lock-v1.md`.  
**Scope:** What happens **after** Send story succeeds, and how that message looks in the DM thread and inbox.  
**Not in scope:** #664 IG parity / hold-pause · heart like · public comments · thumbs · a new video player · a new video lightbox · prod SQL  
**Gospels:** Instagram craft bar · Coinbase calm + rich-media · rich-calm v1.4 · **no** playful/gimmick · no drop shadows · no green success · no confetti  
**House register:** Geist · Sporty Blue `#1769FF` · spacing **8 / 16 / 24 / 48** · ink / secondary / hairline as house SoT · InlineNotice for status

---

## One lock

A sent story is a **168-wide story card** in the DM. Video plays through the existing **SocialFeedVideo** host. Photo is a still in the same card and opens the Stories viewer. The message body is the calm line **Sent a story**. The raw story URL is never stored and never shown.

---

## Sent toast

| Token | Lock |
|-------|------|
| When | Only after the send **succeeds** and the house sheet **closes** |
| Duration | **2000ms**, then gone |
| Host | Existing **InlineNotice** grammar. Not a new toast system |
| Place | **Bottom-center** · inset bottom **24** · max-width **280** |
| A11y | `role="status"` · `aria-live="polite"` |
| Paint | House ink on the notice surface. **No** green. **No** confetti. **No** shadow |
| Fail | Sheet **stays open**. Inline error on the sheet. **No** success toast |
| Dismiss | Sheet dismiss (X / scrim) sends nothing and shows no toast |

---

## Message body

| Token | Lock |
|-------|------|
| Stored body | Calm **Sent a story**. Not `socialStoryHref`. Not a raw URL |
| Media | **Keep** the story media on the message. Load **media**, not body-only |
| Story meta | Author, story id, and expiry ride with that media so the card can render after the URL is gone. No new column. No prod SQL |
| Inbox, you sent | **Sent a story** |
| Inbox, they sent | **Sent you a story** |
| Expired | **Story unavailable**. Still no URL |
| Forbidden | URL text in the thread, the inbox excerpt, the toast, or the unavailable line |

---

## Story card

| Token | Lock |
|-------|------|
| Hook | `data-social-dm-story-share` |
| Width | **168** |
| Media well | **9:16** · cover · the well clips the frame |
| Radius | **8** |
| Footer pad | **8** |
| Footer | Author avatar **24** + name + meta **Story** |
| Shadow | None |

Phone wraps the name. Do not ellipsize it into a truncated stub.

---

## Video

| Token | Lock |
|-------|------|
| Host | Existing **SocialFeedVideo** inside the card. No new player |
| Mux | **SocialMuxPlayer** when the item has `playbackId` |
| File | Native `<video controls playsInline>` when it does not |
| Load | The message **media**, not a body-only read and not a rail poster |
| Tap | Fullscreen **that same host only** (`requestFullscreen` on the video or Mux host already in the card) |
| OUT | Poster-only pretending to be video · URL text · a new player · a new HouseOverlay video lightbox · a cousin player |

---

## Photo

| Token | Lock |
|-------|------|
| Frame | Same **9:16** card. Still image. Cover |
| Tap | Stories viewer via `socialStoryHref` |
| OUT | Opening a video lightbox for a photo · printing the href as text |

---

## Expired

| Token | Lock |
|-------|------|
| Copy | **Story unavailable** |
| Media | Do not play or link the dead story |
| URL | Still none |

---

## Keep closed (cite)

- `docs/design-locks/stories-viewer-ig-actions-lock-v1.md` — reply, heart, send sheet, bottom row. Heart is untouched here  
- `docs/design-locks/house-overlay-dual-host-v1.md` — the send sheet host. Do not add a video lightbox  
- `docs/design-locks/24frame-visual-register-rich-calm-lock-v1.md` — paint only  

---

## Dev ship checklist (one line)

**Ship:** success closes the sheet then a 2000ms InlineNotice toast (bottom-center, inset 24, max-width 280, status/polite, no green/confetti/shadow); failure keeps the sheet and the inline error and shows no toast; body is **Sent a story** with media kept; thread card is `data-social-dm-story-share` at 168 with a 9:16 cover well, radius 8, footer pad 8, avatar 24 + name + Story; video is live SocialFeedVideo (Mux or native controls) and tap fullscreens that host; photo tap opens the story; inbox says Sent a story / Sent you a story; expired says Story unavailable; never a raw URL; heart untouched; no undraft; no prod SQL.

---

## FAIL / PASS

**PASS:** Toast only after a real send · card matches the geometry · video is the live host · photo opens the viewer · inbox and body stay calm · expired stays calm · heart unchanged.  
**FAIL:** Sheet stays open on success · toast on failure · raw URL anywhere · poster standing in for video · a new player or video lightbox · URL in the inbox · heart rewritten · SQL applied.

---

## Label

**[Global Content][24Frame]** Stories send DM craft v1.1
