# [GC][24Frame] LOCK — Social Home composer prompt “Share something” v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam ask 2026-09-24 · CoS Own→READY) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · CoS routes Dev  
**Repo citation:** `docs/design-locks/social-home-composer-share-copy-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/social-home-composer-share-copy-lock-v1.md`  
**Register:** Familiar Social verbs · Coinbase-precise · quiet helpers  
**Supersedes (copy only):** `docs/design-locks/social-home-activity-feed-lock-v1.md` lines that say **Write something** for the Home composer prompt / empty primary CTA — purpose + stack + URLs in that lock stay.  
**Also supersedes:** `SOCIAL.home.composerPrompt` / `composerPromptNamed` = `"Write something"` · `socialComposerPrompt()` return · comments citing “Write something” as the live prompt  
**Out of scope:** Composer geometry / stage weight (see `social-home-spine-density-lock-v1.md`) · Create sheet tile labels · inventing named “Share something, {Name}?” variant

---

## One lock

Every Social Home surface that shows the composer prompt string uses **Share something** — not **Write something**. Phone and desktop. One SoT string.

---

## Copy table

| Surface | Lock |
|---------|------|
| Home composer prompt (`data-social-composer-prompt`) | **Share something** |
| `SOCIAL.home.composerPrompt` | **Share something** |
| `SOCIAL.home.composerPromptNamed` | **Share something** (same string — do **not** invent `Share something, Adam`) |
| `socialComposerPrompt(...)` | Always returns **Share something** |
| Page empty primary CTA (activity empty) | **Share something** (same SoT — focuses composer / create path as today) |
| Aria / tests / lock prose that assert the prompt | Update to **Share something** |

---

## Explicit OUT

| OUT | Why |
|-----|-----|
| **Write something** anywhere on Social Home as the live prompt | Adam replace |
| `What's on your mind…` / Meta clone | Register = 24Frame verb |
| Named variant (`Share something, {first}`) | Adam did not ask; keep one string |
| Changing Photo · Video · Write · Go live Create-sheet tiles | Out — “Write” tile is a kind, not this prompt |
| Geometry / pill / card invent in this lock | Density lock owns stage weight |

---

## Done-when

1. Home composer (phone + desktop) shows **Share something**.  
2. Activity empty primary CTA shows **Share something**.  
3. No remaining user-visible **Write something** on Social Home prompt/CTA SoT.  
4. Gates/tests updated to the new string.

**Ship:** Design Own→READY · CoS CLEAR · one Dev PR (may pair with spine density).
