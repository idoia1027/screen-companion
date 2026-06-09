export type ReminderSettings = {
  reminderEnabled: boolean;
  reminderTriggerMinutes: number;
  idleBreakThresholdMinutes: number;
  reminderMessage: string;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  reminderEnabled: true,
  reminderTriggerMinutes: 50,
  idleBreakThresholdMinutes: 3,
  reminderMessage: '休息一下，站起来走两步。',
};

export const REMINDER_TRIGGER_RANGE = {
  min: 1,
  max: 240,
};

export const IDLE_BREAK_RANGE = {
  min: 1,
  max: 30,
};

const clampRoundedNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const numberValue = typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(numberValue)));
};

export const sanitizeReminderSettings = (settings: Partial<ReminderSettings> | null | undefined): ReminderSettings => {
  return {
    reminderEnabled:
      typeof settings?.reminderEnabled === 'boolean'
        ? settings.reminderEnabled
        : DEFAULT_REMINDER_SETTINGS.reminderEnabled,
    reminderTriggerMinutes: clampRoundedNumber(
      settings?.reminderTriggerMinutes,
      REMINDER_TRIGGER_RANGE.min,
      REMINDER_TRIGGER_RANGE.max,
      DEFAULT_REMINDER_SETTINGS.reminderTriggerMinutes,
    ),
    idleBreakThresholdMinutes: clampRoundedNumber(
      settings?.idleBreakThresholdMinutes,
      IDLE_BREAK_RANGE.min,
      IDLE_BREAK_RANGE.max,
      DEFAULT_REMINDER_SETTINGS.idleBreakThresholdMinutes,
    ),
    reminderMessage:
      typeof settings?.reminderMessage === 'string' && settings.reminderMessage.trim().length > 0
        ? settings.reminderMessage.trim()
        : DEFAULT_REMINDER_SETTINGS.reminderMessage,
  };
};
