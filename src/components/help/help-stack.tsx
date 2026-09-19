import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/ssr";

import { PHOSPHOR_CHROME_IDLE_WEIGHT } from "@/lib/phosphor-icon";
import { HELP_ROW_CLASS, HELP_STACK, HELP_STACK_CLASS } from "@/lib/help";
import { SHEET_GROUP_CHEVRON_CLASS } from "@/lib/house-sheet";

// Coinbase-style Get Help rows. Same chevron register as the
// account sheet. Destinations live on HELP_STACK — one SoT.

export function HelpStack() {
  return (
    <nav data-help-stack="" className={HELP_STACK_CLASS}>
      {HELP_STACK.map((item) => (
        <Link
          key={item.kind}
          href={item.href}
          data-help-stack-item={item.kind}
          className={HELP_ROW_CLASS}
        >
          {item.label}
          <CaretRight className={SHEET_GROUP_CHEVRON_CLASS} weight={PHOSPHOR_CHROME_IDLE_WEIGHT} />
        </Link>
      ))}
    </nav>
  );
}
