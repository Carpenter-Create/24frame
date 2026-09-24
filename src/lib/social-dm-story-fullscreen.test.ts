import { describe, expect, it, vi } from "vitest";

import {
  callStoryShareHostFullscreen,
  storyShareFullscreenHost,
} from "@/lib/social-dm-story-fullscreen";

describe("story share fullscreen host", () => {
  it("uses webkitEnterFullscreen on the in-card video and not a wrapper", () => {
    const webkitEnterFullscreen = vi.fn();
    const requestFullscreen = vi.fn();
    const wrapper = { requestFullscreen: vi.fn() };
    const video = { webkitEnterFullscreen, requestFullscreen };
    const host = storyShareFullscreenHost({ video, mux: wrapper });
    expect(host).toBe(video);
    expect(host).not.toBe(wrapper);
    expect(callStoryShareHostFullscreen(host)).toBe(true);
    expect(webkitEnterFullscreen).toHaveBeenCalledOnce();
    expect(requestFullscreen).not.toHaveBeenCalled();
    expect(wrapper.requestFullscreen).not.toHaveBeenCalled();
  });

  it("uses the Mux media element before the mux-player, then standard fullscreen", () => {
    const media = { requestFullscreen: vi.fn() };
    const mux = { requestFullscreen: vi.fn(), media };
    const host = storyShareFullscreenHost({ video: null, mux });
    expect(host).toBe(media);
    expect(callStoryShareHostFullscreen(host)).toBe(true);
    expect(media.requestFullscreen).toHaveBeenCalledOnce();
    expect(mux.requestFullscreen).not.toHaveBeenCalled();
  });

  it("falls through to the mux-player fullscreen API when media is not ready", () => {
    const mux = { requestFullscreen: vi.fn(), media: null };
    const host = storyShareFullscreenHost({ video: null, mux });
    expect(host).toBe(mux);
    expect(callStoryShareHostFullscreen(host)).toBe(true);
    expect(mux.requestFullscreen).toHaveBeenCalledOnce();
  });
});
