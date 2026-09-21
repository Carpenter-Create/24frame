import { SOCIAL_COVER_BYTES_ROUTE } from "@/lib/social-edge";

export { SOCIAL_COVER_BYTES_ROUTE };

/** Local previews can be read in the browser. Proxy and CDN hrefs cannot. */
export function coverPreviewIsLocal(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}

/** TypeError and "Failed to fetch" stay off the screen. Other crop messages pass through. */
export function coverFailureCopy(error: unknown, fallback: string): string {
  if (error instanceof TypeError) return fallback;
  if (error instanceof Error) {
    if (/failed to fetch/i.test(error.message)) return fallback;
    if (error.message && error.message !== "cover") return error.message;
  }
  return fallback;
}
