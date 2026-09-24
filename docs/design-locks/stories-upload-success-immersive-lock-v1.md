# [GC][24Frame] LOCK — Stories create success immersive confirm v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam FAIL 2026-09-24 — upload success thin check card · CoS exact-shot clarify same day · Own→READY) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation:** `docs/design-locks/stories-upload-success-immersive-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/stories-upload-success-immersive-lock-v1.md`  
**Adam FAIL (exact shot — library video upload, not in-app record):** `/workspace/24frame-agg-ux/stories-upload-success-fail-adam.png`  
**Preview host (signal):** `thread-messag-103ff7-e8holdings.vercel.app` · Social  
**Doctrine:** **Media Immersion Doctrine** (Adam 2026-09-24, house-wide, permanent) — anywhere media → media-rich immersive IG-excellent presence; soft / flat / pasted = FAIL before glance. Soft never ships.  
**Bar:** Same immersive confirm as **Record** path. E8 / FB-IG highest commercial grade. Success after a Story post must still **feel like Stories**, not a blank admin receipt.  
**Cites:** `create-story-photo-video-fb-layout-lock-v1.1.md` (entry stage only — does **not** own posted face) · `social-story-studio` / `SOCIAL_STORY_STUDIO_*` (record immersive host = the bar) · DM immersive hide-shell grammar (same chrome-tax kill) · rich-calm · never-patch · phone never-truncate · dual-host  
**Out of scope:** Inventing Dev spacing beyond the tokens below · undrafting #664 · Groups / group pages product · inventing caption/share-to-feed on this face · Send (#677) · viewer IG parity remount

---

## One lock

After a Story **posts successfully**, show **one immersive media confirm** — the same full-bleed Stories studio host used on **Record review** — with the **just-posted media still present**. Upload (library pick) and Record / Take must land on **that same confirm**. Kill the thin white check card on empty create-stage chrome **and** kill Social shell + **Your story** receipt chrome on that face.

---

## Adam FAIL — exact chrome (shot)

Library **video upload** (not in-app record) landed on:

| Layer | What Adam saw | Verdict |
|-------|---------------|---------|
| Social shell | Logo **24** · **Social** · search · sparkle · bell · avatar still up | Chrome tax · not immersive |
| Page header | **X** · **Your story** · **AC** + **Adam Carpenter** | Create-stage receipt · not studio |
| Body | Large empty **gray** void | Soft / empty |
| Card | Center white card · blue check · **Story posted** · **Back to Stories** · blue **View Stories** | Thin / flat / pasted · **no media** |

**Bar:** Record path immersive confirm (media on stage). Soft/thin card = FAIL.

---

## Diff (why)

| Path | Pre-post | Post-success today | Verdict |
|------|----------|--------------------|---------|
| **Record video** | Immersive dark studio · media fills stage (`SOCIAL_STORY_STUDIO_*`) | `releaseClip()` + `phase === "posted"` → create-stage (**Your story** + identity) + thin `SOCIAL_STORY_POSTED_CLASS` · Social shell may remain · **no media** | Pre-post = PASS bar · post = soft FAIL |
| **Upload video** (library) | Immersive studio while `phase === "review" && clip.kind === "video"` | **Same** thin posted card · shot above | Post = soft FAIL (Adam signal) |
| **Upload / Take photo** | Light secondary share column (`SOCIAL_STORY_SHARE_*`) — not this lock | Same thin posted card | Post = soft FAIL |

**Root cause (craft):** Success tears down media (`releaseClip`) and swaps to a **paper receipt** under Social shell + create rail. Soft / flat / pasted. Media Immersion FAIL.

**Code anchors (cite only — Design does not ship):**  
`src/components/social/social-story-studio.tsx` (`phase === "posted"`, `videoStudio`, `postClip`) · `SOCIAL_STORY_POSTED_CLASS` in `src/lib/social-chrome.ts` · copy `SOCIAL.stories.posted` / `postedHint` / `viewStories`

---

## Posted face (concrete — one grammar)

**Trigger:** `createSocialStory` success for **any** create path (Upload photo · Upload video · Take photo · Record video).

| Token | Lock |
|-------|------|
| Host | **Immersive Stories studio stage** — same family as Record review (`SOCIAL_STORY_STUDIO_CLASS` / stage). Full-bleed media. **Not** create-stage rail + muted empty pane. |
| Media | **Required.** Keep the just-posted photo **or** video on stage (blob or signed URL). Video may loop muted or hold last frame — media presence required. **Do not** revoke / clear media **before** confirm paints. |
| Aspect | **9:16** cover · object-cover · phone + desktop |
| Scrim / overlay | Bottom gradient (same grammar as studio review chrome) · top thin chrome |
| Close | **X** top-leading · hit **40** · ink-on-dark / band-ink · → Social Home `/social` (same close target as create) |
| Title | **Story posted** · `t-body-sm` / medium · band-ink · top center (or over bottom scrim — one place, not both) |
| Primary CTA | **View Stories** · pill · height **48** · pad **16** H · Sporty Blue `#1769FF` · white label · → Social Home `/social` (Stories rail visible) |
| Secondary | Optional text control **Back to Stories** under CTA · `t-body-sm` · band-ink/70 · same href — **or** omit if redundant with primary; do **not** invent a third destination |
| Check icon | **OUT** as the hero — no empty white card centered on grey with blue check as the success face |
| Create rail | **Hidden** while posted confirm is up (phone + desktop) — no **Your story** / **AC** identity competing |
| Social shell | **Hidden** while posted confirm is up — logo / Social / search / sparkle / bell / avatar **OUT** (same chrome-tax kill as Record studio / DM immersive). **Restore** on exit to `/social`. |
| Bottom dock | **Hidden** on phone while posted (if present). Restore on exit. |
| Empty gray void | **OUT** — media fills the stage |
| Shadow | **None** |
| Spacing | Only **8 / 16 / 24 / 48** |

### Phone

| Token | Lock |
|-------|------|
| Host | Full viewport immersive studio (edge to safe-area) — **no** Social shell above |
| Media | Full-bleed 9:16 cover |
| CTA | Bottom overlay · pad **16** · safe-area bottom · View Stories |

### Desktop

| Token | Lock |
|-------|------|
| Host | Immersive studio filling the compose viewport — media dominates; **no** thin card in a grey void under house utilities |
| Shell / rail | Social shell + create left rail **OUT** for posted |
| CTA | Same pill grammar · bottom overlay |

---

## Unify rule (no fork)

| Entry | Pre-post (unchanged by this lock) | Posted confirm |
|-------|-----------------------------------|----------------|
| Record video | Immersive studio review | **This immersive confirm** |
| Upload video | Immersive studio review | **Same** |
| Take photo | Existing Take / shutter path | **Same** |
| Upload photo | Existing review may stay light share column **until** post | **Same immersive confirm after post** |

One component / one `posted` face. **Forbidden:** separate soft receipt for Upload and rich confirm for Record.

---

## FAIL / OUT

| FAIL | Why |
|------|-----|
| Thin white card · blue check · Story posted · Back to Stories · View Stories (Adam shot) | Soft / flat / pasted |
| Social shell still up on confirm (logo · Social · search · sparkle · bell · avatar) | Chrome tax · not Record bar |
| **Your story** + **AC** identity on success | Create receipt · not immersive |
| Empty muted / gray stage with no media | Media Immersion FAIL |
| Upload → receipt · Record stays immersive | Path fork — unify |
| Dropping media (`releaseClip`) before confirm paints | Causes blank card |
| Inventing caption / sticker / share-to-feed on success | Out of scope |
| Groups / group pages / community product | Out |
| Undraft #664 or inventing Dev spacing menus | Out |
| Soft green toast-only success with no media | Soft-grade |

---

## Done-when (CoS → Dev)

1. Library **video Upload** → post → immersive confirm with **that video** on stage · **no** thin check card · **no** Social shell · **no** Your story / AC row · **no** empty gray.  
2. **Record video** → post → **same** confirm host / CTA grammar (no richer fork).  
3. Photo Upload or Take → post → same immersive confirm with **that still** on stage.  
4. Phone + desktop: shell + create rail hidden on posted · restore on exit to `/social` · View Stories works.  
5. Adam hard-refresh glance on upload success: **PASS** Media Immersion (not soft receipt).

**Ship:** Design Own→READY · CoS CLEAR · one Dev PR citing this lock path only.
