# [GC][24Frame] LOCK — Feed caption above media v1

**Date:** 2026-09-25 (CT)
**Status:** **LOCKED** (Adam lock 2026-09-25 feed caption-above-media, Facebook · CoS CLEAR)
**Repo citation:** `docs/design-locks/feed-caption-above-media-lock-v1.md`
**Scope:** Social Home / feed post cards that have **both** text and media. Not Stories. Not compose. Not the share sheet.

## One lock

A feed post with **both** a text body and media renders in Facebook order:

1. author row
2. caption (text body)
3. media
4. actions
5. likes

Comments, when N > 0, stay after likes.

Caption is the text stack only, above the media. Media stays the media face: full-bleed on that face, no paper card around the image or video.

## Unchanged

| Post | Order |
|------|--------|
| Text only | Unchanged. Existing blend stays author → actions → likes → caption. This lock does not move it. |
| Media only | author → media → actions → likes |
| Stories | Instagram, media-first. Do not change. |

## Out

Write compose, DM compose, voice notes, share sheet, photo scale, tap immersive, Stories rail, Stories viewer.
