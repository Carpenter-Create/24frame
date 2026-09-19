import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CHANNEL_GRID_CLASS, CHANNEL_PLATE_CLASS } from "@/lib/channel-card";
import { ChannelCard } from "./channel-card";
import { ChannelCardGrid } from "./channel-card-grid";

describe("ChannelCard house IA", () => {
  it("renders plate, real tags, name, and meta as one link", () => {
    const html = renderToStaticMarkup(
      <ChannelCard
        channel={{
          id: "1",
          name: "Acme Distribution",
          href: "/channels/1",
          tags: [
            { label: "Email", tone: "neutral" },
            { label: "Active", tone: "active" },
          ],
          meta: "2 licensed titles",
        }}
      />,
    );
    expect(html).toContain('data-channel-card="1"');
    expect(html).toContain("data-channel-card-plate");
    expect(html).toContain("data-channel-card-tags");
    expect(html).toContain("AD");
    expect(html).toContain("Acme Distribution");
    expect(html).toContain("Email");
    expect(html).toContain("Active");
    expect(html).toContain("2 licensed titles");
    expect(html).toContain('href="/channels/1"');
    expect(html).toContain(CHANNEL_PLATE_CLASS);
    expect(html).toContain("aspect-[3/2]");
    expect(html).toContain("bg-surface-muted");
    expect(html).not.toContain("#635BFF");
    expect(html).not.toContain("ACTION ADVENTURE");
  });

  it("lays out a 1 / 2 / 3 / 4 column house grid", () => {
    const html = renderToStaticMarkup(
      <ChannelCardGrid>
        <span>card</span>
      </ChannelCardGrid>,
    );
    expect(html).toContain("data-channels-grid");
    expect(html).toContain(CHANNEL_GRID_CLASS);
    expect(html).toContain("grid-cols-1");
    expect(html).toContain("md:grid-cols-2");
    expect(html).toContain("lg:grid-cols-3");
    expect(html).toContain("xl:grid-cols-4");
    expect(html).toContain("gap-[var(--space-6)]");
  });

  it("keeps /vendors as a permanent redirect to /aggregation/channels", () => {
    const src = readFileSync("src/lib/workspace-redirects.ts", "utf8");
    expect(src).toContain('hop("/vendors", CHANNELS)');
    expect(src).toContain('hop("/vendors/:path*", `${CHANNELS}/:path*`)');
  });
});
