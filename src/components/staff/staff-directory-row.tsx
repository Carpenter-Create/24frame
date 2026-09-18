import Link from "next/link";

import { cn } from "@/lib/cn";
import {
  STAFF_DIRECTORY_AVATAR_CLASS,
  STAFF_DIRECTORY_COPY_CLASS,
  STAFF_DIRECTORY_NAME_CLASS,
  STAFF_DIRECTORY_NESTED_ROW_CLASS,
  STAFF_DIRECTORY_ROW_CLASS,
  STAFF_DIRECTORY_SECONDARY_CLASS,
  STAFF_DIRECTORY_TRAILING_CLASS,
  directoryInitials,
  type StaffDirectoryRowModel,
} from "@/lib/staff-directory";

// The ONE staff directory row. Vendors, client orgs, and org people all
// render this. Do not patch a Card/table lookalike.

export function StaffDirectoryRow({
  row,
  nested = false,
  className,
}: {
  row: StaffDirectoryRowModel;
  nested?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <span data-staff-directory-avatar="" className={STAFF_DIRECTORY_AVATAR_CLASS}>
        {row.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- optional logo/face; initials remain the fallback
          <img src={row.photoUrl} alt="" className="size-full object-cover" />
        ) : (
          directoryInitials(row.name)
        )}
      </span>
      <span className={STAFF_DIRECTORY_COPY_CLASS}>
        <span className={STAFF_DIRECTORY_NAME_CLASS}>{row.name}</span>
        {row.secondary ? (
          <span className={STAFF_DIRECTORY_SECONDARY_CLASS}>{row.secondary}</span>
        ) : null}
      </span>
      {row.trailing ? (
        <span data-staff-directory-meta="" className={STAFF_DIRECTORY_TRAILING_CLASS}>
          {row.trailing}
        </span>
      ) : null}
    </>
  );

  const classes = cn(
    STAFF_DIRECTORY_ROW_CLASS,
    nested ? STAFF_DIRECTORY_NESTED_ROW_CLASS : null,
    row.href ? "transition-colors hover:bg-surface/70" : null,
    className,
  );

  if (row.href) {
    return (
      <Link
        data-staff-directory-row=""
        data-staff-directory-nested={nested ? "" : undefined}
        href={row.href}
        className={classes}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      data-staff-directory-row=""
      data-staff-directory-nested={nested ? "" : undefined}
      className={classes}
    >
      {body}
    </div>
  );
}
