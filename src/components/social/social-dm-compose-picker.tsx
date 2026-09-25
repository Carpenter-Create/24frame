"use client";

import { useRef, useState } from "react";
import Link from "next/link";

import { searchSocialDmPeers, startSocialDm } from "@/app/(app)/social/actions";
import { HouseEmpty } from "@/components/chrome/house";
import { Skeleton } from "@/components/layout/skeleton";
import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialIcon } from "@/components/social/social-icon";
import { Input } from "@/components/ui/input";
import {
  DM_COMPOSE_CHIP_AVATAR_CLASS,
  DM_COMPOSE_CHIP_CLASS,
  DM_COMPOSE_CTA_HOST_CLASS,
  DM_COMPOSE_ENTRY_CLASS,
  DM_COMPOSE_ENTRY_ICON_CLASS,
  DM_COMPOSE_HEADER_BACK_CLASS,
  DM_COMPOSE_HEADER_CLASS,
  DM_COMPOSE_HEADER_HOST_CLASS,
  DM_COMPOSE_HEADER_TITLE_CLASS,
  DM_COMPOSE_LIST_CLASS,
  DM_COMPOSE_NAME_CLASS,
  DM_COMPOSE_ROOT_CLASS,
  DM_COMPOSE_SKELETON_ROWS,
  DM_COMPOSE_SUGGESTED_LABEL_CLASS,
  DM_COMPOSE_TO_CLASS,
  DM_COMPOSE_TO_LABEL_CLASS,
  dmDirectSelected,
  dmGroupSelected,
  type DmComposeMode,
  type DmComposePerson,
} from "@/lib/social-dm-compose";
import {
  DM_COMPOSE_AVATAR_CLASS,
  DM_COMPOSE_CTA_CLASS,
  DM_COMPOSE_HELPER_CLASS,
  DM_COMPOSE_ROW_CLASS,
  DM_COMPOSE_SEARCH_CLASS,
  dmDirectComposeCta,
  dmGroupComposeCta,
  dmMembershipCanSelectMore,
  dmMembershipHelper,
} from "@/lib/social-dm-membership";
import { displayHandle, SOCIAL, SOCIAL_ROUTES } from "@/lib/social";

// DM compose immersive IA v1.1.
// docs/design-locks/dm-compose-immersive-ia-lock-v1.md
// Screen A: 1:1. Screen B: fresh multi-party. Cap stays membership v1.1.

function ComposeHeader({ mode }: { mode: DmComposeMode }) {
  const group = mode === "group";
  return (
    <header data-social-dm-compose-header="" className={DM_COMPOSE_HEADER_HOST_CLASS}>
      <div className={DM_COMPOSE_HEADER_CLASS}>
        <Link
          href={group ? `${SOCIAL_ROUTES.dms}/new` : SOCIAL_ROUTES.dms}
          aria-label={group ? SOCIAL.dms.newMessage : SOCIAL.dms.title}
          className={DM_COMPOSE_HEADER_BACK_CLASS}
        >
          <SocialIcon name="caret-left" size={20} />
        </Link>
        <h1 className={DM_COMPOSE_HEADER_TITLE_CLASS}>
          {group ? SOCIAL.dms.newGroupChat : SOCIAL.dms.newMessage}
        </h1>
      </div>
    </header>
  );
}

function ComposeSkeletons() {
  return (
    <div data-social-dm-compose-skeletons="">
      {Array.from({ length: DM_COMPOSE_SKELETON_ROWS }, (_, index) => (
        <div key={index} data-social-dm-compose-skeleton="" className="flex h-14 items-center gap-2 px-4">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function SocialDmComposeLoading({ mode }: { mode: DmComposeMode }) {
  return (
    <div data-social-dm-compose="" data-social-dm-compose-mode={mode} className={DM_COMPOSE_ROOT_CLASS}>
      <ComposeHeader mode={mode} />
      <div className={DM_COMPOSE_LIST_CLASS}>
        <p className={DM_COMPOSE_SUGGESTED_LABEL_CLASS}>{SOCIAL.dms.suggested}</p>
        <ComposeSkeletons />
      </div>
    </div>
  );
}

export function SocialDmComposeEmpty({ mode }: { mode: DmComposeMode }) {
  return (
    <div data-social-dm-compose="" data-social-dm-compose-mode={mode} className={DM_COMPOSE_ROOT_CLASS}>
      <ComposeHeader mode={mode} />
      <HouseEmpty>{SOCIAL.dms.noProfileCta}</HouseEmpty>
    </div>
  );
}

export function SocialDmComposePicker({
  mode,
  people,
}: {
  mode: DmComposeMode;
  people: readonly DmComposePerson[];
}) {
  const group = mode === "group";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DmComposePerson[]>([...people]);
  const [selected, setSelected] = useState<DmComposePerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchGen = useRef(0);
  const others = selected.length;
  const cta = group ? dmGroupComposeCta(others) : dmDirectComposeCta(others);
  const canSelectMore = dmMembershipCanSelectMore(others);

  function onSearch(next: string) {
    setQuery(next);
    const needle = next.trim();
    if (!needle) {
      searchGen.current += 1;
      setLoading(false);
      setResults([...people]);
      return;
    }
    const gen = ++searchGen.current;
    setLoading(true);
    void searchSocialDmPeers(needle)
      .then((result) => {
        if (searchGen.current !== gen) return;
        setResults(result.people);
        setLoading(false);
      })
      .catch(() => {
        if (searchGen.current !== gen) return;
        setLoading(false);
      });
  }

  return (
    <div data-social-dm-compose="" data-social-dm-compose-mode={mode} className={DM_COMPOSE_ROOT_CLASS}>
      <ComposeHeader mode={mode} />
      <form
        className="flex min-h-0 flex-1 flex-col"
        action={async (formData) => {
          setError("");
          const result = await startSocialDm(formData);
          if (result?.error) setError(result.error);
        }}
      >
        {selected.map((person) => (
          <input key={person.id} type="hidden" name="peer_id" value={person.id} />
        ))}
        {group ? (
          <div className={DM_COMPOSE_NAME_CLASS}>
            <label className="sr-only" htmlFor="social-dm-group-name">
              {SOCIAL.dms.groupName}
            </label>
            <Input
              id="social-dm-group-name"
              name="title"
              variant="bare"
              autoComplete="off"
              placeholder={SOCIAL.dms.groupName}
              className="w-full"
            />
          </div>
        ) : (
          <div className={DM_COMPOSE_TO_CLASS}>
            <span className={DM_COMPOSE_TO_LABEL_CLASS}>{SOCIAL.dms.to}</span>
            {selected.map((person) => (
              <span key={person.id} data-social-dm-chip="" className={DM_COMPOSE_CHIP_CLASS}>
                <SocialAvatar
                  name={person.name}
                  photoUrl={person.photoUrl}
                  size="sm"
                  className={DM_COMPOSE_CHIP_AVATAR_CLASS}
                />
                <span className="min-w-0 break-words t-body-sm text-ink">{person.name}</span>
                <button
                  type="button"
                  aria-label={person.name}
                  className="inline-flex size-6 shrink-0 items-center justify-center text-ink-2"
                  onClick={() => setSelected((current) => current.filter((item) => item.id !== person.id))}
                >
                  <SocialIcon name="x" size={12} />
                </button>
              </span>
            ))}
            <label className="sr-only" htmlFor="social-dm-compose-q">
              {SOCIAL.dms.search}
            </label>
            <Input
              id="social-dm-compose-q"
              variant="bare"
              value={query}
              autoComplete="off"
              placeholder={SOCIAL.dms.search}
              className="min-w-0 flex-1"
              onChange={(event) => onSearch(event.target.value)}
            />
          </div>
        )}
        {group ? (
          <div className="px-4">
            <div className={DM_COMPOSE_SEARCH_CLASS}>
              <label className="sr-only" htmlFor="social-dm-compose-q">
                {SOCIAL.dms.search}
              </label>
              <Input
                id="social-dm-compose-q"
                variant="bare"
                value={query}
                autoComplete="off"
                placeholder={SOCIAL.dms.search}
                className="w-full"
                onChange={(event) => onSearch(event.target.value)}
              />
            </div>
            <p data-social-dm-cap="" className={DM_COMPOSE_HELPER_CLASS}>
              {dmMembershipHelper(others)}
            </p>
          </div>
        ) : (
          <Link
            href={`${SOCIAL_ROUTES.dms}/new/group`}
            data-social-dm-group-chat=""
            className={DM_COMPOSE_ENTRY_CLASS}
          >
            <span className={DM_COMPOSE_ENTRY_ICON_CLASS}>
              <SocialIcon name="users" size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words t-body font-medium text-ink">{SOCIAL.dms.groupChat}</span>
              <span className="block break-words t-body-sm text-ink-2">{SOCIAL.dms.groupChatHint}</span>
            </span>
            <SocialIcon name="caret-right" size={16} className="shrink-0 text-ink-2" />
          </Link>
        )}
        <div data-social-dm-compose-list="" className={DM_COMPOSE_LIST_CLASS}>
          <p className={DM_COMPOSE_SUGGESTED_LABEL_CLASS}>{SOCIAL.dms.suggested}</p>
          {loading ? (
            <ComposeSkeletons />
          ) : (
            <ul className="flex flex-col">
              {results.map((person) => {
                const on = selected.some((item) => item.id === person.id);
                const disabled = group && !on && !canSelectMore;
                return (
                  <li key={person.id}>
                    <button
                      type="button"
                      data-social-dm-compose-row=""
                      aria-pressed={group ? on : undefined}
                      disabled={disabled}
                      className={DM_COMPOSE_ROW_CLASS}
                      onClick={() =>
                        setSelected((current) =>
                          group ? dmGroupSelected(current, person) : dmDirectSelected(current, person),
                        )
                      }
                    >
                      <SocialAvatar
                        name={person.name}
                        photoUrl={person.photoUrl}
                        size="sm"
                        className={DM_COMPOSE_AVATAR_CLASS}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block break-words t-body font-medium text-ink">{person.name}</span>
                        <span className="block break-words t-body-sm text-ink-2">
                          {displayHandle(person.handle)}
                        </span>
                      </span>
                      {group ? (
                        on ? (
                          <SocialIcon
                            name="check-circle"
                            active
                            size={20}
                            className="shrink-0 text-accent"
                          />
                        ) : (
                          <span
                            data-social-dm-check="off"
                            className="size-5 shrink-0 rounded-full border border-hairline"
                          />
                        )
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {error ? <p className="px-4 pt-2 t-body-sm text-ink-2">{error}</p> : null}
        <div className={DM_COMPOSE_CTA_HOST_CLASS}>
          <button type="submit" data-social-dm-chat="" className={DM_COMPOSE_CTA_CLASS} disabled={cta === null}>
            {SOCIAL.dms.chat}
          </button>
        </div>
      </form>
    </div>
  );
}
