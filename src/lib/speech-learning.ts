import type { WorkspaceMode } from "@/lib/workspace";

// Learn from transcripts + typed text only. Tag source voice|typed.
// Never store raw audio. Preference defaults ON (opt-out). Lawyers
// own T&Cs / privacy copy — this file holds the short settings label
// and the ingest hook only.

export const SPEECH_LEARNING_STORAGE_KEY = "gc-speech-learning";

export const SPEECH_LEARNING_SOURCES = ["voice", "typed"] as const;
export type SpeechLearningSource = (typeof SPEECH_LEARNING_SOURCES)[number];

export type SpeechLearningWorkspace = WorkspaceMode | "home";

export const SPEECH_LEARNING = {
  storageKey: SPEECH_LEARNING_STORAGE_KEY,
  settingsLabel: "Learn from typed and dictated text",
  on: "On",
  off: "Off",
  defaultEnabled: true,
} as const;

export type SpeechLearningIngest = {
  text: string;
  source: SpeechLearningSource;
  workspace: SpeechLearningWorkspace;
  locale?: string;
};

export type SpeechLearningStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export function parseSpeechLearningEnabled(raw: string | null | undefined): boolean {
  if (raw == null || raw.trim() === "") return SPEECH_LEARNING.defaultEnabled;
  const value = raw.trim().toLowerCase();
  if (value === "off" || value === "0" || value === "false") return false;
  return true;
}

export function serializeSpeechLearningEnabled(enabled: boolean): "on" | "off" {
  return enabled ? "on" : "off";
}

export function readSpeechLearningEnabled(storage?: SpeechLearningStorage | null): boolean {
  try {
    return parseSpeechLearningEnabled(storage?.getItem(SPEECH_LEARNING_STORAGE_KEY) ?? null);
  } catch {
    return SPEECH_LEARNING.defaultEnabled;
  }
}

export function writeSpeechLearningEnabled(
  enabled: boolean,
  storage?: SpeechLearningStorage | null,
): void {
  try {
    storage?.setItem(SPEECH_LEARNING_STORAGE_KEY, serializeSpeechLearningEnabled(enabled));
  } catch {
    // Storage may be unavailable — session still honors the in-memory toggle.
  }
}

type SpeechLearningListener = (event: SpeechLearningIngest) => void;

const listeners = new Set<SpeechLearningListener>();

export function onSpeechLearningIngest(listener: SpeechLearningListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function ingestSpeechLearning(
  input: SpeechLearningIngest,
  options?: { enabled?: boolean; storage?: SpeechLearningStorage | null },
): SpeechLearningIngest | null {
  const enabled =
    options?.enabled ??
    readSpeechLearningEnabled(options?.storage ?? speechLearningBrowserStorage());
  if (!enabled) return null;
  const text = input.text.trim();
  if (!text) return null;
  const event: SpeechLearningIngest = {
    text,
    source: input.source,
    workspace: input.workspace,
    ...(input.locale ? { locale: input.locale } : {}),
  };
  for (const listener of listeners) listener(event);
  return event;
}

export function speechLearningWorkspaceFromPath(pathname: string): SpeechLearningWorkspace {
  if (pathname.startsWith("/social")) return "social";
  if (pathname.startsWith("/education")) return "education";
  if (pathname.startsWith("/home") || pathname.startsWith("/messages") || pathname === "/") {
    return "home";
  }
  return "aggregation";
}

function speechLearningBrowserStorage(): SpeechLearningStorage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}
