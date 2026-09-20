import { Suspense } from "react";
import Link from "next/link";

import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialDmsRowsSkeleton } from "@/components/social/social-skeletons";
import { SocialConversationFaces } from "@/components/social/social-ui";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import { conversationRoomLabel, inboxPeerIds, SOCIAL, SOCIAL_ROUTES, socialDmHref, socialPersonLabel } from "@/lib/social";
import { loadDmInbox } from "@/lib/social-dms";
import { loadProfilesByIds } from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { requireSocialSession, type SocialSession } from "@/lib/social-session";

export default async function SocialDmsPage() {
  const session = await requireSocialSession();
  return (
    <div data-social-dms="">
      <PageHeader title={SOCIAL.dms.title} subtitle={SOCIAL.dms.subtitle} />
      <Suspense fallback={<SocialDmsRowsSkeleton />}>
        <SocialDmsInbox session={session} />
      </Suspense>
    </div>
  );
}

async function SocialDmsInbox({ session }: { session: SocialSession }) {
  const { ctx, supabase } = session;
  const [profile, inbox] = await Promise.all([
    ensureOwnSocialProfile(supabase, ctx.user),
    loadDmInbox(supabase),
  ]);
  const rows = profile ? inbox.rows : [];
  const peopleIds = [...new Set(rows.flatMap((row) => inboxPeerIds(row)))];
  const [peers, faces] = await Promise.all([
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrls(peopleIds),
  ]);

  return (
    <>
      {inbox.truncated && profile ? (
        <InlineNotice tone="info" className="mb-[var(--space-4)]" data-social-dms-truncated="">
          {SOCIAL.dms.truncatedInbox}
        </InlineNotice>
      ) : null}
      {profile && rows.length === 0 ? (
        <div data-social-dms-empty="" className="flex flex-col gap-3">
          <HouseEmpty>{SOCIAL.dms.empty}</HouseEmpty>
          <TextAction href={SOCIAL_ROUTES.explore} data-social-dms-start="">
            {SOCIAL.dms.startCta}
          </TextAction>
        </div>
      ) : null}
      <ul className="flex flex-col">
        {rows.map((row) => {
          const others = inboxPeerIds(row)
            .map((id) => {
              const peer = peers.get(id);
              return {
                id,
                name: socialPersonLabel({
                  handle: peer?.handle ?? "",
                  displayName: peer?.display_name,
                }),
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
    </>
  );
}
