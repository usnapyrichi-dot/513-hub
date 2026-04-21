"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspace, resolveWorkspaceId } from "@/lib/supabase/workspace";
import { revalidatePath } from "next/cache";

export async function getWorkspaceSettings() {
  const supabase = await createClient();
  const ws = await getCurrentWorkspace();

  // No workspace yet (user authenticated but not assigned to a workspace) → return defaults
  if (!ws) {
    return {
      agency_name: "Mi Agencia",
      tagline: "",
      timezone: "Europe/Madrid",
      notification_prefs: { notif_status: true, notif_review: true },
    };
  }

  const { data, error } = await supabase
    .from("workspace_settings")
    .select("agency_name, tagline, timezone, notification_prefs")
    .eq("workspace_id", ws.workspaceId)
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

export async function getWorkspaceMembers() {
  const supabase = await createClient();
  const workspaceId = await resolveWorkspaceId();

  // 1. Fetch workspace members
  const { data: members, error: membersError } = await supabase
    .from("workspace_members")
    .select("id, role, joined_at, user_id")
    .eq("workspace_id", workspaceId);

  if (membersError) {
    console.error("Error fetching workspace members:", membersError);
    throw new Error("No se pudieron cargar los roles de equipo.");
  }

  if (!members || members.length === 0) {
    return [];
  }

  // 2. Fetch profiles
  const userIds = members.map((m) => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .in("id", userIds);

  if (profilesError) {
    console.error("Error fetching profiles:", profilesError);
    throw new Error("No se pudieron cargar los perfiles de equipo.");
  }

  // 3. Map together
  return members.map((member) => {
    const profile = profiles?.find((p) => p.id === member.user_id);
    return {
      ...member,
      profiles: profile || { full_name: "Usuario pendiente", email: "", avatar_url: null }
    };
  });
}

export async function inviteWorkspaceMember(email: string, role: string) {
  const workspaceId = await resolveWorkspaceId();
  
  // Need the admin client to invite users
  const { createAdminClient } = await import("@/lib/supabase/admin");
  let adminClient;
  try {
    adminClient = createAdminClient();
  } catch (e: any) {
    return { success: false, error: e.message };
  }

  // Invite user via Supabase Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.inviteUserByEmail(email);

  if (authError) {
    return { success: false, error: "Error enviando invitación: " + authError.message };
  }

  const userId = authData.user?.id;
  if (!userId) {
    return { success: false, error: "No se pudo crear el usuario." };
  }

  // Assign user to workspace
  const { error: memberError } = await adminClient
    .from("workspace_members")
    .insert([{
      workspace_id: workspaceId,
      user_id: userId,
      role,
      joined_at: new Date().toISOString(),
    }]);

  if (memberError) {
    // If it fails because the user was already a member, we can ignore or return error
    if (memberError.code === "23505") {
      return { success: false, error: "El usuario ya forma parte de este Workspace." };
    }
    return { success: false, error: "Error asignando al workspace: " + memberError.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
