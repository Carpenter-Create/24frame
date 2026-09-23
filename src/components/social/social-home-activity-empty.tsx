"use client";

import Link from "next/link";

import { HOUSE_PHONE_STACK_CLASS, HOUSE_PHONE_WRAP_CLASS } from "@/lib/house-phone-stack";
import {
  SOCIAL_ACTION_QUIET_CLASS,
  SOCIAL_ACTION_SECONDARY_CLASS,
  SOCIAL_EMPTY_ACTION_CLASS,
  SOCIAL_EMPTY_PANEL_CLASS,
} from "@/lib/social-chrome";
import { SOCIAL, SOCIAL_ROUTES, socialCreateHref, socialSearchHref } from "@/lib/social";

const SOCIAL_HOME_ACTIVITY_CTA_CLASS = `${HOUSE_PHONE_STACK_CLASS} gap-[var(--space-4)] md:flex-row md:flex-wrap md:items-center md:justify-center`;

/** Opens the Home composer. Falls back to Create text when that control is not mounted. */
export function focusSocialHomeComposer(): void {
  const composer = document.querySelector<HTMLElement>("[data-social-home-composer]");
  if (!composer) {
    window.location.assign(socialCreateHref("text"));
    return;
  }
  composer.focus();
  composer.click();
}

export function SocialHomeActivityEmpty({ findPeople }: { findPeople: boolean }) {
  return (
    <div data-social-home-activity-empty="" data-social-empty="" className={SOCIAL_EMPTY_PANEL_CLASS}>
      <div className={`${HOUSE_PHONE_STACK_CLASS} gap-[var(--space-2)] text-center`}>
        <p className={`${HOUSE_PHONE_WRAP_CLASS} t-heading text-ink`}>{SOCIAL.home.empty}</p>
        <p className={`${HOUSE_PHONE_WRAP_CLASS} t-body-sm text-ink-3`}>{SOCIAL.home.emptyHint}</p>
      </div>
      <div className={SOCIAL_HOME_ACTIVITY_CTA_CLASS}>
        <button
          type="button"
          data-social-home-activity-write=""
          className={`${SOCIAL_EMPTY_ACTION_CLASS} ${HOUSE_PHONE_WRAP_CLASS}`}
          onClick={focusSocialHomeComposer}
        >
          {SOCIAL.home.composerPrompt}
        </button>
        <Link
          href={SOCIAL_ROUTES.storiesNew}
          data-social-home-activity-story=""
          className={`${SOCIAL_ACTION_SECONDARY_CLASS} ${HOUSE_PHONE_WRAP_CLASS}`}
        >
          {SOCIAL.stories.createCta}
        </Link>
        {findPeople ? (
          <Link
            href={socialSearchHref({ intent: "people" })}
            data-social-home-activity-people=""
            className={`${SOCIAL_ACTION_QUIET_CLASS} ${HOUSE_PHONE_WRAP_CLASS}`}
          >
            {SOCIAL.home.findPeople}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
