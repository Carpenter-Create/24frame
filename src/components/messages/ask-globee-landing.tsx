"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Clock, Send, Slash, type LucideIcon } from "lucide-react";

import {
  ASK_GLOBEE,
  askGlobeeChipActivation,
  askGlobeeChipMark,
  askGlobeeComposerSubmit,
  askGlobeeSelectedChip,
  askGlobeeThreadHref,
  type AskGlobeeChipMark,
} from "@/lib/ask-globee";
import { type AskGlobeeHistoryRow } from "@/lib/ask-globee-conversations";
import { startAskGlobeeConversation } from "@/app/(app)/messages/ask-globee-actions";
import { Input } from "@/components/ui/input";
import {
  ASK_GLOBEE_CLOCK_BUTTON_CLASS,
  MOBILE_CHROME_CLOCK_DOCK_CLASS,
  MOBILE_CHROME_ICON_CLASS,
  MOBILE_CHROME_ICON_STROKE,
} from "@/lib/mobile-chrome";
import { AskGlobeeHistoryPopover } from "./ask-globee-history";

const CHIP_MARK_ICON: Record<AskGlobeeChipMark, LucideIcon> = {
  alert: CircleAlert,
  slash: Slash,
  send: Send,
};

// Overlay landing, Mercury bottom-up: clock docks top-left; headline and
// chips sit above a pinned composer. Empty/new chat anchors to the bottom
// (justify-end), not a top-down empty header. Chip click fills, selects,
// and sends the same prompt as free text. Submit persists the user turn,
// then opens the thread on the current path. Quiet clock 16 opens past
// conversations. Mobile 44 hit / --space-6 lead. Desktop size-4 at left-0.
// No plus. No HISTORY list. No invented titles. House 48 (--space-12).
// Composer is 640x56 r28 pad 16. Thinking chrome stays on the thread.
// Chips above the composer on every viewport. Drop "What do you need?".
// No Beta. No Mercury brand colors. No Circle brand fill.
export function AskGlobeeLanding({
  conversations = [],
}: {
  conversations?: AskGlobeeHistoryRow[];
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const selected = askGlobeeSelectedChip(prompt);

  const send = async (value: string) => {
    if (pending) return;
    setError(null);
    setPending(true);
    const result = await startAskGlobeeConversation(value);
    if (result.conversationId) {
      const href = askGlobeeThreadHref(result.conversationId);
      if (href) {
        router.push(href);
        return;
      }
    }
    setPending(false);
    if (result.error) setError(result.error);
  };

  return (
    <div
      data-ask-globee-landing=""
      className="relative flex h-full min-h-0 flex-1 flex-col items-center p-[var(--space-12)] max-md:px-[var(--space-4)]"
    >
      <div className={MOBILE_CHROME_CLOCK_DOCK_CLASS}>
        <AskGlobeeHistoryPopover
          conversations={conversations}
          open={historyOpen}
          onOpenChange={setHistoryOpen}
        >
          <button
            type="button"
            data-ask-globee-clock=""
            aria-label={ASK_GLOBEE.pastConversationsLabel}
            aria-expanded={historyOpen}
            onClick={() => setHistoryOpen((open) => !open)}
            className={ASK_GLOBEE_CLOCK_BUTTON_CLASS}
          >
            <Clock className={MOBILE_CHROME_ICON_CLASS} strokeWidth={MOBILE_CHROME_ICON_STROKE} />
          </button>
        </AskGlobeeHistoryPopover>
      </div>

      <div className="flex w-full min-h-0 flex-1 flex-col items-center justify-end gap-[var(--space-12)] overflow-auto">
        <h1 data-ask-globee-headline="" className="t-display text-center text-ink">
          {ASK_GLOBEE.headline}
        </h1>

        <div
          data-ask-globee-try=""
          className="flex w-full max-w-[640px] flex-col items-center gap-[var(--space-4)]"
        >
          <p className="t-label text-ink-3">{ASK_GLOBEE.tryLabel}</p>
          <div className="flex flex-wrap justify-center gap-[var(--space-2)] max-md:w-full max-md:flex-col max-md:items-stretch">
            {ASK_GLOBEE.tryPrompts.map((label, index) => {
              const pressed = selected === label;
              const mark = askGlobeeChipMark(index);
              const MarkIcon = mark ? CHIP_MARK_ICON[mark] : null;
              return (
                <button
                  key={label}
                  type="button"
                  data-ask-globee-chip=""
                  data-ask-globee-chip-mark={mark ?? undefined}
                  aria-pressed={pressed}
                  onClick={() => {
                    const activation = askGlobeeChipActivation(label);
                    setPrompt(activation.prompt);
                    void send(activation.send);
                  }}
                  className="inline-flex items-center gap-[var(--space-2)] rounded-full border-0 bg-surface-muted px-[var(--space-4)] py-[var(--space-2)] t-body-sm text-ink"
                >
                  {MarkIcon ? (
                    <MarkIcon
                      aria-hidden="true"
                      className="size-4 text-ink-3"
                      strokeWidth={1.33}
                    />
                  ) : null}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <form
        data-ask-globee-composer=""
        className="mt-[var(--space-12)] flex w-full shrink-0 justify-center"
        onSubmit={(event) => {
          event.preventDefault();
          const next = askGlobeeComposerSubmit(prompt);
          if (next) void send(next);
        }}
      >
        <label className="flex h-14 w-full max-w-[640px] items-center justify-between rounded-[28px] border border-hairline bg-surface px-[var(--space-4)]">
          <span className="sr-only">{ASK_GLOBEE.composerPlaceholderMobile}</span>
          <Input
            variant="bare"
            type="text"
            name="prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={ASK_GLOBEE.composerPlaceholderMobile}
            autoComplete="off"
            className="flex-1 text-left focus:outline-none"
          />
          <button
            type="submit"
            aria-label={ASK_GLOBEE.sendLabel}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-contrast"
          >
            <ArrowRight className="size-4" strokeWidth={1.33} />
          </button>
        </label>
      </form>

      {error ? (
        <p data-ask-globee-error="" className="mt-[var(--space-2)] t-body-sm text-center text-ink-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}
