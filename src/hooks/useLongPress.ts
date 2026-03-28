import { useRef, useCallback } from 'react';

export function useLongPress(callback: () => void, ms = 2000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    timerRef.current = setTimeout(callback, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
  };
}
