"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { revalidatePath } from "next/cache";

export async function getWorkspaceSettings() {
  const supabase = await createClient();
  const workspaceId = await resolveWorkspaceId();

  const { data, error } = await supabase
    .from("workspace_settings")
    .select("agency_name, tagline, timezone, notification_prefs")
    .eq("workspace_id", workspaceId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Row doesn't exist yet, return defaults
      return {
        agency_name: "My Agency",
        tagline: "",
        timezone: "Europe/Madrid",
        notification_prefs: { notif_status: true, notif_review: true },
      };
    }
    console.error("Error fetching workspace settings:", error);
    throw new Error("No se pudo cargar la configuración.");
  }

  return data;
}

export async function updateWorkspaceSettings(patch: {
  agency_name?: string;
  tagline?: string;
  timezone?: string;
  notification_prefs?: any;
}) {
  const supabase = await createClient();
  const workspaceId = await resolveWorkspaceId();

  const { data, error } = await supabase
    .from("workspace_settings")
    .upsert({
      workspace_id: workspaceId,
      ...patch,
      updated_at: new Date().toISOString(),
    }, { onConflict: "workspace_id" })
    .select()
    .single();

  if (error) {
    console.error("Error updating workspace settings:", error);
    throw new Error("No se pudo actualizar la configuración.");
  }

  revalidatePath("/", "layout"); // Revalidate entire app to update headers
  return data;
}
