import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/ui/toast";
import { getWorkspaceSettings } from "@/app/actions/workspace";
import { WorkspaceProvider } from "@/components/layout/workspace-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // getWorkspaceSettings handles missing workspace gracefully (returns defaults).
  // Unauthenticated users are already redirected by middleware before reaching here.
  const settings = await getWorkspaceSettings();

  return (
    <ToastProvider>
      <WorkspaceProvider settings={settings}>
        <div className="flex min-h-screen bg-[var(--color-surface-container-low)]">
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-x-hidden min-h-screen" style={{ marginLeft: "280px" }}>
            {children}
          </main>
        </div>
      </WorkspaceProvider>
    </ToastProvider>
  );
}
