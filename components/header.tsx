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

const Stat = ({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) => {
  return (
    <div>
      <p className="text-[0.625rem] uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500">
        {label}
      </p>
      <p className="text-sm font-medium leading-snug">{value}</p>
    </div>
  );
};

const Header = ({
  locationName,
  totalTokens,
  vo2Max,
  showSeriesACopy,
}: {
  locationName: string;
  totalTokens: number;
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
      <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1">
        <Stat label="Current location" value={locationName} />
        {totalTokens > 0 && (
          <Stat
            label="Claude Code, past week"
            value={`${totalTokens.toLocaleString()} tokens`}
          />
        )}
        <Stat
          label={
            <>
              Garmin VO<sub className="font-black">2</sub> Max
            </>
          }
          value={vo2Max}
        />
      </div>
    </div>
  );
};

export default Header;
