import { backOff } from "exponential-backoff";
import isEqual from "lodash/isEqual";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import type { DuolingoCourse, DuolingoData } from "@/types/models";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

const fetchDuolingoData = async (username: string) => {
  const res = await fetch(
    `https://www.duolingo.com/2017-06-30/users?username=${username}`,
  );
  if (!res.ok) {
    throw new Error(`Duolingo API error: ${res.status}`);
  }
  const data = await res.json();
  const user = data.users?.[0];
  if (!user) {
    throw new Error("User not found");
  }
  return user as { streak: number; courses: DuolingoCourse[] };
};

export const POST = async () => {
  await validatePresharedKey("cron");

  const { streak, courses } = await backOff(() =>
    fetchDuolingoData("JustinGurtz"),
  );

  const newData = { streak, courses } as Pick<DuolingoData, "streak"> & {
    courses: DuolingoCourse[];
  };

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
