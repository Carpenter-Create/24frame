"use client";

import { ASK_GLOBEE } from "@/lib/ask-globee";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { HouseAiMark } from "./house-ai-mark";
import { AskAiOpenButton } from "./ask-ai-overlay";

// Same Ask 24Frame AI product as the shell overlay. Header entry so
// Home, Social, Education, and Aggregation open one panel — never a
// workspace hop. Glyph is the house Adam sparkle cluster.
export function AskAssistantHeaderLink() {
  return (
    <AskAiOpenButton
      aria-label={ASK_GLOBEE.headline}
      data-ask-assistant-header=""
      className={HOUSE_THEME_TOGGLE_CLASS}
    >
      <HouseAiMark />
    </AskAiOpenButton>
  );
}
