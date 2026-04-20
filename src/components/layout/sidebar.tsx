"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./workspace-context";
import {
  LayoutDashboard,
  Lightbulb,
  Building2,
  Database,
  CalendarDays,
  Settings,
  Sparkles,
  PresentationIcon,
  Images,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard",       href: "/",               icon: LayoutDashboard },
  { label: "Brand Hub",       href: "/clients",        icon: Building2 },
  { label: "Ideation Studio", href: "/ideation",       icon: Lightbulb },
  { label: "Content Master",  href: "/content",        icon: Database },
  { label: "IA Studio",       href: "/ai-studio",      icon: Sparkles },
  { label: "Calendar",        href: "/calendar",       icon: CalendarDays },
  { label: "Assets",          href: "/assets",         icon: Images },
  { label: "Presentaciones",  href: "/presentations",  icon: PresentationIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { settings } = useWorkspace();
  const agencyName = settings?.agency_name || "513 HUB";
  const tagline = settings?.tagline || "Editorial Studio";
  const initial = (agencyName || "5").charAt(0).toUpperCase();

  return (
    <aside
      className="fixed left-0 top-0 z-40 h-screen flex flex-col bg-[var(--color-surface-container-lowest)] select-none border-r border-[rgba(173,179,176,0.15)]"
      style={{ width: "280px" }}
    >
      {/* Logo — with breathing room */}
      <div className="px-10 pt-12 pb-10">
        <Link href="/" className="flex items-center gap-4 group">
          <div className="w-[42px] h-[42px] bg-[var(--color-on-surface)] rounded-xl flex items-center justify-center text-[var(--color-surface-container-lowest)] font-bold text-base shadow-sm"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            {initial}
          </div>
          <div>
            <span className="block font-bold text-[15px] text-[var(--color-on-surface)]"
              style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "0.02em" }}
            >
              {agencyName}
            </span>
            <span className="block text-[11px] text-[var(--color-accent-red)] font-medium mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]"
              style={{ letterSpacing: "0.02em" }}
            >
              {tagline}
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation — generous spacing */}
      <nav className="flex-1 px-6 space-y-1 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-5 py-3 text-[13px] font-medium tracking-[0.02em] rounded-xl transition-all duration-150 group",
                isActive
                  ? "bg-[var(--color-accent-red-bg)] text-[var(--color-accent-red)] font-semibold"
                  : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
              )}
            >
              <item.icon
                className="w-5 h-5 flex-shrink-0"
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom — Settings */}
      <div className="px-6 pb-10">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-4 px-5 py-3.5 text-[13px] font-medium tracking-[0.02em] rounded-xl transition-all duration-150",
            pathname.startsWith("/settings")
              ? "bg-[var(--color-surface-container)] text-[var(--color-on-surface)] font-semibold"
              : "text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
