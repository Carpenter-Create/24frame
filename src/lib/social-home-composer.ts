export {
  socialCreateKindFromMediaFile,
  socialCreateKindFromMediaFiles,
} from "@/lib/social-create-media";

// Home compact composer (Figma 160:482). Field typing goes to text Create.
// Media intent hands the FileList to Create across the client navigation
// so the pick is not thrown away.

let pendingMedia: File[] | null = null;

export function stashSocialHomeComposerMedia(files: ArrayLike<File>): void {
  pendingMedia = Array.from(files);
}

export function takeSocialHomeComposerMedia(): File[] {
  const files = pendingMedia ?? [];
  pendingMedia = null;
  return files;
}
