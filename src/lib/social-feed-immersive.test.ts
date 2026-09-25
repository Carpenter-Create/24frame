import { afterEach, describe, expect, it, vi } from "vitest";

import {
  shareSocialPostLink,
  socialImmersiveCaptionNeedsMore,
  socialPostShareUrl,
} from "./social-feed-immersive";

describe("social feed immersive helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("caps a long caption at three lines before more", () => {
    expect(socialImmersiveCaptionNeedsMore("short note")).toBe(false);
    expect(socialImmersiveCaptionNeedsMore("a".repeat(141))).toBe(true);
    expect(socialImmersiveCaptionNeedsMore("one\ntwo\nthree\nfour")).toBe(true);
  });

  it("builds the post permalink for share", () => {
    expect(socialPostShareUrl("p1", "https://app.24frame.co")).toBe("https://app.24frame.co/social/p/p1");
  });

  it("opens the platform share sheet with the post url and does not copy after a cancel", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });
    await expect(shareSocialPostLink("p1", "https://app.24frame.co")).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ url: "https://app.24frame.co/social/p/p1" });
    expect(writeText).not.toHaveBeenCalled();
  });

  it("leaves the link uncopied when share is cancelled", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Share canceled", "AbortError"));
    const writeText = vi.fn();
    vi.stubGlobal("navigator", { share, clipboard: { writeText } });
    await expect(shareSocialPostLink("p1", "https://app.24frame.co")).resolves.toBe("aborted");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the permalink when the platform share sheet is absent", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await expect(shareSocialPostLink("p1", "https://app.24frame.co")).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://app.24frame.co/social/p/p1");
  });
});
