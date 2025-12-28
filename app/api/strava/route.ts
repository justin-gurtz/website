import { backOff } from "exponential-backoff";
import map from "lodash/map";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REFERSH_TOKEN,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/env/secret";
import type { StravaActivity } from "@/types/models";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

export const POST = async () => {
  await validatePresharedKey("cron");

  const tokenRes = await backOff(() =>
    fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        refresh_token: STRAVA_REFERSH_TOKEN,
        grant_type: "refresh_token",
      }),
    }),
  );

  const { access_token: accessToken } = await tokenRes.json();

  if (!accessToken) {
    throw new Error("No Strava access token");
  }

  const activitiesRes = await backOff(() =>
    fetch("https://www.strava.com/api/v3/athlete/activities", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  );

  const activities = await activitiesRes.json();

  if (activities.errors) {
    throw new Error("Strava API error");
  }

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const data = map(activities, (activity: StravaActivity) => ({
    id: activity.id,
    type: activity.type,
    startDate: activity.start_date, // API returns snake_case, we use camelCase
    payload: activity, // Payload stored as-is (not transformed)
  }));

  const { error } = await supabase.from("strava").upsert(data);

  if (error) {
    throw new Error(error.message);
  }

  return new Response(null, {
    status: 204,
  });
};
