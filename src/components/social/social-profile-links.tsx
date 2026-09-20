"use client";

import {
  FacebookLogo,
  FilmSlate,
  GlobeSimple,
  InstagramLogo,
  LinkedinLogo,
  ThreadsLogo,
  TiktokLogo,
  Video,
  XLogo,
  YoutubeLogo,
  type Icon,
} from "@phosphor-icons/react";

import {
  SOCIAL_LINK_PLATFORMS,
  type SocialLinkPlatform,
  type SocialProfileLink,
} from "@/lib/social-profile-links";

const ICONS: Record<SocialLinkPlatform, Icon> = {
  instagram: InstagramLogo,
  youtube: YoutubeLogo,
  facebook: FacebookLogo,
  x: XLogo,
  linkedin: LinkedinLogo,
  tiktok: TiktokLogo,
  vimeo: Video,
  imdb: FilmSlate,
  threads: ThreadsLogo,
  website: GlobeSimple,
};

export function SocialProfileLinkRow({ links }: { links: readonly SocialProfileLink[] }) {
  if (links.length === 0) return null;
  return (
    <div data-social-profile-links="" className="mt-2 flex flex-wrap items-center gap-3">
      {links.map((link) => {
        const Icon = ICONS[link.platform];
        return (
          <a
            key={`${link.platform}:${link.url}`}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            data-social-profile-link={link.platform}
            data-social-profile-imdb={link.platform === "imdb" ? "" : undefined}
            className="inline-flex size-6 items-center justify-center text-ink-2"
          >
            <Icon size={20} weight="bold" />
          </a>
        );
      })}
    </div>
  );
}

export function socialProfileLinkIconNames(): readonly SocialLinkPlatform[] {
  return SOCIAL_LINK_PLATFORMS;
}
