import { backOff } from "exponential-backoff";
import map from "lodash/map";
import omit from "lodash/omit";
import { revalidatePath } from "next/cache";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  STRAVA_CLIENT_ID,
  STRAVA_CLIENT_SECRET,
  STRAVA_REFRESH_TOKEN,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/env/secret";
import type { StravaActivity } from "@/types/models";
import {
  HttpError,
  retryUnlessClientError,
  validatePresharedKey,
} from "@/utils/server";
import { createClient } from "@/utils/supabase";

export const POST = async () => {
  const authError = await validatePresharedKey("cron");
  if (authError) return authError;

  const { access_token: accessToken } = await backOff(
    async () => {
      const res = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        body: new URLSearchParams({
          client_id: STRAVA_CLIENT_ID,
          client_secret: STRAVA_CLIENT_SECRET,
          refresh_token: STRAVA_REFRESH_TOKEN,
          grant_type: "refresh_token",
        }),
      });
      if (!res.ok)
        throw new HttpError(
          `Strava token request failed: ${res.status}`,
          res.status,
        );
      return res.json();
    },
    { retry: retryUnlessClientError },
  );

  if (!accessToken) {
    throw new Error("No Strava access token");
  }

  const activities = await backOff(
    async () => {
      const res = await fetch(
        "https://www.strava.com/api/v3/athlete/activities",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!res.ok)
        throw new HttpError(
          `Strava activities request failed: ${res.status}`,
          res.status,
        );
      return res.json();
    },
    { retry: retryUnlessClientError },
  );

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  // Strava returns newest-first; compare against the newest stored activity
  // to detect whether this sync actually brought anything new
  const { data: newestRow } = await supabase
    .from("strava")
    .select("id")
    .order("startDate", { ascending: false })
    .limit(1)
    .maybeSingle();

  const typedActivities = activities as StravaActivity[];
  const hasNewActivity =
    typedActivities.length > 0 && typedActivities[0].id !== newestRow?.id;

  const data = map(typedActivities, (activity) => ({
    id: activity.id,
    type: activity.type,
    startDate: activity.start_date, // API returns snake_case, we use camelCase
    // Payload stored as-is, minus the exact start/end coordinates: Strava
    // trims the route line to hide them but returns these untrimmed
    payload: omit(activity, "start_latlng", "end_latlng"),
  }));

  const { error } = await supabase.from("strava").upsert(data);

  if (error) {
    throw new Error(error.message);
  }

  if (hasNewActivity) {
    revalidatePath("/");
  }

  return new Response(null, {
    status: 204,
  });
};
