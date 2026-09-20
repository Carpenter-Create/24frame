import { describe, expect, it } from "vitest";

import { SOCIAL_VIDEO_MAX_BYTES } from "./social-media";
import { formatStoryRecorderClock } from "./social-story-recorder";
import {
  formatGoLiveClock,
  goLiveFileName,
  goLiveFitsByteCap,
  goLiveReachedCap,
  goLiveRecorderOptions,
  goLiveRemainingMs,
  SOCIAL_GO_LIVE_MAX_MS,
  SOCIAL_GO_LIVE_VIDEO_BITS_PER_SECOND,
} from "./social-go-live";

describe("Go live duration cap", () => {
  it("caps at 10 minutes and counts remaining time down to 0:00", () => {
    expect(SOCIAL_GO_LIVE_MAX_MS).toBe(10 * 60 * 1000);
    expect(goLiveRemainingMs(0)).toBe(SOCIAL_GO_LIVE_MAX_MS);
    expect(goLiveRemainingMs(60_000)).toBe(9 * 60 * 1000);
    expect(goLiveRemainingMs(SOCIAL_GO_LIVE_MAX_MS)).toBe(0);
    expect(goLiveRemainingMs(SOCIAL_GO_LIVE_MAX_MS + 5_000)).toBe(0);
    expect(goLiveReachedCap(SOCIAL_GO_LIVE_MAX_MS - 1)).toBe(false);
    expect(goLiveReachedCap(SOCIAL_GO_LIVE_MAX_MS)).toBe(true);
    expect(formatGoLiveClock(SOCIAL_GO_LIVE_MAX_MS)).toBe("10:00");
    expect(formatGoLiveClock(0)).toBe("0:00");
    expect(formatGoLiveClock(goLiveRemainingMs(90_000))).toBe("8:30");
    expect(formatGoLiveClock(90_000)).toBe(formatStoryRecorderClock(90_000));
  });

  it("names the recorded file and keeps the bitrate under the bumped video cap", () => {
    expect(goLiveFileName("video/webm")).toBe("live.webm");
    expect(goLiveFileName("video/mp4")).toBe("live.mp4");
    expect(goLiveRecorderOptions("video/webm").videoBitsPerSecond).toBe(
      SOCIAL_GO_LIVE_VIDEO_BITS_PER_SECOND,
    );
    expect(SOCIAL_VIDEO_MAX_BYTES).toBe(250 * 1024 * 1024);
    expect(goLiveFitsByteCap(12)).toBe(true);
    expect(goLiveFitsByteCap(SOCIAL_VIDEO_MAX_BYTES + 1)).toBe(false);
    expect(goLiveFitsByteCap(0)).toBe(false);
  });
});
