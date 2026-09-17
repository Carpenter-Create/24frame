import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { STATUS_PROGRESS_SEG_ON_CLASS } from "@/lib/status-progress";

import { StatusProgressTrack } from "./status-progress-track";

function renderTitle(status: string, liveCount = 0) {
  return renderToStaticMarkup(
    createElement(StatusProgressTrack, { pipeline: "title", status, liveCount }),
  );
}

describe("StatusProgressTrack", () => {
  it("fills through the current title stage and keeps a quiet label", () => {
    const html = renderTitle("in_review");
    expect(html).toContain('data-status-progress-variant="pipeline"');
    expect(html).toContain('data-status-progress-current="2"');
    expect(html).toContain('aria-label="In review, step 3 of 5"');
    expect(html.match(/data-status-progress-seg="filled"/g) ?? []).toHaveLength(3);
    expect(html.match(/data-status-progress-seg="empty"/g) ?? []).toHaveLength(2);
    expect(html).toContain("bg-accent");
    expect(html).toContain("bg-surface-muted");
    expect(html).toContain("h-[3px]");
    expect(html).toContain("t-label");
    expect(html).toContain("In review");
    expect(html).not.toMatch(/green|emerald|rose|red|yellow/);
  });

  it("renders official off-pipeline as a muted badge with no track", () => {
    const html = renderTitle("takedown_requested");
    expect(html).toContain('data-status-progress-variant="off"');
    expect(html).toContain("Takedown requested");
    expect(html).toContain("border-hairline");
    expect(html).not.toContain("data-status-progress-track");
    expect(html).not.toContain(STATUS_PROGRESS_SEG_ON_CLASS);
  });

  it("keeps delivery Live at 3/3", () => {
    const html = renderToStaticMarkup(
      createElement(StatusProgressTrack, { pipeline: "delivery", status: "live" }),
    );
    expect(html.match(/data-status-progress-seg="filled"/g) ?? []).toHaveLength(3);
    expect(html).not.toContain('data-status-progress-seg="empty"');
    expect(html).toContain("Live");
  });
});
