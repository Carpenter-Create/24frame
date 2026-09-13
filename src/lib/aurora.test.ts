import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";

import {
  AURORA_CLUSTERS,
  AURORA_ENV,
  assertAuroraDatabaseUrl,
  auroraDatabaseUrl,
  isAuroraConfigured,
  isForbiddenAuroraDatabaseUrl,
} from "./aurora";

const src = readFileSync("src/lib/aurora.ts", "utf8");
const shim = readFileSync("docs/infra/aurora-auth-shim.sql", "utf8");
const awsMigration = readFileSync(
  "supabase/migrations/20260913230000_finance_ops_slice_2_aws_spine.sql",
  "utf8",
);

describe("Aurora SoT contract", () => {
  afterEach(() => {
    delete process.env.AURORA_DATABASE_URL;
  });

  it("records live Aurora PostgreSQL on E8 us-west-2 and does not invent Cognito", () => {
    expect(AURORA_CLUSTERS.account).toBe("405912452061");
    expect(AURORA_CLUSTERS.region).toBe("us-west-2");
    expect(AURORA_CLUSTERS.engine).toBe("aurora-postgresql");
    expect(AURORA_CLUSTERS.dev).toBe("frame-aurora-dev");
    expect(AURORA_CLUSTERS.prod).toBe("frame-aurora-prod");
    expect(src).not.toContain("24frame-aurora-");
    expect(AURORA_ENV).toEqual(["AURORA_DATABASE_URL"]);
    expect(src).not.toContain("cognito");
    expect(src).not.toContain("Cognito");
    expect(src).toContain("Auth stays Supabase Auth");
  });

  it("refuses survivor pooler and Royalogic hosts", () => {
    expect(isForbiddenAuroraDatabaseUrl("")).toBe(true);
    expect(
      isForbiddenAuroraDatabaseUrl(
        "postgresql://postgres.uevsculwzwlhxeamagwg@aws-1-us-west-2.pooler.supabase.com:5432/postgres",
      ),
    ).toBe(true);
    expect(isForbiddenAuroraDatabaseUrl("postgresql://x@royalogic.example/db")).toBe(true);
    expect(
      isForbiddenAuroraDatabaseUrl(
        "postgresql://app@frame-aurora-dev.cluster-abc.us-west-2.rds.amazonaws.com:5432/24frame",
      ),
    ).toBe(false);
    expect(() =>
      assertAuroraDatabaseUrl(
        "postgresql://postgres.uevsculwzwlhxeamagwg@aws-1-us-west-2.pooler.supabase.com:5432/postgres",
      ),
    ).toThrow(/dedicated 24Frame Aurora cluster/);
  });

  it("does not fall back to a generic DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgresql://other@localhost/db";
    expect(isAuroraConfigured()).toBe(false);
    expect(() => auroraDatabaseUrl()).toThrow(/AURORA_DATABASE_URL/);
    expect(src).not.toContain("process.env.DATABASE_URL");
    expect(src).not.toContain("SUPABASE_DB");
  });

  it("keeps new Slice 2 jobs off auth.users FKs and documents the shim", () => {
    expect(awsMigration).not.toContain("references auth.users");
    expect(awsMigration).toContain("Aurora-portable");
    expect(awsMigration).toContain("no pg_cron");
    expect(shim).toContain("auth.uid()");
    expect(shim).toContain("Do not apply to survivor");
    expect(shim).not.toContain("cognito");
  });
});
