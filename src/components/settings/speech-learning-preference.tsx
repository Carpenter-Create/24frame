"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import {
  APPEARANCE_SETTINGS_CARD_CLASS,
  APPEARANCE_SETTINGS_TITLE_CLASS,
} from "@/lib/appearance";
import {
  readSpeechLearningEnabled,
  SPEECH_LEARNING,
  writeSpeechLearningEnabled,
} from "@/lib/speech-learning";

export function SpeechLearningPreference() {
  const [enabled, setEnabled] = useState(SPEECH_LEARNING.defaultEnabled);

  useEffect(() => {
    try {
      setEnabled(readSpeechLearningEnabled(localStorage));
    } catch {
      setEnabled(SPEECH_LEARNING.defaultEnabled);
    }
  }, []);

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
            const next = !enabled;
            setEnabled(next);
            try {
              writeSpeechLearningEnabled(next, localStorage);
            } catch {
              // Preference still flips for the session.
            }
          }}
        >
          {enabled ? SPEECH_LEARNING.on : SPEECH_LEARNING.off}
        </button>
      </div>
    </section>
  );
}
