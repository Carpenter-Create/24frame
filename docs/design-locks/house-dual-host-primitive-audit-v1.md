# House dual-host primitive audit v1

One row unlock at a time. A pull request opens the next row. It does not start a later row, and it does not fork a lookalike.

| Priority | Row |
| --- | --- |
| P0 | HouseOverlay dual-host. Geometry is [`house-overlay-dual-host-v1.md`](house-overlay-dual-host-v1.md). |
| P0 | Extend HousePageSelect. Do not add a second phone select. |
| P1 | HouseField + SettingsFieldStack. |
| P1 | HouseSegment / HouseChip. |
| P2 | HouseEmpty / Pending / Error. |

Phone never-truncate applies on every row. A source-of-truth trigger does not use `truncate`.
