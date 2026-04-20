"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Film, LayoutTemplate, Image as ImageIcon, Plus } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Piece = {
  id: string;
  title: string;
  content_type: string;
  status: string;
  publish_date: string | null;
  clients: { name: string } | null;
};

const STATUS_COLOR: Record<string, string> = {
  planning:       "#A8A8A8",
  briefed:        "#A8A8A8",
  ideation:       "#A8A8A8",
  pre_production: "#FF9500",
  production:     "#FF9500",
  internal_review:"#FF9500",
  client_review:  "#34C759",
  client_approved:"#34C759",
  scheduled:      "#007AFF",
  published:      "#1C1C1C",
};

const TYPE_ICON = (type: string) => {
  if (type === "reel") return Film;
  if (type.startsWith("carousel")) return LayoutTemplate;
  return ImageIcon;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CalendarGrid({ pieces }: { pieces: Piece[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const router = useRouter();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Make Mon=0

  // Group pieces by day
  const piecesByDay: Record<number, Piece[]> = {};
  pieces.forEach((p) => {
    if (!p.publish_date) return;
    const d = new Date(p.publish_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!piecesByDay[day]) piecesByDay[day] = [];
      piecesByDay[day].push(p);
    }
  });

  // Unscheduled pieces
  const unscheduled = pieces.filter((p) => !p.publish_date);

  const monthName = new Date(year, month, 1).toLocaleDateString("es-ES", {
    month: "long", year: "numeric",
  });

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="p-12 space-y-8 animate-fade-up">

      {/* Header nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#1C1C1C] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h2 className="text-[18px] font-bold uppercase tracking-widest text-[#1C1C1C] capitalize">
          {monthName}
        </h2>

        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center border border-[#E5E5E5] rounded-sm hover:border-[#1C1C1C] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="text-center py-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">{d}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-[#E5E5E5] rounded-[12px] overflow-hidden border border-[#E5E5E5]">
        {/* Empty cells before first day */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-[#FAFAFA] min-h-[110px] p-2" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayPieces = piecesByDay[day] ?? [];
          const today_ = isToday(day);

          return (
            <div
              key={day}
              className={`bg-white min-h-[110px] p-2 transition-colors hover:bg-[#FAFAFA] relative group ${
                today_ ? "bg-[#FAFAFA]" : ""
              }`}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              {/* Day number */}
              <div className={`w-6 h-6 flex items-center justify-center mb-1.5 rounded-full text-[11px] font-bold ${
                today_
                  ? "bg-[#1C1C1C] text-white"
                  : "text-[#949494]"
              }`}>
                {day}
              </div>

              {/* Quick add button (hover) */}
              {dayPieces.length === 0 && hoveredDay === day && (
                <button
                  onClick={() => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    router.push(`/content?newDate=${dateStr}`);
                  }}
                  className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-[#E5E5E5] hover:bg-[#1C1C1C] hover:text-white text-[#949494] rounded-sm flex items-center justify-center transition-all"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}

              {/* Pieces */}
              <div className="space-y-1">
                {dayPieces.slice(0, 3).map((p) => {
                  const Icon = TYPE_ICON(p.content_type);
                  const color = STATUS_COLOR[p.status] ?? "#A8A8A8";
                  return (
                    <Link
                      key={p.id}
                      href={`/content/${p.id}`}
                      className="flex items-center gap-1 px-1.5 py-1 rounded-sm hover:opacity-80 transition-opacity group"
                      style={{ backgroundColor: color + "18", borderLeft: `2px solid ${color}` }}
                    >
                      <Icon className="w-2.5 h-2.5 flex-shrink-0" style={{ color }} />
                      <span className="text-[9px] font-bold text-[#1C1C1C] truncate leading-tight">
                        {p.clients?.name ? `${p.clients.name.slice(0,8)} · ` : ""}
                        {p.title}
                      </span>
                    </Link>
                  );
                })}
                {dayPieces.length > 3 && (
                  <span className="text-[8px] font-bold text-[#949494] uppercase tracking-widest pl-1">
                    +{dayPieces.length - 3} más
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Fill remaining cells */}
        {Array.from({
          length: (7 - ((startOffset + daysInMonth) % 7)) % 7,
        }).map((_, i) => (
          <div key={`end-${i}`} className="bg-[#FAFAFA] min-h-[110px] p-2" />
        ))}
      </div>

      {/* Unscheduled pieces */}
      {unscheduled.length > 0 && (
        <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-6">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#949494] mb-4">
            Sin Fecha Asignada — {unscheduled.length} pieza{unscheduled.length !== 1 ? "s" : ""}
          </h3>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((p) => {
              const color = STATUS_COLOR[p.status] ?? "#A8A8A8";
              return (
                <Link
                  key={p.id}
                  href={`/content/${p.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm border border-[#E5E5E5] hover:border-[#1C1C1C] transition-colors bg-[#FAFAFA]"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-bold text-[#1C1C1C] uppercase tracking-wide">
                    {p.clients?.name && <span className="text-[#949494]">{p.clients.name} · </span>}
                    {p.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 justify-end">
        {[
          { color: "#A8A8A8", label: "Ideation / Planning" },
          { color: "#FF9500", label: "Producción" },
          { color: "#34C759", label: "Review Cliente" },
          { color: "#007AFF", label: "Programado" },
          { color: "#1C1C1C", label: "Publicado" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-[9px] font-medium text-[#949494] uppercase tracking-widest">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
