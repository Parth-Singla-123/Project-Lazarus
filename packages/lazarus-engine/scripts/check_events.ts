import WebSocket from "ws";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
  });

  const { data, error } = await supabase
    .from("healing_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error querying healing_events:", error);
    process.exit(1);
  }

  console.log("Recent healing_events:", JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
