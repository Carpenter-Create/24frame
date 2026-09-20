import {
  SettingsDrillRow,
  SettingsGroupList,
  SettingsGroupRow,
} from "@/components/settings/settings-drill";
import { HELP_STACK } from "@/lib/help";

// Get Help rows — house Settings inset-group SoT (SettingsGroupList +
// SettingsDrillRow). Same register as Notifications Preferences and
// Settings drill lists. Label · chevron. Not a second Settings hub
// and not bare text on the page canvas. Destinations live on
// HELP_STACK — one SoT.

export function HelpStack() {
  return (
    <nav data-help-stack="">
      <SettingsGroupList>
        {HELP_STACK.map((item) => (
          <SettingsGroupRow key={item.kind}>
            <SettingsDrillRow
              kind={item.kind}
              label={item.label}
              href={item.href}
              itemAttr="data-help-stack-item"
            />
          </SettingsGroupRow>
        ))}
      </SettingsGroupList>
    </nav>
  );
}
