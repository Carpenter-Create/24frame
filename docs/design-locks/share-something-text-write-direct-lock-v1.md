# [GC][24Frame] LOCK — Share something text opens write compose v1

**Date:** 2026-09-25 (CT)  
**Status:** **LOCKED** · Adam FAIL on the Create sheet hop · Design no PR · path stays `docs/design-locks/share-something-text-write-direct-lock-v1.md`  
**Box:** `/workspace/24frame-agg-ux/share-something-text-write-direct-lock-v1.md` — checked 2026-09-25; that file was not in the tree. This lock records the approved SoT from the CLEAR.  
**Cite:** Home composer FB-row v1.6 stays. Photo and Camera icons stay. Create sheet stays on bottom-nav + and other Create entries.

## One lock

The Home **Share something** text / placeholder hit opens **write compose** immediately, with the keyboard. It does not open the Create sheet (Media / Write / Go live).

## Concrete

| Surface | Lock |
|---------|------|
| Prompt + avatar (`data-social-composer-prompt-row`) | Link to write compose (`/social/create?kind=text`). No Create sheet. `aria-label={SOCIAL.create.title}` stays. Visible text stays **Share something** |
| Write compose | Existing create surface, kind text. Body field focused for the keyboard |
| Attach | That write compose can attach photo or video (`Add photo or video`). No second chooser |
| Home Photo and Camera | Unchanged. Same media picks, glyph 16, hit 32 |
| Bottom-nav + and other Create entries | Create sheet stays |

## Explicit OUT

Inventing a menu · Groups · #682 · #683 · changing Photo / Camera · reopening composer chrome, Topics, full-bleed, or post actions · undraft

## Done-when

Tapping Share something lands on write compose with the keyboard up, and that compose can attach media. Photo and Camera on the Home row stay. + still opens the Create sheet.
