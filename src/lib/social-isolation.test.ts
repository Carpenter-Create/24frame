import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("social isolation lock", () => {
  it("does not add person-scoped tables to the B3 catalog harness", () => {
    const b3 = readFileSync("scripts/security/b3-cross-org-isolation.mjs", "utf8");
    expect(b3).toContain("Cross-org isolation");
    expect(b3).not.toContain("from(\"profiles\")");
    expect(b3).not.toContain("from(\"groups\")");
    expect(b3).not.toContain("from(\"posts\")");
    expect(b3).not.toContain("from(\"likes\")");
    expect(b3).not.toContain("from(\"leaderboard_entries\")");
    expect(b3).not.toContain("from(\"level_distribution\")");
    expect(b3).not.toContain("rebuild_leaderboards");
    expect(b3).not.toContain("get_dm_inbox");
    expect(b3).not.toContain("open_or_get_direct_conversation");
    expect(b3).not.toContain("add_conversation_participants");
    expect(b3).not.toContain("set_group_conversation_title");
    expect(b3).not.toContain("from(\"courses\")");
    expect(b3).not.toContain("from(\"modules\")");
    expect(b3).not.toContain("from(\"lessons\")");
    expect(b3).not.toContain("has_course_access");
    expect(b3).not.toContain("from(\"follows\")");
    expect(b3).not.toContain("from(\"stories\")");
    expect(b3).not.toContain("from(\"story_views\")");
  });

  it("keeps Social writes on the user-scoped client", () => {
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    expect(actions).toContain('from "@/lib/supabase/server"');
    expect(actions).not.toContain("@/lib/supabase/admin");
    expect(actions).not.toContain("SERVICE_ROLE");
    expect(actions).not.toContain("ai_conversations");
    const session = readFileSync("src/lib/social-session.ts", "utf8");
    expect(session).toContain('from "@/lib/supabase/server"');
    expect(session).not.toContain("@/lib/supabase/admin");
    expect(session).not.toContain("SERVICE_ROLE");
    const board = readFileSync("src/app/(app)/social/leaderboard/page.tsx", "utf8");
    expect(board).toContain('from "@/lib/social-session"');
    expect(board).not.toContain("@/lib/supabase/admin");
    expect(board).not.toContain("rebuild_leaderboards");
    const list = readFileSync("src/app/(app)/education/page.tsx", "utf8");
    const detail = readFileSync("src/app/(app)/education/[slug]/page.tsx", "utf8");
    expect(list).toContain('from "@/lib/social-session"');
    expect(detail).toContain('from "@/lib/social-session"');
    expect(list).not.toContain("@/lib/supabase/admin");
    expect(detail).not.toContain("@/lib/supabase/admin");
    expect(actions).not.toContain("from(\"courses\")");
    expect(list).not.toContain("/education");
    expect(detail).not.toContain("/lessons/");
    expect(actions).toContain('from("follows")');
    expect(actions).toContain('notify_new_follower');
    expect(actions).toContain('from("stories")');
    expect(actions).not.toContain("from(\"reels\")");
    expect(actions).toContain("ensureOwnSocialProfile");
    const editPage = readFileSync("src/app/(app)/social/profile/edit/page.tsx", "utf8");
    const bioPage = readFileSync("src/app/(app)/social/profile/edit/bio/page.tsx", "utf8");
    expect(editPage).toContain('from "@/lib/social-session"');
    expect(bioPage).toContain('from "@/lib/social-session"');
    expect(editPage).not.toContain("@/lib/supabase/admin");
    expect(bioPage).not.toContain("@/lib/supabase/admin");
    expect(editPage).not.toContain("SERVICE_ROLE");
    expect(bioPage).not.toContain("from(\"reels\")");
  });

  it("does not create another person's Social profile from org invite or membership", () => {
    const orgCreate = readFileSync("src/app/actions.ts", "utf8");
    const identity = readFileSync("supabase/migrations/20260912033234_identity_spine.sql", "utf8");
    const profile = readFileSync("src/lib/social-profile.ts", "utf8");
    expect(orgCreate).toContain("create_org_and_membership");
    expect(orgCreate).not.toContain("from(\"profiles\")");
    expect(orgCreate).not.toContain("ensureOwnSocialProfile");
    expect(identity).toContain("do not auto-create    profiles on org invite or membership insert");
    expect(identity).toContain("Mapping C: no trigger on auth.users, memberships, or organizations that");
    expect(profile).toContain("never an invitee");
    expect(profile).toContain("user.id");
  });

  it("locks posts.group_id off ON DELETE CASCADE", () => {
    const migration = readFileSync(
      "supabase/migrations/20260914190000_social_group_delete_no_cascade_posts.sql",
      "utf8",
    );
    const fkSql = migration.match(
      /add constraint posts_group_id_fkey[\s\S]*?;/,
    )?.[0];
    expect(fkSql).toBeTruthy();
    expect(fkSql).toMatch(/on delete restrict/i);
    expect(fkSql).not.toMatch(/on delete cascade/i);
    expect(migration).toContain("LIFECYCLE CLASS");
    expect(migration).toContain("ACCESS PATH");
    expect(migration).toContain("NO ORG_ID ON SOCIAL");
    expect(migration).toContain("drop policy if exists groups_delete_staff");
    expect(migration).not.toMatch(/create policy groups_delete_staff/i);
    expect(migration).toContain("revoke delete on public.groups from authenticated");
    expect(migration).toContain("no org_id");
  });

  it("binds posts/stories media keys to the author in the database", () => {
    const migration = readFileSync(
      "supabase/migrations/20260914200000_social_media_author_bound.sql",
      "utf8",
    );
    expect(migration).toContain("INTENT: Remediation class 3");
    expect(migration).toContain("ACCESS PATH");
    expect(migration).toContain("NO ORG_ID ON SOCIAL");
    expect(migration).toContain("create or replace function public.social_media_keys_owned");
    expect(migration).toContain("add constraint posts_media_author_bound");
    expect(migration).toContain("add constraint stories_media_author_bound");
    expect(migration).toContain("social_media_keys_owned(media, author_id, 'posts')");
    expect(migration).toContain("social_media_keys_owned(media, author_id, 'stories')");
    expect(migration).not.toMatch(/org_id uuid/i);
    expect(migration).toContain("Do not add org_id or is_gc_staff");
    expect(migration).not.toMatch(/is_gc_staff\s*\(/);
    const actions = readFileSync("src/app/(app)/social/actions.ts", "utf8");
    expect(actions).toContain("mediaItemsForInsert(formData.get(\"media\"), user.id)");
    expect(actions).toContain("mediaItemsForInsert(formData.get(\"media\"), user.id, \"stories\")");
    const sign = readFileSync("src/lib/s3-social-media.ts", "utf8");
    expect(sign).toContain("ownedMediaItems(media, authorId, lane)");
    expect(sign).toContain("signedSocialMediaItems(post.media, post.author_id)");
  });

  it("caps DM fan-out and names inbox/thread honesty bounds", () => {
    const migration = readFileSync(
      "supabase/migrations/20260914420000_dm_fanout_caps.sql",
      "utf8",
    );
    const bounds = readFileSync("src/lib/social-dm-bounds.ts", "utf8");
    const loaders = readFileSync("src/lib/social-dms.ts", "utf8");
    const inbox = readFileSync("src/app/(app)/social/dms/page.tsx", "utf8");
    const thread = readFileSync("src/app/(app)/social/dms/[id]/page.tsx", "utf8");
    expect(migration).toContain("INTENT: Remediation class 6");
    expect(migration).toContain("ACCESS PATH");
    expect(migration).toContain("limit 32");
    expect(migration).toContain(", 51)");
    expect(migration).toContain("room is full");
    expect(migration).not.toMatch(/org_id uuid/i);
    expect(migration).not.toMatch(/is_gc_staff\s*\(/);
    expect(bounds).toContain("SOCIAL_DM_FANOUT_BATCH");
    expect(bounds).toContain("created_at+id keyset");
    expect(loaders).toContain("get_dm_inbox");
    expect(loaders).toContain("splitProbe");
    expect(loaders).toContain("ascending: false");
    expect(inbox).toContain("loadDmInbox");
    expect(inbox).toContain("data-social-dms-truncated");
    expect(thread).toContain("loadDmThreadMessages");
    expect(thread).toContain("data-social-dm-thread-truncated");
    expect(thread).toContain("data-social-dm-older-page");
    expect(thread).toContain("!historical");
    expect(thread).not.toContain("ascending: true");
    expect(thread).not.toContain("DETAIL_LIST");
    expect(thread).not.toContain("rangeFor");
  });

  it("lets authenticated members select active public handles", () => {
    const migration = readFileSync(
      "supabase/migrations/20260914210000_profiles_select_active_public.sql",
      "utf8",
    );
    const page = readFileSync("src/app/(app)/social/u/[handle]/page.tsx", "utf8");
    const insert = readFileSync("src/lib/social.ts", "utf8");
    expect(migration).toContain("or status = 'active'");
    expect(migration).toContain("or discoverable = true");
    expect(migration).toMatch(/create policy profiles_select[\s\S]*status = 'active'/);
    expect(migration).not.toMatch(/create policy profiles_select[\s\S]*status <> 'active'/);
    expect(migration).not.toContain("createAdminClient");
    expect(page).toContain('.eq("handle", handle)');
    expect(page).not.toContain("createAdminClient");
    expect(insert).toContain("discoverable: true");
  });

  it("rewrites apex /@handle to /social/u/{display} and 301s leftover /social/@handle", () => {
    const social = readFileSync("src/lib/social.ts", "utf8");
    const middleware = readFileSync("src/lib/supabase/middleware.ts", "utf8");
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(social).toContain("socialVanityInternalPath");
    expect(social).toContain("socialProfileRewriteTarget");
    expect(social).toContain("socialProfileLegacyPublicRedirect");
    expect(social).toContain("matchSocialPublicAtPath");
    expect(social).toContain("socialProfileHref");
    expect(social).toContain("SOCIAL_VANITY_RESERVED_HANDLES");
    expect(social).toContain("https://24frame.co/@");
    expect(social).toContain("socialProfileCanonicalUrl");
    expect(nextConfig).not.toContain('source: "/@:handle"');
    expect(nextConfig).not.toContain("/social/u/@:handle");
    expect(middleware).toContain("socialProfileRewriteTarget");
    expect(middleware).toContain("socialProfileLegacyPublicRedirect");
    expect(middleware).toContain("NextResponse.rewrite");
    expect(middleware).toContain("NextResponse.redirect");
    expect(middleware).toContain("301");
    expect(middleware).not.toContain('path.startsWith("/@")');
  });
});
