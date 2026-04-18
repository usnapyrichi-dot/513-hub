"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createContentPiece } from "@/app/actions/content";
import { Plus, X, Loader2 } from "lucide-react";

const CONTENT_TYPES = [
  { id: "reel",               label: "Reel" },
  { id: "carousel_animated",  label: "Carrusel Animado" },
  { id: "carousel_static",    label: "Carrusel Estático" },
] as const;

const ALL_PLATFORMS = ["instagram", "tiktok", "linkedin", "youtube"];

interface Props {
  clients: { id: string; name: string }[];
}

export function NewPieceModal({ clients }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [contentType, setContentType] = useState<"reel" | "carousel_animated" | "carousel_static">("reel");
  const [platforms, setPlatforms] = useState<string[]>(["instagram"]);
  const [publishDate, setPublishDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-open modal and pre-fill date if coming from calendar
  useEffect(() => {
    const newDate = searchParams.get("newDate");
    if (newDate) {
      setPublishDate(newDate);
      setOpen(true);
      // Clean up URL
      router.replace("/content");
    }
  }, [searchParams, router]);

  const togglePlatform = (p: string) =>
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );

  const handleSubmit = () => {
    if (!title.trim() || !clientId) return;
    startTransition(async () => {
      const res = await createContentPiece({
        client_id: clientId,
        title: title.trim(),
        content_type: contentType,
        platforms,
        publish_date: publishDate || undefined,
      });
      if (res.success) {
        setOpen(false);
        resetForm();
        router.push(`/content/${res.id}`);
      } else {
        alert("Error: " + res.error);
      }
    });
  };

  const resetForm = () => {
    setTitle("");
    setClientId(clients[0]?.id ?? "");
    setContentType("reel");
    setPlatforms(["instagram"]);
    setPublishDate("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-10 px-5 bg-[#1C1C1C] hover:bg-[var(--color-accent-red)] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nueva Pieza
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-[16px] shadow-2xl w-full max-w-[520px] mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[#E5E5E5]">
              <div>
                <h2 className="text-[14px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                  Nueva Pieza de Contenido
                </h2>
                <p className="text-[10px] text-[#949494] font-medium mt-0.5 uppercase tracking-widest">
                  Se creará en estado Planning
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0F0F0] text-[#949494] hover:text-[#1C1C1C] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">

              {/* Title */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
                  Título / Concepto *
                </label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Ej: BMW Serie 3 — Lanzamiento Primavera 2025"
                  className="w-full h-11 px-4 border border-[#E5E5E5] rounded-sm text-[12px] text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] placeholder:text-[#CCCCCC]"
                />
              </div>

              {/* Client */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
                  Cliente / Marca *
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-11 px-4 border border-[#E5E5E5] rounded-sm text-[12px] font-bold uppercase text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] bg-white"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Content Type */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
                  Tipo de Formato *
                </label>
                <div className="flex gap-2">
                  {CONTENT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setContentType(t.id)}
                      className={`flex-1 py-2.5 text-[9px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
                        contentType === t.id
                          ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
                          : "bg-white text-[#949494] border-[#E5E5E5] hover:border-[#1C1C1C] hover:text-[#1C1C1C]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
                  Plataformas
                </label>
                <div className="flex gap-2">
                  {ALL_PLATFORMS.map((p) => (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      className={`px-3 py-2 text-[9px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
                        platforms.includes(p)
                          ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
                          : "bg-white text-[#949494] border-[#E5E5E5] hover:border-[#1C1C1C]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Publish Date */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
                  Fecha de publicación (opcional)
                </label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full h-11 px-4 border border-[#E5E5E5] rounded-sm text-[12px] text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t border-[#E5E5E5] flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 h-11 text-[10px] font-bold uppercase tracking-widest border border-[#E5E5E5] rounded-sm text-[#949494] hover:border-[#1C1C1C] hover:text-[#1C1C1C] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending || !title.trim() || !clientId}
                className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#1C1C1C] hover:bg-[var(--color-accent-red)] disabled:opacity-40 text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors"
              >
                {isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</>
                ) : (
                  <><Plus className="w-4 h-4" /> Crear Pieza</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
