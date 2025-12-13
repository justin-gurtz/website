"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/utils/tailwind";

const ScrollingText = ({
  children,
  className,
  parentPadding = 0,
  speed = 30, // pixels per second
  initialPauseDuration = 1.5,
  pauseDuration = 4,
  spacing = 25,
}: {
  children: React.ReactNode;
  className?: string;
  parentPadding?: number;
  speed?: number;
  initialPauseDuration?: number;
  pauseDuration?: number;
  spacing?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const firstSpanRef = useRef<HTMLSpanElement>(null);
  const secondSpanRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [animationId, setAnimationId] = useState<string | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [actualSpacing, setActualSpacing] = useState(spacing);
  const childrenRef = useRef<React.ReactNode>(children);
  const prevContentWidthRef = useRef<number>(0);
  const animationIdRef = useRef<string | null>(null);
  const parentPaddingRef = useRef(parentPadding);

  // Update refs when values change
  useEffect(() => {
    animationIdRef.current = animationId;
    parentPaddingRef.current = parentPadding;
  }, [animationId, parentPadding]);

  const checkOverflow = useCallback(() => {
    if (!containerRef.current || !measureRef.current) return;

    // Get the container width (which includes the padding we added back)
    const measuredContainerWidth = containerRef.current.offsetWidth;
    const measuredContentWidth = measureRef.current.offsetWidth;

    // Only scroll if content is wider than the visible area
    // The visible area is the container width minus the padding on both sides
    const visibleWidth = measuredContainerWidth - parentPaddingRef.current * 2;
    const needsScroll = measuredContentWidth > visibleWidth;

    setShouldScroll(needsScroll);
    setContentWidth(measuredContentWidth);

    // Measure actual spacing between spans if they exist
    if (needsScroll && firstSpanRef.current && secondSpanRef.current) {
      const firstRect = firstSpanRef.current.getBoundingClientRect();
      const secondRect = secondSpanRef.current.getBoundingClientRect();
      const measuredSpacing = secondRect.left - firstRect.right;
      setActualSpacing(measuredSpacing > 0 ? measuredSpacing : spacing);
    } else {
      setActualSpacing(spacing);
    }

    // If content width changed significantly, regenerate animation
    const contentWidthChanged =
      Math.abs(measuredContentWidth - prevContentWidthRef.current) > 1;
    prevContentWidthRef.current = measuredContentWidth;

    if (needsScroll) {
      // Generate new animation ID if we don't have one or content width changed
      if (!animationIdRef.current || contentWidthChanged) {
        const id = `scrolling-text-${Math.random().toString(36).substr(2, 9)}`;
        setAnimationId(id);
      }
    } else {
      setAnimationId(null);
    }
  }, [spacing]);

  // Check overflow on mount and setup observers
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready and styles are applied
    const rafId = requestAnimationFrame(() => {
      checkOverflow();
    });

    // Recheck on resize
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(checkOverflow);
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (measureRef.current) {
      resizeObserver.observe(measureRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [checkOverflow]);

  // Check overflow when children changes
  useEffect(() => {
    childrenRef.current = children;
    // Small delay to ensure DOM has updated
    const timeoutId = setTimeout(() => {
      requestAnimationFrame(checkOverflow);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [children, checkOverflow]);

  // Calculate scroll distance: content width + actual measured spacing
  // Start: first instance at parentPadding position
  // End: second instance at parentPadding position (seamless loop)
  // When animation loops back to 0%, second instance is now at start position
  const scrollDistance = contentWidth > 0 ? -(contentWidth + actualSpacing) : 0;

  // Calculate duration based on distance and speed
  // Distance is the absolute value of scrollDistance (since it's negative)
  const scrollDistancePixels = Math.abs(scrollDistance);
  const scrollDuration =
    scrollDistancePixels > 0 && speed > 0 ? scrollDistancePixels / speed : 0;

  const totalDuration = scrollDuration + pauseDuration;
  // Calculate pause percentage (pause happens at the end, before looping)
  const pausePercentage =
    scrollDuration > 0 && totalDuration > 0
      ? (scrollDuration / totalDuration) * 100
      : 0;

  // Inject styles into document head
  useEffect(() => {
    if (!shouldScroll || !animationId || contentWidth <= 0) return;

    const styleId = `scrolling-text-style-${animationId}`;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Calculate the exact end position to ensure seamless looping
    // Start: first span at parentPadding
    // End: second span at parentPadding (so loop is seamless)
    const currentParentPadding = parentPaddingRef.current;
    const startPosition = currentParentPadding;
    const endPosition = currentParentPadding + scrollDistance; // scrollDistance is negative

    styleElement.textContent = `
      @keyframes scrolling-text-${animationId} {
        0% {
          transform: translateX(${startPosition}px);
        }
        ${pausePercentage}% {
          transform: translateX(${endPosition}px);
        }
        100% {
          transform: translateX(${endPosition}px);
        }
      }
      .scrolling-text-${animationId} {
        animation: scrolling-text-${animationId} ${totalDuration}s linear infinite;
        animation-delay: ${initialPauseDuration}s;
      }
    `;

    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        element.remove();
      }
    };
  }, [
    shouldScroll,
    animationId,
    contentWidth,
    pausePercentage,
    scrollDistance,
    totalDuration,
    initialPauseDuration,
  ]);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden w-full relative"
      style={{
        // Extend the container into the parent's padding area
        marginLeft: `-${parentPadding}px`,
        marginRight: `-${parentPadding}px`,
        width: `calc(100% + ${parentPadding * 2}px)`,
        lineHeight: 1,
        // Gradient mask for edge fade when parentPadding is set
        // Container extends by parentPadding on each side (total width = 100% + 2*parentPadding)
        // - 0 to parentPadding: left fade zone (transparent → opaque)
        // - parentPadding to (100% - parentPadding): visible content area (fully opaque)
        // - (100% - parentPadding) to 100%: right fade zone (opaque → transparent)
        // The visible content area (middle section) is always fully opaque
        ...(parentPadding > 0 && {
          maskImage: `linear-gradient(to right, transparent 0, transparent ${parentPadding / 2}px, black ${parentPadding}px, black calc(100% - ${parentPadding}px), transparent calc(100% - ${parentPadding / 2}px), transparent 100%)`,
          WebkitMaskImage: `linear-gradient(to right, transparent 0, transparent ${parentPadding / 2}px, black ${parentPadding}px, black calc(100% - ${parentPadding}px), transparent calc(100% - ${parentPadding / 2}px), transparent 100%)`,
        }),
      }}
    >
      {/* Hidden element to measure content width */}
      <span
        ref={measureRef}
        className={cn(
          "absolute opacity-0 pointer-events-none whitespace-nowrap invisible",
          className,
        )}
        aria-hidden="true"
      >
        {children}
      </span>
      <div
        ref={contentRef}
        className={cn(
          "inline-block whitespace-nowrap",
          className,
          shouldScroll && animationId && `scrolling-text-${animationId}`,
        )}
        style={{
          // When scrolling, animation starts at parentPadding position
          // Set initial transform to match animation start to prevent jump
          // When not scrolling, add padding to align with parent padding
          paddingLeft: shouldScroll ? undefined : `${parentPadding}px`,
          transform: shouldScroll
            ? `translateX(${parentPadding}px)`
            : undefined,
          lineHeight: 1,
          verticalAlign: "top",
        }}
      >
        {shouldScroll ? (
          <>
            <span ref={firstSpanRef}>{children}</span>
            <span ref={secondSpanRef} style={{ marginLeft: `${spacing}px` }}>
              {children}
            </span>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ScrollingText;
