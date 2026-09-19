"use client";

import { ASK_GLOBEE } from "@/lib/ask-globee";
import { HOUSE_THEME_TOGGLE_CLASS } from "@/lib/house-lead-chrome";
import { HOUSE_HEADER_TRAILING_ICON_CLASS } from "@/lib/house-phone-shell";
import { HouseAiMark } from "./house-ai-mark";
import { AskAiOpenButton } from "./ask-ai-overlay";

// Same Ask 24Frame AI product as the shell overlay. Header entry so
// Home, Social, Education, and Aggregation open one panel via
// AskAiOpenButton → openAskAi → current path + overlay query.
// Never a workspace hop. Glyph is the house Adam sparkle cluster.
export function AskAssistantHeaderLink() {
  return (
    <AskAiOpenButton
      aria-label={ASK_GLOBEE.headline}
      data-ask-assistant-header=""
      className={HOUSE_THEME_TOGGLE_CLASS}
    >
      <HouseAiMark className={HOUSE_HEADER_TRAILING_ICON_CLASS} />
    </AskAiOpenButton>
  );
}
