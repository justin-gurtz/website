import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import type { Database } from "@/types/database";
import { validatePresharedKey } from "@/utils/server";

export async function POST(request: Request) {
  await validatePresharedKey();

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const supabase = await createClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const { error } = await supabase.from("nytimes").insert({
    title: data.title as string,
    url: data.url as string,
  });

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
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
