"use server";

// =============================================
// 513 HUB v1.5 — comments server actions
// =============================================
// Replaces the direct browser-side Supabase writes that comment-thread.tsx
// performs today. Bloque 8 will refactor that component to call these.

import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { revalidatePath } from "next/cache";
import type { Comment, CommentType } from "@/types/database";

export interface CreateCommentInput {
  content_piece_id: string;
  comment_text: string;
  comment_type: CommentType;
  review_id?: string | null;
}

export async function createComment(
  input: CreateCommentInput
): Promise<
  | { success: true; data: Comment }
  | { success: false; error: string }
> {
  const text = input.comment_text?.trim();
  if (!text) {
    return { success: false, error: "Comment text is required." };
  }

  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();

  const { data, error } = await supabase
    .from("comments")
    .insert({
      workspace_id,
      content_piece_id: input.content_piece_id,
      comment_text: text,
      comment_type: input.comment_type,
      review_id: input.review_id ?? null,
      resolved: false,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/content/${input.content_piece_id}`);
  return { success: true, data: data as Comment };
}

export async function toggleCommentResolved(
  commentId: string,
  resolved: boolean
): Promise<
  | { success: true }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .update({ resolved })
    .eq("id", commentId)
    .select("content_piece_id")
    .single();

  if (error) return { success: false, error: error.message };
  if (data?.content_piece_id) {
    revalidatePath(`/content/${data.content_piece_id}`);
  }
  return { success: true };
}
