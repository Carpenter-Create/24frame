import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  pendingTitlePrefixesFromRows,
  purgeDeletedTitleStorage,
  sweepDeletedTitlePrefixes,
} from "./s3-title-purge";

const { purgeTitlePrefix } = vi.hoisted(() => ({
  purgeTitlePrefix: vi.fn(),
}));

vi.mock("./s3", () => ({
  purgeTitlePrefix,
}));

const ORG = "550e8400-e29b-41d4-a716-446655440000";
const TITLE = "11111111-2222-4333-8444-555555555555";

beforeEach(() => {
  purgeTitlePrefix.mockReset();
});

describe("purgeDeletedTitleStorage", () => {
  it("marks assets purged only after S3 succeeds and no in-flight writes remain", async () => {
    purgeTitlePrefix
      .mockResolvedValueOnce({ prefix: "p/", deleted: 1 })
      .mockResolvedValueOnce({ prefix: "p/", deleted: 0 });
    const markPurged = vi.fn(async () => ({ error: null }));
    const hasInFlightWrites = vi.fn(async () => false);

    await expect(
      purgeDeletedTitleStorage({ orgId: ORG, titleId: TITLE, markPurged, hasInFlightWrites }),
    ).resolves.toEqual({ prefix: "p/", deleted: 1 });
    expect(purgeTitlePrefix).toHaveBeenCalledTimes(2);
    expect(purgeTitlePrefix).toHaveBeenCalledWith(ORG, TITLE);
    expect(markPurged).toHaveBeenCalledTimes(1);
  });

  it("does not mark when S3 purge fails", async () => {
    purgeTitlePrefix.mockRejectedValueOnce(new Error("S3 down"));
    const markPurged = vi.fn(async () => ({ error: null }));
    const hasInFlightWrites = vi.fn(async () => false);

    await expect(
      purgeDeletedTitleStorage({ orgId: ORG, titleId: TITLE, markPurged, hasInFlightWrites }),
    ).rejects.toThrow("S3 down");
    expect(markPurged).not.toHaveBeenCalled();
    expect(hasInFlightWrites).not.toHaveBeenCalled();
  });

  it("does not mark while a transcode job can still write the prefix", async () => {
    purgeTitlePrefix.mockResolvedValueOnce({ prefix: "p/", deleted: 1 });
    const markPurged = vi.fn(async () => ({ error: null }));
    const hasInFlightWrites = vi.fn(async () => true);

    await expect(
      purgeDeletedTitleStorage({ orgId: ORG, titleId: TITLE, markPurged, hasInFlightWrites }),
    ).resolves.toEqual({ prefix: "p/", deleted: 1 });
    expect(purgeTitlePrefix).toHaveBeenCalledTimes(1);
    expect(markPurged).not.toHaveBeenCalled();
  });

  it("does not mark when a confirm pass still races an in-flight write", async () => {
    purgeTitlePrefix
      .mockResolvedValueOnce({ prefix: "p/", deleted: 0 })
      .mockResolvedValueOnce({ prefix: "p/", deleted: 1 });
    const markPurged = vi.fn(async () => ({ error: null }));
    const hasInFlightWrites = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    await expect(
      purgeDeletedTitleStorage({ orgId: ORG, titleId: TITLE, markPurged, hasInFlightWrites }),
    ).resolves.toEqual({ prefix: "p/", deleted: 1 });
    expect(purgeTitlePrefix).toHaveBeenCalledTimes(2);
    expect(markPurged).not.toHaveBeenCalled();
  });

  it("fails closed when the mark RPC errors after S3 success", async () => {
    purgeTitlePrefix.mockResolvedValue({ prefix: "p/", deleted: 0 });
    const markPurged = vi.fn(async () => ({ error: { message: "mark failed" } }));
    const hasInFlightWrites = vi.fn(async () => false);

    await expect(
      purgeDeletedTitleStorage({ orgId: ORG, titleId: TITLE, markPurged, hasInFlightWrites }),
    ).rejects.toThrow("mark failed");
  });
});

describe("pendingTitlePrefixesFromRows", () => {
  it("dedupes title ids and ignores an empty page", () => {
    expect(pendingTitlePrefixesFromRows(null)).toEqual([]);
    expect(
      pendingTitlePrefixesFromRows([
        { id: TITLE, org_id: ORG },
        { id: TITLE, org_id: ORG },
      ]),
    ).toEqual([{ orgId: ORG, titleId: TITLE }]);
  });
});

describe("sweepDeletedTitlePrefixes", () => {
  it("is a no-op when nothing is pending — second pass is idempotent", async () => {
    const purgeOne = vi.fn();
    await expect(sweepDeletedTitlePrefixes([], purgeOne)).resolves.toEqual({
      attempted: 0,
      purged: 0,
      failed: 0,
    });
    expect(purgeOne).not.toHaveBeenCalled();
  });

  it("purges each pending title once and counts a retryable failure", async () => {
    const other = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const purgeOne = vi
      .fn()
      .mockResolvedValueOnce({ deleted: 2 })
      .mockRejectedValueOnce(new Error("still failing"));

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      sweepDeletedTitlePrefixes(
        [
          { orgId: ORG, titleId: TITLE },
          { orgId: ORG, titleId: TITLE },
          { orgId: ORG, titleId: other },
        ],
        purgeOne,
      ),
    ).resolves.toEqual({ attempted: 2, purged: 1, failed: 1 });
    expect(purgeOne).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });
});
