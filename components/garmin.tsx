"use client";

import { format, parseISO } from "date-fns";
import { upperFirst } from "lodash";
import { Roboto } from "next/font/google";
import { useMemo } from "react";
import useEasedNumber from "@/hooks/use-eased-number";
import type { GarminData } from "@/types/models";
import { cn } from "@/utils/tailwind";
import Link from "./link";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

type Gender = "male" | "female";
type AgeGroup = "20-29" | "30-39" | "40-49" | "50-59" | "60-69" | "70-79";
type Vo2MaxCategory = "poor" | "fair" | "good" | "excellent" | "superior";

const garminVo2Categories: Record<
  Gender,
  Record<AgeGroup, Record<number, number>>
> = {
  male: {
    "20-29": {
      5: 55.4,
      4: 49.0,
      3: 43.0,
      2: 38.0,
      1: 0,
    },
    "30-39": {
      5: 54.0,
      4: 46.0,
      3: 41.0,
      2: 36.0,
      1: 0,
    },
    "40-49": {
      5: 52.5,
      4: 44.0,
      3: 38.0,
      2: 34.0,
      1: 0,
    },
    "50-59": {
      5: 48.9,
      4: 41.0,
      3: 35.0,
      2: 31.0,
      1: 0,
    },
    "60-69": {
      5: 45.7,
      4: 38.0,
      3: 32.0,
      2: 28.0,
      1: 0,
    },
    "70-79": {
      5: 42.1,
      4: 35.0,
      3: 29.0,
      2: 25.0,
      1: 0,
    },
  },
  female: {
    "20-29": {
      5: 49.6,
      4: 44.0,
      3: 39.0,
      2: 35.0,
      1: 0,
    },
    "30-39": {
      5: 47.4,
      4: 42.0,
      3: 37.0,
      2: 33.0,
      1: 0,
    },
    "40-49": {
      5: 45.3,
      4: 39.0,
      3: 35.0,
      2: 31.0,
      1: 0,
    },
    "50-59": {
      5: 41.1,
      4: 36.0,
      3: 32.0,
      2: 28.0,
      1: 0,
    },
    "60-69": {
      5: 37.7,
      4: 33.0,
      3: 29.0,
      2: 26.0,
      1: 0,
    },
    "70-79": {
      5: 35.0,
      4: 30.0,
      3: 26.0,
      2: 22.0,
      1: 0,
    },
  },
};

const getAgeGroup = (age: number): AgeGroup | null => {
  if (age >= 80) return null;
  if (age >= 70) return "70-79";
  if (age >= 60) return "60-69";
  if (age >= 50) return "50-59";
  if (age >= 40) return "40-49";
  if (age >= 30) return "30-39";
  if (age >= 20) return "20-29";
  return null;
};

const getCategoryIndex = (
  vo2max: number,
  threshold: Record<number, number>,
): number => {
  if (vo2max >= threshold[5]) return 5;
  if (vo2max >= threshold[4]) return 4;
  if (vo2max >= threshold[3]) return 3;
  if (vo2max >= threshold[2]) return 2;
  return 1;
};

const getThresholdName = (index: number): Vo2MaxCategory => {
  if (index === 5) return "superior";
  if (index === 4) return "excellent";
  if (index === 3) return "good";
  if (index === 2) return "fair";
  return "poor";
};

const getVo2MaxCategory = (
  vo2max: number,
  age: number,
  gender: keyof typeof garminVo2Categories,
) => {
  const ageGroup = getAgeGroup(age);
  if (!ageGroup) return null;

  const threshold = garminVo2Categories[gender][ageGroup];

  const index = getCategoryIndex(vo2max, threshold);
  const name = getThresholdName(index);

  const min = threshold[index];
  const max = threshold[index + 1] || 100;

  return { name, min, max, index };
};

const GarminLogo = ({ height }: { height: number }) => {
  return (
    <svg
      viewBox="0 0 783 166"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Garmin"
      role="img"
      height={height}
    >
      <path
        d="M284.492 59.6593C284.748 56.7762 287.343 54.6341 290.247 54.8751C308.01 56.3506 325.812 57.4083 343.634 58.0489C346.548 58.1558 351.317 58.4136 354.236 58.6173C354.238 58.6198 361.443 59.1401 366.77 60.3595C372.105 61.5952 376.674 63.4713 380.521 65.9864C382.136 67.0387 383.6 68.2227 384.909 69.5362C386.717 71.35 388.231 73.4112 389.446 75.713C391.542 79.6915 392.634 84.5855 392.673 90.423C392.732 99.0811 390.173 105.809 384.909 110.536C384.752 110.677 384.593 110.817 384.431 110.954C378.87 115.683 367.16 118.841 367.096 118.847C364.143 119.629 363.117 122.227 364.855 124.62C364.901 124.716 376.589 140.75 384.909 151.526C388.928 156.767 392.078 160.792 392.434 161.256C393.547 162.666 393.068 165.399 389.87 165.413C388.217 165.42 386.564 165.423 384.909 165.423C380.53 165.423 376.156 165.4 371.787 165.355C368.588 165.321 366.196 164.085 363.724 160.972C354.88 149.25 346.282 137.435 337.941 125.533C336.243 123.095 332.346 121.003 329.274 120.86C329.192 120.918 303.99 119.523 303.987 119.49C303.985 119.519 303.963 119.538 303.942 119.537C303.911 119.702 301.335 157.881 301.335 157.881C301.143 160.768 298.414 162.432 295.226 162.202C290.621 161.871 286.016 161.515 281.421 161.133C278.229 160.868 275.789 158.804 276.043 155.922C278.86 123.835 281.676 91.7467 284.492 59.6593ZM539.912 48.2296C542.807 47.8324 545.501 49.8342 545.91 52.6993C550.421 84.42 554.932 116.141 559.443 147.861C559.983 151.642 557.6 153.435 554.428 153.87C550.137 154.46 545.855 155.026 541.559 155.57C538.379 155.973 535.711 154.453 535.374 151.688C535.134 149.715 527.099 83.5844 526.817 82.2403C526.669 83.6726 494.203 156.083 493.604 156.065C492.294 158.73 488.6 159.034 486.904 156.613C486.283 156.677 442.417 90.6471 442.027 89.256C441.986 90.6488 445.202 158.026 445.266 159.35C445.402 162.142 443.188 164.074 439.99 164.215C436.231 164.38 432.489 164.527 428.733 164.658C425.023 164.787 422.864 162.87 422.779 159.987L419.858 63.5177C419.772 60.6247 422.089 58.1925 425.011 58.09C430.534 57.8971 436.06 57.6637 441.578 57.3907C445.286 57.2073 448.06 59.1721 449.511 61.6739C460.757 79.5885 472.508 97.3377 484.726 114.902C486.408 117.301 488.866 117.101 490.136 114.449C499.548 94.9853 508.445 75.4114 516.796 55.7521C517.956 53.09 520.136 50.7769 524.157 50.2823C529.414 49.6354 534.665 48.9506 539.912 48.2296ZM196.462 47.922C198.145 45.5597 201.863 44.0114 204.738 44.4718C206.694 44.7857 208.656 45.0954 210.61 45.3986C213.494 45.8471 216.593 48.4412 217.51 51.1935C216.565 51.4807 255.667 152.661 257.609 154.669C258.532 156.811 256.932 158.858 253.745 158.522C248.011 157.916 242.29 157.27 236.565 156.584C232.016 156.038 229.933 153.678 228.862 150.993C227.8 148.31 225.612 143.352 225.15 142.168C224.442 140.348 222.5 139.549 219.372 139.114C201.271 136.646 183.224 133.77 165.252 130.489C162.154 129.925 159.789 130.364 158.816 131.634C158.099 132.562 154.382 137.111 152.676 139.199C150.985 141.29 148.501 142.784 143.89 141.872C139.993 141.101 136.097 140.31 132.21 139.501C129.078 138.849 127.937 136.721 129.873 134.495C153.34 106.244 175.545 77.3581 196.462 47.922ZM599.153 38.463C602.012 37.9133 604.32 39.8645 604.88 42.7042C611.097 74.3092 617.315 105.915 623.532 137.52C624.092 140.358 621.886 142.67 618.741 143.274C614.123 144.159 609.511 145.016 604.884 145.849C601.73 146.416 598.846 145.061 598.389 142.443C592.831 110.696 587.272 78.9479 581.714 47.2003C581.084 43.5828 583.132 41.4169 586.001 40.9103C590.393 40.12 594.77 39.3057 599.153 38.463ZM744.282 0.279414C747.05 -0.64992 750.068 0.814403 751.005 3.55285C761.353 33.8757 771.701 64.1987 782.049 94.5216C782.985 97.2597 781.279 100.341 778.243 101.36C775.183 102.389 772.114 103.406 769.047 104.409C764.392 105.931 761.251 105.176 758.481 103.91C729.107 89.7902 700.762 74.6175 673.519 58.4904C670.986 56.9836 669.503 58.0362 670.208 60.8429C670.248 60.9994 685.715 122.704 686.042 124.009C686.692 126.586 684.903 128.662 681.806 129.427C677.634 130.457 673.46 131.465 669.279 132.451C666.164 133.186 663.712 131.821 663.27 129.903C655.845 97.8053 648.421 65.7067 640.996 33.6085C640.551 31.6797 641.693 29.4194 645.289 28.5704C649.099 27.6701 652.905 26.7494 656.707 25.8087C660.583 24.8495 663.877 25.7682 666.365 27.2755C691.915 42.8237 718.48 57.5098 745.996 71.2472C748.673 72.5789 750.146 71.4142 749.263 68.6583C742.973 49.0381 736.683 29.4176 730.394 9.79699C729.549 7.15223 731.212 4.61623 733.988 3.71301C733.985 3.70396 733.983 3.69471 733.98 3.68566C737.418 2.56747 740.853 1.43142 744.282 0.279414ZM3.31357 48.9718C5.19021 43.3139 22.9977 -1.53617 82.7101 15.6769C110.902 23.4951 127.141 37.459 127.365 37.6866C130.212 40.6991 130.042 43.6048 128.036 45.9943C127.995 46.0516 123.196 51.7963 123.173 51.8224C120.659 54.6643 117.102 55.0224 114.321 52.673C114.134 52.4814 99.0727 37.9526 72.129 32.7159C38.897 26.068 28.6949 51.7545 27.0001 57.1671C25.0293 63.4567 20.1637 85.5487 46.5831 100.011C64.8353 109.963 91.0511 109.614 96.8487 108.85C97.0867 107.874 100.823 92.6786 100.848 92.5792C101.431 90.1782 99.8268 87.7111 97.2608 87.0743C88.401 84.8769 79.5606 82.5754 70.753 80.173C67.3393 79.2415 65.8265 76.0074 66.7179 72.8126C67.0502 71.6175 67.3826 70.4218 67.7149 69.2267C68.6029 66.0401 71.5343 64.0591 74.8976 64.9767C89.9229 69.0752 105.031 72.8726 120.208 76.3663C123.595 77.1464 125.775 80.398 125.053 83.6261C122.429 95.3124 119.806 106.999 117.183 118.686C116.15 123.297 112.724 125.111 110.074 125.785C109.367 125.951 91.0432 132.044 53.2462 121.657C41.7555 118.886 -14.0232 98.3969 3.31357 48.9718ZM203.473 76.9445C202.657 74.1563 200.638 73.8251 198.97 76.2081C190.603 88.1553 182.021 100.015 173.246 111.784C171.496 114.121 172.557 116.504 175.63 117.043C187.866 119.198 200.123 121.161 212.419 122.936C215.498 123.377 217.276 121.454 216.373 118.674C211.861 104.784 207.553 90.8718 203.473 76.9445ZM312.441 73.9288C309.478 73.7442 306.902 75.9377 306.706 78.8253C306.269 85.3373 305.832 91.8494 305.395 98.3614C305.199 101.249 307.521 103.775 310.566 103.965C319.153 104.501 327.753 104.944 336.359 105.294C339.399 105.42 344.374 105.5 347.415 105.465C347.415 105.465 351.259 105.438 354.693 104.775C358.127 104.123 360.852 103.124 362.846 101.782C364.851 100.47 366.288 98.8972 367.169 97.0792C368.029 95.2609 368.488 93.268 368.518 91.1027C368.548 88.9273 368.155 86.9331 367.348 85.09C366.53 83.2564 365.163 81.6413 363.243 80.2472C361.335 78.863 358.713 77.7658 355.397 76.9337C352.08 76.103 348.344 75.838 348.344 75.838C345.385 75.6292 340.545 75.3473 337.582 75.2247C329.193 74.8839 320.811 74.4513 312.441 73.9288Z"
        fill="#FFFFFF"
      />
    </svg>
  );
};

const colorBars: { name: Vo2MaxCategory; color: string }[] = [
  { name: "poor", color: "#ff004e" },
  { name: "fair", color: "#ff9800" },
  { name: "good", color: "#03ff3f" },
  { name: "excellent", color: "#00fefd" },
  { name: "superior", color: "#ac00ff" },
];

const size = 100;
const center = size / 2;
const outerRadius = 47;
const normalWidth = 2.75;
const activeWidth = 5;
const gap = 2.5;
const totalArc = 235;
const segmentArc = (totalArc - gap * 4) / 5;

const getArcPath = (startAngle: number, endAngle: number, r: number) => {
  const x1 = center + r * Math.sin(toRad(startAngle));
  const y1 = center - r * Math.cos(toRad(startAngle));
  const x2 = center + r * Math.sin(toRad(endAngle));
  const y2 = center - r * Math.cos(toRad(endAngle));

  const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  const sweepFlag = endAngle > startAngle ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`;
};

const toRad = (deg: number) => deg * (Math.PI / 180);

const Notch = ({ percentage }: { percentage: number }) => {
  // Calculate notch position
  const startAngle = -(totalArc / 2);
  const notchAngle = startAngle + percentage * totalArc;

  // Notch dimensions
  const notchWidth = 3;
  const notchLength = 9;
  const notchOuterRadius = outerRadius + 1;

  // Calculate notch rectangle points (pointing toward center)
  const notchInnerRadius = notchOuterRadius - notchLength;
  const halfWidthAngleOuter =
    Math.atan(notchWidth / 2 / notchOuterRadius) * (180 / Math.PI);
  const halfWidthAngleInner =
    Math.atan(notchWidth / 2 / notchInnerRadius) * (180 / Math.PI);

  const notchPoints = [
    // Outer left
    {
      x:
        center +
        notchOuterRadius * Math.sin(toRad(notchAngle - halfWidthAngleOuter)),
      y:
        center -
        notchOuterRadius * Math.cos(toRad(notchAngle - halfWidthAngleOuter)),
    },
    // Outer right
    {
      x:
        center +
        notchOuterRadius * Math.sin(toRad(notchAngle + halfWidthAngleOuter)),
      y:
        center -
        notchOuterRadius * Math.cos(toRad(notchAngle + halfWidthAngleOuter)),
    },
    // Inner right
    {
      x:
        center +
        notchInnerRadius * Math.sin(toRad(notchAngle + halfWidthAngleInner)),
      y:
        center -
        notchInnerRadius * Math.cos(toRad(notchAngle + halfWidthAngleInner)),
    },
    // Inner left
    {
      x:
        center +
        notchInnerRadius * Math.sin(toRad(notchAngle - halfWidthAngleInner)),
      y:
        center -
        notchInnerRadius * Math.cos(toRad(notchAngle - halfWidthAngleInner)),
    },
  ];

  const notchPath = `M ${notchPoints[0].x} ${notchPoints[0].y} L ${notchPoints[1].x} ${notchPoints[1].y} L ${notchPoints[2].x} ${notchPoints[2].y} L ${notchPoints[3].x} ${notchPoints[3].y} Z`;

  return (
    <path
      d={notchPath}
      fill="white"
      className="stroke-gray-900"
      strokeWidth={1.5}
    />
  );
};

const ColorBar = ({
  bar,
  index,
  percentage,
}: {
  bar: { name: Vo2MaxCategory; color: string };
  index: number;
  percentage?: number;
}) => {
  const segStartAngle = -(totalArc / 2) + index * (segmentArc + gap);
  const segEndAngle = segStartAngle + segmentArc;
  const isActive =
    percentage !== undefined &&
    percentage >= index * 0.2 &&
    percentage < (index + 1) * 0.2;
  const targetWidth = isActive ? activeWidth : normalWidth;
  const strokeWidth = useEasedNumber(targetWidth, {
    duration: 300,
    initialValue: targetWidth,
  });
  // Offset radius inward so outer edge aligns at outerRadius
  // As strokeWidth animates, pathRadius adjusts to keep outer edge fixed
  const pathRadius = outerRadius - strokeWidth / 2;

  return (
    <path
      d={getArcPath(segStartAngle, segEndAngle, pathRadius)}
      fill="none"
      stroke={bar.color}
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
    />
  );
};

const ColorBars = ({ percentage }: { percentage?: number }) => {
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="size-full"
      aria-label="VO2 Max. Category"
      role="img"
    >
      {colorBars.map((bar, i) => (
        <ColorBar key={bar.name} bar={bar} index={i} percentage={percentage} />
      ))}
      {percentage !== undefined && <Notch percentage={percentage} />}
    </svg>
  );
};

const Content = ({
  vO2MaxValue,
  startTimeLocal,
  percentage,
  category,
}: {
  vO2MaxValue: number;
  startTimeLocal: string;
  percentage: number | null;
  category?: Vo2MaxCategory;
}) => {
  const date = useMemo(() => {
    return format(parseISO(startTimeLocal), "MMM d");
  }, [startTimeLocal]);

  return (
    <Link
      href="https://connect.garmin.com/modern/profile/466ed577-f620-4703-b584-4a0370fd1b03"
      className="bg-black size-[11.25rem]"
      contentBrightness="dark"
    >
      <div className="absolute inset-2 m-1.5 rounded-full bg-gray-900 border border-gray-800">
        {percentage !== null ? (
          <ColorBars percentage={percentage} />
        ) : (
          <ColorBars />
        )}
        <div className="absolute bottom-1.25 right-0 left-0 mx-auto flex justify-center">
          <GarminLogo height={9} />
        </div>
      </div>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center text-white text-center",
          roboto.className,
        )}
      >
        <div className="absolute left-0 right-0 top-0 h-1/2 flex flex-col items-center justify-end pb-5">
          <p className="font-bold text-xs">VO2 Max.</p>
        </div>
        <p className="text-4xl font-bold">{Math.floor(vO2MaxValue)}</p>
        <div className="absolute left-0 right-0 bottom-0 h-1/2 flex flex-col items-center justify-start pt-5">
          {category ? (
            <>
              <p className="font-bold text-xs">{upperFirst(category)}</p>
              <p className="font-bold text-[0.625rem]">{date}</p>
            </>
          ) : (
            <p className="font-bold text-xs">{date}</p>
          )}
        </div>
      </div>
    </Link>
  );
};

const AnimatedContent = ({
  data,
  percentage: finalPercentage,
}: {
  data: Pick<GarminData, "vo2MaxValue" | "startTimeLocal">;
  percentage: number;
}) => {
  const percentage = useEasedNumber(finalPercentage, { duration: 3000 });

  const category = useMemo(() => {
    const index = Math.floor(percentage / 0.2) + 1;
    return getThresholdName(index);
  }, [percentage]);

  const vO2MaxValue = useMemo(() => {
    if (finalPercentage === 0) return 0;
    return data.vo2MaxValue * (percentage / finalPercentage);
  }, [data.vo2MaxValue, percentage, finalPercentage]);

  return (
    <Content
      startTimeLocal={data.startTimeLocal}
      vO2MaxValue={vO2MaxValue}
      category={category}
      percentage={percentage}
    />
  );
};

const Garmin = ({
  data: d,
  age,
}: {
  data: Pick<GarminData, "vo2MaxValue" | "startTimeLocal">;
  age: number;
}) => {
  const data = useMemo(() => {
    // The float is rounded by the Garmin API, let's add a little more to
    // account for that, to visually match the chart on my watch
    const vo2MaxValue = d.vo2MaxValue + 0.5;
    return { ...d, vo2MaxValue };
  }, [d]);

  const percentage = useMemo(() => {
    const finalCategory = getVo2MaxCategory(data.vo2MaxValue, age, "male");
    if (!finalCategory) return null;

    const { index, min, max } = finalCategory;

    const completed = data.vo2MaxValue - min;
    const total = max - min;

    let preliminary = completed / total;

    if (index === 5) {
      preliminary = 1 - (1 - preliminary) ** 20;
    } else if (index === 1) {
      preliminary = preliminary ** 20;
    }

    const current = preliminary * 0.2;
    const previous = (index - 1) * 0.2;

    return previous + current;
  }, [data.vo2MaxValue, age]);

  return percentage === null ? (
    <Content
      vO2MaxValue={data.vo2MaxValue}
      startTimeLocal={data.startTimeLocal}
      percentage={percentage}
    />
  ) : (
    <AnimatedContent data={data} percentage={percentage} />
  );
};

export default Garmin;
