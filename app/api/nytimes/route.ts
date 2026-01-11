import { NextResponse } from "next/server";
import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import { validatePresharedKey } from "@/utils/server";
import { createClient } from "@/utils/supabase";

export const POST = async (request: Request) => {
  const authError = await validatePresharedKey("nytimes");
  if (authError) return authError;

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const { error } = await supabase.from("nytimes").insert({
    title: data.title as string,
    url: data.url as string,
    image: data.image as string,
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
