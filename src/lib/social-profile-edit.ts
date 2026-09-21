// Edit profile + Bio — Figma 180:206 / 180:1946 / 181:2184 and
// 180:2004 / 180:2026. Own face 181:230 / 181:2000 has no dead ▶ Edit.
// Sole entry is the primary Edit profile control. Share stays the sheet.
// Bio Enter/Return inserts a newline (Adam amend). Soft newlines count
// toward BIO_MAX as stored. Done is the Sporty Blue check only.
// Edit picture reuses avatars/{userId}/avatar.
//
// Save SoT: apply the draft to this overlay, paint the own face in the
// already-mounted Social tree, leave Edit immediately, persist in the
// background, roll back here on error. Memory + sessionStorage + a
// short cookie keep the hop off the skeleton. Index is photo + Settings
// drill-in rows only — nothing typed on the index. Name and Username
// drill inward. Avatar opens the house app-sheet. Professions and
// Topics share one chip-select face. IMDb, Links, and Bio are their
// own faces. Selecting stays local draft until that one write.

import { ACCOUNT_PROFILE } from "@/lib/account-profile";
import { persistSocialMutation } from "@/lib/social-optimistic";
import {
  BIO_MAX,
  SOCIAL,
  SOCIAL_ROUTES,
  bareHandle,
  composeSocialDisplayName,
  displayHandle,
  socialBioEnterSubmits,
  socialHandleInputError,
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
  profileUrlOnEditFace: false,
  handleBareField: true,
  indexDrillOnly: true,
  nameDrillIn: true,
  handleDrillIn: true,
  avatarSheet: true,
  professionsDrillIn: true,
  topicsDrillIn: true,
  imdbDrillIn: true,
  linksDrillIn: true,
  bioMax: BIO_MAX,
  bioPrivacy: SOCIAL.profile.bioPrivacy,
  addLink: SOCIAL.profile.addLink,
  editHref: SOCIAL_ROUTES.profileEdit,
  bioHref: SOCIAL_ROUTES.profileBio,
  enterSubmits: socialBioEnterSubmits(),
  // Name, Username, and Bio from Edit are same-tree faces.
  keepsDraftOnBio: true,
  optimisticSave: true,
  saveHop: true,
  // Fetch persist — not a server action — so Done does not refresh the tree.
  saveHref: "/api/social/profile",
} as const;

export const SOCIAL_PROFILE_OPTIMISTIC_COOKIE = "24frame_social_profile_save";
export const SOCIAL_PROFILE_OPTIMISTIC_STORAGE = "24frame_social_profile_save";
export const SOCIAL_PROFILE_OPTIMISTIC_COOKIE_MAX_AGE = 60;

export type SocialProfileEditFace =
  | "edit"
  | "name"
  | "handle"
  | "bio"
  | "roles"
  | "topics"
  | "imdb"
  | "links";

export function socialProfileEditFace(
  next: SocialProfileEditFace | boolean,
): SocialProfileEditFace {
  if (next === true) return "bio";
  if (next === false) return "edit";
  return next;
}

export function socialProfileBioRowSummary(bio: string): string {
  const text = bio.trim();
  return text || SOCIAL.profile.bioAdd;
}

export function socialProfileNameRowSummary(displayName: string): string {
  const text = displayName.trim();
  return text || SOCIAL.profile.nameAdd;
}

export function socialProfileHandleRowSummary(handle: string): string {
  return displayHandle(handle) || SOCIAL.profile.usernameAdd;
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
  coverUrl?: string | null;
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
  coverUrl: string | null;
  welcomeVideoUrl: string | null;
  crafts: readonly string[];
  topics: readonly string[];
  imdbUrl: string | null;
  websiteUrl: string | null;
};

export const SOCIAL_PROFILE_IDENTITY_EMPTY: SocialProfileIdentityView = {
  handle: "",
  displayName: "",
  bio: "",
  photoUrl: null,
  coverUrl: null,
  welcomeVideoUrl: null,
  crafts: [],
  topics: [],
  imdbUrl: null,
  websiteUrl: null,
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
let hop = false;
const listeners = new Set<() => void>();

function emitSocialProfileOptimistic() {
  for (const listener of listeners) listener();
}

function isBlobUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith("blob:");
}

export function durableSocialProfileOptimistic(
  next: SocialProfileOptimisticSnapshot,
): SocialProfileOptimisticSnapshot {
  const durable: SocialProfileOptimisticSnapshot = { ...next };
  if (isBlobUrl(durable.photoUrl)) delete durable.photoUrl;
  if (isBlobUrl(durable.coverUrl)) delete durable.coverUrl;
  if (isBlobUrl(durable.welcomeVideoUrl)) delete durable.welcomeVideoUrl;
  return durable;
}

function asSocialProfileOptimisticSnapshot(
  parsed: unknown,
): SocialProfileOptimisticSnapshot | null {
  if (!parsed || typeof parsed !== "object") return null;
  const next = parsed as SocialProfileOptimisticSnapshot;
  if (typeof next.handle !== "string" && typeof next.displayName !== "string") return null;
  return next;
}

export function parseSocialProfileOptimisticCookie(
  value: string | undefined | null,
): SocialProfileOptimisticSnapshot | null {
  if (!value) return null;
  const candidates = [value];
  try {
    const decoded = decodeURIComponent(value);
    if (decoded !== value) candidates.unshift(decoded);
  } catch {
    // Cookie readers may already decode.
  }
  for (const candidate of candidates) {
    try {
      const snap = asSocialProfileOptimisticSnapshot(JSON.parse(candidate) as unknown);
      if (snap && !snap.error && !snap.handleError) return snap;
    } catch {
      // Try the next encoding.
    }
  }
  return null;
}

export function readSocialProfileOptimisticCookie(
  get: (name: string) => string | undefined,
): SocialProfileOptimisticSnapshot | null {
  return parseSocialProfileOptimisticCookie(get(SOCIAL_PROFILE_OPTIMISTIC_COOKIE));
}

export function socialProfileOptimisticCookieWrite(next: SocialProfileOptimisticSnapshot): string {
  const payload = encodeURIComponent(JSON.stringify(durableSocialProfileOptimistic(next)));
  return `${SOCIAL_PROFILE_OPTIMISTIC_COOKIE}=${payload}; path=/social; max-age=${SOCIAL_PROFILE_OPTIMISTIC_COOKIE_MAX_AGE}; samesite=lax`;
}

export function socialProfileOptimisticCookieClear(): string {
  return `${SOCIAL_PROFILE_OPTIMISTIC_COOKIE}=; path=/social; max-age=0; samesite=lax`;
}

function readDocumentOptimisticCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${SOCIAL_PROFILE_OPTIMISTIC_COOKIE}=`;
  const part = document.cookie.split("; ").find((row) => row.startsWith(prefix));
  return part?.slice(prefix.length);
}

function readStoredSocialProfileOptimistic(): SocialProfileOptimisticSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SOCIAL_PROFILE_OPTIMISTIC_STORAGE);
    if (raw) {
      const snap = asSocialProfileOptimisticSnapshot(JSON.parse(raw) as unknown);
      if (snap) return snap;
    }
  } catch {
    // Quota / private mode.
  }
  return parseSocialProfileOptimisticCookie(readDocumentOptimisticCookie());
}

function writeSocialProfileOptimisticBridge(next: SocialProfileOptimisticSnapshot | null) {
  if (typeof window === "undefined") return;
  try {
    if (next) {
      sessionStorage.setItem(
        SOCIAL_PROFILE_OPTIMISTIC_STORAGE,
        JSON.stringify(next.error || next.handleError ? next : durableSocialProfileOptimistic(next)),
      );
    } else {
      sessionStorage.removeItem(SOCIAL_PROFILE_OPTIMISTIC_STORAGE);
    }
  } catch {
    // Quota / private mode.
  }
  document.cookie =
    next && !next.error && !next.handleError
      ? socialProfileOptimisticCookieWrite(next)
      : socialProfileOptimisticCookieClear();
}

overlay = readStoredSocialProfileOptimistic();

export function readSocialProfileOptimistic(): SocialProfileOptimisticSnapshot | null {
  return overlay;
}

export function readSocialProfileSaveHop(): boolean {
  return hop;
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

export function getSocialProfileSaveHopServerSnapshot(): boolean {
  return false;
}

export function socialProfileOptimisticPublic(
  next: SocialProfileOptimisticSnapshot | null,
): next is SocialProfileOptimisticSnapshot {
  return Boolean(next && !next.error && !next.handleError && (next.handle || next.displayName));
}

export function applySocialProfileOptimistic(next: SocialProfileOptimisticSnapshot): void {
  overlay = next;
  hop = socialProfileOptimisticPublic(next);
  writeSocialProfileOptimisticBridge(next);
  emitSocialProfileOptimistic();
}

export function patchSocialProfileOptimistic(patch: Partial<SocialProfileOptimisticSnapshot>): void {
  overlay = { ...(overlay ?? {}), ...patch };
  writeSocialProfileOptimisticBridge(overlay);
  emitSocialProfileOptimistic();
}

export function releaseSocialProfileSaveHop(): void {
  if (!hop) return;
  hop = false;
  emitSocialProfileOptimistic();
}

export function clearSocialProfileOptimistic(): void {
  if (!overlay && !hop) return;
  overlay = null;
  hop = false;
  writeSocialProfileOptimisticBridge(null);
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

export async function persistSocialProfileEdit(form: FormData): Promise<{ error?: string }> {
  return persistSocialMutation(SOCIAL_PROFILE_EDIT_LOCK.saveHref, form, ACCOUNT_PROFILE.saveFailed);
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
  const handleError = socialHandleInputError(draft.username);
  if (handleError) return { ok: false, handleError };
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
      coverUrl: next && next.coverUrl !== undefined ? next.coverUrl : server.coverUrl,
      welcomeVideoUrl:
        next && next.welcomeVideoUrl !== undefined ? next.welcomeVideoUrl : server.welcomeVideoUrl,
    };
  }
  return {
    handle: next.handle ?? server.handle,
    displayName: next.displayName ?? server.displayName,
    bio: next.bio !== undefined ? next.bio : server.bio,
    photoUrl: next.photoUrl !== undefined ? next.photoUrl : server.photoUrl,
    coverUrl: next.coverUrl !== undefined ? next.coverUrl : server.coverUrl,
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
  if (next.coverUrl !== undefined && next.coverUrl !== server.coverUrl) return false;
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
    coverUrl: next.coverUrl !== undefined ? next.coverUrl : server.coverUrl,
    welcomeVideoUrl: next.welcomeVideoUrl !== undefined ? next.welcomeVideoUrl : server.welcomeVideoUrl,
    crafts: next.crafts ?? server.crafts,
    topics: next.topics ?? server.topics,
    imdbUrl: next.imdbUrl !== undefined ? next.imdbUrl ?? "" : server.imdbUrl,
    websiteUrl: next.websiteUrl !== undefined ? next.websiteUrl : server.websiteUrl,
    error: next.error ?? "",
    handleError: next.handleError ?? "",
  };
}
