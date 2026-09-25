import "server-only";

import { type SignedSocialMedia } from "@/lib/s3-social-media";
import { socialMediaProxies } from "@/lib/social-edge";

/**
 * Story playback SoT. Mux player only.
 * Images stay on the same-origin media proxy.
 * A video row without a playback id fails closed: empty url, never the
 * media proxy and never a signed object GET.
 * Tokens stay on /api/social/mux-playback when playbackPolicy is signed.
 * This does not mint a Mux JWT and does not add a signer.
 */
export async function signedStoryPlaybackItems(
  media: unknown,
  authorId: string,
): Promise<SignedSocialMedia[]> {
  return socialMediaProxies(media, authorId, "stories").map((item) =>
    item.kind === "video" && !item.playbackId ? { ...item, url: "" } : item,
  );
}
