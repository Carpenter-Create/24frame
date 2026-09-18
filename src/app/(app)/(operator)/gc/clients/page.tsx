import { parseClientDirectoryFilter } from "@/lib/clients";
import { searchParamString } from "@/lib/staff-directory";

import { GcClientsDirectory } from "./clients-directory";

export default async function GcClientsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const sp = await (searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>));
  return GcClientsDirectory({
    showFilters: true,
    statusFilter: parseClientDirectoryFilter(searchParamString(sp.status)),
  });
}
