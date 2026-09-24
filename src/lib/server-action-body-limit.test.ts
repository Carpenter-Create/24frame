import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { AVATAR_MAX_BYTES } from "./account-avatar";
import { EDUCATION_IMAGE_MAX_BYTES, EDUCATION_VIDEO_MAX_BYTES } from "./education";
import {
  RETIRED_SERVER_ACTION_BODY_LIMIT_BYTES,
  SERVER_ACTION_BODY_SIZE_LIMIT_BYTES,
  SERVER_ACTION_MAX_FILE_BYTES,
  SERVER_ACTION_MULTIPART_HEADROOM_BYTES,
  serverActionBodyExceedsLimit,
} from "./server-action-body-limit";

const largestInActionFile = Math.max(AVATAR_MAX_BYTES, EDUCATION_IMAGE_MAX_BYTES);

describe("server action body limit", () => {
  it("is the largest file still posted to a server action, plus multipart headroom", () => {
    expect(AVATAR_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect(EDUCATION_IMAGE_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(largestInActionFile).toBe(EDUCATION_IMAGE_MAX_BYTES);
    expect(SERVER_ACTION_MAX_FILE_BYTES).toBe(largestInActionFile);
    expect(SERVER_ACTION_MAX_FILE_BYTES).toBeLessThan(EDUCATION_VIDEO_MAX_BYTES);
    expect(SERVER_ACTION_MULTIPART_HEADROOM_BYTES).toBe(20 * 1024);
    expect(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES).toBe(
      largestInActionFile + SERVER_ACTION_MULTIPART_HEADROOM_BYTES,
    );
  });

  it("stays under the retired 3GiB ceiling that applied to every server action", () => {
    expect(RETIRED_SERVER_ACTION_BODY_LIMIT_BYTES).toBe(3 * 1024 * 1024 * 1024);
    expect(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES).toBeLessThan(RETIRED_SERVER_ACTION_BODY_LIMIT_BYTES);
    expect(serverActionBodyExceedsLimit(EDUCATION_VIDEO_MAX_BYTES)).toBe(true);
    expect(serverActionBodyExceedsLimit(RETIRED_SERVER_ACTION_BODY_LIMIT_BYTES)).toBe(true);
  });

  it("rejects an oversize body and accepts one at the ceiling", () => {
    expect(serverActionBodyExceedsLimit(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES)).toBe(false);
    expect(serverActionBodyExceedsLimit(SERVER_ACTION_BODY_SIZE_LIMIT_BYTES + 1)).toBe(true);
    expect(serverActionBodyExceedsLimit(Number.NaN)).toBe(true);
    expect(serverActionBodyExceedsLimit(Number.POSITIVE_INFINITY)).toBe(true);
    expect(serverActionBodyExceedsLimit(-1)).toBe(true);
  });

  it("wires that single ceiling into next.config and drops the 3gb literal", () => {
    const nextConfig = readFileSync("next.config.ts", "utf8");
    expect(nextConfig).toContain('from "./src/lib/server-action-body-limit"');
    expect(nextConfig).toContain("bodySizeLimit: SERVER_ACTION_BODY_SIZE_LIMIT_BYTES");
    expect(nextConfig).not.toMatch(/bodySizeLimit:\s*["']3gb["']/);
    expect(nextConfig).toContain("every server action");
  });
});
