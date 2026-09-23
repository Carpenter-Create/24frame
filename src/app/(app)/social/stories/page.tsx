import { permanentRedirect } from "next/navigation";

import { SOCIAL_ROUTES } from "@/lib/social";

// Bare stories index is not a second Home. Stories stay a rail on /social.
// Create and the viewer stay under /social/stories/….
export default function SocialStoriesIndexPage(): never {
  permanentRedirect(SOCIAL_ROUTES.home);
}
