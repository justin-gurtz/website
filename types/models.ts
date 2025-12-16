import type { Database } from "@/types/database";

export type Movement = Database["public"]["Tables"]["movements"]["Row"];
export type NowPlaying = Database["public"]["Tables"]["now_playing"]["Row"];
export type GarminData = Database["public"]["Tables"]["garmin"]["Row"];
export type NYTimesData = Database["public"]["Tables"]["nytimes"]["Row"];

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
  created_at: string;
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
