import { describe, expect, it } from "vitest";

import {
  applySpeechTranscript,
  speechRecognitionCtor,
  speechRecognitionSupported,
  transcriptsFromSpeechEvent,
} from "./speech-recognition";

describe("speech recognition SoT", () => {
  it("hides support when neither constructor is present", () => {
    expect(speechRecognitionSupported({})).toBe(false);
    expect(speechRecognitionCtor({})).toBeNull();
  });

  it("accepts SpeechRecognition or the webkit alias", () => {
    class FakeRec {
      continuous = false;
      interimResults = false;
      lang = "";
      onresult = null;
      onerror = null;
      onend = null;
      start() {}
      stop() {}
      abort() {}
    }
    expect(speechRecognitionSupported({ SpeechRecognition: FakeRec })).toBe(true);
    expect(speechRecognitionCtor({ webkitSpeechRecognition: FakeRec })).toBe(FakeRec);
    expect(speechRecognitionSupported({ webkitSpeechRecognition: FakeRec })).toBe(true);
  });

  it("splits final and interim transcripts from a recognition event", () => {
    expect(
      transcriptsFromSpeechEvent({
        resultIndex: 0,
        results: [
          { isFinal: true, 0: { transcript: "  hello " } },
          { isFinal: false, 0: { transcript: "world" } },
        ],
      }),
    ).toEqual({ finals: ["hello"], interim: "world" });
  });

  it("replaces search text and appends dictate text", () => {
    expect(applySpeechTranscript("old query", "new query", "replace")).toBe("new query");
    expect(applySpeechTranscript("What's on", "your mind", "append")).toBe("What's on your mind");
    expect(applySpeechTranscript("", "  hello  ", "append")).toBe("hello");
    expect(applySpeechTranscript("keep", "   ", "replace")).toBe("keep");
  });
});
