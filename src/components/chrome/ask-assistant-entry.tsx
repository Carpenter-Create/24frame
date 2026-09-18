import Link from "next/link";
import { Sparkle } from "@phosphor-icons/react";

import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { PHOSPHOR_CHROME_ICON_CLASS, PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
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
        className={PHOSPHOR_CHROME_ICON_CLASS}
        weight={PHOSPHOR_CHROME_IDLE_WEIGHT}
        aria-hidden="true"
      />
    </Link>
  );
}
