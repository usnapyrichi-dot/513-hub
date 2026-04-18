import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import Link from "next/link";
import { KanbanBoard } from "./kanban-board";

export const dynamic = 'force-dynamic';

// ─── Status groupings for stats ───────────────────────────────────────────────
const STAT_GROUPS = [
  { label: "Ideación",    statuses: ["ideation","planning","idea_approved"],                           color: "#A8A8A8" },
  { label: "Producción",  statuses: ["briefed","pre_production","production","internal_review"],       color: "#FF9500" },
  { label: "Review",      statuses: ["client_review","client_approved","client_changes","rework"],     color: "#34C759" },
  { label: "Publicado",   statuses: ["scheduled","published"],                                         color: "#1C1C1C" },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: pieces }, { data: clients }] = await Promise.all([
    supabase
      .from('content_pieces')
      .select('id, title, description, content_type, status, created_at, clients ( name )')
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, name')
      .order('name'),
  ]);

  const allPieces = pieces ?? [];

  // Compute stats
  const stats = STAT_GROUPS.map((g) => ({
    ...g,
    count: allPieces.filter((p) => g.statuses.includes(p.status)).length,
  }));
  const total = allPieces.length;

  return (
    <>
      <Header
        title="PLANNING DASHBOARD"
        actions={
          <div className="flex items-center gap-1 bg-[var(--color-surface-container-low)] rounded-lg p-1">
            <button className="px-5 py-2 text-[12px] font-bold uppercase tracking-[0.06em] bg-[var(--color-surface-container-lowest)] rounded-md text-[var(--color-on-surface)] shadow-sm">
              KANBAN
            </button>
            <Link href="/calendar">
              <button className="px-5 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--color-on-surface-variant)] rounded-md hover:text-[var(--color-on-surface)]">
                TIMELINE
              </button>
            </Link>
          </div>
        }
      />

      {/* Stats bar */}
      {total > 0 && (
        <div className="px-12 pt-8 pb-2">
          <div className="grid grid-cols-5 gap-3">
            {/* Total */}
            <div className="bg-white border border-[#E5E5E5] rounded-[12px] p-4 flex flex-col gap-1">
              <span className="text-[28px] font-bold text-[#1C1C1C] leading-none">{total}</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">Total Piezas</span>
              <div className="mt-2 h-0.5 w-full bg-[#1C1C1C] rounded-full" />
            </div>
            {/* Per-column stats */}
            {stats.map((s) => {
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s.label} className="bg-white border border-[#E5E5E5] rounded-[12px] p-4 flex flex-col gap-1">
                  <span className="text-[28px] font-bold leading-none" style={{ color: s.color }}>{s.count}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">{s.label}</span>
                  <div className="mt-2 h-0.5 w-full bg-[#F0F0F0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <KanbanBoard pieces={allPieces} clients={clients ?? []} />
    </>
  );
}
