import { KeyboardEvent, useEffect, useState } from 'react';
import type { TimerStatus } from '../hooks/useTimer';

type TimerControlsProps = {
  intervalMinutes: number;
  remainingSeconds: number;
  status: TimerStatus;
  onIntervalChange: (minutes: number) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onTestReminder: () => void;
};

const formatRemaining = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const nextSeconds = seconds % 60;
  return `${minutes}:${nextSeconds.toString().padStart(2, '0')}`;
};

const TimerControls = ({
  intervalMinutes,
  remainingSeconds,
  status,
  onIntervalChange,
  onStart,
  onPause,
  onReset,
  onTestReminder,
}: TimerControlsProps) => {
  const [draftMinutes, setDraftMinutes] = useState(String(intervalMinutes));

  useEffect(() => {
    setDraftMinutes(String(intervalMinutes));
  }, [intervalMinutes]);

  const commitDraftMinutes = () => {
    const nextMinutes = Number(draftMinutes);

    if (!Number.isFinite(nextMinutes) || nextMinutes < 1) {
      setDraftMinutes(String(intervalMinutes));
      return;
    }

    onIntervalChange(nextMinutes);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur();
    }
  };

  return (
    <div className="timer-controls">
      <label className="timer-controls__field">
        <span>Reminder minutes</span>
        <input
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          value={draftMinutes}
          onBlur={commitDraftMinutes}
          onChange={(event) => setDraftMinutes(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </label>
      <div className="timer-controls__remaining">{formatRemaining(remainingSeconds)}</div>
      <div className="timer-controls__actions">
        {status === 'running' ? (
          <button type="button" onClick={onPause}>
            Pause
          </button>
        ) : (
          <button type="button" onClick={onStart}>
            Start
          </button>
        )}
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
      <button className="timer-controls__test" type="button" onClick={onTestReminder}>
        Test 10s
      </button>
    </div>
  );
};

export default TimerControls;
