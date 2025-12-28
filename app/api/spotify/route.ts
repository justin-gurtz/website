import { backOff } from "exponential-backoff";
import map from "lodash/map";
import reduce from "lodash/reduce";
import { z } from "zod";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/env/secret";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

const ImageSchema = z.object({
  width: z.number(),
  height: z.number(),
  url: z.string(),
});

const TrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
  album: z.object({
    id: z.string(),
    name: z.string(),
    images: z.array(ImageSchema).optional(),
  }),
});

const EpisodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(ImageSchema).optional(),
  show: z.object({
    id: z.string(),
    name: z.string(),
    images: z.array(ImageSchema).optional(),
  }),
});

type Image = z.infer<typeof ImageSchema>;
type TrackItem = z.infer<typeof TrackSchema>;
type EpisodeItem = z.infer<typeof EpisodeSchema>;

const isTrack = (input: unknown): input is TrackItem => {
  return TrackSchema.safeParse(input).success;
};

const isEpisode = (input: unknown): input is EpisodeItem => {
  return EpisodeSchema.safeParse(input).success;
};

type SpotifyCurrentlyPlaying = {
  is_playing: boolean;
  currently_playing_type: "track" | "episode";
  item: TrackItem | EpisodeItem;
};

const sanitize = (
  currentlyPlaying: SpotifyCurrentlyPlaying,
): { mediaType: string; images?: Image[]; by: string[] } => {
  const { currently_playing_type: type, item } = currentlyPlaying;

  if (type === "track" && isTrack(item)) {
    return {
      mediaType: "song",
      images: item.album.images,
      by: map(item.artists, (artist) => artist.name),
    };
  }

  if (type === "episode" && isEpisode(item)) {
    return {
      mediaType: "podcast",
      images: item.images || item.show.images,
      by: [item.show.name],
    };
  }

  throw new Error("Unknown or malformed currently playing type");
};

const getBestImage = (images: Image[] | undefined) => {
  if (!images) return undefined;

  const largestImage = reduce(
    images,
    (largest, image) => {
      return image.width > largest.width ? image : largest;
    },
    images[0],
  );

  return reduce(
    images,
    (smallest, image) => {
      // Ideally 2x container size
      if (image.width >= 320 && image.height >= 320) {
        return image.width < smallest.width ? image : smallest;
      }
      return smallest;
    },
    largestImage,
  );
};

export const POST = async () => {
  await validatePresharedKey("cron");

  const tokenRes = await backOff(() =>
    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: SPOTIFY_REFRESH_TOKEN,
      }),
    }),
  );

  const { access_token: accessToken } = await tokenRes.json();

  if (!accessToken) {
    throw new Error("No Spotify access token");
  }

  const currentlyPlayingRes = await backOff(() =>
    fetch(
      "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    ),
  );

  if (!currentlyPlayingRes.ok) {
    throw new Error("Spotify currently playing request failed");
  }

  let currentlyPlaying: SpotifyCurrentlyPlaying | undefined;

  try {
    currentlyPlaying = await currentlyPlayingRes.json();
  } catch {
    // Nothing playing
  }

  const { is_playing: isPlaying, item } = currentlyPlaying || {};

  if (isPlaying && item && currentlyPlaying) {
    const supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
    );

    const sanitized = sanitize(currentlyPlaying);
    const image = getBestImage(sanitized.images);

    const { error } = await supabase.from("spotify").insert({
      mediaType: sanitized.mediaType,
      image: image?.url,
      name: item.name,
      by: sanitized.by,
      payload: currentlyPlaying,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  return new Response(null, {
    status: 204,
  });
};
