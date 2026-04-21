// Temporary debug page for Bloque 5 verification.
// Delete this route before merging to main (Bloque 16).
import { getCurrentWorkspace } from "@/lib/supabase/workspace";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DebugWorkspacePage() {
  const supabase = await createClient();

  // 1. Auth check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // 2. Raw membership query (bypasses getCurrentWorkspace wrapper)
  const { data: rawMembership, error: membershipError } = user
    ? await supabase
        .from("workspace_members")
        .select("*")
        .eq("user_id", user.id)
        .limit(5)
    : { data: null, error: null };

  // 3. getCurrentWorkspace result
  const ws = await getCurrentWorkspace();

  return (
    <div style={{ padding: 32, fontFamily: "monospace", maxWidth: 900 }}>
      <h1>Debug — Auth + Workspace</h1>

      <h2 style={{ marginTop: 24 }}>1. auth.getUser()</h2>
      <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 8 }}>
        {JSON.stringify({ user: user ? { id: user.id, email: user.email } : null, authError }, null, 2)}
      </pre>

      <h2 style={{ marginTop: 24 }}>2. Raw workspace_members query</h2>
      <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 8 }}>
        {JSON.stringify({ rawMembership, membershipError }, null, 2)}
      </pre>

      <h2 style={{ marginTop: 24 }}>3. getCurrentWorkspace()</h2>
      <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 8 }}>
        {JSON.stringify(ws, null, 2)}
      </pre>

      {ws === null ? (
        <p style={{ marginTop: 16, color: "#b00" }}>
          ⚠ getCurrentWorkspace devuelve null.
        </p>
      ) : (
        <p style={{ marginTop: 16, color: "#060" }}>
          ✅ Membership resuelta correctamente.
        </p>
      )}
    </div>
  );
}
