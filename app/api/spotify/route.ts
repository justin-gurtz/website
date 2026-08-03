import * as Sentry from "@sentry/nextjs";
import { addMonths, differenceInDays, differenceInHours } from "date-fns";
import { backOff } from "exponential-backoff";
import map from "lodash/map";
import reduce from "lodash/reduce";
import { Vibrant } from "node-vibrant/node";
import { z } from "zod";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
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

const getDominantColor = async (
  imageUrl: string | undefined,
): Promise<string | null> => {
  if (!imageUrl) return null;

  try {
    const palette = await Vibrant.from(imageUrl).getPalette();

    // Prefer DarkVibrant for a colorful but dark background
    // Fall back to Vibrant (darkened), then DarkMuted
    const swatch =
      palette.DarkVibrant ?? palette.Vibrant ?? palette.DarkMuted ?? null;

    if (!swatch) return null;

    return swatch.hex;
  } catch {
    return null;
  }
};

// Thrown when the refresh token itself is rejected — retrying won't help,
// only re-authorizing at /api/spotify/auth will
class SpotifyReauthorizeError extends Error {}

export const POST = async () => {
  const authError = await validatePresharedKey("cron");
  if (authError) return authError;

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data: tokenRow, error: tokenRowError } = await supabase
    .from("spotifyTokens")
    .select("refreshToken, updatedAt, warnedAt")
    .eq("id", 1)
    .maybeSingle();

  if (tokenRowError) {
    throw new Error(tokenRowError.message);
  }

  if (!tokenRow) {
    throw new SpotifyReauthorizeError(
      "No Spotify refresh token stored — visit /api/spotify/auth to connect",
    );
  }

  // Spotify refresh tokens expire 6 months after authorization (updatedAt is
  // stamped on each re-auth). Warn via Sentry daily for the last 2 weeks.
  const now = new Date();
  const expiresAt = addMonths(new Date(tokenRow.updatedAt), 6);
  const daysLeft = differenceInDays(expiresAt, now);
  const alreadyWarnedToday =
    tokenRow.warnedAt &&
    differenceInHours(now, new Date(tokenRow.warnedAt)) < 23;

  if (daysLeft <= 14 && !alreadyWarnedToday) {
    Sentry.captureMessage(
      `Spotify token expires in ${daysLeft} days — visit /api/spotify/auth?key=<CRON_PRESHARED_KEY> to re-authorize`,
      "warning",
    );

    const { error } = await supabase
      .from("spotifyTokens")
      .update({ warnedAt: now.toISOString() })
      .eq("id", 1);

    if (error) {
      throw new Error(error.message);
    }
  }

  const { access_token: accessToken } = await backOff(
    async () => {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokenRow.refreshToken,
        }),
      });
      if (res.status === 400 || res.status === 401) {
        throw new SpotifyReauthorizeError(
          `Spotify refresh token rejected (${res.status}) — re-authorize at /api/spotify/auth`,
        );
      }
      if (!res.ok)
        throw new Error(`Spotify token request failed: ${res.status}`);
      return res.json();
    },
    {
      retry: (error) => !(error instanceof SpotifyReauthorizeError),
    },
  );

  if (!accessToken) {
    throw new Error("No Spotify access token");
  }

  const currentlyPlayingRes = await backOff(async () => {
    const res = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    if (!res.ok) throw new Error(`Spotify currently playing: ${res.status}`);
    return res;
  });

  if (currentlyPlayingRes.status === 204) {
    return new Response(null, { status: 204 });
  }

  const currentlyPlaying: SpotifyCurrentlyPlaying =
    await currentlyPlayingRes.json();
  const { is_playing: isPlaying, item } = currentlyPlaying;

  if (isPlaying && item) {
    // Get the most recent row to check if it's the same song
    const { data: lastRow } = await supabase
      .from("spotify")
      .select("id, name, by")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    const sanitized = sanitize(currentlyPlaying);
    const isSameSong =
      lastRow?.name === item.name &&
      JSON.stringify(lastRow?.by) === JSON.stringify(sanitized.by);

    if (isSameSong && lastRow) {
      // Same song - just update the timestamp
      const { error } = await supabase
        .from("spotify")
        .update({ updatedAt: new Date().toISOString() })
        .eq("id", lastRow.id);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      // Different song - calculate color and insert new row
      const image = getBestImage(sanitized.images);
      const color = await getDominantColor(image?.url);

      const { error } = await supabase.from("spotify").insert({
        mediaType: sanitized.mediaType,
        image: image?.url,
        name: item.name,
        by: sanitized.by,
        color,
        payload: currentlyPlaying,
      });

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  return new Response(null, {
    status: 204,
  });
};
