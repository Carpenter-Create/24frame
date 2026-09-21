import { describe, expect, it } from "vitest";

import { SOCIAL_COVER_BYTES_ROUTE } from "@/lib/social-edge";

import { coverFailureCopy, coverPreviewIsLocal } from "./social-profile-cover-load";

describe("cover reposition load", () => {
  it("treats only blob and data URLs as locally readable", () => {
    expect(coverPreviewIsLocal("blob:http://local/abc")).toBe(true);
    expect(coverPreviewIsLocal("data:image/jpeg;base64,aaa")).toBe(true);
    expect(coverPreviewIsLocal("/api/social/media?key=posts%2Fu%2Fa.jpg")).toBe(false);
    expect(coverPreviewIsLocal("https://cdn.example/signed")).toBe(false);
    expect(SOCIAL_COVER_BYTES_ROUTE).toBe("/api/social/cover");
  });

  it("never surfaces Failed to fetch", () => {
    expect(coverFailureCopy(new TypeError("Failed to fetch"), "Could not crop cover photo.")).toBe(
      "Could not crop cover photo.",
    );
    expect(coverFailureCopy(new Error("Failed to fetch"), "Could not crop cover photo.")).toBe(
      "Could not crop cover photo.",
    );
    expect(coverFailureCopy(new Error("Photo must be 10 MB or smaller."), "Could not crop cover photo.")).toBe(
      "Photo must be 10 MB or smaller.",
    );
  });
});
