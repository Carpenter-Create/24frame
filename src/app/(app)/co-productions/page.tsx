import { redirect } from "next/navigation";

import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { CO_PRODUCTIONS_PAGE } from "@/lib/co-productions";
import { getOrgContext } from "@/lib/supabase/context";

export default async function CoProductionsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  return (
    <>
      <PageHeader title={CO_PRODUCTIONS_PAGE.title} />
      <EmptyState
        title={CO_PRODUCTIONS_PAGE.title}
        description={CO_PRODUCTIONS_PAGE.synopsis}
      />
    </>
  );
}
