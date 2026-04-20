"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateContentStatus, createContentPiece } from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Calendar, Plus, Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Piece = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  status: string;
  created_at: string;
  clients: { name: string } | null;
};

type Column = {
  id: string;
  title: string;
  targetStatus: string; // status to assign on drop
  statuses: string[];   // statuses that belong here
  accent: string;       // top-border color
};

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: Column[] = [
  {
    id: "ideation",
    title: "IDEATION",
    targetStatus: "ideation",
    statuses: ["ideation", "planning", "idea_approved"],
    accent: "#A8A8A8",
  },
  {
    id: "production",
    title: "PRODUCTION",
    targetStatus: "production",
    statuses: ["briefed", "pre_production", "production", "internal_review"],
    accent: "#FF9500",
  },
  {
    id: "review",
    title: "CLIENT REVIEW",
    targetStatus: "client_review",
    statuses: ["client_review", "client_approved", "client_changes", "rework"],
    accent: "#34C759",
  },
  {
    id: "published",
    title: "PUBLISHED",
    targetStatus: "scheduled",
    statuses: ["scheduled", "published"],
    accent: "#1C1C1C",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Client = { id: string; name: string };

export function KanbanBoard({ pieces: initialPieces, clients }: { pieces: Piece[]; clients: Client[] }) {
  const [pieces, setPieces] = useState<Piece[]>(initialPieces);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [quickAddCol, setQuickAddCol] = useState<string | null>(null);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickClient, setQuickClient] = useState(clients[0]?.id ?? "");
  const [isAdding, setIsAdding] = useState(false);
  const dragSourceStatus = useRef<string>("");
  const router = useRouter();
  const { toast } = useToast();

  const handleQuickAdd = async (col: Column) => {
    if (!quickTitle.trim() || !quickClient) return;
    setIsAdding(true);
    const res = await createContentPiece({
      client_id: quickClient,
      title: quickTitle.trim(),
      content_type: "reel",
      platforms: ["instagram"],
      status: col.targetStatus,
    });
    setIsAdding(false);
    if (res.success) {
      setQuickAddCol(null);
      setQuickTitle("");
      router.push(`/content/${res.id}`);
    } else {
      alert("Error: " + res.error);
    }
  };

  // ── Distribute pieces into columns ──────────────────────────────────────────
  const columnCards = (col: Column) =>
    pieces.filter((p) => col.statuses.includes(p.status));

  // ── Drag handlers ────────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, piece: Piece) => {
    e.dataTransfer.setData("pieceId", piece.id);
    e.dataTransfer.effectAllowed = "move";
    dragSourceStatus.current = piece.status;
    setDraggingId(piece.id);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column wrapper entirely
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent, col: Column) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData("pieceId");
    if (!id) return;

    const piece = pieces.find((p) => p.id === id);
    if (!piece) return;

    // If dropping on the same column, do nothing
    if (col.statuses.includes(piece.status)) return;

    // Optimistic update
    setPieces((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: col.targetStatus } : p
      )
    );
    setDraggingId(null);

    // Persist to DB
    startTransition(async () => {
      const res = await updateContentStatus(id, col.targetStatus);
      if (!res.success) {
        setPieces((prev) =>
          prev.map((p) => p.id === id ? { ...p, status: dragSourceStatus.current } : p)
        );
        toast("Error al cambiar estado", "error");
      } else {
        toast(`Movida a ${col.title}`, "success");
        router.refresh();
      }
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-12 animate-fade-up">
      <div className="grid grid-cols-4 gap-6">
        {COLUMNS.map((col, colIndex) => {
          const cards = columnCards(col);
          const isOver = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col)}
              className={`space-y-5 px-1 rounded-[16px] transition-all duration-150 ${
                isOver
                  ? "bg-[rgba(28,28,28,0.03)] ring-1 ring-[rgba(28,28,28,0.08)]"
                  : ""
              }`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-2 py-2">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: col.accent }} />
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--color-on-surface)]"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {String(colIndex + 1).padStart(2, "0")}. {col.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[var(--color-on-surface-variant)]">{cards.length}</span>
                  <button
                    onClick={() => { setQuickAddCol(quickAddCol === col.id ? null : col.id); setQuickTitle(""); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-[#949494] hover:bg-[#F0F0F0] hover:text-[#1C1C1C] transition-all"
                    title="Añadir pieza">
                    {quickAddCol === col.id ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Quick-add form */}
              {quickAddCol === col.id && (
                <div className="mx-1 mb-2 bg-white border border-[#E5E5E5] rounded-[12px] p-3 space-y-2 shadow-sm">
                  <input autoFocus value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleQuickAdd(col); if (e.key === "Escape") setQuickAddCol(null); }}
                    placeholder="Título de la pieza..."
                    className="w-full text-[11px] px-3 py-2 border border-[#E5E5E5] rounded-sm focus:outline-none focus:border-[#1C1C1C] placeholder:text-[#CCCCCC]" />
                  <select value={quickClient} onChange={(e) => setQuickClient(e.target.value)}
                    className="w-full text-[10px] font-bold uppercase px-3 py-2 border border-[#E5E5E5] rounded-sm focus:outline-none focus:border-[#1C1C1C] bg-white appearance-none">
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={() => handleQuickAdd(col)} disabled={isAdding || !quickTitle.trim()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1C1C1C] hover:bg-[var(--color-accent-red)] disabled:opacity-40 text-white text-[9px] font-bold uppercase tracking-widest rounded-sm transition-colors">
                      {isAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Crear
                    </button>
                    <button onClick={() => setQuickAddCol(null)}
                      className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest border border-[#E5E5E5] rounded-sm text-[#949494] hover:border-[#1C1C1C] transition-colors">
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Cards */}
              <div className={`space-y-4 min-h-[200px] transition-all`}>
                {cards.map((card) => {
                  const clientName = card.clients?.name ?? "Unassigned";
                  const cType = card.content_type ?? "post";
                  const isDragging = draggingId === card.id;

                  return (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card)}
                      onDragEnd={handleDragEnd}
                      className={`transition-all duration-150 ${
                        isDragging
                          ? "opacity-40 scale-[0.97] cursor-grabbing"
                          : "cursor-grab"
                      }`}
                    >
                      <Link
                        href={`/content/${card.id}`}
                        onClick={(e) => {
                          // Prevent navigation when dragging
                          if (draggingId) e.preventDefault();
                        }}
                        className="block bg-white rounded-[16px] p-6 space-y-4 group transition-all border border-[rgba(173,179,176,0.15)] hover:border-[#1C1C1C]"
                        style={{
                          boxShadow:
                            "0 2px 8px rgba(46,52,50,0.04), 0 8px 24px rgba(46,52,50,0.02)",
                          borderTop: `3px solid ${col.accent}`,
                        }}
                      >
                        {/* Badge + Menu */}
                        <div className="flex items-start justify-between">
                          <Badge
                            variant="outline"
                            className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest border-[#E5E5E5] text-[#1C1C1C]"
                          >
                            {cType.replace("_", " ")}
                          </Badge>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-outline)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface-container-low)] transition-all">
                            <MoreHorizontal className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Client + Title + Desc */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#949494]">
                            {clientName}
                          </span>
                          <h4 className="text-[14px] font-bold text-[var(--color-on-surface)] leading-tight line-clamp-2">
                            {card.title}
                          </h4>
                          <p className="text-[11px] text-[var(--color-on-surface-variant)] leading-relaxed line-clamp-2">
                            {card.description ?? "Sin descripción detallada."}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[var(--color-outline)]" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-on-surface-variant)]">
                              {new Date(card.created_at).toLocaleDateString(
                                "es-ES",
                                { day: "2-digit", month: "short" }
                              )}
                            </span>
                          </div>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] uppercase font-bold ring-2 ring-white bg-[#F8F6F6] text-[#1C1C1C] border border-[#E5E5E5]"
                            title={clientName}
                          >
                            {clientName.charAt(0)}
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}

                {/* Empty column placeholder */}
                {cards.length === 0 && (
                  <div
                    className={`border-2 border-dashed rounded-[16px] flex flex-col items-center justify-center py-14 text-center transition-all ${
                      isOver
                        ? "border-[#1C1C1C] opacity-80"
                        : "border-[var(--color-outline-variant)] opacity-40"
                    }`}
                  >
                    <Plus className="w-5 h-5 text-[var(--color-outline)] mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-outline)]">
                      {isOver ? "SOLTAR AQUÍ" : "VACÍO"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Saving indicator */}
      {isPending && (
        <div className="fixed bottom-6 right-6 bg-[#1C1C1C] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF9500] animate-pulse" />
          Guardando...
        </div>
      )}
    </div>
  );
}
