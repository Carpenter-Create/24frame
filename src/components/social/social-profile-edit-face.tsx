"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { SocialIcon } from "@/components/social/social-icon";
import {
  SOCIAL_PROFILE_BIO_DONE_CLASS,
  SOCIAL_PROFILE_EDIT_BACK_CLASS,
  SOCIAL_PROFILE_EDIT_BODY_CLASS,
  SOCIAL_PROFILE_EDIT_HEADER_CLASS,
  SOCIAL_PROFILE_EDIT_HOST_CLASS,
  SOCIAL_PROFILE_EDIT_SHEET_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL_ICON_SIZE_HEADER } from "@/lib/social-icons";
import { SOCIAL, SOCIAL_ROUTES } from "@/lib/social";

export function SocialProfileEditFace({
  face,
  title,
  onBack,
  backHref = SOCIAL_ROUTES.profileEdit,
  done,
  children,
}: {
  face: "name" | "handle" | "roles" | "topics" | "imdb" | "links" | "bio";
  title: string;
  onBack?: () => void;
  backHref?: string;
  done?: {
    attr: string;
    onClick: () => void;
    pending?: boolean;
    icon?: boolean;
  };
  children: ReactNode;
}) {
  const hostAttr = { [`data-social-profile-${face}`]: "" };
  const headerAttr = { [`data-social-profile-${face}-header`]: "" };
  const backAttr = { [`data-social-profile-${face}-back`]: "" };

  return (
    <div {...hostAttr} className={SOCIAL_PROFILE_EDIT_HOST_CLASS}>
      <div className={SOCIAL_PROFILE_EDIT_SHEET_CLASS}>
        <header {...headerAttr} className={SOCIAL_PROFILE_EDIT_HEADER_CLASS}>
          {onBack ? (
            <button
              type="button"
              {...backAttr}
              onClick={onBack}
              className={SOCIAL_PROFILE_EDIT_BACK_CLASS}
              aria-label={SOCIAL.profile.back}
            >
              <SocialIcon name="caret-left" size={SOCIAL_ICON_SIZE_HEADER} />
            </button>
          ) : (
            <Link href={backHref} className={SOCIAL_PROFILE_EDIT_BACK_CLASS} aria-label={SOCIAL.profile.back}>
              <SocialIcon name="caret-left" size={SOCIAL_ICON_SIZE_HEADER} />
            </Link>
          )}
          <h1 className="min-w-0 flex-1 text-center text-[17px] font-semibold text-ink">{title}</h1>
          {done ? (
            <button
              type="button"
              {...{ [done.attr]: "" }}
              disabled={done.pending}
              onClick={done.onClick}
              className={done.icon ? SOCIAL_PROFILE_BIO_DONE_CLASS : undefined}
              aria-label={SOCIAL.profile.done}
            >
              {done.icon ? <SocialIcon name="check" size={18} /> : SOCIAL.profile.done}
            </button>
          ) : (
            <span className="size-9 shrink-0" aria-hidden />
          )}
        </header>
        <div className={SOCIAL_PROFILE_EDIT_BODY_CLASS}>{children}</div>
      </div>
    </div>
  );
}
