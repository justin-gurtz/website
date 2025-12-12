import { createClient } from "@supabase/supabase-js";
import { backOff } from "exponential-backoff";
import { request } from "graphql-request";
import isEqual from "lodash/isEqual";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { GITHUB_ACCESS_TOKEN, SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import type { Database } from "@/types/database";
import type { GitHubContributions } from "@/types/models";
import { validatePresharedKey } from "@/utils/server";

type GitHubData = {
  viewer: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: GitHubContributions;
      };
    };
  };
};

const query = `
    query {
      viewer {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                weekday
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;

export async function POST() {
  await validatePresharedKey();

  const res = await backOff(() =>
    request<GitHubData>("https://api.github.com/graphql", query, undefined, {
      Authorization: `Bearer ${GITHUB_ACCESS_TOKEN}`,
    }),
  );

  const newData = {
    contributions:
      res.viewer.contributionsCollection.contributionCalendar.weeks,
  };

  const supabase = await createClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const { error: selectError, data: selectData } = await supabase
    .from("github")
    .select("contributions")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (!isEqual(selectData, newData)) {
    const { error: insertError } = await supabase
      .from("github")
      .insert(newData);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  return new Response(null, {
    status: 204,
  });
}
