import type { CamelCaseDatabase } from "@/types/camel-case";

type Tables = CamelCaseDatabase["public"]["Tables"];

// Database row types (camelCase)
export type Movement = Tables["movements"]["Row"];
export type SpotifyData = Tables["spotify"]["Row"];
export type NYTimesData = Tables["nytimes"]["Row"];
export type InstagramPost = Tables["instagram"]["Row"];
export type InstagramFollows = Tables["instagramFollows"]["Row"];

// Per-image classification produced at ingest time (stored in instagram.imageMeta,
// keyed by storage path)
export type InstagramImageClassification = {
  isScreenshot: boolean;
  isRevealing: boolean;
  // Set when classification completed but produced no result (model refusal,
  // unreadable file) — treated as filtered, never retried
  unclassifiable?: boolean;
  focus: { x: number; y: number };
};

export type InstagramImageMeta = Record<string, InstagramImageClassification>;

// Shape passed to the Instagram component after filtering and URL resolution
export type InstagramDisplayImage = {
  url: string;
  focus: { x: number; y: number };
};

export type CurrentLocation = {
  name: string;
  timeZoneId: string;
};

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

// Subset of StravaActivity that is safe to serialize into the page — the full
// payload includes start/end GPS coordinates and must stay on the server
export type StravaRun = Pick<
  StravaActivity,
  "id" | "distance" | "moving_time" | "map"
>;

export type DuolingoStreak = {
  startDate: string;
  length: number;
  endDate: string;
} | null;

export type DuolingoCourse = {
  learningLanguage: string;
  title: string;
  xp: number;
};

export type GitContributionLevel =
  | "NONE"
  | "FIRST_QUARTILE"
  | "SECOND_QUARTILE"
  | "THIRD_QUARTILE"
  | "FOURTH_QUARTILE";

export type GitHubContributionDay = {
  weekday: number;
  date: string;
  contributionCount: number;
  contributionLevel: GitContributionLevel;
};

export type GitHubContribution = {
  contributionDays: GitHubContributionDay[];
};
