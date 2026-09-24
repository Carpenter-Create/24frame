// Send craft v1.2. Fullscreen stays on the in-thread host.
// iOS ignores Element.requestFullscreen on a wrapper div. The native
// video path is webkitEnterFullscreen. Mux uses that on its media, then
// requestFullscreen. No second player.

export type StoryShareFullscreenHost = {
  webkitEnterFullscreen?: () => void;
  requestFullscreen?: () => void | Promise<void>;
  media?: StoryShareFullscreenHost | null;
};

function canFullscreen(host: StoryShareFullscreenHost | null | undefined): host is StoryShareFullscreenHost {
  if (!host) return false;
  return typeof host.webkitEnterFullscreen === "function" || typeof host.requestFullscreen === "function";
}

/** Light-DOM video first, then the Mux player's own media, then the mux-player element. Never the card wrapper. */
export function storyShareFullscreenHost(input: {
  video?: StoryShareFullscreenHost | null;
  mux?: StoryShareFullscreenHost | null;
}): StoryShareFullscreenHost | null {
  if (canFullscreen(input.video)) return input.video;
  if (canFullscreen(input.mux?.media)) return input.mux.media;
  if (canFullscreen(input.mux)) return input.mux;
  return null;
}

/** iOS webkitEnterFullscreen, otherwise the standard Fullscreen API on that same node. */
export function callStoryShareHostFullscreen(host: StoryShareFullscreenHost | null | undefined): boolean {
  if (!host) return false;
  if (typeof host.webkitEnterFullscreen === "function") {
    host.webkitEnterFullscreen();
    return true;
  }
  if (typeof host.requestFullscreen === "function") {
    void host.requestFullscreen();
    return true;
  }
  return false;
}
