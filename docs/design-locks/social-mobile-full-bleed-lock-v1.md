# [GC][24Frame] LOCK — Social mobile full-bleed media + dividers v1

**Date:** 2026-09-24 (CT)  
**Status:** **LOCKED** (Adam 2026-09-24 · mobile full-bleed · desktop leave · CoS tip-first CLEAR Dev · Design lock parallel/after · house speed — no invent bounce) · Design does **not** open a PR · CoS seeds `docs/design-locks/` · Design HOLD invent else  
**Repo citation:** `docs/design-locks/social-mobile-full-bleed-lock-v1.md`  
**Box draft:** `/workspace/24frame-agg-ux/social-mobile-full-bleed-lock-v1.md`  
**Supersedes:** `social-full-bleed-lock-v1.md` (desktop-in amend — **REVERT**; Adam: leave desktop)  
**Adam call:** On mobile Social, media images and grey lines touch the edges / full width like Facebook so it feels like an app not a website. **Desktop left alone.**  
**Gospels:** Launch-great ASAP · Media Immersion · Immersive Social / Home north star · quiet redundant-chrome · phone never-truncate  
**Related:** `social-home-spine-density-lock-v1.1.md` feed bleed intent — this lock raises **phone** media + horizontal greys to **viewport edge** (0 inset)  
**Out:** Desktop bleed invent · soft “almost full” · bleeding text/meta · website postcard inset media on phone

---

## One lock

**Mobile Social only:** post media and horizontal grey dividers are **viewport full-bleed** (L/R inset **0**). Text, avatar, actions, and captions stay inset (Facebook grammar). **Desktop: out of scope.**

---

## Phone SoT (concrete)

| Surface | Lock |
|---------|------|
| Post / feed **media** (image · video frame) | L/R = **viewport edge** · inset **0** · side radius **0** |
| Horizontal **grey dividers** (`#ECEDF0`) | L/R = **viewport edge** · inset **0** |
| Author row · avatar · name · meta · actions · caption · comments teaser | Keep **inset** (house pad H **16** unless a tighter locked surface says otherwise) |
| Stories **rail** host | Full-width **scroll host** (rail reaches viewport edges; cards scroll inside) |
| Stories **viewer** | Already full-bleed — **keep** |
| Compose top/bottom hairlines (#681 v1.6) | On phone, horizontal section greys follow viewport-bleed when they are section lines |
| Page / shell horizontal pad | Must **not** trap phone media or grey rules inside an inset column |

---

## Desktop

**Out of scope.** Do not invent a desktop bleed cousin. Leave desktop Social feed as currently locked elsewhere.

---

## Explicit OUT

| OUT | Why |
|-----|-----|
| Desktop media/divider full-bleed this lock | Adam: leave desktop |
| Phone media or greys inset inside viewport | Adam FAIL — website feel |
| Bleeding captions / actions / avatars | Breaks FB text-inset grammar |
| Soft half-bleed | No invent bounce |

---

## FAIL / PASS

| PASS | FAIL |
|------|------|
| Phone: media + greys touch viewport L/R | Side gutters on phone media or greys |
| Text / chrome stay inset | Text also full-bleed |
| Desktop unchanged by this lock | Desktop bleed invent |

---

## Done-when

1. Phone Social feed media L/R flush to viewport.  
2. Phone horizontal grey dividers L/R flush to viewport.  
3. Text/meta inset.  
4. Desktop left alone.  
5. No Design PR.

**Ship:** Design Own→READY (parallel/after) · Design HOLD invent else.

---

## Report (for CoS)

- **READY:** mobile-only full-bleed media + grey dividers · desktop out  
- **Lock path:** `/workspace/24frame-agg-ux/social-mobile-full-bleed-lock-v1.md` → `docs/design-locks/social-mobile-full-bleed-lock-v1.md`
