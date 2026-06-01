import { useEffect, useRef, useCallback } from "react";

const INACTIVITY_MS = 15 * 60 * 1000; // 15 minutes

const ACTIVITY_EVENTS: string[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

export const useInactivityTimer = (
  onExpire: () => void,
  active: boolean
) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep ref up to date so the timer closure always calls the latest callback
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onExpireRef.current(), INACTIVITY_MS);
  }, []);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, reset, { passive: true })
    );
    reset(); // start the timer immediately

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, reset]);
};
