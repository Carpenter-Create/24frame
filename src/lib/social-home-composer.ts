import type { SocialCreateKind } from "@/lib/social";
import { socialMediaKindFor } from "@/lib/social-media";

// Home compact composer (Figma 160:482). Field typing goes to text Create.
// Media icon opens a photo-or-video picker; the FileList is handed to Create
// across the client navigation so the pick is not thrown away.

let pendingMedia: File[] | null = null;

export function socialCreateKindFromMediaFile(
  file: Pick<File, "type">,
): SocialCreateKind | null {
  const kind = socialMediaKindFor(file.type);
  if (kind === "image") return "photo";
  if (kind === "video") return "video";
  return null;
}

export function socialCreateKindFromMediaFiles(
  files: ArrayLike<Pick<File, "type">>,
): SocialCreateKind | null {
  const first = files[0];
  return first ? socialCreateKindFromMediaFile(first) : null;
}

export function stashSocialHomeComposerMedia(files: ArrayLike<File>): void {
  pendingMedia = Array.from(files);
}

export function takeSocialHomeComposerMedia(): File[] {
  const files = pendingMedia ?? [];
  pendingMedia = null;
  return files;
}
