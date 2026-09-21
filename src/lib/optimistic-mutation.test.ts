import { describe, expect, it, vi } from "vitest";

import { optimisticPersistNotice, runOptimisticMutation } from "@/lib/optimistic-mutation";

describe("house optimistic mutation runner", () => {
  it("applies first, persists second, and rolls back a failed persist", async () => {
    const calls: string[] = [];
    runOptimisticMutation({
      apply: () => {
        calls.push("apply");
        return "token";
      },
      persist: async () => {
        calls.push("persist");
        return { error: "Save failed." };
      },
      rollback: (token) => {
        calls.push(`rollback:${token}`);
      },
      onError: (error) => {
        calls.push(`error:${error}`);
      },
    });
    expect(calls[0]).toBe("apply");
    await vi.waitFor(() => {
      expect(calls).toEqual(["apply", "persist", "rollback:token", "error:Save failed."]);
    });
  });

  it("surfaces an Error message as the persist notice", () => {
    expect(optimisticPersistNotice(new Error("boom"), "fallback")).toBe("boom");
    expect(optimisticPersistNotice(null, "fallback")).toBe("fallback");
  });
});
