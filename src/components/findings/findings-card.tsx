import Link from "next/link";

import { Card, CardBody } from "@/components/ui/card";
import {
  FINDING_MESSAGE_CLASS,
  FINDING_ROW_CLASS,
  FINDING_SEVERITY_CLASS,
  FINDING_SEVERITY_LABEL,
} from "@/lib/findings";

// Shared findings render. One entity's open findings as message + severity-label rows.
// Used in-context on both title-detail pages and (via FindingRows) in the Catalog Health
// overview — so the "open findings + severity label" pattern lives in one place.
export type Finding = { id: string; message: string; severity: string };

export function FindingRows({
  findings,
  href,
}: {
  findings: Finding[];
  href?: string;
}) {
  return (
    <ul className="flex flex-col gap-1">
      {findings.map((f) => {
        const inner = (
          <>
            <span className={FINDING_MESSAGE_CLASS}>{f.message}</span>
            <span className={FINDING_SEVERITY_CLASS}>
              {FINDING_SEVERITY_LABEL[f.severity as "high" | "low"] ?? f.severity}
            </span>
          </>
        );
        return (
          <li key={f.id}>
            {href ? (
              <Link href={href} className={FINDING_ROW_CLASS}>
                {inner}
              </Link>
            ) : (
              <div className={FINDING_ROW_CLASS}>{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function FindingsCard({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) return null;
  return (
    <Card>
      <CardBody className="flex flex-col gap-1.5">
        <span className="t-label text-ink-3">Findings</span>
        <FindingRows findings={findings} />
      </CardBody>
    </Card>
  );
}
