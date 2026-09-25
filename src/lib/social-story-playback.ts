import "server-only";

import { signedSocialMediaUrl, type SignedSocialMedia } from "@/lib/s3-social-media";
import { socialMediaProxies } from "@/lib/social-edge";
import { ownedMediaItems } from "@/lib/social-media";

/**
 * Story playback SoT.
 * Images stay on the same-origin media proxy (the browser follows the 302).
 * Native video gets the existing CloudFront / S3 GET from signedSocialMediaUrl
 * so the element can range-request the file. A 302 plus a media fragment
 * makes WebKit error the element and paint the broken-media glyph.
 * Mux rows keep playbackId + playbackPolicy. Tokens stay on
 * /api/social/mux-playback, and only when playbackPolicy is signed.
 * This does not mint a Mux JWT and does not add a signer.
 */
export async function signedStoryPlaybackItems(
  media: unknown,
  authorId: string,
): Promise<SignedSocialMedia[]> {
  const items = socialMediaProxies(media, authorId, "stories");
  const owned = ownedMediaItems(media, authorId, "stories");
  const playback: SignedSocialMedia[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const stored = owned[index];
    if (!item) continue;
    if (!stored || item.playbackId || item.kind !== "video") {
      playback.push(item);
      continue;
    }
    const direct = await signedSocialMediaUrl(stored.key);
    playback.push(direct ? { ...item, url: direct } : item);
  }
  return playback;
}
