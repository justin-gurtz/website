import { NEXT_PUBLIC_SUPABASE_URL } from "@/env/public";
import { SUPABASE_SERVICE_ROLE_KEY } from "@/env/secret";
import { createClient } from "@/utils/supabase";

// Uncached on purpose: the Spotify widget polls this to know whether music is
// still playing, so the page itself only needs to regenerate on song changes
export const dynamic = "force-dynamic";

export const GET = async () => {
  const supabase = createClient(
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data, error } = await supabase
    .from("spotify")
    .select("updatedAt")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return new Response(null, { status: 500 });
  }

  return Response.json(
    { updatedAt: data.updatedAt },
    { headers: { "Cache-Control": "no-store" } },
  );
};
