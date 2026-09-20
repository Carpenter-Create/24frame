import { cn } from "@/lib/cn";
import {
  FIELD_LIST_CLASS,
  FIELD_LIST_LABEL_CLASS,
  FIELD_LIST_ROW_CLASS,
  FIELD_LIST_VALUE_CLASS,
} from "@/lib/field-list";

// Canonical label/value ledger (Metadata register). Frameless: sits inside a
// Card (which supplies the surface/border), directly after the CardHeader, so
// its hairline row dividers run full-width. Phone stacks label above value.
// Desktop keeps the right-aligned ledger.
export function FieldList({
  items,
  className,
}: {
  items: { label: string; value: React.ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={cn(FIELD_LIST_CLASS, className)} data-field-list="">
      {items.map((it, i) => (
        <div key={i} className={FIELD_LIST_ROW_CLASS} data-field-list-row="">
          <dt className={FIELD_LIST_LABEL_CLASS}>{it.label}</dt>
          <dd className={FIELD_LIST_VALUE_CLASS}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
