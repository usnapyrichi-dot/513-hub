"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { revalidatePath } from "next/cache";

export async function listGems(clientId: string) {
  const supabase = await createClient();
  const workspaceId = await resolveWorkspaceId();

  const { data, error } = await supabase
    .from("client_gems")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("client_id", clientId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching gems:", error);
    throw new Error("No se pudieron cargar las Gems.");
  }

  return data;
}

export async function upsertGem(
  clientId: string,
  gemData: { id?: string; name: string; system_instruction: string; model: string }
) {
  const supabase = await createClient();
  const workspaceId = await resolveWorkspaceId();

  const { data: userData } = await supabase.auth.getUser();

  const payload = {
    workspace_id: workspaceId,
    client_id: clientId,
    name: gemData.name,
    system_instruction: gemData.system_instruction,
    model: gemData.model,
    ...(gemData.id ? { id: gemData.id } : { created_by: userData.user?.id }),
  };

  const { data, error } = await supabase
    .from("client_gems")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Error upserting gem:", error);
    throw new Error("No se pudo guardar la Gem.");
  }

  revalidatePath(`/dashboard/clients/${clientId}`);
  revalidatePath(`/dashboard/ai-studio`);
  return data;
}

export async function deleteGem(gemId: string) {
  const supabase = await createClient();
  const workspaceId = await resolveWorkspaceId();

  const { error } = await supabase
    .from("client_gems")
    .update({ is_active: false })
    .eq("workspace_id", workspaceId)
    .eq("id", gemId);

  if (error) {
    console.error("Error deleting gem:", error);
    throw new Error("No se pudo eliminar la Gem.");
  }

  revalidatePath(`/dashboard/ai-studio`);
  return true;
}
