import "server-only";

import { signedEducationCoverUrls } from "@/lib/s3-education";

// Node callers pass this into SocialDesktopForYouSlot. The public
// profile route stays on the edge runtime and omits the signer.
export const signSocialForYouCourseCovers = signedEducationCoverUrls;
