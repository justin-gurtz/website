import { NextResponse } from "next/server";
import { z } from "zod";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

const bodySchema = z.object({
  title: z.string(),
  url: z.string(),
  image: z.string().optional(),
});

export const POST = async (request: Request) => {
  const authError = await validatePresharedKey("nytimes");
  if (authError) return authError;

  const formData = await request.formData();
  const parsed = bodySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return new Response(parsed.error.message, { status: 400 });
  }

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const { error } = await supabase.from("nytimes").insert(parsed.data);

  if (error) {
    throw new Error(error.message);
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};
