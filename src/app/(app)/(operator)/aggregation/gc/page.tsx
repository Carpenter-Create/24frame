import { redirect } from "next/navigation";

import { QUEUE_HREF } from "@/lib/queue";

// GC landing → the Queue. (The gc layout gate already enforces gc_staff.)
export default function GcIndex() {
  redirect(QUEUE_HREF);
}
