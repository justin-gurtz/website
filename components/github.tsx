import { format, parseISO } from "date-fns";
import forEach from "lodash/forEach";
import map from "lodash/map";
import times from "lodash/times";
import { useMemo } from "react";
import Link from "@/components/link";
import type { GitContributionLevel, GitHubContributions } from "@/types/models";
import { cn } from "@/utils/tailwind";

const GitHubLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 98 96"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="GitHub"
    role="img"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
    />
  </svg>
);

const Month = ({ children }: { children?: string }) => (
  <td className="size-2.5 text-xs text-neutral-700 dark:text-neutral-300">
    {children}
  </td>
);

const Day = ({
  contributionLevel,
}: {
  contributionLevel: GitContributionLevel;
}) => {
  const bg = useMemo(() => {
    switch (contributionLevel) {
      case "FOURTH_QUARTILE":
        return "bg-green-700 dark:bg-green-400";
      case "THIRD_QUARTILE":
        return "bg-green-600 dark:bg-green-600";
      case "SECOND_QUARTILE":
        return "bg-green-500 dark:bg-green-700";
      case "FIRST_QUARTILE":
        return "bg-green-300 dark:bg-green-800";
      default:
        return "bg-black/5 dark:bg-white/5";
    }
  }, [contributionLevel]);

  return (
    // eslint-disable-next-line jsx-a11y/control-has-associated-label
    <td
      className={cn(
        "text-[6px] rounded-xs size-2.5 outline outline-1 outline-[rgba(0,0,0,0.05)] dark:outline-[rgba(0,0,0,0.1)] -outline-offset-1",
        bg,
      )}
    />
  );
};

type ContributionDay = GitHubContributions[0]["contributionDays"][0];

const GitHub = ({ contributions }: { contributions: GitHubContributions }) => {
  const weeks = useMemo(() => {
    const daysByWeekday = times(7, () => [] as ContributionDay[]);

    forEach(contributions, (week) => {
      // eslint-disable-next-line lodash/prefer-map
      forEach(week.contributionDays, (day) => {
        daysByWeekday[day.weekday].push(day);
      });
    });

    return daysByWeekday;
  }, [contributions]);

  let monthCursor = parseISO(weeks[0][0].date).getMonth();

  return (
    <Link href="https://github.com/justin-gurtz" className="@container">
      <div className="bg-white dark:bg-neutral-900 rounded-xl px-4 py-3.5 border border-neutral-300 dark:border-neutral-700 h-[180px] flex flex-col justify-between">
        <div className="overflow-x-hidden flex-1 flex flex-row-reverse items-start -ml-4 -mt-0.5 @sm:mt-0.5">
          <table className="table-fixed w-full border-separate border-spacing-[3px]">
            <thead>
              <tr>
                {map(weeks[0], (day, i) => {
                  const month = parseISO(day.date).getMonth();

                  if (month !== monthCursor && weeks[0][i + 1]) {
                    monthCursor = month;

                    return (
                      <Month key={day.date}>
                        {format(parseISO(day.date), "MMM")}
                      </Month>
                    );
                  }

                  return <Month key={day.date} />;
                })}
              </tr>
            </thead>
            <tbody>
              {map(weeks, (week, i) => (
                <tr key={i}>
                  {map(week, (day) => (
                    <Day
                      key={day.date}
                      contributionLevel={day.contributionLevel}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-row-reverse @sm:flex-row items-end @sm:items-center justify-between gap-x-1.5">
          <GitHubLogo className="size-5 @sm:size-4 fill-neutral-800 dark:fill-white -translate-y-[1px]" />
          <div className="flex flex-col @sm:flex-row @sm:items-center @sm:justify-between gap-x-5 flex-1">
            <p className="text-xs font-medium">Code contributions</p>
            <div className="text-neutral-700 dark:text-neutral-300 text-xs flex gap-1 items-center">
              <p>Less</p>
              <table className="border-separate border-spacing-[3px]">
                <tbody>
                  <tr>
                    <Day contributionLevel="NONE" />
                    <Day contributionLevel="FIRST_QUARTILE" />
                    <Day contributionLevel="SECOND_QUARTILE" />
                    <Day contributionLevel="THIRD_QUARTILE" />
                    <Day contributionLevel="FOURTH_QUARTILE" />
                  </tr>
                </tbody>
              </table>
              <p>More</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GitHub;
