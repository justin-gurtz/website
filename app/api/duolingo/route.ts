import Duo from "duo-wrapper";
import { backOff } from "exponential-backoff";
import isEqual from "lodash/isEqual";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import type { DuolingoLearning } from "@/types/models";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

export const POST = async () => {
  await validatePresharedKey("cron");

  const duo = new Duo("JustinGurtz");

  const streak = await backOff(() => duo.getStreak());
  const courses = await backOff(() => duo.getCourses());

  const newData = { streak, courses } as Pick<
    DuolingoLearning,
    "streak" | "courses"
  >;

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const { error: selectError, data: selectData } = await supabase
    .from("duolingo")
    .select("streak,courses")
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (!isEqual(selectData, newData)) {
    const { error: insertError } = await supabase
      .from("duolingo")
      .insert(newData);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return new Response(null, {
    status: 204,
  });
};
