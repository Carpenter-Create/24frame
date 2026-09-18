# Home width lock (Figma SoT)

Amended 2026-09-18. Design Figma confirmed.

At the 1440 frame:

| Surface | Measure |
| --- | --- |
| Header | Full-bleed 1440 / full viewport |
| Phantom Access rail inset | 220px left |
| Home content column | 1220px (1440 − 220). Same as Activity `main`. |
| Visible dest rail | Off |
| Phone | Unchanged (rail tokens 0; existing max-md pad) |

Do not center Home on the old page cap.

Implementation: `--access-rail-width` insets the Home content frame while
`--sidebar-width` stays `0px` so lead chrome stays full-bleed. The column
is `calc(100% - 220px)` — 1220 at the 1440 stamp, matching Activity main.
