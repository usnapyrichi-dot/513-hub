"use client";

import { useState, useMemo } from "react";
import {
  Film, FileCode, Image as ImageIcon, Search, X,
  Download, Star, ChevronDown, Trash2, Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { deleteAsset, toggleAssetFinal } from "@/app/actions/assets";

// ─── Types ────────────────────────────────────────────────────────────────────

type Asset = {
  id: string;
  file_name: string | null;
  file_url: string;
  file_type: "image" | "video" | "design_file";
  mime_type: string | null;
  file_size_bytes: number | null;
  version: number;
  is_final: boolean;
  created_at: string;
  content_pieces: {
    id: string;
    title: string | null;
    clients: { name: string } | null;
  } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getProxyUrl(fileUrl: string) {
  if (fileUrl.includes("/storage/v1/object/public/assets/")) {
    const parts = fileUrl.split("/storage/v1/object/public/assets/");
    if (parts.length > 1) {
      return `/api/assets?path=${encodeURIComponent(parts[1])}`;
    }
  }
  return fileUrl;
}

function formatBytes(b: number) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

const TYPE_ICON = { image: ImageIcon, video: Film, design_file: FileCode };

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialAssets: Asset[];
  clients: { id: string; name: string }[];
}

export function AssetsGallery({ initialAssets, clients }: Props) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterFinal, setFilterFinal] = useState(false);
  const supabase = createClient();

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !(a.file_name ?? "").toLowerCase().includes(q) &&
          !(a.content_pieces?.title ?? "").toLowerCase().includes(q) &&
          !(a.content_pieces?.clients?.name ?? "").toLowerCase().includes(q)
        ) return false;
      }
      if (filterType !== "all" && a.file_type !== filterType) return false;
      if (filterClient !== "all" && a.content_pieces?.clients?.name !== filterClient) return false;
      if (filterFinal && !a.is_final) return false;
      return true;
    });
  }, [assets, search, filterType, filterClient, filterFinal]);

  const totalSize = filtered.reduce((acc, a) => acc + (a.file_size_bytes ?? 0), 0);

  const handleToggleFinal = async (asset: Asset) => {
    await toggleAssetFinal(asset.id, !asset.is_final);
    setAssets((prev) => prev.map((a) => a.id === asset.id ? { ...a, is_final: !a.is_final } : a));
  };

  const handleDelete = async (asset: Asset) => {
    if (!confirm(`¿Eliminar "${asset.file_name}"?`)) return;
    const urlParts = asset.file_url.split("/storage/v1/object/public/assets/");
    if (urlParts[1]) await supabase.storage.from("assets").remove([urlParts[1]]);
    await deleteAsset(asset.id);
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
  };

  return (
    <div className="p-12 space-y-6 animate-fade-up">

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#949494]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar assets..."
            className="w-full h-9 pl-9 pr-4 border border-[#E5E5E5] rounded-sm text-[11px] text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] placeholder:text-[#CCCCCC]" />
        </div>

        <FilterSel value={filterClient} onChange={setFilterClient}
          options={[{ value: "all", label: "Todos los clientes" }, ...clients.map((c) => ({ value: c.name, label: c.name }))]} />

        <FilterSel value={filterType} onChange={setFilterType}
          options={[{ value: "all", label: "Todos los tipos" }, { value: "image", label: "Imágenes" }, { value: "video", label: "Vídeos" }, { value: "design_file", label: "Archivos de diseño" }]} />

        <button onClick={() => setFilterFinal((v) => !v)}
          className={`flex items-center gap-1.5 h-9 px-3 rounded-sm text-[9px] font-bold uppercase tracking-widest border transition-all ${filterFinal ? "bg-[#FFD700] border-[#FFD700] text-[#1C1C1C]" : "bg-white border-[#E5E5E5] text-[#949494] hover:border-[#1C1C1C]"}`}>
          <Crown className={`w-3 h-3 ${filterFinal ? "fill-current" : ""}`} />
          Solo Finales
        </button>

        {(search || filterClient !== "all" || filterType !== "all" || filterFinal) && (
          <button onClick={() => { setSearch(""); setFilterClient("all"); setFilterType("all"); setFilterFinal(false); }}
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#949494] hover:text-[#FF3B30]">
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] text-[#CCCCCC]">{filtered.length} archivos · {formatBytes(totalSize)}</span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[#E5E5E5] rounded-[16px] text-[#CCCCCC]">
          <ImageIcon className="w-8 h-8 mb-2" />
          <p className="text-[11px] font-bold uppercase tracking-widest">Sin assets</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((asset) => {
            const Icon = TYPE_ICON[asset.file_type] ?? ImageIcon;
            return (
              <div key={asset.id}
                className={`group bg-white border rounded-[12px] overflow-hidden transition-all hover:shadow-md ${asset.is_final ? "border-[#FFD700]" : "border-[#E5E5E5] hover:border-[#1C1C1C]"}`}>

                {/* Preview */}
                <div className="aspect-video bg-[#F8F6F6] relative overflow-hidden">
                  {asset.file_type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getProxyUrl(asset.file_url)} alt={asset.file_name ?? ""} className="w-full h-full object-cover" />
                  ) : asset.file_type === "video" ? (
                    <video src={getProxyUrl(asset.file_url)} className="w-full h-full object-cover" muted playsInline
                      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                      onMouseLeave={(e) => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0; }} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-1">
                      <Icon className="w-8 h-8 text-[#CCCCCC]" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-[#CCCCCC]">
                        {asset.mime_type?.split("/").pop()?.toUpperCase() ?? "FILE"}
                      </span>
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[rgba(28,28,28,0.5)] opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                    <a href={getProxyUrl(asset.file_url)} target="_blank" rel="noopener noreferrer" download
                      className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-white" title="Descargar">
                      <Download className="w-3.5 h-3.5 text-[#1C1C1C]" />
                    </a>
                    <button onClick={() => handleToggleFinal(asset)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${asset.is_final ? "bg-[#FFD700]" : "bg-white/90 hover:bg-[#FFD700]"}`} title="Marcar como final">
                      <Crown className="w-3.5 h-3.5 text-[#1C1C1C]" />
                    </button>
                    <button onClick={() => handleDelete(asset)}
                      className="w-8 h-8 rounded-full bg-white/90 hover:bg-[#FF3B30] hover:text-white flex items-center justify-center text-[#949494] transition-all" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {asset.is_final && (
                    <div className="absolute top-1.5 right-1.5 bg-[#FFD700] text-[#1C1C1C] text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                      <Star className="w-2 h-2 fill-current" /> FINAL
                    </div>
                  )}
                  {asset.version > 1 && (
                    <div className="absolute top-1.5 left-1.5 bg-[#1C1C1C]/80 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-sm">
                      v{asset.version}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-[10px] font-bold text-[#1C1C1C] truncate">{asset.file_name ?? "Sin nombre"}</p>
                  {asset.content_pieces && (
                    <p className="text-[9px] text-[#949494] truncate mt-0.5">
                      {asset.content_pieces.clients?.name && (
                        <span className="font-bold">{asset.content_pieces.clients.name} · </span>
                      )}
                      {asset.content_pieces.title}
                    </p>
                  )}
                  <p className="text-[9px] text-[#CCCCCC] mt-0.5">
                    {asset.file_size_bytes ? formatBytes(asset.file_size_bytes) : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterSel({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-9 pl-3 pr-7 border border-[#E5E5E5] rounded-sm text-[10px] font-bold uppercase tracking-wide text-[#1C1C1C] bg-white focus:outline-none focus:border-[#1C1C1C] appearance-none cursor-pointer hover:border-[#1C1C1C] transition-colors">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#949494] pointer-events-none" />
    </div>
  );
}
