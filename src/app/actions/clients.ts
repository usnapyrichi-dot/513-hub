"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { revalidatePath } from "next/cache";

export async function createClientAction(name: string) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const { error } = await supabase
    .from('clients')
    .insert([{ workspace_id, name }]);
  if (error) return { success: false, error: error.message };
  revalidatePath('/clients');
  return { success: true };
}

export async function createClientModel(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const year = parseInt(formData.get('year') as string) || new Date().getFullYear();
  const { error } = await supabase
    .from('car_models')
    .insert([{ workspace_id, client_id: clientId, name, category, year }]);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/clients`);
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function updateBrandGuidelines(
  clientId: string,
  guidelines: {
    tone: string;
    colors: { name: string; hex: string }[];
    dos: string[];
    donts: string[];
    typography?: { name: string; usage: string }[];
  }
) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const { error } = await supabase
    .from('clients')
    .update({ brand_guidelines: guidelines })
    .eq('id', clientId)
    .eq('workspace_id', workspace_id);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}

export async function updateContentPieceDate(id: string, publishDate: string) {
  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();
  const { error } = await supabase
    .from('content_pieces')
    .update({ publish_date: publishDate })
    .eq('id', id)
    .eq('workspace_id', workspace_id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/calendar');
  revalidatePath(`/content/${id}`);
  return { success: true };
}
