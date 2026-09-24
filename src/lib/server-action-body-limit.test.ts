import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { EDUCATION_VIDEO_MAX_BYTES } from "./education";
import { SOCIAL_IMAGE_MAX_BYTES, SOCIAL_VIDEO_MAX_BYTES } from "./social-media";
import {
  RETIRED_SERVER_ACTION_BODY_LIMIT_BYTES,
  SERVER_ACTION_BODY_SIZE_LIMIT_BYTES,
  SERVER_ACTION_MEDIA_CAP_BYTES,
  SERVER_ACTION_MULTIPART_HEADROOM_BYTES,
  serverActionBodyExceedsLimit,
} from "./server-action-body-limit";

describe("server action body limit", () => {
  it("matches the education lesson-source cap plus multipart headroom", () => {
    expect(SERVER_ACTION_MEDIA_CAP_BYTES).toBe(EDUCATION_VIDEO_MAX_BYTES);
    expect(SERVER_ACTION_MEDIA_CAP_BYTES).toBe(2 * 1024 * 1024 * 1024);
    expect(SERVER_ACTION_MULTIPART_HEADROOM_BYTES).toBe(1024 * 1024);
    expect(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES).toBe(
      EDUCATION_VIDEO_MAX_BYTES + SERVER_ACTION_MULTIPART_HEADROOM_BYTES,
    );
  });

  it("stays under the retired 3GiB parser ceiling and above smaller house caps", () => {
    expect(RETIRED_SERVER_ACTION_BODY_LIMIT_BYTES).toBe(3 * 1024 * 1024 * 1024);
    expect(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES).toBeLessThan(RETIRED_SERVER_ACTION_BODY_LIMIT_BYTES);
    expect(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES).toBeGreaterThan(SOCIAL_VIDEO_MAX_BYTES);
    expect(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES).toBeGreaterThan(SOCIAL_IMAGE_MAX_BYTES);
  });

  it("rejects an oversize body and accepts one at the ceiling", () => {
    expect(serverActionBodyExceedsLimit(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES)).toBe(false);
    expect(serverActionBodyExceedsLimit(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES + 1)).toBe(true);
    expect(serverActionBodyExceedsLimit(RETIRED_SERVER_ACTION_BODY_LIMIT_BYTES)).toBe(true);
    expect(serverActionBodyExceedsLimit(Number.NaN)).toBe(true);
    expect(serverActionBodyExceedsLimit(Number.POSITIVE_INFINITY)).toBe(true);
    expect(serverActionBodyExceedsLimit(-1)).toBe(true);
  });

  it("wires the numeric ceiling into next.config and drops the 3gb literal", () => {
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toContain('from "./src/lib/server-action-body-limit"');
    expect(nextConfig).toContain("bodySizeLimit: SERVER_ACTION_BODY_SIZE_LIMIT_BYTES");
    expect(nextConfig).not.toMatch(/bodySizeLimit:\s*["']3gb["']/);
  });
});
