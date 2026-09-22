import { describe, expect, it } from "vitest";
import { Constants } from "@/lib/supabase/database.types";

import {
  ORG_ROLE_LABELS,
  ORG_ROLE_DESCRIPTIONS,
  ORG_CAPABILITIES,
  ORG_CAPABILITY_LABELS,
  SYSTEM_ROLE_CAPABILITIES,
  ROLES_CATALOG,
  systemRoleCatalogRows,
} from "./org-roles";

describe("org-roles", () => {
  it("labels every org role", () => {
    for (const role of Constants.public.Enums.org_role) {
      expect(ORG_ROLE_LABELS[role]).toBeTruthy();
    }
  });

  it("describes every org role", () => {
    for (const role of Constants.public.Enums.org_role) {
      expect(ORG_ROLE_DESCRIPTIONS[role]).toBeTruthy();
    }
  });

  it("labels every capability", () => {
    for (const cap of ORG_CAPABILITIES) {
      expect(ORG_CAPABILITY_LABELS[cap]).toBeTruthy();
    }
  });

  it("maps every org role to at least view capability", () => {
    for (const role of Constants.public.Enums.org_role) {
      const caps = SYSTEM_ROLE_CAPABILITIES[role];
      expect(caps).toBeDefined();
      expect(caps).toContain("view");
    }
  });

  it("gives account_owner all capabilities", () => {
    const ownerCaps = SYSTEM_ROLE_CAPABILITIES.account_owner;
    for (const cap of ORG_CAPABILITIES) {
      expect(ownerCaps).toContain(cap);
    }
  });

  it("builds system role catalog rows from member data", () => {
    const membersByRole: Record<string, { initials: string }[]> = {
      account_owner: [{ initials: "AC" }],
      viewer: [{ initials: "BM" }, { initials: "CK" }],
    };
    const rows = systemRoleCatalogRows(membersByRole);
    expect(rows).toHaveLength(5);
    const ownerRow = rows.find((r) => r.key === "system:account_owner");
    expect(ownerRow).toBeDefined();
    expect(ownerRow!.name).toBe("Account owner");
    expect(ownerRow!.type).toBe("system");
    expect(ownerRow!.memberCount).toBe(1);
    expect(ownerRow!.memberInitials).toEqual(["AC"]);
    expect(ownerRow!.status).toBe("active");

    const viewerRow = rows.find((r) => r.key === "system:viewer");
    expect(viewerRow!.memberCount).toBe(2);

    const legalRow = rows.find((r) => r.key === "system:legal");
    expect(legalRow!.memberCount).toBe(0);
    expect(legalRow!.memberInitials).toEqual([]);
  });

  it("does not use em dashes in user-facing copy", () => {
    const allCopy = [
      ...Object.values(ROLES_CATALOG),
      ...Object.values(ORG_ROLE_LABELS),
      ...Object.values(ORG_ROLE_DESCRIPTIONS),
      ...Object.values(ORG_CAPABILITY_LABELS),
    ].join(" ");
    expect(allCopy).not.toContain("\u2014");
  });
});
