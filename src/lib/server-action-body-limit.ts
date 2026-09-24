// `experimental.serverActions.bodySizeLimit` is one knob. Next applies it
// to every server action. There is no per-action body size limit.
//
// `"3gb"` parses as 3 GiB (`gb` = 1 << 30) and was larger than any file a
// server action is allowed to read. The ceiling is the largest of those
// house caps plus the multipart overhead Next documents for this knob
// (10–20 KB). A body one byte over is rejected with 413 before the action
// runs (`size > limit`).

/** Next serverActions `bodySizeLimit` docs: leave 10–20 KB for multipart. */
export const SERVER_ACTION_MULTIPART_HEADROOM_BYTES = 20 * 1024;

/**
 * Largest file a server action may carry. Must stay equal to
 * max(AVATAR_MAX_BYTES, EDUCATION_IMAGE_MAX_BYTES, EDUCATION_VIDEO_MAX_BYTES).
 * Locked by the unit test so this module can stay import-free for next.config.
 */
export const SERVER_ACTION_MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;

export const SERVER_ACTION_BODY_SIZE_LIMIT_BYTES =
  SERVER_ACTION_MAX_FILE_BYTES + SERVER_ACTION_MULTIPART_HEADROOM_BYTES;

/** Former `bodySizeLimit: "3gb"`. */
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
