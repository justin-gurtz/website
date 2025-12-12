import { createClient } from "@supabase/supabase-js";
import { backOff } from "exponential-backoff";
import { GarminConnect } from "garmin-connect";
import map from "lodash/map";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  GARMIN_PASSWORD,
  GARMIN_USERNAME,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/env/secret";
import type { Database, Json } from "@/types/database";
import { validatePresharedKey } from "@/utils/server";

export async function POST() {
  await validatePresharedKey();

  const GCClient = new GarminConnect({
    username: GARMIN_USERNAME,
    password: GARMIN_PASSWORD,
  });

  await backOff(() => GCClient.login());

  const activities = await backOff(() => GCClient.getActivities());

  if (activities.length > 0) {
    const supabase = await createClient<Database>(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );

    const validActivities = activities.filter(
      (activity) => activity.vO2MaxValue,
    );

    const data = map(validActivities, (activity) => ({
      id: activity.activityId,
      vo2_max_value: activity.vO2MaxValue,
      start_time_local: activity.startTimeLocal,
      payload: activity as unknown as Json,
    }));

    const { error } = await supabase.from("garmin").upsert(data);

    if (error) {
      throw new Error(error.message);
    }
  }

  return new Response(null, {
    status: 204,
  });
}
