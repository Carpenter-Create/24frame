import { PRODUCT_NAME, SOCIAL_WORKSPACE } from "@/lib/product";
import type { SocialMediaItem, SocialMediaRuleError } from "@/lib/social-media";

// Social workspace copy and input rules. Lives in lib/, not JSX.
// Account faces reuse signedAvatarUrl. Post media uses 24frame-media
// keys on posts.media. Title S3 / S3_BUCKET stay film-only.
// Group DMs reuse Pack 4 conversations.kind=group. Gated community
// groups.min_level spaces stay a different surface.
// /messages is Ask 24Frame AI. DMs are /social/dms only.
// Courses are company/admin publish only. Members browse placeholders.

export const SOCIAL_ROUTES = {
  home: "/social",
  explore: "/social/explore",
  create: "/social/create",
  storiesNew: "/social/stories/new",
  profile: "/social/profile",
  members: "/social/members",
  groups: "/social/groups",
  groupsNew: "/social/groups/new",
  courses: "/social/courses",
  leaderboard: "/social/leaderboard",
  dms: "/social/dms",
} as const;

export function socialMemberHref(handle: string): string {
  return `${SOCIAL_ROUTES.members}/${encodeURIComponent(handle)}`;
}

export function socialGroupHref(slug: string): string {
  return `${SOCIAL_ROUTES.groups}/${encodeURIComponent(slug)}`;
}

export function socialPostHref(slug: string, postId: string): string {
  return `${socialGroupHref(slug)}/posts/${encodeURIComponent(postId)}`;
}

export function socialDmHref(id: string): string {
  return `${SOCIAL_ROUTES.dms}/${encodeURIComponent(id)}`;
}

export function socialCourseHref(slug: string): string {
  return `${SOCIAL_ROUTES.courses}/${encodeURIComponent(slug)}`;
}

export function socialStoryHref(id: string): string {
  return `${SOCIAL_ROUTES.home}/stories/${encodeURIComponent(id)}`;
}

export const SOCIAL = {
  workspace: SOCIAL_WORKSPACE,
  home: {
    title: "Home",
    subtitle: `Posts from people you follow in ${PRODUCT_NAME}.`,
    empty: "No posts from people you follow yet.",
    compose: "Write a post",
    submit: "Post",
    attach: "Add photo or video",
    attaching: "Adding",
    removeAttach: "Remove",
    photoKind: "Photo",
    videoKind: "Video",
    emptyPost: "Write a post or attach a photo or video.",
    mediaType: "Use a photo (JPEG, PNG, WebP, GIF) or a video (MP4, QuickTime, WebM).",
    mediaTooLarge: "That file is too large.",
    mediaMissing: "Choose a photo or video first.",
    mediaInvalid: "Those attachments could not be stored.",
    mediaForbidden: "That file cannot be attached.",
    mediaLimit: "Attach up to four photos or videos.",
    uploadFailed: "The file could not be stored.",
    topic: "Topic",
  },
  explore: {
    title: "Explore",
    subtitle: `Find what is moving in ${PRODUCT_NAME}.`,
    search: "Search",
    searchPlaceholder: "Search people and posts",
    empty: "No trending topics yet.",
    noResults: "No matching people or posts.",
  },
  create: {
    title: "Create",
    subtitle: "Write a post, or add a photo or video.",
    text: "Text",
    photo: "Photo",
    video: "Video",
  },
  stories: {
    create: "Create story",
    title: "Story",
    subtitle: "Add a photo or video. It stays visible for 24 hours.",
    empty: "Add a photo or video.",
    missing: "That story is not visible.",
    expired: "That story is no longer available.",
    submit: "Share",
  },
  checklist: {
    title: "Get started",
    photo: "Photo",
    bio: "Bio",
    introduce: "Introduce yourself",
    firstPost: "First post",
    firstStory: "First story",
  },
  follow: {
    follow: "Follow",
    following: "Following",
  },
  profile: {
    title: "Profile",
    subtitle: "Your creator profile in this workspace.",
    emptyTitle: "Create a creator profile",
    emptyBody:
      "A profile is optional. Company aggregation does not create one. Handle and display name only — photos stay later.",
    handle: "Handle",
    displayName: "Display name",
    bio: "Bio",
    bioSubmit: "Save bio",
    birthDate: "Date of birth",
    birthDateHint: "Required. You must be 13 or older.",
    submit: "Create profile",
    handleTaken: "That handle is already taken.",
    created: "Profile created.",
  },
  member: {
    title: "Member",
    missing: "No public profile for that handle.",
    message: "Message",
    noProfileCta: "Create a creator profile to send a message.",
  },
  groups: {
    title: "Groups",
    subtitle: "Groups you belong to, and public groups you can see.",
    empty: "No groups yet.",
    mine: "Your groups",
    public: "Public groups",
    create: "Create a group",
    members: "members",
    join: "Join",
    joined: "Joined",
    forbidden: "Creating a group needs the create_group capability.",
  },
  groupNew: {
    title: "New group",
    name: "Name",
    slug: "Slug",
    description: "Description",
    submit: "Create group",
  },
  group: {
    wall: "Group",
    empty: "No posts in this group.",
    compose: "Write a post",
    submit: "Post",
    notFound: "That group is not visible.",
    membersOnly: "Join this group to post.",
  },
  post: {
    title: "Post",
    missing: "That post is not visible.",
    like: "Like",
    unlike: "Unlike",
    likes: "likes",
  },
  dms: {
    title: "Messages",
    subtitle: `One-to-one and group conversations in ${PRODUCT_NAME}.`,
    empty: "No conversations yet.",
    thread: "Conversation",
    compose: "Write a message",
    submit: "Send",
    missing: "That conversation is not visible.",
    noProfileCta: "Create a creator profile to use messages.",
    addPeople: "Add people",
    addHandle: "Handle",
    addSubmit: "Add",
    addSelf: "You are already in this conversation.",
    addMissing: "No profile for that handle.",
    addBlocked: "That person cannot be added.",
    titleLabel: "Title",
    titleHint: "Optional. Names stay first.",
    titleSave: "Save title",
    titleInvalid: "Enter a shorter title.",
  },
  leaderboard: {
    title: "Leaderboard",
    subtitle: `How members rank in ${PRODUCT_NAME}.`,
    private: "The leaderboard is private.",
    top: "Top 10",
    yourRank: "Your rank",
    yourRankEmpty: "Your rank appears after you create a creator profile.",
    computed: "Last computed",
    levels: "Level distribution",
    points: "points",
    members: "members",
    empty: "No ranks yet.",
  },
  courses: {
    title: "Courses",
    subtitle: `Placeholder courses in the ${PRODUCT_NAME} Social+Education workspace.`,
    empty: "No courses yet.",
    missing: "That course is not visible.",
    denied: "This course is not available.",
    preview: "Preview",
    modules: "Modules",
  },
  cta: {
    needProfile: "Create a creator profile to post, like, or message.",
    profileHrefLabel: "Create a creator profile",
  },
} as const;

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 30;
export const DISPLAY_NAME_MAX = 80;
export const POST_BODY_MAX = 2000;
export const BIO_MAX = 280;
export const MESSAGE_BODY_MAX = 2000;
export const GROUP_NAME_MAX = 80;
export const GROUP_SLUG_MAX = 40;
export const GROUP_DESCRIPTION_MAX = 400;
export const CONVERSATION_TITLE_MAX = 80;
export const SOCIAL_MIN_AGE_YEARS = 13;

const HANDLE_RE = /^[a-z0-9_]+$/;
const SLUG_RE = /^[a-z0-9-]+$/;

export function normalizeHandle(raw: string): string | null {
  const handle = raw.trim().toLowerCase();
  if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX) return null;
  if (!HANDLE_RE.test(handle)) return null;
  return handle;
}

export function normalizeDisplayName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length === 0 || name.length > DISPLAY_NAME_MAX) return null;
  return name;
}

export function normalizePostBody(raw: string): string | null {
  const body = raw.trim();
  if (body.length === 0 || body.length > POST_BODY_MAX) return null;
  return body;
}

export function normalizeBio(raw: string): string | null {
  const bio = raw.trim().replace(/\s+/g, " ");
  if (bio.length === 0) return "";
  if (bio.length > BIO_MAX) return null;
  return bio;
}

export function normalizeMessageBody(raw: string): string | null {
  const body = raw.trim();
  if (body.length === 0 || body.length > MESSAGE_BODY_MAX) return null;
  return body;
}

export function normalizeGroupName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length === 0 || name.length > GROUP_NAME_MAX) return null;
  return name;
}

export function normalizeGroupSlug(raw: string): string | null {
  const slug = raw.trim().toLowerCase();
  if (slug.length < HANDLE_MIN || slug.length > GROUP_SLUG_MAX) return null;
  if (!SLUG_RE.test(slug)) return null;
  return slug;
}

export function normalizeGroupDescription(raw: string): string | null {
  const description = raw.trim();
  if (description.length === 0) return null;
  if (description.length > GROUP_DESCRIPTION_MAX) return null;
  return description;
}

export function normalizeConversationTitle(raw: string): { title: string | null } | null {
  const title = raw.trim().replace(/\s+/g, " ");
  if (title.length === 0) return { title: null };
  if (title.length > CONVERSATION_TITLE_MAX) return null;
  return { title };
}

export function conversationRoomLabel(
  title: string | null | undefined,
  participantNames: readonly string[],
): string {
  const trimmed = title?.trim();
  if (trimmed) return trimmed;
  const names = participantNames.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return SOCIAL.dms.thread;
  return names.join(", ");
}

export function inboxPeerIds(row: {
  peer_id: string | null;
  participant_ids?: string[] | null;
}): string[] {
  if (row.participant_ids && row.participant_ids.length > 0) {
    return [...new Set(row.participant_ids.filter(Boolean))];
  }
  return row.peer_id ? [row.peer_id] : [];
}

export function quietDmAddError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("yourself")) return SOCIAL.dms.addSelf;
  if (text.includes("blocked")) return SOCIAL.dms.addBlocked;
  if (text.includes("not found") || text.includes("inactive")) return SOCIAL.dms.addMissing;
  if (text.includes("not a participant")) return SOCIAL.dms.missing;
  return SOCIAL.dms.addBlocked;
}

export function isEligibleBirthDate(iso: string, today = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const birth = new Date(`${iso}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime())) return false;
  const cutoff = new Date(
    Date.UTC(today.getUTCFullYear() - SOCIAL_MIN_AGE_YEARS, today.getUTCMonth(), today.getUTCDate()),
  );
  return birth.getTime() <= cutoff.getTime();
}

export function socialInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
}

export function socialCopyHasProductName(text: string): boolean {
  return text.includes(PRODUCT_NAME);
}

export function profileInsertRow(input: {
  userId: string;
  handle: string;
  displayName: string;
  birthDate: string;
}) {
  return {
    id: input.userId,
    handle: input.handle,
    display_name: input.displayName,
    birth_date: input.birthDate,
    app_role: "member" as const,
    points_total: 0,
    level: 1,
    status: "active" as const,
    trust_state: "new" as const,
  };
}

export function socialMediaRuleMessage(error: SocialMediaRuleError): string {
  if (error === "type") return SOCIAL.home.mediaType;
  if (error === "tooLarge") return SOCIAL.home.mediaTooLarge;
  if (error === "missing") return SOCIAL.home.mediaMissing;
  if (error === "limit") return SOCIAL.home.mediaLimit;
  if (error === "forbidden") return SOCIAL.home.mediaForbidden;
  return SOCIAL.home.mediaInvalid;
}

export function postInsertRow(input: {
  authorId: string;
  body: string | null;
  groupId?: string | null;
  media?: SocialMediaItem[];
  category?: string | null;
}) {
  return {
    author_id: input.authorId,
    body: input.body,
    group_id: input.groupId ?? null,
    media: input.media ?? [],
    category: input.category ?? null,
    status: "active" as const,
    like_count: 0,
    comment_count: 0,
    pinned: false,
  };
}

export function followInsertRow(followerId: string, followeeId: string) {
  return {
    follower_id: followerId,
    followee_id: followeeId,
  };
}

export function likeInsertRow(userId: string, postId: string) {
  return {
    user_id: userId,
    target_type: "post" as const,
    target_id: postId,
  };
}

export function messageInsertRow(input: {
  senderId: string;
  conversationId: string;
  body: string;
}) {
  return {
    sender_id: input.senderId,
    conversation_id: input.conversationId,
    body: input.body,
    status: "active" as const,
  };
}

export function groupInsertRow(input: {
  name: string;
  slug: string;
  description: string | null;
  createdBy: string;
}) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    visibility: "public" as const,
    created_by: input.createdBy,
    member_count: 0,
  };
}

export const SOCIAL_BANNED_PRODUCT_NAMES = ["Globee", "24frame", "24-Frame", "24FRAME"] as const;

