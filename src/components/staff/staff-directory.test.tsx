import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StaffDirectoryList } from "./staff-directory-list";
import { StaffDirectoryRow } from "./staff-directory-row";
import {
  STAFF_DIRECTORY_AVATAR_CLASS,
  STAFF_DIRECTORY_NAME_CLASS,
  STAFF_DIRECTORY_SURFACE_CLASS,
} from "@/lib/staff-directory";

describe("StaffDirectoryRow", () => {
  it("renders the Circle avatar-led row and links when given an href", () => {
    const html = renderToStaticMarkup(
      <StaffDirectoryRow
        row={{
          id: "1",
          name: "Acme Distribution",
          secondary: "Portal upload",
          trailing: "2 titles",
          href: "/channels/1",
        }}
      />,
    );
    expect(html).toContain("data-staff-directory-row");
    expect(html).toContain("data-staff-directory-avatar");
    expect(html).toContain("AD");
    expect(html).toContain("Acme Distribution");
    expect(html).toContain("Portal upload");
    expect(html).toContain("2 titles");
    expect(html).toContain('href="/channels/1"');
    expect(html).toContain(STAFF_DIRECTORY_AVATAR_CLASS);
    expect(html).toContain(STAFF_DIRECTORY_NAME_CLASS);
    expect(html).toContain("rounded-full");
  });

  it("stays a static row for associated people with no profile href", () => {
    const html = renderToStaticMarkup(
      <StaffDirectoryRow
        row={{
          id: "u1",
          name: "jane@acmefilms.com",
          secondary: "Account owner · Aug 14, 2026",
        }}
      />,
    );
    expect(html).toContain("jane@acmefilms.com");
    expect(html).toContain("Account owner · Aug 14, 2026");
    expect(html).toContain("JA");
    expect(html).not.toContain("<a");
  });
});

describe("StaffDirectoryList", () => {
  it("puts chips + count above one grey holding surface", () => {
    const html = renderToStaticMarkup(
      <StaffDirectoryList
        rows={[
          { id: "1", name: "Acme Films", secondary: "2 people · Pro", trailing: "Active" },
        ]}
        countLabel="1 client"
        filters={<span>All</span>}
      />,
    );
    expect(html).toContain("data-staff-directory-toolbar");
    expect(html).toContain("data-staff-directory-count");
    expect(html).toContain("1 client");
    expect(html).toContain(STAFF_DIRECTORY_SURFACE_CLASS);
    expect(html).toContain("Acme Films");
  });

  it("nests seat rows under an org without a table", () => {
    const html = renderToStaticMarkup(
      <StaffDirectoryList
        rows={[
          {
            id: "1",
            name: "Acme Films",
            secondary: "1 person · Pro",
            trailing: "Active",
            nested: [
              {
                id: "u1",
                name: "jane@acmefilms.com",
                secondary: "Account owner · Aug 14, 2026",
              },
            ],
          },
        ]}
        countLabel="1 client"
      />,
    );
    expect(html).toContain("jane@acmefilms.com");
    expect(html).toContain("Account owner · Aug 14, 2026");
    expect(html).toContain("data-staff-directory-nested");
    expect(html).not.toContain("<table");
  });
});

describe("house law — one directory primitive", () => {
  it("stays the Clients directory primitive — Channels uses its own card/detail", () => {
    const channels = readFileSync("src/app/(app)/(operator)/aggregation/channels/page.tsx", "utf8");
    const channelProfile = readFileSync("src/app/(app)/(operator)/aggregation/channels/[id]/page.tsx", "utf8");
    const clients = readFileSync(
      "src/app/(app)/(operator)/aggregation/gc/clients/clients-directory.tsx",
      "utf8",
    );
    const clientProfile = readFileSync(
      "src/app/(app)/(operator)/aggregation/gc/clients/[orgId]/page.tsx",
      "utf8",
    );

    expect(channels).toContain("ChannelCardGrid");
    expect(channels).not.toContain("StaffDirectoryList");
    expect(channelProfile).toContain("ChannelDetail");
    expect(channelProfile).not.toContain("StaffDirectoryRow");
    expect(clients).toContain("StaffDirectoryList");
    expect(clientProfile).toContain("StaffDirectoryRow");
    expect(clients).not.toContain("nested:");
    expect(clients).not.toContain("Card");
    expect(clients).not.toContain("<table");
    expect(clientProfile).not.toContain("Card");
    expect(clientProfile).not.toContain("<table");
  });
});
