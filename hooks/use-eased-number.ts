import { useCallback, useEffect, useRef, useState } from "react";

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t) * (1 - t);

const useEasedNumber = (
  target: number,
  {
    initialValue = 0,
    duration = 1000,
  }: { initialValue?: number; duration?: number } = {},
) => {
  const [value, setValue] = useState(initialValue);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const startValueRef = useRef(initialValue);
  const latestValueRef = useRef(initialValue);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const animate = useCallback(() => {
    const elapsed = Math.min((Date.now() - startTimeRef.current) / duration, 1);

    if (elapsed >= 1) {
      setValue(target);
      return;
    }

    const eased = easeOutQuad(elapsed);
    const newValue =
      startValueRef.current + (target - startValueRef.current) * eased;

    setValue(newValue);
    rafRef.current = requestAnimationFrame(animate);
  }, [target, duration]);

  useEffect(() => {
    startValueRef.current = latestValueRef.current;
    startTimeRef.current = Date.now();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

  return value;
};

export default useEasedNumber;
