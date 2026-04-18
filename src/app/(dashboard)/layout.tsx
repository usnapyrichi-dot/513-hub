"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/ui/toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[var(--color-surface-container-low)]">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-x-hidden min-h-screen" style={{ marginLeft: "280px" }}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
