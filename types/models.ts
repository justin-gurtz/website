import type { CamelCaseDatabase } from "@/types/camel-case";

type Tables = CamelCaseDatabase["public"]["Tables"];

// Database row types (camelCase)
export type Movement = Tables["movements"]["Row"];
export type SpotifyData = Tables["spotify"]["Row"];
export type GarminData = Tables["garmin"]["Row"];
export type NYTimesData = Tables["nytimes"]["Row"];
export type InstagramPost = Tables["instagram"]["Row"];
export type InstagramFollows = Tables["instagram_follows"]["Row"];

// JSON payload types (from third-party APIs - keep original casing)
export type StravaActivity = {
  id: number;
  type: string;
  name: string;
  start_date: string;
  start_latlng: [number, number];
  distance: number;
  moving_time: number;
  elapsed_time: number;
  visibility: string;
  map: {
    summary_polyline: string;
  };
};

export type DuolingoLearning = {
  createdAt: string;
  streak: number;
  courses: {
    learningLanguage: string;
    title: string;
    xp: number;
  }[];
};

export type GitContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export type GitHubContributions = {
  contributionDays: {
    weekday: number;
    date: string;
    contributionCount: number;
    contributionLevel: GitContributionLevel;
  }[];
}[];
