import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import {
  STAFF_DIRECTORY_COUNT_CLASS,
  STAFF_DIRECTORY_EMPTY_CLASS,
  STAFF_DIRECTORY_FIELD_LABEL_CLASS,
  STAFF_DIRECTORY_FIELD_ROW_CLASS,
  STAFF_DIRECTORY_FIELD_VALUE_CLASS,
  STAFF_DIRECTORY_SECTION_TITLE_CLASS,
  STAFF_DIRECTORY_STACK_CLASS,
  STAFF_DIRECTORY_SURFACE_CLASS,
  STAFF_DIRECTORY_TOOLBAR_CLASS,
  type StaffDirectoryField,
  type StaffDirectoryRowModel,
} from "@/lib/staff-directory";
import { StaffDirectoryRow } from "@/components/staff/staff-directory-row";

export function StaffDirectoryList({
  rows,
  countLabel,
  filters,
  empty,
}: {
  rows: readonly StaffDirectoryRowModel[];
  countLabel: string;
  filters?: ReactNode;
  empty?: ReactNode;
}) {
  return (
    <div className={STAFF_DIRECTORY_STACK_CLASS}>
      <div data-staff-directory-toolbar="" className={STAFF_DIRECTORY_TOOLBAR_CLASS}>
        {filters ?? <span />}
        <span data-staff-directory-count="" className={STAFF_DIRECTORY_COUNT_CLASS}>
          {countLabel}
        </span>
      </div>
      <div data-staff-directory="" className={STAFF_DIRECTORY_SURFACE_CLASS}>
        {rows.length === 0 ? (
          empty
        ) : (
          <ul>
            {rows.map((row) => (
              <li key={row.id} className="border-b border-hairline last:border-b-0">
                <StaffDirectoryRow row={row} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function StaffDirectorySection({
  title,
  children,
  empty,
  className,
}: {
  title: string;
  children?: ReactNode;
  empty?: string;
  className?: string;
}) {
  return (
    <section
      data-staff-directory-section=""
      className={cn(STAFF_DIRECTORY_SURFACE_CLASS, className)}
    >
      <h2 className={STAFF_DIRECTORY_SECTION_TITLE_CLASS}>{title}</h2>
      {children ??
        (empty ? <p className={STAFF_DIRECTORY_EMPTY_CLASS}>{empty}</p> : null)}
    </section>
  );
}

export function StaffDirectoryFields({ fields }: { fields: readonly StaffDirectoryField[] }) {
  return (
    <dl>
      {fields.map((field) => (
        <div key={`${field.label}:${field.value}`} className={STAFF_DIRECTORY_FIELD_ROW_CLASS}>
          <dt className={STAFF_DIRECTORY_FIELD_LABEL_CLASS}>{field.label}</dt>
          <dd className={STAFF_DIRECTORY_FIELD_VALUE_CLASS}>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}
