// =============================================
// 513 HUB v1.5 — getCurrentWorkspace helper
// =============================================
// Resolves the current workspace + role for a Server Component /
// Server Action using the already-authenticated Supabase SSR client.
//
// Contract:
//   * If the user is NOT signed in  → returns null
//   * If signed in but has NO membership → returns null (caller decides
//     whether to 403 or redirect to /login)
//   * If signed in with 1+ memberships → returns the FIRST membership
//     (ordered by joined_at ASC, so the original owner wins for the
//      default admin on v1.5). Multi-workspace switching lands in v2.
//
// This function is safe to call in Server Components and Server Actions.
// It must NEVER be imported from client components (it reads auth cookies
// via the SSR client).

import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole } from "@/types/database";

export interface CurrentWorkspace {
  workspaceId: string;
  role: WorkspaceRole;
  userId: string;
}

export async function getCurrentWorkspace(): Promise<CurrentWorkspace | null> {
  const supabase = await createClient();

  // 1. Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 2. Membership (first one, oldest first)
  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Surface the error to logs but do not throw: callers handle null.
    console.error("[getCurrentWorkspace] membership query failed:", error);
    return null;
  }

  if (!membership) return null;

  return {
    workspaceId: membership.workspace_id as string,
    role: membership.role as WorkspaceRole,
    userId: user.id,
  };
}

/**
 * Throws a 403-like Error if there is no current workspace.
 * Use this in Server Actions where a membership is REQUIRED.
 */
export async function requireCurrentWorkspace(): Promise<CurrentWorkspace> {
  const ws = await getCurrentWorkspace();
  if (!ws) {
    throw new Error(
      "No workspace membership for current user. Sign in and ensure you were invited to a workspace."
    );
  }
  return ws;
}

/**
 * True if the given role has TEAM-level access (i.e. can see/edit
 * everything in the workspace). Mirrors the SQL helper is_team_member().
 */
export function isTeamRole(role: WorkspaceRole): boolean {
  return role !== "client_viewer";
}

/**
 * Resolve the workspace_id to attach to an INSERT.
 *
 * - If the user is authenticated and has a membership → use it.
 * - Otherwise (dev / no-session phase of v1.5 staging) → fall back to
 *   the UNIQUE workspace in the DB. This branch is only reachable while
 *   auth middleware is disabled. It disappears in Bloque 11 when login
 *   becomes mandatory and real RLS kicks in.
 *
 * Returns the workspace UUID as string, or throws if neither path resolves.
 */
export async function resolveWorkspaceId(): Promise<string> {
  const ws = await getCurrentWorkspace();
  if (ws) return ws.workspaceId;

  // Fallback path (single-tenant v1.5 dev phase).
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      "resolveWorkspaceId: no authenticated user and no workspace in DB."
    );
  }
  return data.id as string;
}
