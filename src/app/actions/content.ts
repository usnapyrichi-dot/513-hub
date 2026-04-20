"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateContentStatus(id: string, status: string) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const { error } = await supabase
    .from('content_pieces')
    .update({ status })
    .eq('id', id)
    .eq('workspace_id', workspace_id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  revalidatePath('/content');
  revalidatePath(`/content/${id}`);
  return { success: true };
}

export async function updateContentDescription(id: string, description: string) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const { error } = await supabase
    .from('content_pieces')
    .update({ description })
    .eq('id', id)
    .eq('workspace_id', workspace_id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/content/${id}`);
  return { success: true };
}

export async function updateContentFields(id: string, fields: {
  description?: string;
  copy_out?: string;
  visual_description?: string;
  publish_date?: string;
}) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const { error } = await supabase
    .from('content_pieces')
    .update(fields)
    .eq('id', id)
    .eq('workspace_id', workspace_id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/content/${id}`);
  return { success: true };
}

export async function createContentPiece(data: {
  client_id: string;
  title: string;
  content_type: "reel" | "carousel_animated" | "carousel_static";
  platforms: string[];
  publish_date?: string;
  status?: string;
}) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const { data: piece, error } = await supabase
    .from('content_pieces')
    .insert({
      ...data,
      workspace_id,
      status: data.status ?? 'planning',
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  revalidatePath('/content');
  return { success: true, id: piece.id };
}

export async function deleteContentPiece(id: string) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const { error } = await supabase
    .from('content_pieces')
    .delete()
    .eq('id', id)
    .eq('workspace_id', workspace_id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  revalidatePath('/content');
  return { success: true };
}

export async function listPiecesForClient(clientId: string) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const { data, error } = await supabase
    .from('content_pieces')
    .select('id, title')
    .eq('client_id', clientId)
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false });
  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data ?? [] };
}
