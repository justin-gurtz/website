import LocationInfo from "@/components/location-info";
import { bodyBaseStyles } from "@/constants";
import type { CurrentLocation } from "@/types/models";
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
      className={cn(
        bodyBaseStyles,
        "hover:underline hover:underline-offset-2 font-medium",
      )}
    >
      {children}
    </a>
  );
};

const Header = ({
  location,
  showSeriesACopy,
}: {
  location: CurrentLocation;
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
        . I like to collect data about my life using APIs and custom software.
      </p>
      <LocationInfo location={location} />
    </div>
  );
};

export default Header;
