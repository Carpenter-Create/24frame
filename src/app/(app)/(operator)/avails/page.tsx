import { PageHeader } from "@/components/ui/page-header";
import { AVAILS_PAGE } from "@/lib/avails";

// TODO(design): Avails body layout is held — Adam asked Design for A vs B
// (Titles-style list without StatusProgressTrack vs 3-wide landscape poster
// grid). Quiet empty shell only until CoS sends the winner. No list fork,
// no territory / avails matrix.
export default function AvailsPage() {
  return <PageHeader title={AVAILS_PAGE.title} />;
}
