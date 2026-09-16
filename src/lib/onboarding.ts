import {
  AGGREGATION_WORKSPACE,
  ASSISTANT_NAME,
  COMPANY_AGGREGATION_WORKSPACE,
  PRODUCT_NAME,
} from "@/lib/product";

// Onboarding copy + feature highlights (content lives in lib/, not JSX). GC voice:
// declarative, no banned words. "Coming soon" items are clearly badged and must never
// read as usable today (brand rule: never invent/promise capabilities). Which items are
// live vs. coming-soon is a founder call — adjust `status` here, not in the component.

export const ONBOARDING_WELCOME = {
  eyebrow: PRODUCT_NAME,
  title: `Welcome to ${PRODUCT_NAME}`,
  subtitle: `A few steps to set up your ${AGGREGATION_WORKSPACE}. Here's what you'll be able to do.`,
} as const;

export const ONBOARDING_ORGANIZATION = {
  title: `Name your ${COMPANY_AGGREGATION_WORKSPACE}`,
  subtitle: "This workspace holds your titles, rights, and deliveries.",
  nameLabel: "Workspace name",
  nameRequired: "Workspace name is required.",
  submit: "Create workspace",
  creating: "Creating…",
} as const;

export type Highlight = { title: string; body: string; status: "live" | "soon" };

export const ONBOARDING_HIGHLIGHTS: Highlight[] = [
  {
    title: "Turn in new titles",
    body: "Submit titles and upload platform-ready assets for distribution.",
    status: "live",
  },
  {
    title: "Dashboard",
    body: "See what needs your attention across your catalog.",
    status: "live",
  },
  {
    title: "Reports",
    body: "Activity across Aggregation.",
    status: "live",
  },
  {
    title: `${ASSISTANT_NAME} assistant`,
    body: "Answers about your catalog, rights, and deliveries.",
    status: "soon",
  },
  {
    title: "Company profile",
    body: `Manage your ${COMPANY_AGGREGATION_WORKSPACE}.`,
    status: "soon",
  },
];
