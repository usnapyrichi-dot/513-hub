"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Search, X, MoreHorizontal, Calendar,
  PlaySquare, LayoutTemplate, Image as ImageIcon, ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Piece = {
  id: string;
  title: string;
  content_type: string;
  status: string;
  publish_date: string | null;
  created_at: string;
  clients: { name: string } | null;
};

type Client = { id: string; name: string };

interface Props {
  pieces: Piece[];
  clients: Client[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_GROUPS = [
  { id: "ideation",    label: "Ideación",    statuses: ["ideation","planning","idea_approved"], color: "#A8A8A8", bg: "#F8F6F6" },
  { id: "production",  label: "Producción",  statuses: ["briefed","pre_production","production","internal_review"], color: "#FF9500", bg: "#FFF7ED" },
  { id: "review",      label: "Review",      statuses: ["client_review","client_approved","client_changes","rework"], color: "#34C759", bg: "#F0FDF4" },
  { id: "published",   label: "Publicado",   statuses: ["scheduled","published"], color: "#1C1C1C", bg: "#F8F6F6" },
];

function getStatusGroup(status: string) {
  return STATUS_GROUPS.find((g) => g.statuses.includes(status)) ?? STATUS_GROUPS[0];
}

function getTypeIcon(type: string) {
  if (type === "reel") return <PlaySquare className="w-4 h-4 text-[#949494]" />;
  if (type.startsWith("carousel")) return <LayoutTemplate className="w-4 h-4 text-[#949494]" />;
  return <ImageIcon className="w-4 h-4 text-[#949494]" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentList({ pieces, clients }: Props) {
  const [search, setSearch]             = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType]     = useState("all");
  const [sortBy, setSortBy]             = useState<"created" | "publish" | "status">("created");

  const filtered = useMemo(() => {
    const base = pieces.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          (p.title ?? "").toLowerCase().includes(q) ||
          (p.clients?.name ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterClient !== "all" && p.clients?.name !== filterClient) return false;
      if (filterStatus !== "all") {
        const group = getStatusGroup(p.status);
        if (group.id !== filterStatus) return false;
      }
      if (filterType !== "all" && p.content_type !== filterType) return false;
      return true;
    });

    return [...base].sort((a, b) => {
      if (sortBy === "publish") {
        const da = a.publish_date ?? a.created_at;
        const db = b.publish_date ?? b.created_at;
        return da < db ? -1 : da > db ? 1 : 0;
      }
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return a.created_at < b.created_at ? 1 : -1;
    });
  }, [pieces, search, filterClient, filterStatus, filterType, sortBy]);

  const hasFilters = search || filterClient !== "all" || filterStatus !== "all" || filterType !== "all";

  const clearFilters = () => {
    setSearch("");
    setFilterClient("all");
    setFilterStatus("all");
    setFilterType("all");
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#949494]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o marca..."
            className="w-full h-9 pl-9 pr-4 border border-[#E5E5E5] rounded-sm text-[11px] text-[#1C1C1C] bg-white focus:outline-none focus:border-[#1C1C1C] placeholder:text-[#CCCCCC]"
          />
        </div>

        {/* Client filter */}
        <FilterSelect
          value={filterClient}
          onChange={setFilterClient}
          options={[
            { value: "all", label: "Todos los clientes" },
            ...clients.map((c) => ({ value: c.name, label: c.name })),
          ]}
        />

        {/* Status filter */}
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: "all", label: "Todos los estados" },
            ...STATUS_GROUPS.map((g) => ({ value: g.id, label: g.label })),
          ]}
        />

        {/* Type filter */}
        <FilterSelect
          value={filterType}
          onChange={setFilterType}
          options={[
            { value: "all",               label: "Todos los formatos" },
            { value: "reel",              label: "Reel" },
            { value: "carousel_animated", label: "Carrusel Animado" },
            { value: "carousel_static",   label: "Carrusel Estático" },
          ]}
        />

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#949494] hover:text-[#FF3B30] transition-colors"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}

        <FilterSelect
          value={sortBy}
          onChange={(v) => setSortBy(v as any)}
          options={[
            { value: "created", label: "Más recientes" },
            { value: "publish", label: "Por fecha pub." },
            { value: "status",  label: "Por estado" },
          ]}
        />

        <span className="ml-auto text-[10px] font-medium text-[#CCCCCC]">
          {filtered.length} pieza{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="w-full h-48 border-2 border-dashed border-[#E5E5E5] rounded-[12px] flex flex-col items-center justify-center text-[#CCCCCC]">
          <Search className="w-6 h-6 mb-2" />
          <p className="text-[11px] font-bold uppercase tracking-widest">Sin resultados</p>
        </div>
      ) : (
        <div className="bg-white rounded-[16px] border border-[#E5E5E5] shadow-sm overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_160px_160px_160px_48px] gap-4 px-6 py-4 border-b border-[#E5E5E5] bg-[#F8F6F6]">
            {["Título", "Cliente", "Formato", "Estado", ""].map((h) => (
              <div key={h} className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-[#F0F0F0]">
            {filtered.map((piece) => {
              const clientName = piece.clients?.name ?? "Sin Marca";
              const sg = getStatusGroup(piece.status);
              const dateStr = piece.publish_date
                ? new Date(piece.publish_date).toLocaleDateString("es-ES", { day:"2-digit", month:"short" })
                : new Date(piece.created_at).toLocaleDateString("es-ES", { day:"2-digit", month:"short" });

              return (
                <Link
                  key={piece.id}
                  href={`/content/${piece.id}`}
                  className="grid grid-cols-[1fr_160px_160px_160px_48px] gap-4 px-6 py-4 items-center hover:bg-[#FAFAFA] transition-colors group"
                >
                  {/* Title */}
                  <div>
                    <h4 className="text-[12px] font-bold text-[#1C1C1C] truncate group-hover:text-[var(--color-accent-red)] transition-colors">
                      {piece.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3 h-3 text-[#CCCCCC]" />
                      <span className="text-[10px] text-[#949494]">{dateStr}</span>
                    </div>
                  </div>

                  {/* Client */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#F8F6F6] border border-[#E5E5E5] flex items-center justify-center text-[9px] font-bold text-[#1C1C1C] flex-shrink-0">
                      {clientName.charAt(0)}
                    </div>
                    <span className="text-[11px] font-bold text-[#1C1C1C] truncate uppercase tracking-wide">
                      {clientName}
                    </span>
                  </div>

                  {/* Type */}
                  <div className="flex items-center gap-2">
                    {getTypeIcon(piece.content_type)}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                      {piece.content_type.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className="inline-block text-[8px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-sm"
                      style={{ color: sg.color, backgroundColor: sg.bg }}
                    >
                      {sg.label}
                    </span>
                  </div>

                  {/* Menu */}
                  <div className="flex justify-center">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-[#CCCCCC] group-hover:text-[#1C1C1C] group-hover:bg-[#F0F0F0] transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-3 pr-7 border border-[#E5E5E5] rounded-sm text-[10px] font-bold uppercase tracking-wide text-[#1C1C1C] bg-white focus:outline-none focus:border-[#1C1C1C] appearance-none cursor-pointer hover:border-[#1C1C1C] transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#949494] pointer-events-none" />
    </div>
  );
}
