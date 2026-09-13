import { revalidatePath } from "next/cache";
import { z } from "zod";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

const rowSchema = z.object({
  period: z.string(),
  device: z.string(),
  model: z.string(),
  provider: z.string().default("claude"),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  // Optional so app builds that predate cache tracking keep syncing; absent
  // means unknown and is stored as NULL, never 0
  cacheReadTokens: z.number().int().min(0).optional(),
  cacheCreationTokens: z.number().int().min(0).optional(),
});

const bodySchema = z.array(rowSchema).min(1);

// "claude-haiku-4-5-20251001" -> "Haiku 4.5", "claude-opus-5" -> "Opus 5". Older
// app builds still send raw IDs; normalizing here keeps every row keyed on the
// display name. Unrecognized shapes pass through so new schemes show up as-is.
const displayModelName = (raw: string) => {
  const match = raw.match(/^claude-([a-z]+)((?:-\d+)+?)(?:-\d{8})?$/);
  if (!match) return raw;
  const [, family, version] = match;
  const name = family.charAt(0).toUpperCase() + family.slice(1);
  return `${name} ${version.slice(1).replaceAll("-", ".")}`;
};

export const POST = async (request: Request) => {
  const authError = await validatePresharedKey("claude");
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return new Response(parsed.error.message, { status: 400 });
  }

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  // Read the previous updatedAt before the upsert overwrites it — used below
  // to throttle page purges during heavy sessions with frequent pushes
  const { data: lastRow } = await supabase
    .from("aiUsage")
    .select("updatedAt")
    .order("updatedAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = new Date().toISOString();
  const data = parsed.data.map((row) => ({
    ...row,
    model: row.provider === "claude" ? displayModelName(row.model) : row.model,
    updatedAt: now,
  }));

  const { error } = await supabase.from("aiUsage").upsert(data);

  if (error) {
    throw new Error(error.message);
  }

  const throttled =
    lastRow &&
    Date.now() - new Date(lastRow.updatedAt).getTime() < 5 * 60 * 1000;

  if (!throttled) {
    revalidatePath("/");
  }

  return new Response(null, { status: 204 });
};
