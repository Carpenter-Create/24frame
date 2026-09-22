"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import {
  APPEARANCE_SETTINGS_CARD_CLASS,
  APPEARANCE_SETTINGS_TITLE_CLASS,
} from "@/lib/appearance";
import {
  SPEECH_LEARNING,
  speechLearningServerSnapshot,
  speechLearningSnapshot,
  subscribeSpeechLearning,
  writeSpeechLearningEnabled,
} from "@/lib/speech-learning";

// Parked off Preferences (Adam 2026-09-22). Do not mount this on
// Settings. The gc-speech-learning store stays in lib/speech-learning.ts.

export function SpeechLearningPreference() {
  const enabled = useSyncExternalStore(
    subscribeSpeechLearning,
    speechLearningSnapshot,
    speechLearningServerSnapshot,
  );

  return (
    <section data-settings-speech-learning="" className={APPEARANCE_SETTINGS_CARD_CLASS}>
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <h3 className={APPEARANCE_SETTINGS_TITLE_CLASS}>{SPEECH_LEARNING.settingsLabel}</h3>
        <button
          type="button"
          data-settings-speech-learning-toggle=""
          aria-pressed={enabled}
          className={cn(
            "rounded-full px-[var(--space-3)] py-[var(--space-2)] t-body-sm font-medium",
            enabled ? "bg-accent text-accent-contrast" : "bg-surface-muted text-ink-2",
          )}
          onClick={() => {
            let storage: typeof localStorage | null = null;
            try {
              storage = localStorage;
            } catch {
              storage = null;
            }
            writeSpeechLearningEnabled(!enabled, storage);
          }}
        >
          {enabled ? SPEECH_LEARNING.on : SPEECH_LEARNING.off}
        </button>
      </div>
    </section>
  );
}
