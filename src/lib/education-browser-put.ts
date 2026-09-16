/**
 * Browser PUT to a presigned Education source URL.
 * Cross-origin S3 fetch throws on missing CORS — never leak that to Saving….
 */
export async function putEducationBrowserObject(
  url: string,
  file: Blob,
  contentType: string,
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    return res.ok;
  } catch {
    return false;
  }
}
