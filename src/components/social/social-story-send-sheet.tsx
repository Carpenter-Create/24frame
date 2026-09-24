"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { AppSheetHead, AppSheetSurface, Close44 } from "@/components/chrome/house";
import {
  HouseDialogFrame,
  HouseScrim,
  useHouseDesktop,
} from "@/components/chrome/house-overlay";
import { SocialAvatar } from "@/components/social/social-avatar";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Input } from "@/components/ui/input";
import { listStorySendPeople, sendSocialStoryItem } from "@/app/(app)/social/light-actions";
import { APP_SHEET_HOST_CLASS } from "@/lib/house-sheet";
import { SOCIAL } from "@/lib/social";
import {
  storySendPeopleQuery,
  storySendToast,
  storySendUiAfter,
  type StorySendPerson,
} from "@/lib/social-story-actions";

export function SocialStorySendSheet({
  storyId,
  open,
  onClose,
  onSent,
  directory,
}: {
  storyId: string;
  open: boolean;
  onClose: () => void;
  onSent?: () => void;
  directory?: readonly StorySendPerson[];
}) {
  const titleId = useId();
  const searchId = useId();
  const desktop = useHouseDesktop();
  const provided = directory !== undefined;
  const [people, setPeople] = useState<StorySendPerson[]>(directory ? [...directory] : []);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!provided);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open || provided) return undefined;
    let cancelled = false;
    void listStorySendPeople().then((result) => {
      if (cancelled) return;
      setPeople(result.people);
      setError(result.error ?? "");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, provided]);

  if (!open) return null;

  const shown = storySendPeopleQuery(people, query);

  async function choose(personId: string) {
    if (sending) return;
    setSending(true);
    setError("");
    const form = new FormData();
    form.set("story_id", storyId);
    form.set("peer_id", personId);
    const result = await sendSocialStoryItem(form);
    const outcome = storySendUiAfter(result);
    if (outcome.close) {
      if (storySendToast(result).show) onSent?.();
      onClose();
      return;
    }
    setError(outcome.error);
    setSending(false);
  }

  const body = (
    <div data-social-story-send-body="" className="flex min-h-0 flex-col gap-2">
      <label className="sr-only" htmlFor={searchId}>
        {SOCIAL.search.searchPlaceholder}
      </label>
      <Input
        id={searchId}
        data-social-story-send-search=""
        value={query}
        placeholder={SOCIAL.search.searchPlaceholder}
        autoComplete="off"
        onChange={(event) => setQuery(event.target.value)}
      />
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      {loading ? null : shown.length === 0 && !error ? (
        <p data-social-story-send-empty="" className="py-8 text-center t-body-sm text-ink-2">
          {query.trim() ? SOCIAL.search.noResults : SOCIAL.stories.sendEmpty}
        </p>
      ) : (
        <div data-social-story-send-list="" className="flex max-h-[70dvh] flex-col gap-2 overflow-y-auto">
          {shown.map((person) => (
            <button
              key={person.id}
              type="button"
              data-social-story-send-row={person.id}
              disabled={sending}
              className="flex w-full min-w-0 items-center gap-3 py-2 text-left"
              onClick={() => void choose(person.id)}
            >
              <SocialAvatar
                name={person.name}
                photoUrl={person.photoUrl}
                size="sm"
                className="size-10"
              />
              <span className="min-w-0 break-words t-body text-ink">{person.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const title = (
    <h2 id={titleId} className="min-w-0 flex-1 t-title text-ink">
      {SOCIAL.stories.send}
    </h2>
  );

  const sheet = desktop ? (
    <HouseDialogFrame
      size="form"
      titleId={titleId}
      label={SOCIAL.stories.send}
      onClose={onClose}
      closeLabel={SOCIAL.stories.close}
    >
      <div data-social-story-send-sheet="">
        <div className="flex shrink-0 items-center justify-between gap-4">
          {title}
          <Close44 label={SOCIAL.stories.close} onClick={onClose} />
        </div>
        {body}
      </div>
    </HouseDialogFrame>
  ) : (
    <div data-social-story-send-sheet="" data-house-overlay-host="app-sheet" className={APP_SHEET_HOST_CLASS}>
      <HouseScrim label={SOCIAL.stories.close} onClose={onClose} />
      <AppSheetSurface role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <AppSheetHead>
          {title}
          <Close44 label={SOCIAL.stories.close} onClick={onClose} />
        </AppSheetHead>
        {body}
      </AppSheetSurface>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}
