import { COMPANY_AGGREGATION_WORKSPACE } from "@/lib/product";

// Empty Aggregation home when the signed-in account has no company org.
// Social stays reachable. This is not a Social seat and not an org invite.

export const AGGREGATION_EMPTY = {
  title: `No ${COMPANY_AGGREGATION_WORKSPACE} yet`,
  body: "Titles, rights, and deliveries live here. Create a company workspace to use the catalog, or stay in Social.",
  create: "Create a company workspace",
  createHref: "/onboarding",
} as const;
