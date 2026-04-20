"use server";

// =============================================
// 513 HUB v1.5 — ideation server actions
// =============================================
// Replaces the direct browser-side Supabase writes that ideation-client.tsx
// performs today. Bloque 8 will refactor that component to call these.
//
// Note: ideation-client today writes to `content_pieces`, NOT to the `ideas`
// table. These actions mirror that behaviour so we don't change product
// semantics in this block — we just move the writes to the server.

import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { revalidatePath } from "next/cache";
import type { ContentPiece } from "@/types/database";

export interface CreateIdeationPieceInput {
  client_id: string;
  title: string;
  description: string;
  content_type?: "reel" | "carousel_animated" | "carousel_static";
}

export async function createIdeationPiece(
  input: CreateIdeationPieceInput
): Promise<
  | { success: true; data: ContentPiece }
  | { success: false; error: string }
> {
  if (!input.client_id) return { success: false, error: "client_id is required." };
  if (!input.title?.trim()) return { success: false, error: "title is required." };

  const supabase = await createClient();
  const workspace_id = await resolveWorkspaceId();

  const { data, error } = await supabase
    .from("content_pieces")
    .insert({
      workspace_id,
      client_id: input.client_id,
      title: input.title.trim(),
      description: input.description ?? "",
      content_type: input.content_type ?? "reel",
      status: "ideation",
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/content");
  revalidatePath("/ideation");
  return { success: true, data: data as ContentPiece };
}

export async function appendConceptToPiece(
  pieceId: string,
  description: string
): Promise<
  | { success: true }
  | { success: false; error: string }
> {
  if (!pieceId) return { success: false, error: "pieceId is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("content_pieces")
    .update({ description })
    .eq("id", pieceId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/content/${pieceId}`);
  revalidatePath("/content");
  return { success: true };
}
