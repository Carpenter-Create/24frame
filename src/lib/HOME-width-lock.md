# Home width lock

Amended 2026-09-23. Desktop shell L/R yield to
`docs/design-locks/shell-desktop-horizontal-gutter-lock-v2.md`
(32 start / 32 end). Dest/Access rail stays off on Home.
Phone unchanged.

At the 1440 frame:

| Surface | Measure |
| --- | --- |
| Header | Full-bleed 1440 / full viewport. Desktop shell gutters 32 / 32. |
| Left inset | 32px (`--shell-gutter-inline-start`). |
| Right inset | 32px (`--shell-gutter-inline-end`). |
| Home content column | 1376px (1440 − 32 − 32) |
| Visible dest rail | Off |
| Phone | Unchanged (existing max-md pad) |

Do not center Home on the old page cap. The dest-rail slot is
`--sidebar-width` (256). Home does not use it.

Implementation: Home content uses `--shell-gutter-inline-start` left
and `--shell-gutter-inline-end` right. On Home the shell sets
`--sidebar-width` to `0px` so lead chrome stays full-bleed.
`--access-rail-width` aliases that slot and is not the Home canvas
inset. `--content-inset` (48) and `--chrome-gutter` (16) stay for
reading measure, phone, and dest-rail geometry.
