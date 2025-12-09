import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { differenceInYears, subYears } from "date-fns";
import { GarminConnect } from "garmin-connect";
import { first } from "lodash";
import map from "lodash/map";
import Duolingo from "@/components/duolingo";
import Footer from "@/components/footer";
import Garmin from "@/components/garmin";
import GitHub from "@/components/github";
import Header from "@/components/header";
import Refresh from "@/components/refresh";
import Spotify from "@/components/spotify";
import Strava from "@/components/strava";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  BIRTH_DATE,
  GARMIN_OAUTH_TOKEN_1,
  GARMIN_OAUTH_TOKEN_2,
  GARMIN_PASSWORD,
  GARMIN_USERNAME,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/env/secret";
import type { Database } from "@/types/database";
import type {
  DuolingoLearning,
  GitHubContributions,
  StravaActivity,
} from "@/types/models";

export const revalidate = 60;

const age = differenceInYears(new Date(), new Date(BIRTH_DATE));

const getLocation = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from("movements")
    .select("moved_at,city,region,country,time_zone_id")
    .order("moved_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getNowPlaying = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from("now_playing")
    .select("created_at,image,name,by")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getGitHub = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from("github")
    .select("contributions")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.contributions as GitHubContributions;
};

const getDuolingo = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from("duolingo")
    .select("created_at,streak,courses")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DuolingoLearning;
};

const getStrava = async (supabase: SupabaseClient<Database>) => {
  const oneYearAgo = subYears(new Date(), 1);

  // eslint-disable-next-line lodash/prefer-lodash-method
  const { data, error } = await supabase
    .from("strava")
    .select("payload")
    .filter("type", "eq", "Run")
    .filter("start_date", "gte", oneYearAgo.toISOString())
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return map(data, ({ payload }) => payload) as StravaActivity[];
};

const getGarmin = async () => {
  const GCClient = new GarminConnect({
    username: GARMIN_USERNAME,
    password: GARMIN_PASSWORD,
  });

  GCClient.loadToken(
    JSON.parse(GARMIN_OAUTH_TOKEN_1),
    JSON.parse(GARMIN_OAUTH_TOKEN_2),
  );

  const activities = await GCClient.getActivities();

  return first(activities) || null;
};

const Page = async () => {
  const supabase = await createClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const location = await getLocation(supabase);
  const nowPlaying = await getNowPlaying(supabase);

  const strava = await getStrava(supabase);
  const github = await getGitHub(supabase);
  const duolingo = await getDuolingo(supabase);
  const garmin = await getGarmin();

  return (
    <>
      <div className="min-h-svh flex items-center justify-center p-5 sm:p-10">
        <div className="shrink-0 flex flex-col gap-3 w-full max-w-md lg:max-w-4xl">
          <div className="flex flex-col lg:flex-row gap-20 lg:gap-3 items-start justify-between">
            <Header location={location} />
            <div className="self-end flex flex-wrap gap-3 justify-end">
              <Spotify nowPlaying={nowPlaying} />
              {garmin && <Garmin activity={garmin} age={age} />}
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row-reverse">
            <div className="w-full">
              <Strava activities={strava} />
            </div>
            <div className="w-full flex flex-col gap-20 lg:gap-3">
              <div className="flex flex-col gap-3">
                <GitHub contributions={github} />
                <Duolingo learning={duolingo} location={location} />
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
