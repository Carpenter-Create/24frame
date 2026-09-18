import { HouseEmpty, TextAction } from "@/components/chrome/house";
import { PageHeader } from "@/components/ui/page-header";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialAddPeopleForm, SocialDmCompose, SocialGroupTitleForm } from "@/components/social/social-forms";
import { SocialAvatar } from "@/components/social/social-ui";
import { signedAvatarUrls } from "@/lib/s3-avatars";
import {
  SOCIAL_DM_THREAD_CURSOR_PARAM,
  parseDmThreadCursorParam,
  socialDmThreadHref,
} from "@/lib/social-dm-bounds";
import { conversationRoomLabel, displayHandle, SOCIAL, SOCIAL_ROUTES } from "@/lib/social";
import { loadDmParticipants, loadDmThreadMessages } from "@/lib/social-dms";
import { loadProfilesByIds } from "@/lib/social-feed";
import { ensureOwnSocialProfile } from "@/lib/social-profile";
import { requireSocialSession } from "@/lib/social-session";
import { markSocialDmRead } from "../../actions";

export default async function SocialDmThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, { id }, sp] = await Promise.all([
    requireSocialSession(),
    params,
    searchParams ? searchParams : Promise.resolve({} as Record<string, string | string[] | undefined>),
  ]);
  const { ctx, supabase } = session;
  const cursor = parseDmThreadCursorParam(sp[SOCIAL_DM_THREAD_CURSOR_PARAM]);
  const profile = await ensureOwnSocialProfile(supabase, ctx.user);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, kind, title")
    .eq("id", id)
    .maybeSingle();

  if (!conversation) {
    return (
      <div data-social-dm-missing="">
        <PageHeader title={SOCIAL.dms.thread} backLink={{ href: SOCIAL_ROUTES.dms }} />
        <HouseEmpty>{SOCIAL.dms.missing}</HouseEmpty>
      </div>
    );
  }

  if (profile) await markSocialDmRead(conversation.id);

  const [thread, members] = await Promise.all([
    loadDmThreadMessages(supabase, conversation.id, { cursor }),
    loadDmParticipants(supabase, conversation.id),
  ]);
  const messages = thread.messages;
  const activeIds = members.rows.map((row) => row.user_id);
  const peopleIds = [
    ...new Set([
      ...activeIds,
      ...messages.map((row) => row.sender_id).filter((id): id is string => !!id),
    ]),
  ];
  const [people, faces] = await Promise.all([
    loadProfilesByIds(supabase, peopleIds),
    signedAvatarUrls(peopleIds),
  ]);
  const others = activeIds
    .filter((userId) => userId !== ctx.user.id)
    .map((userId) => people.get(userId))
    .filter((person): person is NonNullable<typeof person> => !!person);
  const title = conversationRoomLabel(
    conversation.title,
    others.map((person) => person.display_name),
  );
  const subtitle =
    others.length === 1
      ? displayHandle(others[0].handle)
      : others.map((person) => displayHandle(person.handle)).join(", ") || undefined;
  const historical = cursor !== null;

  return (
    <div data-social-dm-thread="" data-social-dm-kind={conversation.kind}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        backLink={{ href: SOCIAL_ROUTES.dms, label: SOCIAL.dms.title }}
      />
      {profile ? <SocialAddPeopleForm conversationId={conversation.id} /> : null}
      {profile && conversation.kind === "group" ? (
        <SocialGroupTitleForm conversationId={conversation.id} title={conversation.title} />
      ) : null}
      {thread.truncated || members.truncated || historical ? (
        <div
          data-social-dm-thread-truncated={thread.truncated || members.truncated ? "" : undefined}
          data-social-dm-older-page={historical ? "" : undefined}
          className="mb-[var(--space-4)] flex flex-col gap-[var(--space-3)]"
        >
          {historical ? (
            <InlineNotice tone="info">{SOCIAL.dms.olderPage}</InlineNotice>
          ) : thread.truncated ? (
            <InlineNotice tone="info">{SOCIAL.dms.truncatedThread}</InlineNotice>
          ) : null}
          {members.truncated ? (
            <InlineNotice tone="info">{SOCIAL.dms.roomFull}</InlineNotice>
          ) : null}
          {historical ? (
            <TextAction href={socialDmThreadHref(conversation.id)} data-social-dm-latest="">
              {SOCIAL.dms.latestMessages}
            </TextAction>
          ) : null}
          {thread.nextCursor ? (
            <TextAction
              href={socialDmThreadHref(conversation.id, { before: thread.nextCursor })}
              data-social-dm-older=""
            >
              {SOCIAL.dms.olderMessages}
            </TextAction>
          ) : null}
        </div>
      ) : null}
      <ol className="flex flex-col gap-[var(--space-4)]">
        {messages.map((message) => {
          const sender = message.sender_id ? people.get(message.sender_id) : null;
          const name = sender?.display_name ?? "Member";
          return (
            <li key={message.id} className="flex gap-[var(--space-3)]">
              <SocialAvatar
                name={name}
                photoUrl={message.sender_id ? faces.get(message.sender_id) ?? null : null}
              />
              <div>
                <p className="t-body-sm text-ink-3">{name}</p>
                <p className="t-body text-ink whitespace-pre-wrap">{message.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      {messages.length === 0 ? <HouseEmpty>{SOCIAL.dms.empty}</HouseEmpty> : null}
      {profile && !historical ? <SocialDmCompose conversationId={conversation.id} /> : null}
    </div>
  );
}
