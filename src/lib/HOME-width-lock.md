# Home width lock

Amended 2026-09-18. Adam: reclaim Home left real estate; ease News off
the right edge. Dest/Access rail stays off on Home.

At the 1440 frame:

| Surface | Measure |
| --- | --- |
| Header | Full-bleed 1440 / full viewport |
| Left inset | 48px (`--content-inset`). House reading inset — not the dest-rail slot. |
| Right inset | 16px (`--chrome-gutter`). Slight News outer breath. |
| Home content column | 1376px (1440 − 48 − 16) |
| Visible dest rail | Off |
| Phone | Unchanged (existing max-md pad) |

Do not center Home on the old page cap. The dest-rail slot is
`--sidebar-width` (256). Home does not use it.

Implementation: Home content uses `--content-inset` left and
`--chrome-gutter` right. On Home the shell sets `--sidebar-width` to
`0px` so lead chrome stays full-bleed. `--access-rail-width` aliases
that slot and is not the Home canvas inset.
