import { describe, expect, it } from "vitest";

import {
  AGGREGATION_WORKSPACE,
  ASK_ASSISTANT,
  ASSISTANT_NAME,
  COMPANY_AGGREGATION_WORKSPACE,
  PARENT_ENTITY,
  PRODUCT_NAME,
} from "./product";

describe("product chrome lock", () => {
  it("locks the user-visible product and assistant spelling", () => {
    expect(PRODUCT_NAME).toBe("24Frame");
    expect(ASSISTANT_NAME).toBe("24Frame AI");
    expect(ASK_ASSISTANT).toBe("Ask 24Frame AI");
    expect(PARENT_ENTITY).toBe("Global Content Holdings LLC");
    expect(AGGREGATION_WORKSPACE).toBe("aggregation workspace");
    expect(COMPANY_AGGREGATION_WORKSPACE).toBe("company aggregation workspace");
    expect(PRODUCT_NAME).not.toBe("24frame");
    expect(PRODUCT_NAME).not.toBe("24-Frame");
    expect(PRODUCT_NAME).not.toBe("24FRAME");
    expect(ASSISTANT_NAME).not.toMatch(/24frame|24-Frame|24FRAME/);
  });
});
