import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { backOff } from "exponential-backoff";
import { GarminConnect } from "garmin-connect";
import type {
  IActivity,
  IOauth1Token,
  IOauth2Token,
} from "garmin-connect/dist/garmin/types";
import map from "lodash/map";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import {
  GARMIN_PASSWORD,
  GARMIN_TOKEN_ENCRYPTION_KEY,
  GARMIN_USERNAME,
  SUPABASE_SERVICE_ROLE_KEY,
} from "@/env/secret";
import type { Json } from "@/types/database";
import { validatePresharedKey } from "@/utils/server";
import { createClient, type SupabaseClient } from "@/utils/supabase";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM

const encryptToken = (token: IOauth1Token | IOauth2Token): string => {
  const key = Buffer.from(GARMIN_TOKEN_ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (64 hex characters)");
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Convert token object to JSON string before encryption
  const tokenString = JSON.stringify(token);
  let encrypted = cipher.update(tokenString, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Combine IV + authTag + encrypted data
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
};

const decryptToken = (encryptedToken: string): IOauth1Token | IOauth2Token => {
  const key = Buffer.from(GARMIN_TOKEN_ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("Encryption key must be 32 bytes (64 hex characters)");
  }

  const parts = encryptedToken.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }

  const [ivHex, authTagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  // Parse the JSON string back to token object
  return JSON.parse(decrypted) as IOauth1Token | IOauth2Token;
};

const saveTokens = async (
  supabase: SupabaseClient,
  oauth1Token: IOauth1Token,
  oauth2Token: IOauth2Token,
) => {
  // Encrypt tokens before storing (encrypted tokens are strings)
  const encryptedOauth1 = encryptToken(oauth1Token);
  const encryptedOauth2 = encryptToken(oauth2Token);

  // Upsert: if a row exists, update it; otherwise insert a new one
  const { error } = await supabase.from("garmin_tokens").upsert(
    {
      id: 1, // Use a fixed ID since we only need one token set
      oauth1Token: encryptedOauth1,
      oauth2Token: encryptedOauth2,
      updatedAt: new Date().toISOString(),
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
};

const getStoredTokens = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from("garmin_tokens")
    .select("oauth1Token, oauth2Token")
    .order("updatedAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const oauth1Token = decryptToken(data.oauth1Token as unknown as string);
  const oauth2Token = decryptToken(data.oauth2Token as unknown as string);

  return {
    oauth1: oauth1Token,
    oauth2: oauth2Token,
  };
};

export const POST = async () => {
  await validatePresharedKey("cron");

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const GCClient = new GarminConnect({
    username: GARMIN_USERNAME,
    password: GARMIN_PASSWORD,
  });

  // Try to load stored tokens
  const storedTokens = await getStoredTokens(supabase);
  let activities: IActivity[];

  if (storedTokens) {
    try {
      // Load tokens and try to use them
      GCClient.loadToken(
        storedTokens.oauth1 as unknown as IOauth1Token,
        storedTokens.oauth2 as unknown as IOauth2Token,
      );

      // Try to fetch activities to verify tokens are still valid
      // The library should handle token refresh automatically if needed
      activities = await backOff(() => GCClient.getActivities());
    } catch (error) {
      // Tokens are invalid or expired, fall back to login
      console.warn("Stored tokens invalid, logging in:", error);
      await backOff(() => GCClient.login());

      // Save the new tokens after successful login
      const oauth1Token = GCClient.client.oauth1Token;
      const oauth2Token = GCClient.client.oauth2Token;

      if (oauth1Token && oauth2Token) {
        await saveTokens(supabase, oauth1Token, oauth2Token);
      }

      // Fetch activities after login
      activities = await backOff(() => GCClient.getActivities());
    }
  } else {
    // No stored tokens, login required
    await backOff(() => GCClient.login());

    // Save the new tokens after successful login
    const oauth1Token = GCClient.client.oauth1Token;
    const oauth2Token = GCClient.client.oauth2Token;

    if (oauth1Token && oauth2Token) {
      await saveTokens(supabase, oauth1Token, oauth2Token);
    }

    // Fetch activities after login
    activities = await backOff(() => GCClient.getActivities());
  }

  if (activities.length > 0) {
    const validActivities = activities.filter(
      (activity) => activity.vO2MaxValue,
    );

    const data = map(validActivities, (activity) => ({
      id: activity.activityId,
      vo2MaxValue: activity.vO2MaxValue,
      startTimeLocal: activity.startTimeLocal,
      payload: activity as unknown as Json,
    }));

    const { error } = await supabase.from("garmin").upsert(data);

    if (error) {
      throw new Error(error.message);
    }
  }

  return new Response(null, {
    status: 204,
  });
};
