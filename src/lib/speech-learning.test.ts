import { afterEach, describe, expect, it } from "vitest";

import {
  clearSpeechLearningSession,
  ingestSpeechLearning,
  onSpeechLearningIngest,
  parseSpeechLearningEnabled,
  readSpeechLearningEnabled,
  serializeSpeechLearningEnabled,
  SPEECH_LEARNING,
  speechLearningWorkspaceFromPath,
  writeSpeechLearningEnabled,
} from "./speech-learning";

describe("speech learning", () => {
  afterEach(() => {
    clearSpeechLearningSession();
  });

  it("defaults learning ON and treats missing storage as opt-out available", () => {
    expect(SPEECH_LEARNING.defaultEnabled).toBe(true);
    expect(parseSpeechLearningEnabled(null)).toBe(true);
    expect(parseSpeechLearningEnabled("")).toBe(true);
    expect(parseSpeechLearningEnabled("on")).toBe(true);
    expect(parseSpeechLearningEnabled("off")).toBe(false);
    expect(serializeSpeechLearningEnabled(false)).toBe("off");
    expect(readSpeechLearningEnabled({ getItem: () => null, setItem: () => undefined })).toBe(true);
    const store = new Map<string, string>();
    writeSpeechLearningEnabled(false, {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => {
        store.set(key, value);
      },
    });
    expect(store.get(SPEECH_LEARNING.storageKey)).toBe("off");
    expect(SPEECH_LEARNING.settingsLabel).toBe("Learn from typed and dictated text");
  });

  it("honors an in-memory opt-out when storage writes fail", () => {
    writeSpeechLearningEnabled(false, {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("quota");
      },
    });
    expect(readSpeechLearningEnabled({ getItem: () => null, setItem: () => undefined })).toBe(
      false,
    );
    expect(
      ingestSpeechLearning({ text: "keep learning off", source: "typed", workspace: "home" }),
    ).toBeNull();
  });

  it("ingests transcript + workspace + optional locale and tags voice|typed", () => {
    const seen: unknown[] = [];
    const stop = onSpeechLearningIngest((event) => {
      seen.push(event);
    });
    expect(
      ingestSpeechLearning(
        { text: "  hello social  ", source: "voice", workspace: "social", locale: "en-US" },
        { enabled: true },
      ),
    ).toEqual({
      text: "hello social",
      source: "voice",
      workspace: "social",
      locale: "en-US",
    });
    expect(
      ingestSpeechLearning(
        { text: "typed query", source: "typed", workspace: "aggregation" },
        { enabled: true },
      ),
    ).toMatchObject({ source: "typed", workspace: "aggregation" });
    expect(
      ingestSpeechLearning(
        { text: "ignored", source: "voice", workspace: "social" },
        { enabled: false },
      ),
    ).toBeNull();
    expect(ingestSpeechLearning({ text: "   ", source: "typed", workspace: "home" }, { enabled: true })).toBeNull();
    expect(seen).toHaveLength(2);
    expect(seen[0]).toMatchObject({ source: "voice" });
    expect(JSON.stringify(seen)).not.toContain("audio");
    stop();
  });

  it("maps search paths to a workspace without inventing a fourth product", () => {
    expect(speechLearningWorkspaceFromPath("/social/explore")).toBe("social");
    expect(speechLearningWorkspaceFromPath("/education/orientation")).toBe("education");
    expect(speechLearningWorkspaceFromPath("/home")).toBe("home");
    expect(speechLearningWorkspaceFromPath("/aggregation/titles")).toBe("aggregation");
  });
});
