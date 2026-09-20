import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { HouseVoiceMic } from "./house-voice-mic";
import { FORM_CONTROL_FOCUS_CLASS, HOUSE_VOICE_MIC_CLASS } from "@/lib/form-control";
import { HOUSE_VOICE } from "@/lib/house-voice";

describe("HouseVoiceMic graceful fallback", () => {
  it("hides the circular mic when SpeechRecognition is unsupported", () => {
    const hidden = renderToStaticMarkup(
      createElement(HouseVoiceMic, {
        surface: "search",
        workspace: "social",
        supported: false,
        getValue: () => "",
        onValue: () => undefined,
      }),
    );
    expect(hidden).toBe("");
    expect(hidden).not.toContain("data-house-voice-mic");
  });

  it("renders a circular mic with calm focus when supported", () => {
    const html = renderToStaticMarkup(
      createElement(HouseVoiceMic, {
        surface: "search",
        workspace: "social",
        supported: true,
        getValue: () => "",
        onValue: () => undefined,
      }),
    );
    expect(html).toContain('data-house-voice-mic="search"');
    expect(html).toContain(HOUSE_VOICE.search);
    expect(html).toContain(HOUSE_VOICE_MIC_CLASS);
    expect(html).toContain(FORM_CONTROL_FOCUS_CLASS);
    expect(html).toContain("rounded-full");
    expect(html).not.toContain("ring-accent");
    expect(html).not.toContain("focus:ring-2");
    expect(html).not.toContain("focus:ring-accent");
  });

  it("uses dictate labeling on the Social composer surface", () => {
    const html = renderToStaticMarkup(
      createElement(HouseVoiceMic, {
        surface: "dictate",
        workspace: "social",
        supported: true,
        getValue: () => "",
        onValue: () => undefined,
      }),
    );
    expect(html).toContain('data-house-voice-mic="dictate"');
    expect(html).toContain(HOUSE_VOICE.dictate);
  });
});
