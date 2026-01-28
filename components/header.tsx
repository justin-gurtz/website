import LocationInfo from "@/components/location-info";
import type { CurrentLocation } from "@/types/models";

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
      className="underline underline-offset-2"
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
      <h1 className="text-2xl font-bold leading-tight">Hey! I'm Justin.</h1>
      <p className="text-pretty text-sm">
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
