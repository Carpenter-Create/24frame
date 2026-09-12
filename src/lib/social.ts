import { PRODUCT_NAME, SOCIAL_WORKSPACE } from "@/lib/product";

// Social workspace copy and input rules. Lives in lib/, not JSX.
// Text-only v0. Avatars, media, S3, and group chat stay HOLD.
// /messages is Ask 24Frame AI — DMs are /social/dms only.

export const SOCIAL_ROUTES = {
  home: "/social",
  profile: "/social/profile",
  members: "/social/members",
  groups: "/social/groups",
  groupsNew: "/social/groups/new",
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

export const SOCIAL = {
  workspace: SOCIAL_WORKSPACE,
  home: {
    title: "Home",
    subtitle: `Posts you can see in ${PRODUCT_NAME}.`,
    empty: "No posts yet.",
    compose: "Write a post",
    submit: "Post",
  },
  profile: {
    title: "Profile",
    subtitle: "Your creator profile in this workspace.",
    emptyTitle: "Create a creator profile",
    emptyBody:
      "A profile is optional. Company aggregation does not create one. Handle and display name only — photos stay later.",
    handle: "Handle",
    displayName: "Display name",
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
    subtitle: "Direct messages.",
    empty: "No conversations yet.",
    thread: "Conversation",
    compose: "Write a message",
    submit: "Send",
    missing: "That conversation is not visible.",
    noProfileCta: "Create a creator profile to use messages.",
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
  cta: {
    needProfile: "Create a creator profile to post, like, or message.",
    profileHrefLabel: "Create a creator profile",
  },
} as const;

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 30;
export const DISPLAY_NAME_MAX = 80;
export const POST_BODY_MAX = 2000;
export const MESSAGE_BODY_MAX = 2000;
export const GROUP_NAME_MAX = 80;
export const GROUP_SLUG_MAX = 40;
export const GROUP_DESCRIPTION_MAX = 400;
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

export function postInsertRow(input: {
  authorId: string;
  body: string;
  groupId?: string | null;
}) {
  return {
    author_id: input.authorId,
    body: input.body,
    group_id: input.groupId ?? null,
    status: "active" as const,
    like_count: 0,
    comment_count: 0,
    pinned: false,
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

