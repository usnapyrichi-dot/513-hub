"use client";

import { createContext, useContext } from "react";

type WorkspaceSettings = {
  agency_name: string;
  tagline: string;
  logo_url?: string;
  timezone: string;
  notification_prefs: any;
  branding: any;
};

const WorkspaceContext = createContext<{ settings: WorkspaceSettings | null }>({ settings: null });

export function WorkspaceProvider({ children, settings }: { children: React.ReactNode, settings: WorkspaceSettings }) {
  return (
    <WorkspaceContext.Provider value={{ settings }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return context;
}
