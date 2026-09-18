import Link from "next/link";
import { Sparkle } from "@phosphor-icons/react";

import {
  HOUSE_HEADER_CHROME_ICON_CLASS,
  HOUSE_HEADER_CHROME_ICON_WEIGHT,
  HOUSE_THEME_TOGGLE_CLASS,
} from "@/lib/house-lead-chrome";
import { ASK_ASSISTANT } from "@/lib/product";

// Shared header entry for Ask 24Frame AI. Same house icon hit as the
// theme toggle. Wires /messages into every workspace shell — not a
// second AI product, not a SocialTopBar cousin.

export function AskAssistantEntry() {
  return (
    <Link
      href="/messages"
      data-ask-assistant-entry=""
      aria-label={ASK_ASSISTANT}
      className={HOUSE_THEME_TOGGLE_CLASS}
    >
      <Sparkle
        className={HOUSE_HEADER_CHROME_ICON_CLASS}
        weight={HOUSE_HEADER_CHROME_ICON_WEIGHT}
        aria-hidden="true"
      />
    </Link>
  );
}
