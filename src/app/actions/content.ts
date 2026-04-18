"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateContentStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('content_pieces')
    .update({ status })
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  revalidatePath('/content');
  revalidatePath(`/content/${id}`);
  return { success: true };
}

export async function updateContentDescription(id: string, description: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('content_pieces')
    .update({ description })
    .eq('id', id);
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
  const { error } = await supabase
    .from('content_pieces')
    .update(fields)
    .eq('id', id);
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
  const { data: piece, error } = await supabase
    .from('content_pieces')
    .insert({
      ...data,
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
  const { error } = await supabase
    .from('content_pieces')
    .delete()
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  revalidatePath('/content');
  return { success: true };
}
