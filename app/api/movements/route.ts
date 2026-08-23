import { revalidatePath } from "next/cache";
import { validatePresharedKey } from "@/utils/server";

// Movements are written straight to Supabase. A database trigger on the
// movements table calls this after each insert so the header's location and
// "moved … ago" don't sit stale until the hourly revalidation.
export const POST = async () => {
  const authError = await validatePresharedKey("database");
  if (authError) return authError;

  revalidatePath("/");

  return new Response(null, { status: 204 });
};
