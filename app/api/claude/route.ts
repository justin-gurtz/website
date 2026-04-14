import { z } from "zod";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

const rowSchema = z.object({
  period: z.string(),
  device: z.string(),
  model: z.string(),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
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

  const now = new Date().toISOString();
  const data = parsed.data.map((row) => ({ ...row, updatedAt: now }));

  const { error } = await supabase.from("claude").upsert(data);

  if (error) {
    throw new Error(error.message);
  }

  return new Response(null, { status: 204 });
};
