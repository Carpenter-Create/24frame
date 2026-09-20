import {
  APP_SHEET_HEAD_CLASS,
  APP_SHEET_SCRIM_CLASS,
  APP_SHEET_SURFACE_CLASS,
} from "@/lib/house-sheet";
import {
  SOCIAL,
  SOCIAL_ROUTES,
  socialCreateHref,
} from "@/lib/social";
import type { SocialPhosphorIconName } from "@/lib/social-icons";

// Social Create chooser. Adam lock 2026-09-20.
// Pinterest-structure equal tiles. Coinbase-precise chrome.
// Not a Pinterest skin. Not an X FAB flyout / MenuSurface list.
// One SoT for the sheet + tile primitive. Social-only door
// (dock dest · composer plus). Never in the house header.

export const SOCIAL_CREATE_TILES = [
  {
    id: "photo",
    label: SOCIAL.create.photo,
    href: socialCreateHref("photo"),
    icon: "image",
  },
  {
    id: "video",
    label: SOCIAL.create.video,
    href: socialCreateHref("video"),
    icon: "film-strip",
  },
  {
    id: "write",
    label: SOCIAL.create.write,
    href: socialCreateHref("text"),
    icon: "text-t",
  },
  {
    id: "live",
    label: SOCIAL.create.goLive,
    href: SOCIAL_ROUTES.createLive,
    icon: "camera",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  href: string;
  icon: SocialPhosphorIconName;
}[];

export type SocialCreateTileId = (typeof SOCIAL_CREATE_TILES)[number]["id"];

export function socialCreateTile(
  id: string,
): (typeof SOCIAL_CREATE_TILES)[number] | null {
  return SOCIAL_CREATE_TILES.find((tile) => tile.id === id) ?? null;
}

export const SOCIAL_CREATE_SHEET_HOST_CLASS =
  "fixed inset-0 z-50 flex h-dvh w-full flex-col justify-end md:items-center md:justify-center";

export const SOCIAL_CREATE_SHEET_SURFACE_CLASS =
  `${APP_SHEET_SURFACE_CLASS} relative z-10 shadow-none md:mb-0 md:w-[min(28rem,calc(100%-2rem))] md:rounded-[var(--radius-lg)]`;

export const SOCIAL_CREATE_SHEET_HEAD_CLASS =
  `${APP_SHEET_HEAD_CLASS} relative justify-between`;

export const SOCIAL_CREATE_SHEET_TITLE_CLASS =
  "pointer-events-none absolute inset-0 flex items-center justify-center t-body font-medium text-ink";

export const SOCIAL_CREATE_SHEET_SCRIM_CLASS = APP_SHEET_SCRIM_CLASS;

// Phone: 2×2. Wider: one equal row. Never truncate — labels wrap/stack.
export const SOCIAL_CREATE_TILES_CLASS =
  "grid w-full grid-cols-2 gap-[var(--space-3)] min-[480px]:grid-cols-4";

export const SOCIAL_CREATE_TILE_CLASS =
  "flex min-w-0 flex-col items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-lg)] px-[var(--space-2)] py-[var(--space-4)] text-ink";

export const SOCIAL_CREATE_TILE_LABEL_CLASS =
  "whitespace-normal text-center t-label text-ink";
