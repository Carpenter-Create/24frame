import { describe, expect, it } from "vitest";

import {
  socialCreateKindFromMediaFile,
  socialCreateKindFromMediaFiles,
  stashSocialHomeComposerMedia,
  takeSocialHomeComposerMedia,
} from "./social-home-composer";

describe("Social Home compact composer media handoff", () => {
  it("maps stills and clips onto one Media Create intent", () => {
    expect(socialCreateKindFromMediaFile({ type: "image/jpeg" })).toBe("media");
    expect(socialCreateKindFromMediaFile({ type: "video/mp4" })).toBe("media");
    expect(socialCreateKindFromMediaFile({ type: "application/pdf" })).toBeNull();
    expect(socialCreateKindFromMediaFiles([{ type: "image/png" }])).toBe("media");
    expect(socialCreateKindFromMediaFiles([])).toBeNull();
  });

  it("hands the picked FileList to Create once", () => {
    const file = new File(["still"], "still.jpg", { type: "image/jpeg" });
    stashSocialHomeComposerMedia([file]);
    expect(takeSocialHomeComposerMedia()).toEqual([file]);
    expect(takeSocialHomeComposerMedia()).toEqual([]);
  });
});
