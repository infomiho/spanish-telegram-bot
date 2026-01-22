import { InlineKeyboard } from "grammy";

export function createSettingsKeyboard(isSubscribed: boolean = true): InlineKeyboard {
  const keyboard = new InlineKeyboard()
    .text("🕐 Change Time", "settings:time")
    .row()
    .text("📊 Change Difficulty", "settings:difficulty")
    .row()
    .text("🌍 Change Timezone", "settings:timezone")
    .row();

  if (isSubscribed) {
    keyboard.text("🔕 Pause Daily Messages", "settings:unsubscribe");
  } else {
    keyboard.text("🔔 Resume Daily Messages", "settings:subscribe");
  }

  return keyboard;
}
