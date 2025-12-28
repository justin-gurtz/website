import { differenceInYears, subYears } from "date-fns";
import map from "lodash/map";
import Duolingo from "@/components/duolingo";
import Footer from "@/components/footer";
import Garmin from "@/components/garmin";
import GitHub from "@/components/github";
import Header from "@/components/header";
import Instagram from "@/components/instagram";
import NYTimes from "@/components/nytimes";
import Refresh from "@/components/refresh";
import Spotify from "@/components/spotify";
import Strava from "@/components/strava";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { BIRTH_DATE, SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import type {
  DuolingoLearning,
  GitHubContributions,
  StravaActivity,
} from "@/types/models";
import { createClient, type SupabaseClient } from "@/utils/supabase";

export const revalidate = 60;

const age = differenceInYears(new Date(), new Date(BIRTH_DATE));

const getLocation = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("movements")
    .select("movedAt,city,region,country,timeZoneId")
    .order("movedAt", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getSpotify = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("spotify")
    .select("createdAt,image,name,by")
    .order("createdAt", { ascending: false })
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

  return data.contributions as GitHubContributions;
};

const getDuolingo = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("duolingo")
    .select("createdAt,streak,courses")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DuolingoLearning;
};

const getStrava = async (supabase: SupabaseClient) => {
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

  return map(data, ({ payload }) => payload) as StravaActivity[];
};

const getGarmin = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("garmin")
    .select("vo2MaxValue,startTimeLocal")
    .order("startTimeLocal", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
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
    .from("instagram_follows")
    .select("followerCount")
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (followsError) {
    throw new Error(followsError.message);
  }

  const oneYearAgo = subYears(new Date(), 1);

  const { data: pastYearPosts, error: pastYearError } = await supabase
    .from("instagram")
    .select("id,images,caption,postedAt")
    .not("images", "eq", "{}")
    .gte("postedAt", oneYearAgo.toISOString())
    .order("postedAt", { ascending: false, nullsFirst: false });

  if (pastYearError) {
    throw new Error(pastYearError.message);
  }

  if (pastYearPosts.length) {
    return { ...follows, posts: pastYearPosts };
  }

  const { data: fallbackPosts, error: fallbackError } = await supabase
    .from("instagram")
    .select("id,images,caption,postedAt")
    .not("images", "eq", "{}")
    .order("postedAt", { ascending: false, nullsFirst: false })
    .limit(1);

  if (fallbackError) {
    throw new Error(fallbackError.message);
  }

  return { ...follows, posts: fallbackPosts };
};

const Page = async () => {
  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const [
    location,
    spotify,
    strava,
    github,
    duolingo,
    garmin,
    nytimes,
    instagram,
  ] = await Promise.all([
    getLocation(supabase),
    getSpotify(supabase),
    getStrava(supabase),
    getGitHub(supabase),
    getDuolingo(supabase),
    getGarmin(supabase),
    getNYTimes(supabase),
    getInstagram(supabase),
  ]);

  return (
    <>
      <div className="min-h-svh flex items-center justify-center p-5 sm:p-10">
        <div className="shrink-0 flex flex-col gap-3 w-full max-w-md lg:max-w-[59.25rem]">
          <div className="flex flex-col lg:flex-row gap-20 lg:gap-3 items-start justify-between">
            <Header location={location} />
            <div className="self-end w-full lg:w-auto flex flex-col lg:flex-row gap-3 items-end justify-end">
              <Spotify data={spotify} />
              <Instagram data={instagram} />
              <NYTimes data={nytimes} />
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row-reverse">
            <div className="w-full lg:max-w-[23.25rem]">
              <div className="relative pb-[125%] lg:pb-[152%]">
                <Strava activities={strava} />
              </div>
            </div>
            <div className="w-full flex flex-col gap-20 lg:gap-3">
              <div className="flex flex-col gap-3">
                <GitHub contributions={github} />
                <div className="flex gap-3 flex-col-reverse lg:flex-row">
                  <Garmin data={garmin} age={age} />
                  <div className="flex-1">
                    <Duolingo learning={duolingo} location={location} />
                  </div>
                </div>
              </div>
              <div className="flex-1 flex items-end">
                <Footer />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Refresh every={15} />
    </>
  );
};

export default Page;
