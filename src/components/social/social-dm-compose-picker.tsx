"use client";

import { useState } from "react";

import { SocialAvatar } from "@/components/social/social-avatar";
import { SocialIcon } from "@/components/social/social-icon";
import { Input } from "@/components/ui/input";
import { searchSocialDmPeers, startSocialDm } from "@/app/(app)/social/actions";
import { displayHandle, SOCIAL } from "@/lib/social";
import {
  DM_COMPOSE_AVATAR_CLASS,
  DM_COMPOSE_CTA_CLASS,
  DM_COMPOSE_HELPER_CLASS,
  DM_COMPOSE_HOST_CLASS,
  DM_COMPOSE_ROW_CLASS,
  DM_COMPOSE_SEARCH_CLASS,
  dmComposeCta,
  dmMembershipCanSelectMore,
  dmMembershipHelper,
} from "@/lib/social-dm-membership";

type DmComposePerson = {
  id: string;
  handle: string;
  name: string;
  photoUrl: string | null;
};

export function SocialDmComposePicker() {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<DmComposePerson[]>([]);
  const [selected, setSelected] = useState<DmComposePerson[]>([]);
  const [error, setError] = useState("");
  const others = selected.length;
  const cta = dmComposeCta(others);
  const helper = dmMembershipHelper(others);
  const canSelectMore = dmMembershipCanSelectMore(others);

  function toggle(person: DmComposePerson) {
    setSelected((current) => {
      const exists = current.some((item) => item.id === person.id);
      if (exists) return current.filter((item) => item.id !== person.id);
      if (!dmMembershipCanSelectMore(current.length)) return current;
      return [...current, person];
    });
  }

  return (
    <form
      data-social-dm-compose=""
      className={DM_COMPOSE_HOST_CLASS}
      action={async (formData) => {
        setError("");
        const result = await startSocialDm(formData);
        if (result?.error) setError(result.error);
      }}
    >
      {selected.map((person) => (
        <input key={person.id} type="hidden" name="peer_id" value={person.id} />
      ))}
      <div className={DM_COMPOSE_SEARCH_CLASS}>
        <label className="sr-only" htmlFor="social-dm-compose-q">
          {SOCIAL.dms.searchPeople}
        </label>
        <Input
          id="social-dm-compose-q"
          variant="bare"
          value={query}
          autoComplete="off"
          placeholder={SOCIAL.dms.searchPeople}
          className="w-full"
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            void searchSocialDmPeers(next).then((result) => setPeople(result.people));
          }}
        />
      </div>
      <p data-social-dm-cap="" className={DM_COMPOSE_HELPER_CLASS}>
        {helper}
      </p>
      <ul className="flex flex-col">
        {people.map((person) => {
          const on = selected.some((item) => item.id === person.id);
          const disabled = !on && !canSelectMore;
          return (
            <li key={person.id}>
              <button
                type="button"
                data-social-dm-compose-row=""
                aria-pressed={on}
                disabled={disabled}
                className={DM_COMPOSE_ROW_CLASS}
                onClick={() => toggle(person)}
              >
                <SocialAvatar
                  name={person.name}
                  photoUrl={person.photoUrl}
                  size="sm"
                  className={DM_COMPOSE_AVATAR_CLASS}
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words t-body font-medium text-ink">{person.name}</span>
                  <span className="block break-words t-body-sm text-ink-2">{displayHandle(person.handle)}</span>
                </span>
                {on ? <SocialIcon name="check" size={20} className="text-accent" /> : null}
              </button>
            </li>
          );
        })}
      </ul>
      {error ? <p className="pt-2 t-body-sm text-ink-2">{error}</p> : null}
      <button type="submit" className={DM_COMPOSE_CTA_CLASS} disabled={cta === null}>
        {SOCIAL.dms.chat}
      </button>
    </form>
  );
}
