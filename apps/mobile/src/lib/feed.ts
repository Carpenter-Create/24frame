export type SocialProfileRow = {
  id: string;
  handle: string;
  display_name: string;
  status: string;
};

export type SocialPostRow = {
  id: string;
  body: string | null;
  author_id: string;
  group_id: string | null;
  like_count: number;
  created_at: string;
};

export type SocialHomePost = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorHandle: string | null;
  createdAt: string;
};

export type SocialHome = {
  profile: SocialProfileRow | null;
  posts: SocialHomePost[];
};

export type FeedClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{ data: SocialProfileRow | null }>;
        order: (
          column: string,
          options: { ascending: boolean },
        ) => {
          limit: (count: number) => PromiseLike<{ data: SocialPostRow[] | null }>;
        };
      };
      in: (column: string, values: string[]) => PromiseLike<{ data: SocialProfileRow[] | null }>;
    };
  };
};

export function mapSocialHome(
  profile: SocialProfileRow | null,
  posts: SocialPostRow[],
  authors: SocialProfileRow[],
): SocialHome {
  const byId = new Map(authors.map((row) => [row.id, row]));
  return {
    profile,
    posts: posts.map((post) => {
      const author = byId.get(post.author_id);
      return {
        id: post.id,
        body: post.body ?? "",
        authorId: post.author_id,
        authorName: author?.display_name ?? "Member",
        authorHandle: author?.handle ?? null,
        createdAt: post.created_at,
      };
    }),
  };
}

export async function loadSocialHome(client: FeedClient, userId: string): Promise<SocialHome> {
  const { data: profile } = await client
    .from("profiles")
    .select("id, handle, display_name, status")
    .eq("id", userId)
    .maybeSingle();

  const { data: posts } = await client
    .from("posts")
    .select("id, body, author_id, group_id, like_count, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = posts ?? [];
  const authorIds = [...new Set(rows.map((post) => post.author_id))];
  const { data: authors } =
    authorIds.length === 0
      ? { data: [] as SocialProfileRow[] }
      : await client.from("profiles").select("id, handle, display_name, status").in("id", authorIds);

  return mapSocialHome(profile ?? null, rows, authors ?? []);
}
