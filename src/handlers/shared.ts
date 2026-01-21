import { InlineKeyboard } from "grammy";

export function createSettingsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("🕐 Change Time", "settings:time")
    .row()
    .text("📊 Change Difficulty", "settings:difficulty")
    .row()
    .text("🌍 Change Timezone", "settings:timezone");
}
