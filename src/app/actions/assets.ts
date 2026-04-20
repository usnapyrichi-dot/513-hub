"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { revalidatePath } from "next/cache";

export async function createAssetMetadata(data: {
  content_piece_id?: string;
  client_id?: string;
  file_name: string;
  file_url: string;
  file_type: "image" | "video" | "design_file";
  mime_type: string;
  file_size_bytes: number;
  version: number;
  is_final: boolean;
}) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();

  const { data: newAsset, error } = await supabase
    .from("assets")
    .insert({
      workspace_id,
      ...data,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  if (data.content_piece_id) {
    revalidatePath(`/content/${data.content_piece_id}`);
  }
  revalidatePath("/assets");
  
  return { success: true, data: newAsset };
}

export async function deleteAsset(id: string) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  
  const { data: asset, error: fetchError } = await supabase
    .from("assets")
    .select("content_piece_id")
    .eq("id", id)
    .single();
    
  if (fetchError) return { success: false, error: fetchError.message };

  const { error } = await supabase
    .from("assets")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspace_id);

  if (error) return { success: false, error: error.message };

  if (asset?.content_piece_id) {
    revalidatePath(`/content/${asset.content_piece_id}`);
  }
  revalidatePath("/assets");

  return { success: true };
}

export async function toggleAssetFinal(id: string, isFinal: boolean) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();

  const { data: asset, error: fetchError } = await supabase
    .from("assets")
    .select("content_piece_id")
    .eq("id", id)
    .single();
    
  if (fetchError) return { success: false, error: fetchError.message };

  const { error } = await supabase
    .from("assets")
    .update({ is_final: isFinal })
    .eq("id", id)
    .eq("workspace_id", workspace_id);

  if (error) return { success: false, error: error.message };

  if (asset?.content_piece_id) {
    revalidatePath(`/content/${asset.content_piece_id}`);
  }
  revalidatePath("/assets");

  return { success: true };
}
