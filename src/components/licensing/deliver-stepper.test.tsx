import { createElement } from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { DELIVER_STEPPER } from "@/lib/deliver-stepper";
import { DeliverStepper, DeliverSuccess } from "./deliver-stepper";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const TITLE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const VENDOR_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

describe("DeliverStepper Option B", () => {
  it("starts on vendor with Sporty Blue progress and large selectable cards", () => {
    const html = renderToStaticMarkup(
      createElement(DeliverStepper, {
        titles: [{ id: TITLE_A, title: "North Star" }],
        vendors: [{ id: VENDOR_ID, name: "Acme Distribution" }],
        grantsByTitle: {
          [TITLE_A]: [
            {
              id: "g1",
              title_id: TITLE_A,
              rights_type: "avod",
              territory_mode: "world",
              territories: [],
            },
          ],
        },
        create: async () => ({ ids: ["d1"] }),
      }),
    );
    expect(html).toContain('data-deliver-step="vendor"');
    expect(html).toContain(DELIVER_STEPPER.vendorQuestion);
    expect(html).toContain("Acme Distribution");
    expect(html).toContain("data-deliver-progress");
    expect(html).toContain('data-deliver-progress-seg="filled"');
    expect(html).toContain("bg-accent");
    expect(html).toContain(DELIVER_STEPPER.continue);
    expect(html).toContain(DELIVER_STEPPER.back);
    expect(html).not.toContain("#635BFF");
    expect(html).not.toContain("Stripe");
  });

  it("renders success with the delivery id and metadata download entry", () => {
    const html = renderToStaticMarkup(
      createElement(DeliverSuccess, {
        deliveryId: "d-created",
        vendorId: VENDOR_ID,
        titleIds: [TITLE_A],
      }),
    );
    expect(html).toContain("data-deliver-success");
    expect(html).toContain(DELIVER_STEPPER.successTitle);
    expect(html).toContain("ID · d-created");
    expect(html).toContain(DELIVER_STEPPER.download);
    expect(html).toContain("data-deliver-download");
    expect(html).toContain("bg-accent");
  });

  it("does not ship Option A wizard chrome", () => {
    const src = readFileSync("src/components/licensing/deliver-stepper.tsx", "utf8");
    expect(src).toContain("DELIVER_STEPPER_STEPS");
    expect(src).toContain("bg-accent");
    expect(src).not.toContain("wizard");
    expect(src).not.toContain("Option A");
    expect(src).not.toContain("#635BFF");
  });
});
