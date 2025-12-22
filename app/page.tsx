import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { differenceInYears, subYears } from "date-fns";
import {
  Client,
  GetMediaChildrenRequest,
  GetMediaInfoRequest,
  type MediaData,
  PageOption,
  PublicMediaField,
} from "instagram-graph-api";
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
import {
  BIRTH_DATE,
  INSTAGRAM_LONG_LIVED_ACCESS_TOKEN,
  INSTAGRAM_PAGE_ID,
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

const getSpotify = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from("spotify")
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

const getGarmin = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from("garmin")
    .select("vo2_max_value,start_time_local")
    .order("start_time_local", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getNYTimes = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from("nytimes")
    .select("created_at,title,url")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const getInstagram = async () => {
  const client = new Client(
    INSTAGRAM_LONG_LIVED_ACCESS_TOKEN,
    INSTAGRAM_PAGE_ID,
  );

  const pageInfoRequest = client.newGetPageInfoRequest();
  const pageMediaRequest = client.newGetPageMediaRequest(
    PublicMediaField.ID,
    PublicMediaField.CAPTION,
    PublicMediaField.MEDIA_URL,
    PublicMediaField.MEDIA_TYPE,
    PublicMediaField.TIMESTAMP,
  );

  const pageInfo = await pageInfoRequest.execute();

  // Recursively fetch all pages of media
  const allMedia: MediaData[] = [];

  const fetchAllMedia = async (
    request: ReturnType<typeof client.newGetPageMediaRequest>,
  ) => {
    const response = await request.execute();
    allMedia.push(...response.getData());

    try {
      const nextPage = response.getPaging()?.getAfter();
      if (nextPage) {
        await fetchAllMedia(
          request.withPaging({ option: PageOption.AFTER, value: nextPage }),
        );
      }
    } catch {
      // No more pages available
    }
  };

  await fetchAllMedia(pageMediaRequest);

  // Fetch images for each post (including carousel children)
  const posts = await Promise.all(
    allMedia.map(async (post) => {
      let images: string[] = [];

      if (post.media_type === "CAROUSEL_ALBUM") {
        try {
          const childrenRequest = new GetMediaChildrenRequest(
            INSTAGRAM_LONG_LIVED_ACCESS_TOKEN,
            post.id,
          );
          const childrenResponse = await childrenRequest.execute();
          const children = childrenResponse.getData();

          const childMediaUrls = await Promise.all(
            children.map(async (child) => {
              const mediaRequest = new GetMediaInfoRequest(
                INSTAGRAM_LONG_LIVED_ACCESS_TOKEN,
                child.id,
                PublicMediaField.MEDIA_URL,
              );
              const mediaResponse = await mediaRequest.execute();
              return mediaResponse.getMediaUrl();
            }),
          );
          images = childMediaUrls.filter((url): url is string => !!url);
        } catch {
          // Fallback below will handle this
        }

        // Fallback to cover image if children fetch failed
        if (images.length === 0 && post.media_url) {
          images = [post.media_url];
        }
      } else if (post.media_url) {
        images = [post.media_url];
      }

      return { ...post, images };
    }),
  );

  return {
    followers: pageInfo.getFollowers() ?? 0,
    posts,
  };
};

const Page = async () => {
  const supabase = await createClient<Database>(
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
    getInstagram(),
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
