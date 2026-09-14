export const SOCIAL_TAB_BAR_SCROLL_THRESHOLD = 8;

export type SocialTabBarScrollState = "visible" | "hidden";

// FB-style hide on scroll-down / show on scroll-up. Rest (y <= 0) stays visible.
export function nextSocialTabBarVisibility(
  current: SocialTabBarScrollState,
  deltaY: number,
  y: number,
  threshold = SOCIAL_TAB_BAR_SCROLL_THRESHOLD,
): SocialTabBarScrollState {
  if (y <= 0) return "visible";
  if (deltaY > threshold) return "hidden";
  if (deltaY < -threshold) return "visible";
  return current;
}
