import { IconLungsFilled } from "@tabler/icons-react";
import KeyboardIcon from "@/components/icons/keyboard";
import LocationIcon from "@/components/icons/location";
import SparklesIcon from "@/components/icons/sparkles";
import RollingNumber from "@/components/rolling-number";
import Timestamp from "@/components/timestamp";
import { bodyBaseStyles } from "@/constants";
import { cn } from "@/utils/tailwind";

const Link = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(bodyBaseStyles, "underline underline-offset-2 font-medium")}
    >
      {children}
    </a>
  );
};

const iconClassName = "size-4 shrink-0 text-neutral-800 dark:text-white";

const Stat = ({
  icon,
  value,
  children,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
      <span className="contents" aria-hidden>
        {icon}
      </span>
      <p>
        <span className="font-medium text-neutral-800 dark:text-white">
          {value}
        </span>
        {children && <> {children}</>}
      </p>
    </div>
  );
};

const compactFormatOptions: Intl.NumberFormatOptions = {
  notation: "compact",
  maximumFractionDigits: 1,
};

const Header = ({
  locationName,
  locationMovedAt,
  totalTokens,
  todayKeystrokes,
  vo2Max,
  showSeriesACopy,
}: {
  locationName: string;
  locationMovedAt: string;
  totalTokens: number;
  todayKeystrokes: number;
  vo2Max: number;
  showSeriesACopy: boolean;
}) => {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold leading-tight">Hey, I'm Justin.</h1>
      <p className="text-pretty text-sm text-neutral-500 dark:text-neutral-400">
        I'm an engineer at <Link href="https://boldvoice.com/">BoldVoice</Link>{" "}
        where{" "}
        {showSeriesACopy ? (
          <>
            we recently announced our{" "}
            <Link href="https://www.inc.com/maria-jose-gutierrez-chavez/this-startup-is-putting-an-accent-coach-in-your-pocket/91292248">
              $21 million Series&nbsp;A
            </Link>
          </>
        ) : (
          <>I work on React Native, iOS, and web apps</>
        )}
        . <br className="hidden lg:block" />I like to collect data about my life
        using APIs and custom software.
      </p>
      {/* Fills down the first column, then the second. Columns hug their
          content (`auto` + w-fit) so the second column starts right after the
          first instead of at half the header width, but can still shrink and
          wrap rather than overflow on narrow screens */}
      <div className="grid grid-cols-1 sm:grid-flow-col sm:grid-rows-2 sm:grid-cols-[repeat(2,auto)] sm:w-fit gap-x-8 gap-y-2 pt-1">
        <Stat
          icon={<KeyboardIcon className={iconClassName} />}
          value={
            <>
              <RollingNumber value={todayKeystrokes} intro />{" "}
              {todayKeystrokes === 1 ? "key" : "keys"}
            </>
          }
        >
          typed today
        </Stat>
        {totalTokens > 0 && (
          <Stat
            icon={<SparklesIcon className={iconClassName} />}
            value={
              <>
                <RollingNumber
                  value={totalTokens}
                  formatOptions={compactFormatOptions}
                  intro
                />{" "}
                {totalTokens === 1 ? "token" : "tokens"}
              </>
            }
          >
            used on AI this week
          </Stat>
        )}
        <Stat
          icon={<LocationIcon className={iconClassName} />}
          value={locationName}
        >
          – <Timestamp ago as="span" date={locationMovedAt} />
        </Stat>
        <Stat
          icon={<IconLungsFilled className={iconClassName} />}
          value={
            <>
              <RollingNumber value={vo2Max} intro /> VO
              <sub className="font-semibold">2</sub> max
            </>
          }
        />
      </div>
    </div>
  );
};

export default Header;
