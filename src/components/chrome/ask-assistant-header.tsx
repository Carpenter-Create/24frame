import Link from "next/link";
import { Sparkle } from "@phosphor-icons/react";

import { ASK_GLOBEE, askGlobeeLandingHref } from "@/lib/ask-globee";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";

// Same Ask 24Frame AI product as /messages. Header entry so Social and
// Education can reach it without a second AI product or a rail fork.
export function AskAssistantHeaderLink() {
  return (
    <Link
      href={askGlobeeLandingHref()}
      aria-label={ASK_GLOBEE.headline}
      data-ask-assistant-header=""
      className={HOUSE_THEME_TOGGLE_CLASS}
    >
      <Sparkle className={PHOSPHOR_CHROME_ICON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
    </Link>
  );
}
