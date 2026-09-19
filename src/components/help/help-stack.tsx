import { SettingsDrillRow } from "@/components/settings/settings-drill";
import { HELP_STACK, HELP_STACK_CLASS } from "@/lib/help";

// Get Help rows — same SettingsDrillRow grammar as Settings.
// Short list. Not a second Settings hub. Destinations live on
// HELP_STACK — one SoT.

export function HelpStack() {
  return (
    <nav data-help-stack="" className={HELP_STACK_CLASS}>
      {HELP_STACK.map((item) => (
        <SettingsDrillRow
          key={item.kind}
          kind={item.kind}
          label={item.label}
          href={item.href}
          itemAttr="data-help-stack-item"
        />
      ))}
    </nav>
  );
}
