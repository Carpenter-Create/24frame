// Edit profile + Bio — Figma 180:206 / 180:1946 / 181:2184 and
// 180:2004 / 180:2026. Own face 181:230 / 181:2000 has no dead ▶ Edit.
// Sole entry is the primary Edit profile control. Share stays the sheet.
// Bio Enter/Return inserts a newline (Adam amend). Soft newlines count
// toward BIO_MAX as stored. Done is the Sporty Blue check only.
// Edit picture reuses avatars/{userId}/avatar. Links edit in place.

import { BIO_MAX, SOCIAL, SOCIAL_ROUTES, socialBioEnterSubmits } from "@/lib/social";

export const SOCIAL_PROFILE_EDIT_LOCK = {
  entry: SOCIAL.profile.edit,
  share: SOCIAL.profile.share,
  username: SOCIAL.profile.username,
  handleRequired: SOCIAL.profile.handleRequired,
  emptyPreview: "https://24frame.co/@",
  bioMax: BIO_MAX,
  bioPrivacy: SOCIAL.profile.bioPrivacy,
  addLink: SOCIAL.profile.addLink,
  editHref: SOCIAL_ROUTES.profileEdit,
  bioHref: SOCIAL_ROUTES.profileBio,
  enterSubmits: socialBioEnterSubmits(),
  // Bio from Edit is a same-tree face. Name/handle stay mounted.
  keepsDraftOnBio: true,
} as const;

export type SocialProfileEditFace = "edit" | "bio";

export function socialProfileEditFace(openBio: boolean): SocialProfileEditFace {
  return openBio ? "bio" : "edit";
}
