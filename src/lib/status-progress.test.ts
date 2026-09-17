import { describe, expect, it } from "vitest";

import { TITLE_STATUS_LABELS, type DeliveryStatus, type TitleStatus } from "@/lib/titles";
import {
  DELIVERY_STATUS_OFF_TRACK,
  DELIVERY_STATUS_TRACK_STEPS,
  STATUS_PROGRESS_SEG_OFF_CLASS,
  STATUS_PROGRESS_SEG_ON_CLASS,
  TITLE_STATUS_OFF_TRACK,
  TITLE_STATUS_TRACK_STEPS,
  deliveryStatusProgress,
  statusProgressAriaLabel,
  statusProgressFilledCount,
  titleStatusProgress,
} from "./status-progress";

describe("titleStatusProgress", () => {
  it("maps on-track titles through current inclusive (G1–G3)", () => {
    const draft = titleStatusProgress("draft");
    expect(draft.variant).toBe("pipeline");
    expect(draft.label).toBe("Draft");
    expect(draft.currentIndex).toBe(0);
    expect(statusProgressFilledCount(draft)).toBe(1);
    expect(draft.steps).toEqual([...TITLE_STATUS_TRACK_STEPS]);
    expect(statusProgressAriaLabel(draft)).toBe("Draft, step 1 of 5");

    const submitted = titleStatusProgress("submitted");
    expect(submitted.label).toBe("Submitted");
    expect(submitted.currentIndex).toBe(1);
    expect(statusProgressFilledCount(submitted)).toBe(2);

    const inReview = titleStatusProgress("in_review");
    expect(inReview.label).toBe("In review");
    expect(inReview.currentIndex).toBe(2);
    expect(statusProgressFilledCount(inReview)).toBe(3);

    const inDelivery = titleStatusProgress("in_delivery");
    expect(inDelivery.label).toBe("In delivery");
    expect(inDelivery.label).not.toBe(TITLE_STATUS_LABELS.in_delivery);
    expect(TITLE_STATUS_LABELS.in_delivery).toBe("Submitted");
    expect(inDelivery.currentIndex).toBe(3);
    expect(statusProgressFilledCount(inDelivery)).toBe(4);

    const live = titleStatusProgress("live");
    expect(live.label).toBe("Live");
    expect(live.currentIndex).toBe(4);
    expect(statusProgressFilledCount(live)).toBe(5);
    expect(statusProgressAriaLabel(live)).toBe("Live, step 5 of 5");
  });

  it("treats derived live (≥1 delivery live) as Live 5/5", () => {
    for (const status of ["draft", "submitted", "in_review", "in_delivery"] as const) {
      const model = titleStatusProgress(status, 1);
      expect(model.variant).toBe("pipeline");
      expect(model.label).toBe("Live");
      expect(model.currentIndex).toBe(4);
      expect(statusProgressFilledCount(model)).toBe(5);
    }
    expect(titleStatusProgress("live", 2).label).toBe("Live");
  });

  it("keeps archived and takedown as muted badges even with live deliveries (G4)", () => {
    for (const status of TITLE_STATUS_OFF_TRACK) {
      const model = titleStatusProgress(status, 3);
      expect(model.variant).toBe("off");
      expect(model.currentIndex).toBe(-1);
      expect(statusProgressFilledCount(model)).toBe(0);
      expect(model.label).toBe(TITLE_STATUS_LABELS[status]);
      expect(statusProgressAriaLabel(model)).toBe(TITLE_STATUS_LABELS[status]);
    }
  });

  it("does not invent stages or reuse filter Submitted for in_delivery", () => {
    expect([...TITLE_STATUS_TRACK_STEPS]).toEqual([
      "Draft",
      "Submitted",
      "In review",
      "In delivery",
      "Live",
    ]);
    expect(titleStatusProgress("in_delivery").steps).not.toContain("Delivered");
    expect(titleStatusProgress("upcoming" as TitleStatus).variant).toBe("off");
  });
});

describe("deliveryStatusProgress", () => {
  it("maps pending / delivered / live as 1/3 · 2/3 · 3/3 (G5)", () => {
    const pending = deliveryStatusProgress("pending");
    expect(pending.variant).toBe("pipeline");
    expect(pending.label).toBe("Pending");
    expect(pending.currentIndex).toBe(0);
    expect(statusProgressFilledCount(pending)).toBe(1);
    expect(pending.steps).toEqual([...DELIVERY_STATUS_TRACK_STEPS]);

    const delivered = deliveryStatusProgress("delivered");
    expect(delivered.label).toBe("Delivered");
    expect(delivered.currentIndex).toBe(1);
    expect(statusProgressFilledCount(delivered)).toBe(2);

    const live = deliveryStatusProgress("live");
    expect(live.label).toBe("Live");
    expect(live.currentIndex).toBe(2);
    expect(statusProgressFilledCount(live)).toBe(3);
    expect(statusProgressAriaLabel(live)).toBe("Live, step 3 of 3");
  });

  it("keeps rejected and taken_down as muted badges", () => {
    for (const status of DELIVERY_STATUS_OFF_TRACK) {
      const model = deliveryStatusProgress(status);
      expect(model.variant).toBe("off");
      expect(model.currentIndex).toBe(-1);
      expect(statusProgressFilledCount(model)).toBe(0);
    }
    expect(deliveryStatusProgress("rejected").label).toBe("Rejected");
    expect(deliveryStatusProgress("taken_down").label).toBe("Taken down");
    expect(deliveryStatusProgress("unknown" as DeliveryStatus).variant).toBe("off");
  });
});

describe("status progress tokens", () => {
  it("fills with Sporty Blue and leaves empty segments on the muted surface", () => {
    expect(STATUS_PROGRESS_SEG_ON_CLASS).toContain("bg-accent");
    expect(STATUS_PROGRESS_SEG_ON_CLASS).not.toMatch(/green|emerald|rose|red|yellow/);
    expect(STATUS_PROGRESS_SEG_OFF_CLASS).toContain("bg-surface-muted");
    expect(STATUS_PROGRESS_SEG_OFF_CLASS).not.toContain("bg-accent");
  });
});
