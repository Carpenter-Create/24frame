"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Microphone } from "@phosphor-icons/react";

import { cn } from "@/lib/cn";
import {
  FORM_CONTROL_FOCUS_CLASS,
  HOUSE_VOICE_MIC_CLASS,
  HOUSE_VOICE_MIC_LISTENING_CLASS,
} from "@/lib/form-control";
import {
  SOCIAL_WRITE_VOICE_HERO_CLASS,
  SOCIAL_WRITE_VOICE_HERO_LISTENING_CLASS,
  SOCIAL_WRITE_VOICE_HERO_RECORDING_CLASS,
} from "@/lib/social-chrome";
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
  speechRecognitionErrorEndsSession,
  speechRecognitionSupported,
  transcriptsFromSpeechEvent,
  type SpeechRecognitionLike,
} from "@/lib/speech-recognition";
import {
  ingestSpeechLearning,
  type SpeechLearningWorkspace,
} from "@/lib/speech-learning";

function subscribeSpeechRecognition() {
  return () => undefined;
}

function speechRecognitionSnapshot() {
  return speechRecognitionSupported();
}

function speechRecognitionServerSnapshot() {
  return false;
}

export function HouseVoiceMic({
  surface,
  workspace,
  supported,
  locale,
  getValue,
  onValue,
  presentation = "icon",
}: {
  surface: HouseVoiceSurface;
  workspace: SpeechLearningWorkspace;
  /** Test override. Omit to probe on the client and hide when missing. */
  supported?: boolean;
  locale?: string;
  getValue: () => string;
  onValue: (next: string) => void;
  /** Compose voice hero stays visible when speech is unavailable. */
  presentation?: "icon" | "hero";
}) {
  const probed = useSyncExternalStore(
    subscribeSpeechRecognition,
    speechRecognitionSnapshot,
    speechRecognitionServerSnapshot,
  );
  const available = supported ?? probed;
  const [listening, setListening] = useState(false);
  const [recording, setRecording] = useState(false);
  const listeningRef = useRef(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baselineRef = useRef("");
  const spokenRef = useRef("");
  const localeRef = useRef(locale);

  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

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

  const hero = presentation === "hero";
  if (!available && !hero) return null;

  const mode = houseVoiceTranscriptMode(surface);
  const label = hero
    ? listening
      ? HOUSE_VOICE.stop
      : HOUSE_VOICE.voice
    : listening
      ? HOUSE_VOICE.listening
      : houseVoiceLabel(surface);

  function detach(rec: SpeechRecognitionLike | null) {
    if (!rec) return;
    rec.onresult = null;
    rec.onerror = null;
    rec.onend = null;
    try {
      rec.stop();
    } catch {
      // already stopped
    }
    if (recRef.current === rec) recRef.current = null;
  }

  function stop() {
    listeningRef.current = false;
    setListening(false);
    setRecording(false);
    detach(recRef.current);
  }

  function start() {
    const Ctor = speechRecognitionCtor();
    if (!Ctor) return;
    stop();
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = localeRef.current || (typeof navigator !== "undefined" ? navigator.language : "en-US");
    baselineRef.current = getValue();
    spokenRef.current = "";
    rec.onresult = (event) => {
      const { finals, interim } = transcriptsFromSpeechEvent(event);
      if (finals.length > 0 || interim) setRecording(true);
      for (const spoken of finals) {
        if (mode === "replace") {
          spokenRef.current = applySpeechTranscript(spokenRef.current, spoken, "append");
          onValue(applySpeechTranscript(baselineRef.current, spokenRef.current, "replace"));
        } else {
          const next = applySpeechTranscript(baselineRef.current, spoken, "append");
          baselineRef.current = next;
          onValue(next);
        }
        ingestSpeechLearning({
          text: spoken,
          source: "voice",
          workspace,
          locale: rec.lang,
        });
      }
      if (interim) {
        const spoken =
          mode === "replace"
            ? applySpeechTranscript(spokenRef.current, interim, "append")
            : interim;
        onValue(applySpeechTranscript(baselineRef.current, spoken, mode));
      }
    };
    rec.onerror = (event) => {
      if (!speechRecognitionErrorEndsSession(event.error)) return;
      listeningRef.current = false;
      setListening(false);
      if (recRef.current === rec) recRef.current = null;
    };
    rec.onend = () => {
      if (recRef.current !== rec || !listeningRef.current) {
        if (recRef.current === rec) recRef.current = null;
        return;
      }
      try {
        rec.start();
      } catch {
        listeningRef.current = false;
        setListening(false);
        if (recRef.current === rec) recRef.current = null;
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
        hero ? SOCIAL_WRITE_VOICE_HERO_CLASS : cn(HOUSE_ICON_BUTTON_CLASS, HOUSE_VOICE_MIC_CLASS, FORM_CONTROL_FOCUS_CLASS),
        hero && listening && SOCIAL_WRITE_VOICE_HERO_LISTENING_CLASS,
        hero && recording && SOCIAL_WRITE_VOICE_HERO_RECORDING_CLASS,
        !hero && listening && HOUSE_VOICE_MIC_LISTENING_CLASS,
      )}
      onClick={() => {
        if (listeningRef.current) stop();
        else start();
      }}
    >
      <Microphone
        className={hero ? "size-14" : "size-4"}
        weight={hero ? "fill" : PHOSPHOR_CHROME_IDLE_WEIGHT}
        aria-hidden
      />
    </button>
  );
}
