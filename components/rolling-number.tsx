"use client";

import {
  AnimatePresence,
  animate,
  type MotionValue,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/utils/tailwind";

// Three copies of 0–9: the middle copy is "home", the outer copies let a
// digit roll through 0 (or 9) on a wrap before silently snapping back home
const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);
const HOME = 10;
const pct = (idx: number) => `${-(idx * 100) / STRIP.length}%`;

const ease = [0.16, 1, 0.3, 1] as const;

// One wheel. Its position is a motion value so neither the count-up nor a
// roll-on-change re-renders anything: the count-up writes the wheel
// position straight from the counter, and changes animate the same value.
const Digit = ({
  digit,
  trend,
  counter,
  exp,
  lowestExp,
  driven,
}: {
  digit: number;
  trend: 1 | -1;
  counter: MotionValue<number>;
  // Power of ten this wheel represents in the counted (formatted) unit
  exp: number;
  lowestExp: number;
  driven: boolean;
}) => {
  const reduced = useReducedMotion();
  const y = useMotionValue(pct(HOME + digit));
  const prev = useRef(digit);

  useMotionValueEvent(counter, "change", (v) => {
    if (!driven) return;
    const scaled = v / 10 ** exp;
    // The lowest wheel spins continuously; higher wheels step when the
    // one below wraps, like a mechanical odometer
    const pos = exp === lowestExp ? scaled % 10 : Math.floor(scaled) % 10;
    y.set(pct(HOME + pos));
  });

  useEffect(() => {
    if (driven) {
      prev.current = digit;
      return;
    }

    const from = prev.current;
    prev.current = digit;

    let next = HOME + digit;
    if (trend > 0 && digit < from) next = HOME + 10 + digit; // up through 0
    if (trend < 0 && digit > from) next = digit; // down through 9

    const instant = reduced || digit === from;
    const controls = animate(y, pct(next), {
      duration: instant ? 0 : 0.7,
      ease,
      // Landed on an outer copy — jump to the same digit in the home copy
      onComplete: () => y.set(pct(HOME + digit)),
    });
    return () => controls.stop();
  }, [digit, trend, driven, reduced, y]);

  // One pre-formatted text run rather than a stack of blocks: text selection
  // serialises a line break for every block box it crosses, even ones whose
  // text is unselectable
  return (
    <motion.span
      className="inline-block whitespace-pre align-top"
      style={{ y }}
    >
      {STRIP.join("\n")}
    </motion.span>
  );
};

// Slots are keyed by position from the right so the ones digit is the
// anchor and a new leading digit appears on the left
const toSlots = (formatted: string, fractionDigits: number) => {
  const chars = [...formatted];
  const digitCount = chars.filter((c) => /\d/.test(c)).length;
  let digitsSeen = 0;
  return chars.map((char, i) => {
    const pos = chars.length - 1 - i;
    const digit = /\d/.test(char) ? Number(char) : null;
    const exp =
      digit === null ? null : digitCount - 1 - digitsSeen++ - fractionDigits;
    return { key: `${pos}-${digit === null ? "l" : "d"}`, digit, char, exp };
  });
};

// Split a formatted number into the part that counts (as a plain number in
// the formatted unit, e.g. 3.7 for "3.7M") and the literals around it
const parseFormatted = (parts: Intl.NumberFormatPart[]) => {
  const numeric = new Set(["integer", "group", "decimal", "fraction"]);
  const first = parts.findIndex((p) => numeric.has(p.type));
  const last = parts.findLastIndex((p) => numeric.has(p.type));
  const prefix = parts
    .slice(0, first)
    .map((p) => p.value)
    .join("");
  const suffix = parts
    .slice(last + 1)
    .map((p) => p.value)
    .join("");
  const fraction = parts.find((p) => p.type === "fraction")?.value ?? "";
  const mantissa = Number(
    parts
      .slice(first, last + 1)
      .filter((p) => p.type !== "group")
      .map((p) => (p.type === "decimal" ? "." : p.value))
      .join(""),
  );
  return { prefix, suffix, mantissa, fractionDigits: fraction.length };
};

const group = (int: string) => int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const RollingNumber = ({
  value,
  formatOptions,
  intro = false,
  className,
}: {
  value: number;
  formatOptions?: Intl.NumberFormatOptions;
  intro?: boolean;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  const format = useMemo(
    () => new Intl.NumberFormat("en-US", formatOptions),
    [formatOptions],
  );

  const [shown, setShown] = useState(value);
  useEffect(() => setShown(value), [value]);

  const last = useRef(shown);
  const trend: 1 | -1 = shown >= last.current ? 1 : -1;
  useEffect(() => {
    last.current = shown;
  });

  const formatted = format.format(shown);
  const target = useMemo(
    () => parseFormatted(format.formatToParts(shown)),
    [format, shown],
  );

  // Intro: count up from 0 in the formatted unit ("0.0M" → "3.7M"). Only
  // structural changes (a new digit, a separator) re-render; wheel
  // positions are written straight from the counter.
  const [countingUp, setCountingUp] = useState(intro);
  const counter = useMotionValue(0);
  const countUpString = (v: number) => {
    const fixed = v.toFixed(target.fractionDigits);
    const [int, frac] = fixed.split(".");
    return `${target.prefix}${group(int)}${frac ? `.${frac}` : ""}${target.suffix}`;
  };
  const [structure, setStructure] = useState(() => countUpString(0));
  useMotionValueEvent(counter, "change", (v) => {
    if (!countingUp) return;
    const next = countUpString(v);
    if (next.length !== structure.length) setStructure(next);
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once on mount
  useEffect(() => {
    if (!intro) return;
    if (reduced) {
      setCountingUp(false);
      return;
    }
    const controls = animate(counter, target.mantissa, {
      delay: 0.3,
      duration: 1.2,
      ease,
      onComplete: () => setCountingUp(false),
    });
    return () => controls.stop();
  }, []);

  const slots = toSlots(
    countingUp ? structure : formatted,
    target.fractionDigits,
  );

  return (
    <span className={cn("inline-block tabular-nums", className)}>
      {/* The wheels are decorative and unselectable; this invisible copy
          overflowing across them is what gets read, selected (its highlight
          isn't faded by the mask) and copied. It's painted beneath the wheels
          so the highlight sits behind the digits, and the wheels ignore the
          pointer so clicks still land on the real text */}
      <span className="inline-block w-0 whitespace-nowrap text-transparent">
        {formatted}
      </span>
      <span className="select-none pointer-events-none">
        <AnimatePresence initial={false}>
          {slots.map((slot) => (
            // Width animates so neighbouring text slides rather than jumps
            // when a digit is added or removed
            <motion.span
              key={slot.key}
              aria-hidden
              // Fades digits at the top and bottom edges as they roll through
              className="inline-block h-lh overflow-clip [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
            >
              {slot.digit === null || slot.exp === null ? (
                slot.char
              ) : (
                <Digit
                  digit={slot.digit}
                  trend={trend}
                  counter={counter}
                  exp={slot.exp}
                  lowestExp={-target.fractionDigits}
                  driven={countingUp}
                />
              )}
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </span>
  );
};

export default RollingNumber;
