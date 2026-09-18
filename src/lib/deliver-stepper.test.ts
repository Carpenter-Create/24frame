import { describe, expect, it } from "vitest";

import {
  DELIVER_PROGRESS_SEG_ON_CLASS,
  DELIVER_STEPPER,
  DELIVER_STEPPER_STEPS,
  deliverProgressFilled,
  deliverStepperHref,
  grantChoiceLabel,
  grantTerritoryChoices,
  grantTerritoryUsesCards,
  parseDeliverTitleIds,
} from "./deliver-stepper";

const TITLE_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
const TITLE_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1";

describe("Deliver Option B stepper", () => {
  it("locks Vendor → Rights → Territory → Done with Sporty Blue fill", () => {
    expect(DELIVER_STEPPER_STEPS.map((step) => step.key)).toEqual([
      "vendor",
      "rights",
      "territory",
      "done",
    ]);
    expect(deliverProgressFilled("vendor")).toBe(1);
    expect(deliverProgressFilled("rights")).toBe(2);
    expect(deliverProgressFilled("territory")).toBe(3);
    expect(deliverProgressFilled("done")).toBe(4);
    expect(DELIVER_PROGRESS_SEG_ON_CLASS).toContain("bg-accent");
    expect(DELIVER_PROGRESS_SEG_ON_CLASS).not.toContain("#635BFF");
    expect(DELIVER_STEPPER.download).toBe("Download metadata sheet");
    expect(DELIVER_STEPPER.successId("abc")).toBe("ID · abc");
  });

  it("parses selected title ids and builds the deliver href", () => {
    expect(parseDeliverTitleIds(`${TITLE_A},${TITLE_B},not-an-id`)).toEqual([TITLE_A, TITLE_B]);
    expect(deliverStepperHref([TITLE_A, TITLE_B])).toBe(
      `/gc/deliveries/deliver?titles=${TITLE_A},${TITLE_B}`,
    );
    expect(deliverStepperHref([])).toBe("/gc/deliveries");
  });

  it("labels grants from house rights + territory, and cards only for short include lists", () => {
    expect(
      grantChoiceLabel({
        id: "g1",
        title_id: TITLE_A,
        rights_type: "avod",
        territory_mode: "world",
        territories: [],
      }),
    ).toBe("AVOD · Worldwide");
    const include = grantTerritoryChoices({
      id: "g1",
      title_id: TITLE_A,
      rights_type: "avod",
      territory_mode: "include",
      territories: ["US", "CA"],
    });
    expect(include).toEqual([
      { key: "US", label: "United States" },
      { key: "CA", label: "Canada" },
    ]);
    expect(grantTerritoryUsesCards(include)).toBe(true);
    expect(
      grantTerritoryUsesCards(
        grantTerritoryChoices({
          id: "g2",
          title_id: TITLE_A,
          rights_type: "avod",
          territory_mode: "world",
          territories: [],
        }),
      ),
    ).toBe(false);
  });
});
