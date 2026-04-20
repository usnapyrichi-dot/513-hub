"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { useWorkspace } from "./workspace-context";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { settings } = useWorkspace();
  const agencyName = settings?.agency_name || "513 HUB";
  
  const words = agencyName.trim().split(/\s+/);
  const initials = (words.length >= 2 ? words[0][0] + words[1][0] : agencyName.slice(0, 2)).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-12 py-8 bg-[var(--color-surface-container-low)] border-b border-[rgba(173,179,176,0.12)]">
      {/* Left: Title */}
      <div className="flex items-center gap-6 min-w-0">
        <div className="min-w-0">
          <h1
            className="text-[22px] font-bold text-[var(--color-on-surface)] uppercase"
            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.02em" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] text-[var(--color-on-surface-variant)] mt-1.5 font-medium tracking-[0.01em]">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-4">
        {actions}
      </div>

      {/* Right: Notifications + Avatar */}
      <div className="flex items-center gap-5">
        <Button
          variant="ghost" size="icon"
          className="w-[42px] h-[42px] rounded-full text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)]"
        >
          <Bell className="w-5 h-5" strokeWidth={1.5} />
        </Button>

        {/* Agency avatar */}
        <div
          title={agencyName}
          className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center text-[11px] font-bold text-white cursor-pointer hover:bg-[var(--color-accent-red)] transition-all"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
