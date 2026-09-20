// One SpeechRecognition SoT for house search mics and Social
// composer dictate. Probe SpeechRecognition / webkit. No audio
// capture here — transcripts only.

export type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0?: { transcript?: string };
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike> & { length: number };
};

export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};

export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export type SpeechRecognitionHost = {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

export type SpeechTranscriptMode = "replace" | "append";

export function speechRecognitionCtor(
  host: SpeechRecognitionHost = globalThis as SpeechRecognitionHost,
): SpeechRecognitionCtor | null {
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function speechRecognitionSupported(
  host: SpeechRecognitionHost = globalThis as SpeechRecognitionHost,
): boolean {
  return speechRecognitionCtor(host) != null;
}

export function transcriptsFromSpeechEvent(event: SpeechRecognitionEventLike): {
  finals: string[];
  interim: string;
} {
  const finals: string[] = [];
  let interim = "";
  const start = Number.isFinite(event.resultIndex) ? event.resultIndex : 0;
  for (let i = start; i < event.results.length; i += 1) {
    const row = event.results[i];
    const text = row?.[0]?.transcript?.trim() ?? "";
    if (!text) continue;
    if (row.isFinal) finals.push(text);
    else interim = interim ? `${interim} ${text}` : text;
  }
  return { finals, interim };
}

export function applySpeechTranscript(
  current: string,
  spoken: string,
  mode: SpeechTranscriptMode,
): string {
  const next = spoken.trim();
  if (!next) return current;
  if (mode === "replace") return next;
  const prefix = current.trimEnd();
  return prefix ? `${prefix} ${next}` : next;
}
