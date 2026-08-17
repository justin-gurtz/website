import { formatInTimeZone } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

// Called hourly by pg_cron. The "Typing since midnight" stat's cutoff is
// baked into the cached page, so purge it during the first hour after
// midnight in the current timezone — data-sync purges can't be relied on
// then (e.g. the laptop is asleep, so no keystroke syncs fire).
export const POST = async () => {
  const authError = await validatePresharedKey("cron");
  if (authError) return authError;

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data, error } = await supabase
    .from("movements")
    .select("timeZoneId")
    .not("timeZoneId", "is", null)
    .order("movedAt", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.timeZoneId) {
    return new Response(null, { status: 204 });
  }

  const localHour = Number(formatInTimeZone(new Date(), data.timeZoneId, "H"));

  if (localHour === 0) {
    revalidatePath("/");
  }

  return new Response(null, { status: 204 });
};
