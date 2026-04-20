"use server";

// =============================================
// 513 HUB v1.5 — briefings server actions
// =============================================
// Replaces the direct browser-side Supabase writes that briefing-panel.tsx
// performs today. Bloque 7 will refactor that component to call these.

import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { revalidatePath } from "next/cache";
import type { Briefing, BriefingReference } from "@/types/database";

export interface UpsertBriefingInput {
  /** The briefing row id (present when updating an existing briefing). */
  id?: string;
  content_piece_id: string;
  objective?: string | null;
  target_audience?: string | null;
  key_messages?: string[];
  ephemerides?: string[];
  client_restrictions?: string | null;
  ref_links?: BriefingReference[];
}

export async function upsertBriefing(
  input: UpsertBriefingInput
): Promise<
  | { success: true; data: Briefing }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  const payload = {
    content_piece_id: input.content_piece_id,
    objective: input.objective ?? null,
    target_audience: input.target_audience ?? null,
    key_messages: input.key_messages ?? [],
    ephemerides: input.ephemerides ?? [],
    client_restrictions: input.client_restrictions ?? null,
    ...(input.ref_links ? { ref_links: input.ref_links } : {}),
  };

  if (input.id) {
    // Update existing briefing (workspace_id untouched, already set on creation).
    const { data, error } = await supabase
      .from("briefings")
      .update(payload)
      .eq("id", input.id)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath(`/content/${input.content_piece_id}`);
    return { success: true, data: data as Briefing };
  }

  // Insert new briefing — must inject workspace_id (NOT NULL).
  const workspace_id = await resolveWorkspaceId();

  const { data, error } = await supabase
    .from("briefings")
    .insert({ ...payload, workspace_id })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(`/content/${input.content_piece_id}`);
  return { success: true, data: data as Briefing };
}
