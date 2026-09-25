/** Fired when story pixels are actually on screen. The open hold listens. */
export const SOCIAL_STORY_MEDIA_PAINTED = "social-story-media-painted";

export function noteStoryMediaPainted(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SOCIAL_STORY_MEDIA_PAINTED));
}

/** Rail still inside the card media well. Avatars and video elements are not a poster. */
export function storyOpenHoldSrc(card: ParentNode): string | null {
  const img = card.querySelector("[data-social-story-media] img");
  if (!(img instanceof HTMLImageElement)) return null;
  const src = img.currentSrc || img.getAttribute("src") || "";
  if (!src || src.startsWith("data:")) return null;
  return src;
}
