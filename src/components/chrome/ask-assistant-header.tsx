import Link from "next/link";

import { ASK_GLOBEE, askGlobeeLandingHref } from "@/lib/ask-globee";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { HouseAiMark } from "./house-ai-mark";

// Same Ask 24Frame AI product as /messages. Header entry so Social and
// Education can reach it without a second AI product or a rail fork.
// Glyph is the house Adam sparkle cluster — not a Phosphor catalog glyph.
export function AskAssistantHeaderLink() {
  return (
    <Link
      href={askGlobeeLandingHref()}
      aria-label={ASK_GLOBEE.headline}
      data-ask-assistant-header=""
      className={HOUSE_THEME_TOGGLE_CLASS}
    >
      <HouseAiMark />
    </Link>
  );
}
