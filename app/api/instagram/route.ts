import * as Sentry from "@sentry/nextjs";
import { subYears } from "date-fns";
import { backOff } from "exponential-backoff";
import {
  Client,
  GetMediaChildrenRequest,
  GetMediaInfoRequest,
  type MediaData,
  PageOption,
  PublicMediaField,
} from "instagram-graph-api";
import { revalidatePath } from "next/cache";
import { classifyImage, isOutOfCredits } from "@/app/api/instagram/classify";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_PAGE_ID,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/env/secret";
import type { Json } from "@/types/database";
import type { InstagramImageMeta } from "@/types/models";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

// Classification can take a couple of minutes on a backfill run
export const maxDuration = 300;

const CLASSIFY_CONCURRENCY = 5;
const MAX_CLASSIFICATIONS_PER_RUN = 100;

// Upload image to Supabase Storage, returns the storage path
const uploadImage = async (
  supabase: ReturnType<typeof createClient>,
  postId: string,
  imageIndex: number,
  imageUrl: string,
): Promise<string | null> => {
  const storagePath = `${postId}/${imageIndex}.jpg`;

  // Check if file already exists
  const { data: existingFile } = await supabase.storage
    .from("instagram")
    .list(postId, { limit: 1, search: `${imageIndex}.jpg` });

  if (existingFile && existingFile.length > 0) {
    return storagePath;
  }

  // Download image from Instagram CDN
  let response: Response;
  try {
    response = await backOff(async () => {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
      return res;
    });
  } catch {
    console.error(`Failed to fetch image: ${imageUrl}`);
    return null;
  }

  const blob = await response.blob();

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from("instagram")
    .upload(storagePath, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error(`Failed to upload image: ${error.message}`);
    return null;
  }

  return storagePath;
};

export const POST = async () => {
  const authError = await validatePresharedKey("cron");
  if (authError) return authError;

  const client = new Client(INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_PAGE_ID);

  const pageInfoRequest = client.newGetPageInfoRequest();
  const pageMediaRequest = client.newGetPageMediaRequest(
    PublicMediaField.ID,
    PublicMediaField.CAPTION,
    PublicMediaField.MEDIA_URL,
    PublicMediaField.MEDIA_TYPE,
    PublicMediaField.TIMESTAMP,
    PublicMediaField.LIKE_COUNT,
    PublicMediaField.COMMENTS_COUNT,
    PublicMediaField.PERMALINK,
  );

  const pageInfo = await backOff(() => pageInfoRequest.execute());

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  // Recursively fetch all pages of media
  const allMedia: MediaData[] = [];

  const fetchAllMedia = async (
    request: ReturnType<typeof client.newGetPageMediaRequest>,
  ) => {
    const response = await backOff(() => request.execute());
    allMedia.push(...response.getData());

    try {
      const nextPage = response.getPaging()?.getAfter();
      if (nextPage) {
        await fetchAllMedia(
          request.withPaging({ option: PageOption.AFTER, value: nextPage }),
        );
      }
    } catch {
      // No more pages available
    }
  };

  await fetchAllMedia(pageMediaRequest);

  // Fetch images for each post (including carousel children) and upload to storage
  const posts = await Promise.all(
    allMedia.map(async (post) => {
      let imageUrls: string[] = [];

      if (post.media_type === "CAROUSEL_ALBUM") {
        try {
          const childrenRequest = new GetMediaChildrenRequest(
            INSTAGRAM_ACCESS_TOKEN,
            post.id,
          );
          const childrenResponse = await backOff(() =>
            childrenRequest.execute(),
          );
          const children = childrenResponse.getData();

          const childMediaUrls = await Promise.all(
            children.map(async (child) => {
              const mediaRequest = new GetMediaInfoRequest(
                INSTAGRAM_ACCESS_TOKEN,
                child.id,
                PublicMediaField.MEDIA_URL,
              );
              const mediaResponse = await backOff(() => mediaRequest.execute());
              return mediaResponse.getMediaUrl();
            }),
          );
          imageUrls = childMediaUrls.filter((url): url is string => !!url);
        } catch {
          // Fallback below will handle this
        }

        // Fallback to cover image if children fetch failed
        if (imageUrls.length === 0 && post.media_url) {
          imageUrls = [post.media_url];
        }
      } else if (post.media_url) {
        imageUrls = [post.media_url];
      }

      // Upload images to Supabase Storage
      const storagePaths = await Promise.all(
        imageUrls.map((url, index) =>
          uploadImage(supabase, post.id, index, url),
        ),
      );

      const images = storagePaths.filter(
        (path): path is string => path !== null,
      );

      return { ...post, images };
    }),
  );

  // Purge the page only when something it renders actually changed
  let changed = false;

  const followerCount = pageInfo.getFollowers() ?? 0;
  const followingCount = pageInfo.getFollows() ?? 0;

  const { data: followsData, error: followsError } = await supabase
    .from("instagramFollows")
    .select("followerCount, followingCount")
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (followsError) {
    throw new Error(followsError.message);
  }

  if (
    followsData?.followerCount !== followerCount ||
    followsData?.followingCount !== followingCount
  ) {
    const { error: insertError } = await supabase
      .from("instagramFollows")
      .upsert({
        followerCount,
        followingCount,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }

    changed = true;
  }

  // Upsert posts before classifying, and never write imageMeta here — it is
  // updated per post below, so a timeout or crash mid-classification can
  // neither lose new posts nor clobber previously stored classifications
  const postsData = posts.map((post) => ({
    id: post.id,
    postedAt: post.timestamp,
    mediaType: post.media_type,
    caption: post.caption,
    images: post.images,
    likeCount: post.like_count,
    commentCount: post.comments_count,
    url: post.permalink,
  }));

  const { data: knownPosts, error: knownError } = await supabase
    .from("instagram")
    .select("id")
    .in(
      "id",
      postsData.map((post) => post.id),
    );

  if (knownError) {
    throw new Error(knownError.message);
  }

  if (knownPosts.length < postsData.length) {
    changed = true;
  }

  const { error: postsError } = await supabase
    .from("instagram")
    .upsert(postsData);

  if (postsError) {
    throw new Error(postsError.message);
  }

  // Classify new images (screenshot/revealing detection + face focal point),
  // but only for posts recent enough to be displayed. Incremental by design:
  // images that fail or exceed the per-run cap are picked up on the next run.
  const displayCutoff = subYears(new Date(), 2);

  const { data: existingRows, error: existingError } = await supabase
    .from("instagram")
    .select("id,imageMeta")
    .gte("postedAt", displayCutoff.toISOString());

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingMeta = new Map(
    existingRows.map((row) => [
      row.id,
      (row.imageMeta ?? {}) as InstagramImageMeta,
    ]),
  );

  const unclassified = posts.flatMap((post) => {
    if (!post.timestamp || new Date(post.timestamp) < displayCutoff) return [];
    const meta = existingMeta.get(post.id);
    return post.images
      .filter((path) => !meta?.[path])
      .map((path) => ({ postId: post.id, path }));
  });

  const toClassify = unclassified.slice(0, MAX_CLASSIFICATIONS_PER_RUN);
  const newMeta = new Map<string, InstagramImageMeta>();
  let outOfCredits = false;

  // Small worker pool to stay within OpenAI rate limits
  let cursor = 0;
  await Promise.all(
    Array.from({ length: CLASSIFY_CONCURRENCY }, async () => {
      while (cursor < toClassify.length && !outOfCredits) {
        const { postId, path } = toClassify[cursor++];
        const url = supabase.storage.from("instagram").getPublicUrl(path)
          .data.publicUrl;
        try {
          const classification = await classifyImage(url);
          const meta = newMeta.get(postId) ?? {};
          meta[path] = classification;
          newMeta.set(postId, meta);
        } catch (error) {
          if (isOutOfCredits(error)) {
            if (!outOfCredits) {
              outOfCredits = true;
              Sentry.captureMessage(
                "OpenAI credit balance exhausted — Instagram image classification paused until topped up",
                "error",
              );
            }
          } else {
            console.error(`Failed to classify image: ${path}`, error);
            Sentry.captureException(error);
          }
        }
      }
    }),
  );

  const metaUpdates = await Promise.all(
    Array.from(newMeta.entries()).map(([postId, meta]) =>
      supabase
        .from("instagram")
        .update({
          imageMeta: { ...existingMeta.get(postId), ...meta } as Json,
        })
        .eq("id", postId),
    ),
  );

  for (const { error } of metaUpdates) {
    if (error) {
      console.error(`Failed to save image classifications: ${error.message}`);
      Sentry.captureException(new Error(error.message));
    } else {
      changed = true;
    }
  }

  if (changed) {
    revalidatePath("/");
  }

  return new Response(null, {
    status: 204,
  });
};
