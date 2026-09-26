# [GC][24Frame] LOCK — Social Home Topics strip center v1

**Date:** 2026-09-25
**Status:** **LOCKED** (Adam glance on tip `705672c3`: composer PASS. Nit: Topic pills sit closer to the bottom of the strip than the top.)
**Repo citation:** `docs/design-locks/social-home-topics-strip-center-lock-v1.md`
**Does not reopen:** `docs/design-locks/social-home-composer-fb-row-sheet-lock-v1.6.md`

---

## One lock

Topic pills are vertically centered in the Topics section, between the header hairline and the composer top rule. The air above the pill row equals the air below it. Phone and desktop.

Pill hit stays 32. Pill copy stays. The row still scrolls sideways. It does not truncate.

## Measure

The social frame pads 16 above the stack. The spine gap under the pills is 8. That left 16 above and 8 below.

The Topics host pulls up by that extra 8 (`-mt-[var(--space-2)]`). Both airs are 8. The shared frame pad stays, so other Social pages keep their 16.

## Explicit OUT

| OUT | Why |
|-----|-----|
| Composer v1.6 tokens | White band, pad Y 8, band 56, top and bottom hairline only, no side stroke, radius 0 |
| Pill size or copy | Not required for center |
| Sibling divider | Host borders are the chrome |
| Changing `SOCIAL_DESKTOP_FRAME_PAD_CLASS` | Shared by every Social page |
