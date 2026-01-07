import Image from "next/image";
import LocationInfo from "@/components/location-info";
import type { Movement } from "@/types/models";

const Header = ({
  location,
}: {
  location: Pick<
    Movement,
    "movedAt" | "city" | "region" | "country" | "timeZoneId"
  >;
}) => {
  return (
    <div className="flex gap-4 items-center">
      <Image
        src="/images/headshot-thumbnail.png"
        alt="Headshot"
        width={50}
        height={50}
        className="rounded-lg bg-black/5 dark:bg-white/5"
        priority
      />
      <div className="flex flex-col gap-0.5">
        <h1 className="text-md font-bold leading-tight">Justin Gurtz</h1>
        <LocationInfo location={location} />
      </div>
    </div>
  );
};

export default Header;
