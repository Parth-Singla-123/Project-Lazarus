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

  const insert = {
    script_id: "22222222-2222-2222-2222-222222222222",
    target_description: "Test insert",
    old_selector: "#old",
    new_selector: "#new",
    status: "HEALED",
  } as any;

  const { data: insertData, error: insertError } = await supabase.from("healing_events").insert([insert]);
  if (insertError) {
    console.error("Insert error:", insertError);
  } else {
    console.log("Insert result:", insertData);
  }

  const { data, error } = await supabase
    .from("healing_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Query error:", error);
    process.exit(1);
  }

  console.log("Recent healing_events:", JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
