import {
  Client,
  GetMediaChildrenRequest,
  GetMediaInfoRequest,
  type MediaData,
  PageOption,
  PublicMediaField,
} from "instagram-graph-api";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_PAGE_ID,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/env/secret";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

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
  const response = await fetch(imageUrl);
  if (!response.ok) {
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

  const pageInfo = await pageInfoRequest.execute();

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  // Recursively fetch all pages of media
  const allMedia: MediaData[] = [];

  const fetchAllMedia = async (
    request: ReturnType<typeof client.newGetPageMediaRequest>,
  ) => {
    const response = await request.execute();
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
          const childrenResponse = await childrenRequest.execute();
          const children = childrenResponse.getData();

          const childMediaUrls = await Promise.all(
            children.map(async (child) => {
              const mediaRequest = new GetMediaInfoRequest(
                INSTAGRAM_ACCESS_TOKEN,
                child.id,
                PublicMediaField.MEDIA_URL,
              );
              const mediaResponse = await mediaRequest.execute();
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
  }

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

  const { error: postsError } = await supabase
    .from("instagram")
    .upsert(postsData);

  if (postsError) {
    throw new Error(postsError.message);
  }

  return new Response(null, {
    status: 204,
  });
};
