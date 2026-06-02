import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_REMINDER_SETTINGS,
  IDLE_BREAK_RANGE,
  REMINDER_TRIGGER_RANGE,
  type ReminderSettings,
} from '../shared/reminderSettings';

type ReminderSettingsControlsProps = {
  settings: ReminderSettings;
  onSave: (settings: ReminderSettings) => Promise<void> | void;
  onRestoreDefaults: () => void;
  onTestReminder?: () => void;
};

const quickFillMessages = ['喝口水', '眼睛休息一下', '起来走走'];

const isValidNumber = (value: string, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && Number.isInteger(parsed) && parsed >= min && parsed <= max;
};

const ReminderSettingsControls = ({
  settings,
  onSave,
  onRestoreDefaults,
  onTestReminder,
}: ReminderSettingsControlsProps) => {
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [triggerMinutes, setTriggerMinutes] = useState(String(settings.reminderTriggerMinutes));
  const [idleMinutes, setIdleMinutes] = useState(String(settings.idleBreakThresholdMinutes));
  const [message, setMessage] = useState(settings.reminderMessage);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setReminderEnabled(settings.reminderEnabled);
    setTriggerMinutes(String(settings.reminderTriggerMinutes));
    setIdleMinutes(String(settings.idleBreakThresholdMinutes));
    setMessage(settings.reminderMessage);
    setError(null);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const markDirty = () => {
    setSaveState('idle');
  };

  const showSaved = () => {
    setSaveState('saved');

    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }

    savedTimeoutRef.current = setTimeout(() => {
      setSaveState('idle');
      savedTimeoutRef.current = null;
    }, 1800);
  };

  const saveDraft = async () => {
    if (!isValidNumber(triggerMinutes, REMINDER_TRIGGER_RANGE.min, REMINDER_TRIGGER_RANGE.max)) {
      setError(`Reminder interval must be ${REMINDER_TRIGGER_RANGE.min}-${REMINDER_TRIGGER_RANGE.max} minutes.`);
      return;
    }

    if (!isValidNumber(idleMinutes, IDLE_BREAK_RANGE.min, IDLE_BREAK_RANGE.max)) {
      setError(`Break detection must be ${IDLE_BREAK_RANGE.min}-${IDLE_BREAK_RANGE.max} minutes.`);
      return;
    }

    if (message.trim().length === 0) {
      setError('Reminder message cannot be empty.');
      return;
    }

    setError(null);
    setSaveState('saving');

    try {
      await onSave({
        reminderEnabled,
        reminderTriggerMinutes: Number(triggerMinutes),
        idleBreakThresholdMinutes: Number(idleMinutes),
        reminderMessage: message.trim(),
      });
      showSaved();
    } catch {
      setSaveState('idle');
      setError('Could not save settings. Please try again.');
    }
  };

  const handleNumberKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      void saveDraft();
    }
  };

  const restoreDefaults = () => {
    setReminderEnabled(DEFAULT_REMINDER_SETTINGS.reminderEnabled);
    setTriggerMinutes(String(DEFAULT_REMINDER_SETTINGS.reminderTriggerMinutes));
    setIdleMinutes(String(DEFAULT_REMINDER_SETTINGS.idleBreakThresholdMinutes));
    setMessage(DEFAULT_REMINDER_SETTINGS.reminderMessage);
    setError(null);
    setSaveState('idle');
    onRestoreDefaults();
  };

  return (
    <section className="reminder-settings" aria-label="Continuous screen reminder settings">
      <label className="reminder-settings__toggle">
        <span>Continuous screen reminder</span>
        <input
          type="checkbox"
          checked={reminderEnabled}
          onChange={(event) => {
            setReminderEnabled(event.target.checked);
            markDirty();
          }}
        />
      </label>

      <label className="settings-panel__field">
        <span>Reminder interval</span>
        <span className="reminder-settings__inline">
          Remind after
          <input
            type="number"
            min={REMINDER_TRIGGER_RANGE.min}
            max={REMINDER_TRIGGER_RANGE.max}
            step="1"
            inputMode="numeric"
            value={triggerMinutes}
            onChange={(event) => {
              setTriggerMinutes(event.target.value);
              markDirty();
            }}
            onKeyDown={handleNumberKeyDown}
          />
          minutes
        </span>
      </label>

      <label className="settings-panel__field">
        <span>Break detection</span>
        <span className="reminder-settings__inline">
          Treat
          <input
            type="number"
            min={IDLE_BREAK_RANGE.min}
            max={IDLE_BREAK_RANGE.max}
            step="1"
            inputMode="numeric"
            value={idleMinutes}
            onChange={(event) => {
              setIdleMinutes(event.target.value);
              markDirty();
            }}
            onKeyDown={handleNumberKeyDown}
          />
          idle minutes as a break
        </span>
      </label>

      <label className="settings-panel__field">
        <span>Reminder message</span>
        <textarea
          value={message}
          rows={3}
          onChange={(event) => {
            setMessage(event.target.value);
            markDirty();
          }}
        />
      </label>

      <div className="reminder-settings__quick-fill" aria-label="Quick fill reminder message">
        <span>Quick fill</span>
        <div>
          {quickFillMessages.map((quickMessage) => (
            <button
              key={quickMessage}
              type="button"
              onClick={() => {
                setMessage(quickMessage);
                markDirty();
              }}
            >
              {quickMessage}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="reminder-settings__error">{error}</p> : null}

      <div className="reminder-settings__actions">
        <button type="button" onClick={() => void saveDraft()} disabled={saveState === 'saving'}>
          {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save'}
        </button>
        <button type="button" onClick={restoreDefaults}>
          Restore defaults
        </button>
      </div>

      {saveState === 'saved' ? <p className="reminder-settings__saved">Saved locally.</p> : null}

      {onTestReminder ? (
        <button className="reminder-settings__test" type="button" onClick={onTestReminder}>
          Test reminder
        </button>
      ) : null}
    </section>
  );
};

export default ReminderSettingsControls;
