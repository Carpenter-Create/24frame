import { describe, expect, it } from "vitest";

import {
  ASK_ASSISTANT,
  ASSISTANT_NAME,
  PARENT_ENTITY,
  PRODUCT_NAME,
} from "./product";

describe("product chrome lock", () => {
  it("locks the user-visible product and assistant spelling", () => {
    expect(PRODUCT_NAME).toBe("24Frame");
    expect(ASSISTANT_NAME).toBe("24Frame AI");
    expect(ASK_ASSISTANT).toBe("Ask 24Frame AI");
    expect(PARENT_ENTITY).toBe("Global Content Holdings LLC");
    expect(PRODUCT_NAME).not.toBe("24frame");
    expect(PRODUCT_NAME).not.toBe("24-Frame");
    expect(PRODUCT_NAME).not.toBe("24FRAME");
    expect(ASSISTANT_NAME).not.toMatch(/24frame|24-Frame|24FRAME/);
  });
});
