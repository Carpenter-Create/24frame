"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { AppSheetHead, AppSheetSurface, Close44 } from "@/components/chrome/house";
import { InlineNotice } from "@/components/ui/inline-notice";
import { SocialAvatar } from "@/components/social/social-avatar";
import { APP_SHEET_HOST_CLASS, APP_SHEET_SCRIM_CLASS } from "@/lib/house-sheet";
import { displayHandle, socialMemberHref, SOCIAL } from "@/lib/social";

export type SocialLikerCard = {
  id: string;
  handle: string;
  displayName: string;
  photoUrl: string | null;
};

export function SocialLikesSheet({
  postId,
  open,
  onClose,
}: {
  postId: string;
  open: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const [people, setPeople] = useState<SocialLikerCard[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (!open) return undefined;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/social/likes?post_id=${encodeURIComponent(postId)}`, {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => null)) as {
        error?: string;
        people?: SocialLikerCard[];
        truncated?: boolean;
      } | null;
      if (cancelled) return;
      if (!res.ok || json?.error) {
        setError(json?.error || SOCIAL.post.missing);
        setPeople([]);
        setTruncated(false);
        setLoading(false);
        return;
      }
      setPeople(json?.people ?? []);
      setTruncated(Boolean(json?.truncated));
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, postId]);

  if (!open) return null;

  const sheet = (
    <div data-social-likes-sheet="" className={APP_SHEET_HOST_CLASS}>
      <button
        type="button"
        aria-label={SOCIAL.create.close}
        className={APP_SHEET_SCRIM_CLASS}
        onClick={onClose}
      />
      <AppSheetSurface role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <AppSheetHead>
          <h2 id={titleId} className="min-w-0 flex-1 t-heading text-ink">
            {SOCIAL.post.likesTitle}
          </h2>
          <Close44 label={SOCIAL.create.close} onClick={onClose} />
        </AppSheetHead>
        <div data-social-likes-list="" className="flex min-h-0 max-h-[70dvh] flex-col overflow-y-auto">
          {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
          {truncated ? <InlineNotice>{SOCIAL.post.likesTruncated}</InlineNotice> : null}
          {loading ? null : people.length === 0 && !error ? (
            <p data-social-likes-empty="" className="py-8 text-center t-body-sm text-ink-2">
              {SOCIAL.post.likesEmpty}
            </p>
          ) : (
            people.map((person) => (
              <Link
                key={person.id}
                href={socialMemberHref(person.handle)}
                data-social-likes-row={person.id}
                className="flex min-w-0 items-center gap-3 py-2.5"
              >
                <SocialAvatar name={person.displayName} photoUrl={person.photoUrl} size="sm" />
                <span className="min-w-0">
                  <span className="block break-words t-body-sm font-semibold text-ink">
                    {person.displayName}
                  </span>
                  <span className="block break-words t-body-sm text-ink-2">
                    {displayHandle(person.handle)}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      </AppSheetSurface>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}
