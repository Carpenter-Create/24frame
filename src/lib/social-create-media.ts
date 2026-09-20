import { socialCreateHref, type SocialCreateKind } from "@/lib/social";
import { socialMediaKindFor } from "@/lib/social-media";

// Adam lock 2026-09-20 — Create Media is one mixed-library intent.
// Media tile / Share-a-post media CTAs open the camera roll immediately
// (`image/*,video/*`). After pick, Next. Then optional caption + Post.
// Never land on an empty attach well first. Photo and Video are not tiles.

export const SOCIAL_CREATE_MEDIA_ACCEPT = "image/*,video/*";
export const SOCIAL_CREATE_MEDIA_STEP_PARAM = "step";
export const SOCIAL_CREATE_MEDIA_STEPS = ["pick", "review", "caption"] as const;
export type SocialCreateMediaStep = (typeof SOCIAL_CREATE_MEDIA_STEPS)[number];

export function parseSocialCreateMediaStep(
  raw: string | string[] | undefined | null,
): SocialCreateMediaStep {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "review" || value === "caption") return value;
  return "pick";
}

export function socialCreateMediaHref(step?: Exclude<SocialCreateMediaStep, "pick">): string {
  const base = socialCreateHref("media");
  return step ? `${base}&${SOCIAL_CREATE_MEDIA_STEP_PARAM}=${step}` : base;
}

export function socialCreateKindFromMediaFile(
  file: Pick<File, "type">,
): Extract<SocialCreateKind, "media"> | null {
  return socialMediaKindFor(file.type) ? "media" : null;
}

export function socialCreateKindFromMediaFiles(
  files: ArrayLike<Pick<File, "type">>,
): Extract<SocialCreateKind, "media"> | null {
  const first = files[0];
  return first ? socialCreateKindFromMediaFile(first) : null;
}

export function socialCreateMediaStepAfterPick(
  files: ArrayLike<unknown>,
  requested: SocialCreateMediaStep | null | undefined,
): SocialCreateMediaStep {
  if (files.length === 0) return "pick";
  return requested === "caption" ? "caption" : "review";
}
