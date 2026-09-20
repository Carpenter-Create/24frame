"use client";

import { useEffect, useRef, useState } from "react";
import { Microphone } from "@phosphor-icons/react";

import { cn } from "@/lib/cn";
import {
  FORM_CONTROL_FOCUS_CLASS,
  HOUSE_VOICE_MIC_CLASS,
  HOUSE_VOICE_MIC_LISTENING_CLASS,
} from "@/lib/form-control";
import { HOUSE_ICON_BUTTON_CLASS } from "@/lib/house-shell";
import {
  houseVoiceLabel,
  houseVoiceTranscriptMode,
  HOUSE_VOICE,
  type HouseVoiceSurface,
} from "@/lib/house-voice";
import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import {
  applySpeechTranscript,
  speechRecognitionCtor,
  speechRecognitionSupported,
  transcriptsFromSpeechEvent,
  type SpeechRecognitionLike,
} from "@/lib/speech-recognition";
import {
  ingestSpeechLearning,
  type SpeechLearningWorkspace,
} from "@/lib/speech-learning";

export function HouseVoiceMic({
  surface,
  workspace,
  supported,
  locale,
  getValue,
  onValue,
}: {
  surface: HouseVoiceSurface;
  workspace: SpeechLearningWorkspace;
  /** Test override. Omit to probe on mount and hide when missing. */
  supported?: boolean;
  locale?: string;
  getValue: () => string;
  onValue: (next: string) => void;
}) {
  const [available, setAvailable] = useState(supported ?? false);
  const [listening, setListening] = useState(false);
  const listeningRef = useRef(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baselineRef = useRef("");
  const localeRef = useRef(locale);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  useEffect(() => {
    if (supported != null) {
      setAvailable(supported);
      return;
    }
    setAvailable(speechRecognitionSupported());
  }, [supported]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      const rec = recRef.current;
      if (!rec) return;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
      try {
        rec.abort();
      } catch {
        // already stopped
      }
      recRef.current = null;
    };
  }, []);

  if (!available) return null;

  const mode = houseVoiceTranscriptMode(surface);
  const label = listening ? HOUSE_VOICE.listening : houseVoiceLabel(surface);

  function stop() {
    listeningRef.current = false;
    setListening(false);
    const rec = recRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // already stopped
    }
  }

  function start() {
    const Ctor = speechRecognitionCtor();
    if (!Ctor) {
      setAvailable(false);
      return;
    }
    stop();
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = localeRef.current || (typeof navigator !== "undefined" ? navigator.language : "en-US");
    baselineRef.current = getValue();
    rec.onresult = (event) => {
      const { finals, interim } = transcriptsFromSpeechEvent(event);
      for (const spoken of finals) {
        const next = applySpeechTranscript(baselineRef.current, spoken, mode);
        baselineRef.current = next;
        onValue(next);
        ingestSpeechLearning({
          text: spoken,
          source: "voice",
          workspace,
          locale: rec.lang,
        });
      }
      if (interim) {
        onValue(applySpeechTranscript(baselineRef.current, interim, mode));
      }
    };
    rec.onerror = () => {
      listeningRef.current = false;
      setListening(false);
    };
    rec.onend = () => {
      if (!listeningRef.current) {
        recRef.current = null;
        return;
      }
      try {
        rec.start();
      } catch {
        listeningRef.current = false;
        setListening(false);
        recRef.current = null;
      }
    };
    recRef.current = rec;
    try {
      rec.start();
      listeningRef.current = true;
      setListening(true);
    } catch {
      listeningRef.current = false;
      setListening(false);
      recRef.current = null;
    }
  }

  return (
    <button
      type="button"
      data-house-voice-mic={surface}
      data-house-voice-listening={listening ? "" : undefined}
      aria-pressed={listening}
      aria-label={label}
      className={cn(
        HOUSE_ICON_BUTTON_CLASS,
        HOUSE_VOICE_MIC_CLASS,
        FORM_CONTROL_FOCUS_CLASS,
        listening && HOUSE_VOICE_MIC_LISTENING_CLASS,
      )}
      onClick={() => {
        if (listeningRef.current) stop();
        else start();
      }}
    >
      <Microphone className="size-4" weight={PHOSPHOR_CHROME_IDLE_WEIGHT} aria-hidden />
    </button>
  );
}
