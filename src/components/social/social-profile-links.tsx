"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FacebookLogo,
  FilmSlate,
  GlobeSimple,
  InstagramLogo,
  LinkedinLogo,
  Play,
  ThreadsLogo,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
  type Icon,
} from "@phosphor-icons/react";

import { AppSheetHead, AppSheetSurface, Close44 } from "@/components/chrome/house";
import { APP_SHEET_HOST_CLASS, APP_SHEET_SCRIM_CLASS } from "@/lib/house-sheet";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { SOCIAL } from "@/lib/social";
import {
  SOCIAL_PROFILE_LINK_CLASS,
  SOCIAL_PROFILE_LINKS_CLASS,
  SOCIAL_PROFILE_LINKS_SHEET_CLASS,
  SOCIAL_PROFILE_LINKS_SHEET_LINK_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_PROFILE_LINK } from "@/lib/social-icons";
import {
  socialProfileLinkAccessibleName,
  socialProfileLinkGlyph,
  type SocialProfileLink,
  type SocialProfileLinkGlyphName,
} from "@/lib/social-profile-links";

const GLYPH: Record<SocialProfileLinkGlyphName, Icon> = {
  "instagram-logo": InstagramLogo,
  "youtube-logo": YoutubeLogo,
  "facebook-logo": FacebookLogo,
  "x-logo": XLogo,
  "linkedin-logo": LinkedinLogo,
  "tiktok-logo": TiktokLogo,
  play: Play,
  "film-slate": FilmSlate,
  "threads-logo": ThreadsLogo,
  globe: GlobeSimple,
};

function SocialProfileLinkGlyph({ platform }: { platform: SocialProfileLink["platform"] }) {
  const name = socialProfileLinkGlyph(platform);
  const Glyph = GLYPH[name];
  return (
    <Glyph
      aria-hidden="true"
      data-social-profile-link-glyph={name}
      size={SOCIAL_ICON_SIZE_PROFILE_LINK}
      weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
    />
  );
}

function SocialProfileFaceLink({ link }: { link: SocialProfileLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={socialProfileLinkAccessibleName(link.url, link.platform)}
      data-social-profile-link={link.platform}
      data-social-profile-imdb={link.platform === "imdb" ? "" : undefined}
      className={SOCIAL_PROFILE_LINK_CLASS}
    >
      <SocialProfileLinkGlyph platform={link.platform} />
    </a>
  );
}

function SocialProfileSheetLink({ link }: { link: SocialProfileLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      data-social-profile-link={link.platform}
      data-social-profile-imdb={link.platform === "imdb" ? "" : undefined}
      data-social-profile-links-sheet-link=""
      className={SOCIAL_PROFILE_LINKS_SHEET_LINK_CLASS}
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
          className={SOCIAL_PROFILE_LINKS_SHEET_CLASS}
        >
          {links.map((link) => (
            <SocialProfileSheetLink key={`${link.platform}:${link.url}`} link={link} />
          ))}
        </div>
      </AppSheetSurface>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(sheet, document.body) : sheet;
}

export function SocialProfileLinkRow({ links }: { links: readonly SocialProfileLink[] }) {
  if (links.length === 0) return null;

  return (
    <div data-social-profile-links="" className={SOCIAL_PROFILE_LINKS_CLASS}>
      {links.map((link) => (
        <SocialProfileFaceLink key={`${link.platform}:${link.url}`} link={link} />
      ))}
    </div>
  );
}
