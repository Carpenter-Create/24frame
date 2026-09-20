import type { ReactNode } from "react";

import { SOCIAL_HOME_STACK_LOCK } from "@/lib/social-home";

// Shared Social Home column. Slot order is the lock — page and
// skeleton both render through this so phone and desktop cannot
// disagree. Composer is desktop-only via SOCIAL_COMPOSER_CLASS.
export function SocialHomeStack({
  composer,
  stories,
  topics,
  wall,
}: {
  composer?: ReactNode;
  stories: ReactNode;
  topics: ReactNode;
  wall: ReactNode;
}) {
  return (
    <div data-social-home-stack={SOCIAL_HOME_STACK_LOCK} className="contents">
      {composer}
      {stories}
      {topics}
      {wall}
    </div>
  );
}
