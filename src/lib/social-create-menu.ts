import {
  SOCIAL,
  SOCIAL_ROUTES,
  socialCreateHref,
} from "@/lib/social";
import type { SocialPhosphorIconName } from "@/lib/social-icons";

export const SOCIAL_CREATE_MENU_INTENTS = [
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

export type SocialCreateMenuIntentId = (typeof SOCIAL_CREATE_MENU_INTENTS)[number]["id"];

export function socialCreateMenuIntent(
  id: string,
): (typeof SOCIAL_CREATE_MENU_INTENTS)[number] | null {
  return SOCIAL_CREATE_MENU_INTENTS.find((intent) => intent.id === id) ?? null;
}
