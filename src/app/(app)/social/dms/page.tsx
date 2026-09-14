import Link from "next/link";
import { redirect } from "next/navigation";

import { HouseEmpty } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { SocialConversationFaces } from "@/components/social/social-ui";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { conversationRoomLabel, inboxPeerIds, SOCIAL, socialDmHref } from "@/lib/social";
import { loadProfilesByIds } from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { getOrgContext } from "@/lib/supabase/context";
import { createClient } from "@/lib/supabase/server";

export default async function SocialDmsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const supabase = await createClient();
  const profile = await ensureOwnSocialProfile(supabase, ctx.user);
  const { data: inbox } = profile
    ? await supabase.rpc("get_dm_inbox", { p_limit: 50 })
    : { data: [] as never[] };

  const rows = inbox ?? [];
  const peopleIds = [...new Set(rows.flatMap((row) => inboxPeerIds(row)))];
  const [peers, faces] = await Promise.all([
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrls(peopleIds),
  ]);

  return (
    <div data-social-dms="">
      <PageHeader title={SOCIAL.dms.title} subtitle={SOCIAL.dms.subtitle} />
      {profile && rows.length === 0 ? <HouseEmpty>{SOCIAL.dms.empty}</HouseEmpty> : null}
      <ul className="flex flex-col">
        {rows.map((row) => {
          const others = inboxPeerIds(row)
            .map((id) => {
              const peer = peers.get(id);
              return {
                id,
                name: peer?.display_name ?? "Member",
                photoUrl: faces.get(id) ?? null,
              };
            });
          const label = conversationRoomLabel(
            row.title,
            others.map((person) => person.name),
          );
          return (
            <li key={row.conversation_id} className="border-b border-hairline py-[var(--space-4)]">
              <Link
                href={socialDmHref(row.conversation_id)}
                className="flex items-center gap-[var(--space-3)]"
                data-social-dm-kind={row.kind}
              >
                <SocialConversationFaces people={others} />
                <div className="min-w-0">
                  <p className="t-body font-medium text-ink">{label}</p>
                  {row.unread_count > 0 ? (
                    <p className="t-body-sm text-ink-3">{row.unread_count} unread</p>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
