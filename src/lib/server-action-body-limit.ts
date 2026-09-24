// Server-action request body ceiling.
//
// Next applies one parser limit to every server action
// (`experimental.serverActions.bodySizeLimit`). The previous value `"3gb"`
// is 3 GiB in Next's bytes parser (`gb` = 1 << 30). The only in-body media
// upload is an Education lesson source, capped at 2 GiB. Stories, social,
// and title masters send file bytes to S3 or Mux; those actions carry
// metadata only, under their own smaller caps.
//
// The ceiling is that 2 GiB cap plus multipart headroom (boundaries, the
// two id fields, and the filename). Next rejects a larger body with 413
// before the action runs (`size > limit`). A spare gigabyte is not headroom.

/** Must stay equal to EDUCATION_VIDEO_MAX_BYTES. Locked by the unit test. */
export const SERVER_ACTION_MEDIA_CAP_BYTES = 2 * 1024 * 1024 * 1024;

/** Multipart and flight overhead above the largest allowed file. */
export const SERVER_ACTION_MULTIPART_HEADROOM_BYTES = 1024 * 1024;

export const SERVER_ACTION_BODY_SIZE_LIMIT_BYTES =
  SERVER_ACTION_MEDIA_CAP_BYTES + SERVER_ACTION_MULTIPART_HEADROOM_BYTES;

/** Former `bodySizeLimit: "3gb"` — Next parses `gb` as 1 << 30. */
export const RETIRED_SERVER_ACTION_BODY_LIMIT_BYTES = 3 * (1 << 30);

/**
 * Fail closed. Matches the server-action parser: a body equal to the limit
 * is accepted; one byte over is rejected. Non-finite and negative lengths
 * are rejected.
 */
export function serverActionBodyExceedsLimit(byteLength: number): boolean {
  if (!Number.isFinite(byteLength) || byteLength < 0) return true;
  return byteLength > SERVER_ACTION_BODY_SIZE_LIMIT_BYTES;
}
