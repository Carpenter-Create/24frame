# [GC][24Frame] LOCK — Stories viewer IG actions v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam product override 2026-09-24 CT — do it like Instagram) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation (ship):** `docs/design-locks/stories-viewer-ig-actions-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/stories-viewer-ig-actions-lock-v1.md`  
**Supersedes:** `docs/design-locks/stories-viewer-reactions-lock-v1.md` (thumbs up/down — **do not ship**)  
**Scope:** Stories **viewer bottom actions** only — heart · comment-to-author · send story via DM.  
**Not in scope:** #664 IG parity / hold-pause (separate) · public comments thread · thumbs up/down · create-story · home rail · shell gutters  
**Gospels:** Instagram craft bar · Coinbase calm + rich-media · rich-calm v1.4 · **no** playful/gimmick · no drop shadows  
**House register:** Geist · Sporty Blue `#1769FF` · spacing **8 / 16 / 24 / 48** · ink / secondary / hairline as house SoT

---

## One lock

Viewer bottom chrome is **Instagram Stories actions grammar** in **24Frame** paint: **comment-to-author** (reply pill) · **heart** like · **send** story to someone via DM. No thumbs. No public comments thread.

---

## Product (Adam — hard)

| Token | Lock |
|-------|------|
| Comment | **KEEP** reply-to-author (`SocialStoryReply`) — DM-style message to story author · **NOT** a public comments thread |
| Like | **Heart** — replaces heart stub / any thumbs cluster |
| Send | **ADD** send-this-story to a person via **DM** |
| OUT | Thumbs up/down · public story comments list/thread · emoji reaction tray · #664 fold-in |

---

## Placement (phone + desktop — one dual-host row)

| Region | Lock |
|--------|------|
| Host row | Bottom viewer chrome · `flex items-center` · gap **8** · pad x **16** · pad y **8** |
| Comment | **Left** · `flex-1 min-w-0` · existing `SocialStoryReply` rounded-full pill (keep role + DM behavior; align only) |
| Action cluster | **Right** · `flex items-center` · gap **8** · `shrink-0` · order L→R: **Heart** then **Send** |
| Heart control | Hit **40×40** · Phosphor **Heart** icon **20** |
| Send control | Hit **40×40** · Phosphor **PaperPlaneTilt** (or house send) icon **20** · aria-label **Send story** |
| Replace | Remove thumbs cluster if present · remove inert heart stub — ship **live** heart + send |
| Forbidden | Second bottom bar · floating IG emoji dock · More/… menu invent · share-to-feed / share-to-Stories external |

Same row on phone full-bleed and desktop 9:16 stage chrome. No mobile-only fork.

---

## Heart — states + counts

| State | Lock |
|-------|------|
| `none` | Not liked by viewer |
| `liked` | Liked by viewer |

| Interaction | Lock |
|-------------|------|
| Tap while `none` | → `liked` |
| Tap while `liked` | → `none` |
| Scope | Per **story item** |

| Counts | Lock |
|--------|------|
| Show | Integer beside heart when like count **> 0** |
| Hide | Omit when **0** (no “0”) |
| Type | `t-label` / **0.75rem** |
| Idle | Secondary / white~70% on dark stage |
| Liked | Heart + count **Sporty Blue `#1769FF`** (filled heart when liked) |
| Sheet | **No** likers sheet from story heart in this lock |

**Motion:** color/fill **≤120 ms** · **no** bounce · **no** particle burst · **no** scale pop. Press opacity **0.7** only.

---

## Comment (reply-to-author)

| Token | Lock |
|-------|------|
| Control | Existing `SocialStoryReply` pill |
| Behavior | Opens / sends **DM to author** (existing `openSocialDm` path) |
| Label | See glass amend — **others:** Send message · **own:** Say something… (comment/@mention) |
| NOT | Public feed comments thread · treating own field as caption editor |

Pill chrome: see **Glass reply / own Say something amend** below.

---

## Send story via DM — sheet / picker grammar

| Token | Lock |
|-------|------|
| Open | Tap Send → **house sheet** (existing `HouseOverlay` / `APP_SHEET_*` dual-host — **no** second sheet system) |
| Title | **Send story** · `t-title` / 1.5rem · Geist · ink |
| Body | Searchable **people picker** (following / recent DMs — use existing social people patterns; do not invent a new directory product) |
| Row | Avatar **40** + display name `t-body` · hit full row · gap **12** · list gap **8** |
| Select | Tap person → send **this story item** as a DM attachment/link to that peer → **close sheet** on success |
| Multi | **Single** recipient per send in this lock (tap one → send → close). No multi-select checkbox invent. |
| Empty | Calm empty: `t-body-sm` secondary — e.g. no people yet (fixture-safe copy; no gimmick illustration) |
| Close | Sheet dismiss (X / scrim) with no send |
| Error | Inline form error under list; sheet stays open |
| OUT | Share to feed · copy link button invent · Stories reshare to own story · external OS share sheet as primary · QR · playful stickers on send |

**Phone:** sheet rises as house bottom sheet. **Desktop:** same house overlay grammar (centered or docked per dual-host SoT — do not fork).

---

## Visual register

| Layer | Lock |
|-------|------|
| Icons idle | Ink-2 / white~70% on dark |
| Heart liked | Sporty Blue filled |
| Send idle/active | Idle only until sheet opens — no persistent “sent” chrome invent beyond toast/inline if house already has one; prefer silent success + close |
| OUT | Meta pink heart · IG gradient · bounce · confetti · emoji reactions · thumbs |

---

## Keep closed (cite)

- `docs/design-locks/stories-viewer-ig-parity-lock-v1.md` — #664 advance/hold/9:16 (separate)  
- `docs/design-locks/stories-viewer-desktop-ig-carousel-lock-v1.md` — stage geometry  
- `docs/design-locks/house-overlay-dual-host-lock-v1.md` — sheet host  
- `docs/design-locks/create-story-photo-video-fb-layout-lock-v1.5.md`  
- `docs/design-locks/24frame-visual-register-rich-calm-lock-v1.md`  

Parity “reply+like” reads as **reply + heart + send** under this lock.

---

## Dev ship checklist (one line)

**Ship:** keep `SocialStoryReply` · live **heart** like (`none`/`liked`, count >0 only, Sporty Blue, no bounce) · **Send** opens house people-picker sheet → single DM of this story item → close · dual-host same bottom row (reply | heart · send) · **no** thumbs · **no** public comments · **not** on #664.

---

## FAIL / PASS

**PASS:** IG action set present · reply stays author-DM · heart works calmly · send picks one person via house sheet · phone+desktop same · no thumbs / no public thread.  
**FAIL:** Thumbs shipped · public comments · gimmick motion · new sheet system · folded into #664 · soft-grade missing send.

---

## Label

**[Global Content][24Frame]** Stories viewer IG actions v1


---

**AMEND 2026-09-24 CT:** Silent send success **OUT**. Brief **Sent** toast + IG DM story-share card owned by `stories-send-dm-craft-lock-v1.md` (Adam #677 smoke).


---

## AMEND 2026-09-24 CT — Glass field own + other (Adam IG · supersedes others-only)

**Status:** Own→READY for CoS CLEAR · **HOLD** the superseded others-only / no-field amend — **do not ship** that version.  
**Mute:** CLOSED from Design (CoS CLEARED mute-control v1 → Dev).  
**Supersedes:** “others-only / no self-reply / own = no field” (skipped-widget default).

**Adam clarifying ask:** IG own “Say something…” — caption or comment?  
**Lock:** **comment / @mention**, **NOT** caption. Caption = create-time text stickers only.

### Product split

| Viewer | Bottom left glass | Bottom right |
|--------|-------------------|--------------|
| **Own story** | Frosted **Say something…** — comment / @mention | Heart · Send (existing — keep) |
| **Other author** | Frosted **Send message** / reply (`SocialStoryReply` DM-to-author) | Heart · Send (unchanged) |

### 1) Own — Say something… (comment / @mention)

| Token | Lock |
|-------|------|
| Resting placeholder | **Say something…** |
| Focus / expand | → **Add a comment or @mention friends…** · emoji row (IG grammar) |
| Role | **Comment / @mention** · **NOT** edit caption / text-sticker on media |
| Face | Frosted glass on dark stage: translucent white wash (~12–20%) + `backdrop-blur` · hairline white~20% · height **40** · `flex-1` · rounded-full · **no** drop shadow |
| Type | `t-body-sm` · white~70% placeholder |

### 2) Other — glass reply (unchanged)

| Token | Lock |
|-------|------|
| Control | `SocialStoryReply` · frosted glass · **Send message** |
| Behavior | DM-to-author (existing) |

### 3) Activity / viewers — cite only

If an Activity / viewers path is **already locked elsewhere**, cite it — do **not** invent Boost, Facebook cross-post, or a new viewers product in this amend.

### 4) Explicit OUT

| OUT |
|-----|
| Treat own field as **caption editor** |
| Keep **others-only** / **self-reply ban** / own = no field |
| Soft / flat non-glass (`bg-surface` paper) |
| Invent **Boost** / Facebook chrome |

### Done-when

1. **Own** → frosted **Say something…** · focus expands to **Add a comment or @mention friends…** + emoji row · not a caption editor.  
2. **Other** → frosted **Send message** (`SocialStoryReply`).  
3. Glass reads frosted — not paper.  
4. No others-only ship · no Boost invent · no #664 reopen.

**Label:** [Global Content][24Frame] Stories viewer glass — own Say something (comment/@mention) + other Send message
