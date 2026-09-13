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
  // Optional so app builds that predate cache tracking keep syncing
  cacheReadTokens: z.number().int().min(0).default(0),
  cacheCreationTokens: z.number().int().min(0).default(0),
});

const bodySchema = z.array(rowSchema).min(1);

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
  const data = parsed.data.map((row) => ({ ...row, updatedAt: now }));

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
