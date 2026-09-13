import { subDays, subYears } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { backOff } from "exponential-backoff";
import compact from "lodash/compact";
import includes from "lodash/includes";
import join from "lodash/join";
import map from "lodash/map";
import reduce from "lodash/reduce";
import Duolingo from "@/components/duolingo";
import Footer from "@/components/footer";
import GitHub from "@/components/github";
import Header from "@/components/header";
import Instagram from "@/components/instagram";
import NYTimes from "@/components/nytimes";
import Refresh from "@/components/refresh";
import Spotify from "@/components/spotify";
import Strava from "@/components/strava";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import type {
  DuolingoCourse,
  DuolingoStreak,
  GitHubContribution,
  InstagramImageMeta,
  Movement,
  StravaActivity,
  StravaRun,
} from "@/types/models";
import { createClient, type SupabaseClient } from "@/utils/supabase";

// Hourly safety net only — crons purge the page on-demand via
// revalidatePath("/") whenever their data actually changes
export const revalidate = 3600;

const getCurrentLocationName = (
  movement: Pick<Movement, "city" | "region" | "country">,
) => {
  const { city, region, country } = movement;

  if (city || region || country) {
    let array: Array<string | null | undefined> = [];

    if (city) {
      const prefersRegion = includes(["US", "CA", "AU"], country);
      const suffix = prefersRegion ? region || country : country || region;

      array = [city, suffix];
    } else if (region) {
      array = [region, country];
    } else {
      array = [country];
    }

    const compacted = compact(array);

    if (compacted.length) {
      return join(compacted, ", ");
    }
  }

  return null;
};

const getLocation = async (supabase: SupabaseClient) => {
  let lastMovedAtChecked = new Date().toISOString();

  // The first, if not second or third movement should have the right data
  const getCurrentLocation = async () => {
    const { data, error } = await supabase
      .from("movements")
      .select("movedAt,city,region,country,timeZoneId")
      .lt("movedAt", lastMovedAtChecked)
      .order("movedAt", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    if (!data.timeZoneId) {
      lastMovedAtChecked = data.movedAt;
      return getCurrentLocation();
    }

    const currentLocationName = getCurrentLocationName(data);

    if (!currentLocationName) {
      lastMovedAtChecked = data.movedAt;
      return getCurrentLocation();
    }

    return {
      name: currentLocationName,
      timeZoneId: data.timeZoneId,
      movedAt: data.movedAt,
    };
  };

  return getCurrentLocation();
};

const getAiUsage = async (supabase: SupabaseClient) => {
  const oneWeekAgo = subDays(new Date(), 7);

  const { data, error } = await supabase
    .from("aiUsage")
    .select("inputTokens,outputTokens,cacheReadTokens,cacheCreationTokens")
    .gte("period", oneWeekAgo.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  // All four usage fields. Cache columns are NULL on rows that predate cache
  // tracking, which just means those hours contribute input + output only
  return reduce(
    data,
    (acc, row) =>
      acc +
      row.inputTokens +
      row.outputTokens +
      (row.cacheReadTokens ?? 0) +
      (row.cacheCreationTokens ?? 0),
    0,
  );
};

const getKeystrokes = async (supabase: SupabaseClient, timeZoneId: string) => {
  // "Today" in the timezone I'm currently in; periods are hourly UTC buckets
  const today = formatInTimeZone(new Date(), timeZoneId, "yyyy-MM-dd");
  const startOfToday = fromZonedTime(`${today}T00:00:00`, timeZoneId);

  const { data, error } = await supabase
    .from("keystrokes")
    .select("count")
    .gte("period", startOfToday.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  return reduce(data, (acc, row) => acc + row.count, 0);
};

const getSpotify = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("spotify")
    .select("updatedAt,image,name,by,color")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getGitHub = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("github")
    .select("contributions")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.contributions as GitHubContribution[];
};

const getDuolingo = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("duolingo")
    .select("streak,courses")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as {
    streak: DuolingoStreak;
    courses: DuolingoCourse[];
  };
};

const getStrava = async (supabase: SupabaseClient): Promise<StravaRun[]> => {
  const oneYearAgo = subYears(new Date(), 1);

  const { data, error } = await supabase
    .from("strava")
    .select("payload")
    .filter("type", "eq", "Run")
    .filter("startDate", "gte", oneYearAgo.toISOString())
    .order("startDate", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const activities = map(data, ({ payload }) => payload) as StravaActivity[];

  // Only public runs, trimmed to the fields the map renders — the full payload
  // includes start/end GPS coordinates and must not reach the browser
  return activities
    .filter((activity) => activity.visibility === "everyone")
    .map(({ id, distance, moving_time, map: runMap }) => ({
      id,
      distance,
      moving_time,
      map: { summary_polyline: runMap.summary_polyline },
    }));
};

const getGarmin = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("garmin")
    .select("vo2MaxValue")
    .order("startTimeLocal", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.vo2MaxValue;
};

const getNYTimes = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("nytimes")
    .select("title,url")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getInstagram = async (supabase: SupabaseClient) => {
  const { data: follows, error: followsError } = await supabase
    .from("instagramFollows")
    .select("followerCount")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (followsError) {
    throw new Error(followsError.message);
  }

  const twoYearsAgo = subYears(new Date(), 2);

  type PostRow = {
    id: string;
    images: string[];
    imageMeta: unknown;
    caption: string | null;
    postedAt: string | null;
  };

  // Resolve storage paths to public URLs and attach the classified focal
  // point. When filtered, drop images flagged at ingest as screenshots or
  // shirtless; unclassified images pass through with a centered focus.
  const toDisplayPost = (post: PostRow, { filtered = true } = {}) => {
    const meta = (post.imageMeta ?? {}) as InstagramImageMeta;

    const images = post.images
      .filter((path) => {
        if (!filtered) return true;
        const m = meta[path];
        return !(m?.isScreenshot || m?.isRevealing || m?.unclassifiable);
      })
      .map((path) => ({
        url: supabase.storage.from("instagram").getPublicUrl(path).data
          .publicUrl,
        focus: meta[path]?.focus ?? { x: 50, y: 50 },
      }));

    return {
      id: post.id,
      caption: post.caption,
      postedAt: post.postedAt,
      images,
    };
  };

  const { data: recentPosts, error: recentError } = await supabase
    .from("instagram")
    .select("id,images,imageMeta,caption,postedAt")
    .not("images", "eq", "{}")
    .gte("postedAt", twoYearsAgo.toISOString())
    .order("postedAt", { ascending: false, nullsFirst: false });

  if (recentError) {
    throw new Error(recentError.message);
  }

  let posts = recentPosts
    .map((post) => toDisplayPost(post))
    .filter((post) => post.images.length > 0);

  if (!posts.length) {
    // No limit: scan the whole (small) table so an older clean post is
    // preferred over showing a flagged image unfiltered
    const { data: fallbackPosts, error: fallbackError } = await supabase
      .from("instagram")
      .select("id,images,imageMeta,caption,postedAt")
      .not("images", "eq", "{}")
      .order("postedAt", { ascending: false, nullsFirst: false });

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    posts = fallbackPosts
      .map((post) => toDisplayPost(post))
      .filter((post) => post.images.length > 0)
      .slice(0, 1);

    // Never render an empty card: if filtering removed everything, show the
    // latest post unfiltered
    if (!posts.length && fallbackPosts.length) {
      posts = [toDisplayPost(fallbackPosts[0], { filtered: false })];
    }
  }

  return { ...follows, posts };
};

const Page = async () => {
  const showSeriesACopy = Date.now() < Date.UTC(2026, 9, 1); // October 1, 2026 UTC

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const locationPromise = backOff(() => getLocation(supabase));

  const [
    location,
    totalTokens,
    todayKeystrokes,
    spotify,
    strava,
    github,
    duolingo,
    vo2Max,
    nytimes,
    instagram,
  ] = await Promise.all([
    locationPromise,
    backOff(() => getAiUsage(supabase)),
    locationPromise.then(({ timeZoneId }) =>
      backOff(() => getKeystrokes(supabase, timeZoneId)),
    ),
    backOff(() => getSpotify(supabase)),
    backOff(() => getStrava(supabase)),
    backOff(() => getGitHub(supabase)),
    backOff(() => getDuolingo(supabase)),
    backOff(() => getGarmin(supabase)),
    backOff(() => getNYTimes(supabase)),
    backOff(() => getInstagram(supabase)),
  ]);

  return (
    <>
      <div className="min-h-svh flex items-center [@media(min-height:56.25rem)]:items-end justify-center p-5 sm:p-10 xl:p-14">
        <div className="shrink-0 flex flex-col gap-3 w-full max-w-md lg:max-w-237 xl:max-w-none">
          <div className="flex flex-col lg:flex-row gap-20 lg:gap-3 items-start justify-between">
            <div className="flex-1">
              <div className="w-full [@media(min-height:56.25rem)]:absolute [@media(min-height:56.25rem)]:left-14 [@media(min-height:56.25rem)]:top-14">
                <Header
                  locationName={location.name}
                  locationMovedAt={location.movedAt}
                  totalTokens={totalTokens}
                  todayKeystrokes={todayKeystrokes}
                  vo2Max={vo2Max}
                  showSeriesACopy={showSeriesACopy}
                />
              </div>
            </div>
            <div className="self-end w-full lg:w-auto flex flex-col lg:flex-row gap-3 items-end justify-end">
              <Spotify data={spotify} />
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row-reverse">
            <div className="w-full lg:max-w-93">
              <div className="relative pb-[152%]">
                <Strava runs={strava} />
              </div>
            </div>
            <div className="w-full flex flex-col gap-3">
              <div className="flex flex-col gap-3 xl:max-w-141 xl:w-full xl:ml-auto">
                <div className="flex gap-3 flex-col lg:flex-row">
                  <Instagram data={instagram} />
                  <div className="flex-1">
                    <Duolingo data={duolingo} location={location} />
                  </div>
                </div>
                <GitHub contributions={github} />
              </div>
              <div className="flex-1 flex flex-col lg:flex-row-reverse justify-between lg:items-end gap-20 lg:gap-3">
                <NYTimes data={nytimes} />
                <Footer />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Refresh every={60} />
    </>
  );
};

export default Page;
