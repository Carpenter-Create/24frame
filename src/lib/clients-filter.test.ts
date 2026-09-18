import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { Constants } from "@/lib/supabase/database.types";

import {
  CLIENTS_PAGE,
  CLIENT_DIRECTORY_FILTERS,
  ORG_STATUS_LABELS,
  clientDirectoryFilterLabel,
  filterClientOrgs,
  parseClientDirectoryFilter,
} from "./clients-filter";

const filterSrc = readFileSync(new URL("./clients-filter.ts", import.meta.url), "utf8");
const statusFilterSrc = readFileSync(
  new URL("../app/(app)/(operator)/gc/clients/clients-status-filter.tsx", import.meta.url),
  "utf8",
);

describe("clients-filter client-safe boundary", () => {
  it("does not import agreements or server-only", () => {
    expect(filterSrc).not.toMatch(/from ["'][^"']*agreements["']/);
    expect(filterSrc).not.toMatch(/import ["']server-only["']/);
    expect(filterSrc).not.toMatch(/from ["']node:crypto["']/);
    expect(filterSrc).not.toMatch(/import ["']node:crypto["']/);
    expect(statusFilterSrc).toMatch(/from ["']@\/lib\/clients-filter["']/);
    expect(statusFilterSrc).not.toMatch(/from ["']@\/lib\/clients["']/);
    expect(statusFilterSrc).not.toMatch(/from ["']@\/lib\/agreements["']/);
    expect(statusFilterSrc).not.toMatch(/import ["']server-only["']/);
  });
});

describe("CLIENTS_PAGE copy", () => {
  it("locks the staff Clients H1 and status-filter label", () => {
    expect(CLIENTS_PAGE.title).toBe("Clients");
    expect(CLIENTS_PAGE.empty).toBe("No clients yet.");
    expect(CLIENTS_PAGE.statusFilterLabel).toBe("Filter by status");
    expect(clientDirectoryFilterLabel("all")).toBe("All");
    expect(clientDirectoryFilterLabel("active")).toBe(ORG_STATUS_LABELS.active);
    expect(clientDirectoryFilterLabel("awaiting_payment")).toBe(ORG_STATUS_LABELS.awaiting_payment);
  });
});

describe("label maps cover the schema", () => {
  it("labels every org status", () => {
    for (const status of Constants.public.Enums.org_status) {
      expect(ORG_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});

describe("client directory filter helpers", () => {
  it("parses known status keys and rejects unknown", () => {
    expect(parseClientDirectoryFilter("payment_lapsed")).toBe("payment_lapsed");
    expect(parseClientDirectoryFilter("nope")).toBe("all");
    expect(CLIENT_DIRECTORY_FILTERS[0]).toEqual({ key: "all", label: "All" });
  });

  it("filters orgs by labeled status without merging names", () => {
    const orgs = [
      { orgId: "one", status: ORG_STATUS_LABELS.active },
      { orgId: "two", status: ORG_STATUS_LABELS.registered },
    ];
    expect(filterClientOrgs(orgs, "active")).toEqual([orgs[0]]);
    expect(filterClientOrgs(orgs, "all")).toHaveLength(2);
  });
});
