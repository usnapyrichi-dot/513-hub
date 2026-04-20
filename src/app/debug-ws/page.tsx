// Temporary debug page for Bloque 5 verification.
// Delete this route before merging to main (Bloque 16).
import { getCurrentWorkspace } from "@/lib/supabase/workspace";

export const dynamic = "force-dynamic";

export default async function DebugWorkspacePage() {
  const ws = await getCurrentWorkspace();

  return (
    <div style={{ padding: 32, fontFamily: "monospace" }}>
      <h1>Debug — getCurrentWorkspace()</h1>
      <pre
        style={{
          background: "#f4f4f4",
          padding: 16,
          borderRadius: 8,
          marginTop: 16,
        }}
      >
        {JSON.stringify(ws, null, 2)}
      </pre>
      {ws === null ? (
        <p style={{ marginTop: 16, color: "#b00" }}>
          ⚠ No hay usuario autenticado o no pertenece a ninguna workspace.
        </p>
      ) : (
        <p style={{ marginTop: 16, color: "#060" }}>
          ✅ Membership resuelta correctamente.
        </p>
      )}
    </div>
  );
}
