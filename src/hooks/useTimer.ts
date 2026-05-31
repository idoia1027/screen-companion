import { useCallback, useEffect, useRef, useState } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

type UseTimerOptions = {
  defaultDurationSeconds: number;
  onComplete?: () => void;
};

export const useTimer = ({ defaultDurationSeconds, onComplete }: UseTimerOptions) => {
  const [durationSeconds, setDurationSeconds] = useState(defaultDurationSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(defaultDurationSeconds);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const completedRef = useRef(false);

  useEffect(() => {
    if (status !== 'running') {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    if (remainingSeconds === 0 && status === 'running' && !completedRef.current) {
      completedRef.current = true;
      setStatus('completed');
      onComplete?.();
    }
  }, [onComplete, remainingSeconds, status]);

  const start = useCallback(() => {
    completedRef.current = false;
    setStatus('running');
  }, []);

  const pause = useCallback(() => {
    setStatus((current) => (current === 'running' ? 'paused' : current));
  }, []);

  const reset = useCallback(
    (nextDurationSeconds = durationSeconds) => {
      completedRef.current = false;
      setDurationSeconds(nextDurationSeconds);
      setRemainingSeconds(nextDurationSeconds);
      setStatus('idle');
    },
    [durationSeconds],
  );

  const setDurationMinutes = useCallback(
    (minutes: number) => {
      const nextDurationSeconds = Math.max(1, Math.round(minutes * 60));
      reset(nextDurationSeconds);
    },
    [reset],
  );

  return {
    durationSeconds,
    remainingSeconds,
    status,
    start,
    pause,
    reset,
    setDurationMinutes,
  };
};
