import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

export interface HealingEvent {
  scriptId: string;
  targetDescription: string;
  oldSelector: string;
  newSelector: string;
  screenshotBase64?: string;
  status: "PENDING" | "HEALED" | "FAILED";
}

/**
 * TelemetryLogger - Logs healing events to Supabase
 */
export class TelemetryLogger {
  private supabase: SupabaseClient | null = null;
  private enabled: boolean = false;

  constructor(config?: { url?: string; anonKey?: string }) {
    if (config?.url && config?.anonKey) {
      this.supabase = createClient(config.url, config.anonKey, {
        realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
      });
      this.enabled = true;
    } else if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      // Prefer server-side env vars when available
      this.supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
      });
      this.enabled = true;
    } else if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      // Fallback to NEXT_PUBLIC_* for client-side or local dev setups
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
        }
      );
      this.enabled = true;
    }
  }

  /**
   * Log a healing event to Supabase
   */
  async logHealing(event: HealingEvent): Promise<void> {
    if (!this.enabled || !this.supabase) {
      console.log("[Lazarus Telemetry] Telemetry disabled, skipping log");
      return;
    }

    try {
      const { error } = await this.supabase.from("healing_events").insert([
        {
          script_id: event.scriptId,
          target_description: event.targetDescription,
          old_selector: event.oldSelector,
          new_selector: event.newSelector,
          screenshot_base64: event.screenshotBase64 || null,
          status: event.status,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("[Lazarus Telemetry] Error logging healing event:", error);
      } else {
        console.log("[Lazarus Telemetry] Event logged successfully");
      }
    } catch (error) {
      console.error("[Lazarus Telemetry] Unexpected error:", error);
    }
  }
}
