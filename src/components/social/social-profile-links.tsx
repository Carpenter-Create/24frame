"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { AppSheetHead, AppSheetSurface, Close44 } from "@/components/chrome/house";
import { APP_SHEET_HOST_CLASS, APP_SHEET_SCRIM_CLASS } from "@/lib/house-sheet";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_PROFILE_LINK_CLASS,
  SOCIAL_PROFILE_LINKS_CLASS,
  SOCIAL_PROFILE_LINKS_MORE_CLASS,
} from "@/lib/social-chrome";
import {
  socialProfileLinksFace,
  socialProfileLinksMoreLabel,
  type SocialProfileLink,
} from "@/lib/social-profile-links";

function SocialProfileLinkText({
  link,
  sheet = false,
}: {
  link: SocialProfileLink;
  sheet?: boolean;
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      data-social-profile-link={link.platform}
      data-social-profile-imdb={link.platform === "imdb" ? "" : undefined}
      data-social-profile-links-sheet-link={sheet ? "" : undefined}
      className={SOCIAL_PROFILE_LINK_CLASS}
    >
      {link.label}
    </a>
  );
}

export function SocialProfileLinksSheet({
  links,
  open,
  onClose,
  titleId,
}: {
  links: readonly SocialProfileLink[];
  open: boolean;
  onClose: () => void;
  titleId: string;
}) {
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

  if (!open) return null;

  const sheet = (
    <div data-social-profile-links-sheet="" className={APP_SHEET_HOST_CLASS}>
      <button
        type="button"
        aria-label={SOCIAL.profile.shareClose}
        className={APP_SHEET_SCRIM_CLASS}
        onClick={onClose}
      />
      <AppSheetSurface
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <AppSheetHead>
          <h2 id={titleId} className="min-w-0 flex-1 t-heading text-ink">
            {SOCIAL.profile.links}
          </h2>
          <Close44 label={SOCIAL.profile.shareClose} onClick={onClose} />
        </AppSheetHead>
        <div
          data-social-profile-links-sheet-list=""
          className={SOCIAL_PROFILE_LINKS_CLASS}
        >
          {links.map((link) => (
            <SocialProfileLinkText
              key={`${link.platform}:${link.url}`}
              link={link}
              sheet
            />
          ))}
        </div>
      </AppSheetSurface>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}

export function SocialProfileLinkRow({ links }: { links: readonly SocialProfileLink[] }) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const { face, overflow } = socialProfileLinksFace(links);

  if (links.length === 0) return null;

  return (
    <div data-social-profile-links="" className={SOCIAL_PROFILE_LINKS_CLASS}>
      {face.map((link) => (
        <SocialProfileLinkText key={`${link.platform}:${link.url}`} link={link} />
      ))}
      {overflow > 0 ? (
        <>
          <button
            type="button"
            data-social-profile-links-more=""
            aria-label={SOCIAL.profile.links}
            className={SOCIAL_PROFILE_LINKS_MORE_CLASS}
            onClick={() => setOpen(true)}
          >
            {socialProfileLinksMoreLabel(overflow)}
          </button>
          <SocialProfileLinksSheet
            links={links}
            open={open}
            onClose={() => setOpen(false)}
            titleId={titleId}
          />
        </>
      ) : null}
    </div>
  );
}
