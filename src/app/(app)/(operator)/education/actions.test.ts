import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/auth", () => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/s3-education", () => ({
  isEducationAwsConfigured: vi.fn(() => false),
  presignEducationSourcePut: vi.fn(),
}));
vi.mock("@/lib/education-mediaconvert", () => ({
  isEducationMediaconvertConfigured: vi.fn(() => false),
  submitEducationHlsJob: vi.fn(),
  getEducationEncodeJob: vi.fn(),
}));

import { getAuthUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isEducationAwsConfigured, presignEducationSourcePut } from "@/lib/s3-education";
import { EDUCATION_ADMIN } from "@/lib/education";

import { createEducationCourse, presignEducationUpload } from "./actions";

const USER = { id: "11111111-1111-4111-8111-111111111111" };
const COURSE = "22222222-2222-4222-8222-222222222222";

function staffClient(row: { user_id: string } | null) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => ({ data: row, error: null })),
  };
  const from = vi.fn(() => chain);
  vi.mocked(createClient).mockResolvedValue({ from } as never);
  return { from };
}

function adminClient(insertError: { code?: string; message?: string } | null = null) {
  const insert = vi.fn(async () => ({ error: insertError }));
  const from = vi.fn(() => ({ insert }));
  vi.mocked(createAdminClient).mockReturnValue({ from } as never);
  return { from, insert };
}

describe("education admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue(USER as never);
  });

  it("refuses a member write and does not open the admin client", async () => {
    staffClient(null);
    const admin = adminClient();
    await expect(
      createEducationCourse({
        slug: "member-write",
        title: "Nope",
        model: "free",
      }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.notAuthorized });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("inserts a course through the service-role client for gc_staff", async () => {
    staffClient({ user_id: USER.id });
    const admin = adminClient();
    await expect(
      createEducationCourse({
        slug: "Welcome To 24Frame Two",
        title: "Welcome",
        model: "free",
        price: "49",
      }),
    ).resolves.toEqual({ slug: "welcome-to-24frame-two" });
    expect(createAdminClient).toHaveBeenCalled();
    expect(admin.from).toHaveBeenCalledWith("courses");
    expect(admin.insert).toHaveBeenCalledWith({
      slug: "welcome-to-24frame-two",
      title: "Welcome",
      description: null,
      is_flagship_free: true,
      price_cents: null,
    });
  });

  it("persists a one-time price on Paid and rejects a Paid course without a price", async () => {
    staffClient({ user_id: USER.id });
    const admin = adminClient();
    await expect(
      createEducationCourse({
        slug: "paid-course",
        title: "Paid fixture",
        model: "paid",
        price: "49.00",
      }),
    ).resolves.toEqual({ slug: "paid-course" });
    expect(admin.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        is_flagship_free: false,
        price_cents: 4900,
      }),
    );
    await expect(
      createEducationCourse({
        slug: "paid-empty",
        title: "Paid empty",
        model: "paid",
        price: "",
      }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.invalid });
  });

  it("returns a clear error when Education storage env is stubbed", async () => {
    staffClient({ user_id: USER.id });
    vi.mocked(isEducationAwsConfigured).mockReturnValue(false);
    await expect(
      presignEducationUpload({
        kind: "cover",
        courseId: COURSE,
        contentType: "image/jpeg",
        byteLength: 12,
      }),
    ).resolves.toEqual({ error: EDUCATION_ADMIN.envUnset });
    expect(presignEducationSourcePut).not.toHaveBeenCalled();
  });
});
