// Edit profile + Bio — Figma 180:206 / 180:1946 / 181:2184 and
// 180:2004 / 180:2026. Own face 181:230 / 181:2000 has no dead ▶ Edit.
// Sole entry is the primary Edit profile control. Share stays the sheet.
// Bio Enter/Return inserts a newline (Adam amend). Soft newlines count
// toward BIO_MAX as stored. Done is the Sporty Blue check only.
// Edit picture reuses avatars/{userId}/avatar. Links edit in place.
//
// Save SoT: apply the draft to this overlay, leave Edit immediately,
// persist in the background, roll back here on error. Professions /
// Topics toggles stay local draft until that one write.

import {
  BIO_MAX,
  SOCIAL,
  SOCIAL_ROUTES,
  bareHandle,
  composeSocialDisplayName,
  normalizeHandle,
  socialBioEnterSubmits,
  socialHandleRequiredError,
  socialNameRequiredError,
} from "@/lib/social";
import { parseSocialImdbInput } from "@/lib/social-imdb";
import {
  composeSocialWebsiteUrlField,
  parseSocialProfileLinksWrite,
  socialProfileLinkError,
} from "@/lib/social-profile-links";
import { parseSocialProfileRoles } from "@/lib/social-profile-roles";
import { parseSocialProfileTopics } from "@/lib/social-profile-topics";

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
  optimisticSave: true,
} as const;

export type SocialProfileEditFace = "edit" | "bio";

export function socialProfileEditFace(openBio: boolean): SocialProfileEditFace {
  return openBio ? "bio" : "edit";
}

export type SocialProfileEditSaveDraft = {
  username: string;
  firstName: string;
  middleName: string;
  lastName: string;
  bio: string;
  crafts: readonly string[];
  topics: readonly string[];
  imdbUrl: string;
  links: readonly string[];
  photoUrl: string | null;
  welcomeVideoUrl: string | null;
};

export type SocialProfileOptimisticSnapshot = {
  handle?: string;
  displayName?: string;
  bio?: string;
  photoUrl?: string | null;
  welcomeVideoUrl?: string | null;
  crafts?: readonly string[];
  topics?: readonly string[];
  imdbUrl?: string;
  websiteUrl?: string | null;
  error?: string;
  handleError?: string;
};

export type SocialProfileIdentityView = {
  handle: string;
  displayName: string;
  bio: string;
  photoUrl: string | null;
  welcomeVideoUrl: string | null;
  crafts: readonly string[];
  topics: readonly string[];
  imdbUrl: string | null;
  websiteUrl: string | null;
};

export type SocialProfileEditSaveCheck =
  | { ok: true; snapshot: SocialProfileOptimisticSnapshot; form: FormData }
  | { ok: false; error?: string; handleError?: string };

const HANDLE_FIELD_ERRORS = new Set<string>([
  SOCIAL.profile.handleRequired,
  SOCIAL.profile.handleInvalid,
  SOCIAL.profile.handleTaken,
]);

let overlay: SocialProfileOptimisticSnapshot | null = null;
const listeners = new Set<() => void>();

function emitSocialProfileOptimistic() {
  for (const listener of listeners) listener();
}

export function readSocialProfileOptimistic(): SocialProfileOptimisticSnapshot | null {
  return overlay;
}

export function subscribeSocialProfileOptimistic(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSocialProfileOptimisticServerSnapshot(): SocialProfileOptimisticSnapshot | null {
  return null;
}

export function applySocialProfileOptimistic(next: SocialProfileOptimisticSnapshot): void {
  overlay = next;
  emitSocialProfileOptimistic();
}

export function patchSocialProfileOptimistic(patch: Partial<SocialProfileOptimisticSnapshot>): void {
  overlay = { ...(overlay ?? {}), ...patch };
  emitSocialProfileOptimistic();
}

export function clearSocialProfileOptimistic(): void {
  if (!overlay) return;
  overlay = null;
  emitSocialProfileOptimistic();
}

export function socialProfileSaveFieldError(error: string): "handle" | "form" {
  return HANDLE_FIELD_ERRORS.has(error) ? "handle" : "form";
}

export function socialProfilePersistNotice(cause: unknown, fallback: string): string {
  if (typeof cause === "string" && cause.trim()) return cause;
  if (cause instanceof Error && cause.message.trim()) return cause.message;
  return fallback;
}

export function socialProfileOptimisticFail(
  snapshot: SocialProfileOptimisticSnapshot,
  error: string,
): SocialProfileOptimisticSnapshot {
  const handleError = socialProfileSaveFieldError(error) === "handle" ? error : "";
  return {
    ...snapshot,
    error: handleError ? "" : error,
    handleError,
  };
}

export function socialProfileEditFormData(draft: SocialProfileEditSaveDraft): FormData {
  const form = new FormData();
  form.set("handle", draft.username);
  form.set("first_name", draft.firstName);
  form.set("middle_name", draft.middleName);
  form.set("last_name", draft.lastName);
  form.set("display_name", composeSocialDisplayName(draft.firstName, draft.lastName, draft.middleName));
  form.set("crafts", JSON.stringify(parseSocialProfileRoles(draft.crafts)));
  form.set("topics", JSON.stringify(parseSocialProfileTopics(draft.topics)));
  form.set("imdb_url", draft.imdbUrl);
  form.set("links", JSON.stringify(draft.links));
  return form;
}

export function checkSocialProfileEditSave(draft: SocialProfileEditSaveDraft): SocialProfileEditSaveCheck {
  const required = socialHandleRequiredError(draft.username);
  if (required) return { ok: false, handleError: required };
  if (!normalizeHandle(draft.username)) return { ok: false, handleError: SOCIAL.profile.handleInvalid };
  const nameError = socialNameRequiredError(draft.firstName, draft.lastName);
  if (nameError) return { ok: false, error: nameError };
  const imdb = parseSocialImdbInput(draft.imdbUrl);
  if (imdb.error) return { ok: false, error: SOCIAL.profile.imdbInvalid };
  const links = parseSocialProfileLinksWrite(JSON.stringify(draft.links));
  if (links.error) {
    return { ok: false, error: socialProfileLinkError(links.error) ?? SOCIAL.profile.linkInvalid };
  }

  const displayName = composeSocialDisplayName(draft.firstName, draft.lastName, draft.middleName);
  const snapshot: SocialProfileOptimisticSnapshot = {
    handle: bareHandle(draft.username),
    displayName,
    bio: draft.bio,
    photoUrl: draft.photoUrl,
    welcomeVideoUrl: draft.welcomeVideoUrl,
    crafts: parseSocialProfileRoles(draft.crafts),
    topics: parseSocialProfileTopics(draft.topics),
    imdbUrl: imdb.url ?? "",
    websiteUrl: composeSocialWebsiteUrlField(links.urls),
    error: "",
    handleError: "",
  };
  return { ok: true, snapshot, form: socialProfileEditFormData(draft) };
}

export function mergeSocialProfileIdentity(
  server: SocialProfileIdentityView,
  next: SocialProfileOptimisticSnapshot | null,
): SocialProfileIdentityView {
  if (!next || next.error || next.handleError) {
    return {
      ...server,
      photoUrl: next && next.photoUrl !== undefined ? next.photoUrl : server.photoUrl,
      welcomeVideoUrl:
        next && next.welcomeVideoUrl !== undefined ? next.welcomeVideoUrl : server.welcomeVideoUrl,
    };
  }
  return {
    handle: next.handle ?? server.handle,
    displayName: next.displayName ?? server.displayName,
    bio: next.bio !== undefined ? next.bio : server.bio,
    photoUrl: next.photoUrl !== undefined ? next.photoUrl : server.photoUrl,
    welcomeVideoUrl: next.welcomeVideoUrl !== undefined ? next.welcomeVideoUrl : server.welcomeVideoUrl,
    crafts: next.crafts ?? server.crafts,
    topics: next.topics ?? server.topics,
    imdbUrl: next.imdbUrl !== undefined ? next.imdbUrl : server.imdbUrl,
    websiteUrl: next.websiteUrl !== undefined ? next.websiteUrl : server.websiteUrl,
  };
}

export function socialProfileOptimisticMatches(
  server: SocialProfileIdentityView,
  next: SocialProfileOptimisticSnapshot,
): boolean {
  if (next.error || next.handleError) return false;
  if (next.handle !== undefined && next.handle !== server.handle) return false;
  if (next.displayName !== undefined && next.displayName !== server.displayName) return false;
  if (next.bio !== undefined && next.bio !== server.bio) return false;
  if (next.imdbUrl !== undefined && (next.imdbUrl || "") !== (server.imdbUrl || "")) return false;
  if (next.websiteUrl !== undefined && (next.websiteUrl || "") !== (server.websiteUrl || "")) {
    return false;
  }
  if (next.crafts && JSON.stringify([...next.crafts]) !== JSON.stringify([...(server.crafts ?? [])])) {
    return false;
  }
  if (next.topics && JSON.stringify([...next.topics]) !== JSON.stringify([...(server.topics ?? [])])) {
    return false;
  }
  if (next.photoUrl !== undefined && next.photoUrl !== server.photoUrl) return false;
  if (next.welcomeVideoUrl !== undefined && next.welcomeVideoUrl !== server.welcomeVideoUrl) {
    return false;
  }
  return true;
}

export function socialProfileEditSeed<T extends SocialProfileIdentityView>(server: T): T & {
  error: string;
  handleError: string;
} {
  const next = readSocialProfileOptimistic();
  if (!next) return { ...server, error: "", handleError: "" };
  return {
    ...server,
    handle: next.handle ?? server.handle,
    displayName: next.displayName ?? server.displayName,
    bio: next.bio !== undefined ? next.bio : server.bio,
    photoUrl: next.photoUrl !== undefined ? next.photoUrl : server.photoUrl,
    welcomeVideoUrl: next.welcomeVideoUrl !== undefined ? next.welcomeVideoUrl : server.welcomeVideoUrl,
    crafts: next.crafts ?? server.crafts,
    topics: next.topics ?? server.topics,
    imdbUrl: next.imdbUrl !== undefined ? next.imdbUrl ?? "" : server.imdbUrl,
    websiteUrl: next.websiteUrl !== undefined ? next.websiteUrl : server.websiteUrl,
    error: next.error ?? "",
    handleError: next.handleError ?? "",
  };
}
