"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { SOCIAL_STORY_GLASS_FIELD_CLASS } from "@/lib/social-chrome";
import {
  SOCIAL_STORY_SAY_EMOJIS,
  storySayDraftWithEmoji,
  storySayPlaceholder,
} from "@/lib/social-story-actions";

// Own-story comment / @mention. Not a caption editor and not a self DM.
export function SocialStorySaySomething({
  defaultExpanded = false,
  onExpandedChange,
}: {
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [draft, setDraft] = useState("");

  function setOpen(next: boolean) {
    setExpanded(next);
    onExpandedChange?.(next);
  }

  return (
    <div
      data-social-story-say=""
      className="flex min-w-0 flex-1 flex-col gap-2"
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setOpen(false);
      }}
    >
      {expanded ? (
        <div data-social-story-say-emoji="" className="flex gap-2 overflow-x-auto">
          {SOCIAL_STORY_SAY_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              tabIndex={-1}
              data-social-story-say-emoji-item={emoji}
              className="flex size-8 shrink-0 items-center justify-center text-[24px]"
              aria-label={emoji}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setDraft((value) => storySayDraftWithEmoji(value, emoji))}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
      <Input
        variant="bare"
        data-social-story-say-field=""
        value={draft}
        placeholder={storySayPlaceholder(expanded)}
        autoComplete="off"
        enterKeyHint="done"
        className={`${SOCIAL_STORY_GLASS_FIELD_CLASS} text-band-ink caret-band-ink placeholder:text-band-ink/70`}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
        onChange={(event) => setDraft(event.target.value)}
      />
    </div>
  );
}
