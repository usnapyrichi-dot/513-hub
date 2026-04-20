"use client";

import { useState, useTransition } from "react";
import { updateContentStatus, updateContentFields, deleteContentPiece } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import {
  Edit3, ImageIcon, Send, MessageSquare, Tag, User,
  MapPin, Loader2, Save, Settings2, FileText, Camera, Type, Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { AssetGallery } from "./asset-gallery";
import { CommentThread } from "./comment-thread";
import { BriefingPanel } from "./briefing-panel";
import type { Asset, Comment, Briefing } from "@/types/database";

// ─── Status accent color ──────────────────────────────────────────────────────

function statusAccent(status: string): string {
  if (["production", "pre_production", "briefed"].includes(status)) return "#FF9500";
  if (["client_review", "internal_review", "client_approved"].includes(status)) return "#34C759";
  if (["scheduled", "published"].includes(status)) return "#1C1C1C";
  return "var(--color-accent-red)";
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  piece: any;
  clientName: string;
  initialAssets: Asset[];
  initialComments: Comment[];
  initialBriefing: Briefing | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

type ContentTab = "concepto" | "copy_out" | "visual";

const CONTENT_TABS: { id: ContentTab; label: string; icon: React.ElementType; field: string }[] = [
  { id: "concepto",   label: "Concepto",    icon: Edit3,     field: "description" },
  { id: "copy_out",   label: "Copy Out",    icon: Type,      field: "copy_out" },
  { id: "visual",     label: "Descripción Visual", icon: Camera, field: "visual_description" },
];

export function ContentEditor({ piece, clientName, initialAssets, initialComments, initialBriefing }: Props) {
  const [contentTab, setContentTab] = useState<ContentTab>("concepto");
  const [fieldValues, setFieldValues] = useState({
    description:         piece.description || "",
    copy_out:            piece.copy_out || "",
    visual_description:  piece.visual_description || "",
  });
  const [isEditing,    setIsEditing]    = useState(false);
  const [isPending,    startTransition] = useTransition();
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [sidebarTab,   setSidebarTab]   = useState<"actions" | "comments" | "briefing">("actions");
  const router = useRouter();
  const { toast } = useToast();

  const activeField = CONTENT_TABS.find((t) => t.id === contentTab)!.field as keyof typeof fieldValues;

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      const res = await updateContentStatus(piece.id, newStatus);
      if (res.success) {
        toast(`Estado actualizado: ${newStatus.replace(/_/g, " ")}`, "success");
        router.refresh();
      } else {
        toast("Error al actualizar estado", "error");
      }
    });
  };

  const handleSave = async () => {
    setIsSavingDraft(true);
    const res = await updateContentFields(piece.id, { [activeField]: fieldValues[activeField] });
    setIsSavingDraft(false);
    if (res.success) {
      setIsEditing(false);
      toast("Guardado correctamente", "success");
      router.refresh();
    } else {
      toast("Error al guardar", "error");
    }
  };

  const accent = statusAccent(piece.status);
  const openComments = initialComments.filter((c) => !c.resolved).length;

  return (
    <div className="flex items-start gap-10">

      {/* ── Main Working Area (Left) ─────────────────────────────────────────── */}
      <div className="flex-1 space-y-8 min-w-0">

        {/* Content fields with tabs */}
        <div className="bg-white rounded-[16px] border border-[#E5E5E5] shadow-sm overflow-hidden relative group">
          {/* Tab header */}
          <div className="flex border-b border-[#E5E5E5]">
            {CONTENT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => { setContentTab(tab.id); setIsEditing(false); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-4 text-[9px] font-bold uppercase tracking-widest transition-all ${
                    contentTab === tab.id
                      ? "text-[#1C1C1C] border-b-2 border-[var(--color-accent-red)] -mb-px bg-white"
                      : "text-[#949494] hover:text-[#1C1C1C] bg-[#FAFAFA]"
                  }`}>
                  <Icon className="w-3 h-3" />{tab.label}
                </button>
              );
            })}
            <div className="px-4 flex items-center">
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-bold uppercase tracking-widest text-[#949494] hover:text-[#1C1C1C]">
                  Editar
                </button>
              ) : (
                <button onClick={handleSave} disabled={isSavingDraft}
                  className="flex items-center gap-1.5 bg-[#1C1C1C] hover:bg-black text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-sm disabled:opacity-50">
                  {isSavingDraft ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Guardar
                </button>
              )}
            </div>
          </div>

          <div className="p-8">
          <div className="prose prose-sm max-w-none w-full">
            {isEditing ? (
              <textarea autoFocus
                className="w-full min-h-[280px] text-sm leading-relaxed text-[#1C1C1C] focus:outline-none p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm resize-y"
                value={fieldValues[activeField]}
                onChange={(e) => setFieldValues((prev) => ({ ...prev, [activeField]: e.target.value }))}
                placeholder={
                  contentTab === "concepto" ? "Desarrolla el concepto aquí..." :
                  contentTab === "copy_out" ? "Escribe el copy final para publicar en redes (hook, cuerpo, CTA, hashtags)..." :
                  "Describe visualmente la ejecución: planos, luz, movimiento de cámara, atmósfera..."
                }
              />
            ) : (
              <p className="whitespace-pre-line min-h-[100px] text-sm text-[#1C1C1C] leading-relaxed">
                {fieldValues[activeField] || (
                  <span className="text-[#CCCCCC]">
                    {contentTab === "concepto" ? "Sin concepto desarrollado aún." :
                     contentTab === "copy_out" ? "Sin copy final. Usa el IA Studio para generar uno." :
                     "Sin descripción visual. Detalla aquí los planos y la estética."}
                  </span>
                )}
              </p>
            )}
          </div>
          </div>
        </div>

        {/* Media Assets */}
        <div className="bg-white rounded-[16px] border border-[#E5E5E5] shadow-sm p-8">
          <h3 className="font-headline font-bold text-lg uppercase tracking-widest text-[#1C1C1C] mb-6 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[var(--color-accent-red)]" />
            Media Assets
          </h3>
          <AssetGallery initialAssets={initialAssets} pieceId={piece.id} />
        </div>

      </div>

      {/* ── Right Sidebar ────────────────────────────────────────────────────── */}
      <div className="w-[340px] flex-shrink-0 bg-white rounded-[16px] border border-[#E5E5E5] shadow-sm relative overflow-hidden">

        {/* Accent stripe */}
        <div
          className="absolute top-0 left-0 w-full h-[3px]"
          style={{ backgroundColor: accent }}
        />

        {/* Tab switcher */}
        <div className="flex border-b border-[#E5E5E5] mt-[3px]">
          {(["actions", "briefing", "comments"] as const).map((tab) => {
            const icons = { actions: Settings2, briefing: FileText, comments: MessageSquare };
            const labels = { actions: "Acciones", briefing: "Briefing", comments: "Chat" };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                onClick={() => setSidebarTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1 py-3 text-[9px] font-bold uppercase tracking-widest transition-all relative ${
                  sidebarTab === tab
                    ? "text-[#1C1C1C] border-b-2 border-[#1C1C1C] -mb-px"
                    : "text-[#949494] hover:text-[#1C1C1C]"
                }`}
              >
                <Icon className="w-3 h-3" />
                {labels[tab]}
                {tab === "comments" && openComments > 0 && (
                  <span className="absolute top-2 right-1.5 min-w-[14px] h-3.5 bg-[#FF3B30] text-white text-[7px] font-bold rounded-full flex items-center justify-center px-1">
                    {openComments}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab: Actions */}
        {sidebarTab === "actions" && (
          <div className="p-6 space-y-6">

            {/* Workflow — full status selector */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-[#949494] uppercase tracking-[0.15em]">
                Estado del Workflow
              </h4>
              <StatusStepper
                currentStatus={piece.status}
                onSelect={handleStatusChange}
                isPending={isPending}
              />
            </div>

            <div className="h-px bg-[#E5E5E5]" />

            {/* Properties */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-[#949494] uppercase tracking-[0.15em]">
                Propiedades
              </h4>

              {/* Publish date — editable */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-[#949494] font-medium tracking-wide block">Fecha de publicación</span>
                <input
                  type="date"
                  defaultValue={piece.publish_date ?? ""}
                  onBlur={async (e) => {
                    const val = e.target.value;
                    if (val !== (piece.publish_date ?? "")) {
                      const res = await updateContentFields(piece.id, { publish_date: val || undefined });
                      if (res.success) toast("Fecha actualizada", "success");
                      else toast("Error al guardar fecha", "error");
                    }
                  }}
                  className="w-full h-8 px-2 border border-[#E5E5E5] rounded-sm text-[11px] text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C]"
                />
              </div>

              {/* Platforms — toggle chips */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-[#949494] font-medium tracking-wide block">Plataformas</span>
                <PlatformToggle
                  pieceId={piece.id}
                  initialPlatforms={piece.platforms ?? ["instagram"]}
                  onSave={(plats) => {
                    updateContentFields(piece.id, { platforms: plats } as any)
                      .then((r) => r.success ? toast("Plataformas guardadas", "success") : toast("Error", "error"));
                  }}
                />
              </div>

              <div className="grid grid-cols-[28px_1fr] items-start gap-2">
                <User className="w-4 h-4 text-[#949494] mt-0.5" />
                <div>
                  <span className="text-[9px] text-[#949494] font-medium tracking-wide block">Tipo</span>
                  <span className="text-[11px] font-bold text-[#1C1C1C] uppercase">
                    {(piece.content_type ?? "reel").replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[28px_1fr] items-start gap-2">
                <MapPin className="w-4 h-4 text-[#949494] mt-0.5" />
                <div>
                  <span className="text-[9px] text-[#949494] font-medium tracking-wide block">Marca</span>
                  <span className="text-[11px] font-bold text-[#1C1C1C] uppercase tracking-wide">
                    {clientName}
                  </span>
                </div>
              </div>

              <div className="h-px bg-[#F0F0F0]" />

              {/* Danger zone */}
              <div className="space-y-2">
                <h4 className="text-[9px] font-bold text-[#FF3B30] uppercase tracking-[0.15em]">
                  Zona Peligrosa
                </h4>
                <button
                  onClick={async () => {
                    if (!confirm(`¿Eliminar permanentemente "${piece.title}"? Esta acción no se puede deshacer.`)) return;
                    const res = await deleteContentPiece(piece.id);
                    if (res.success) {
                      toast("Pieza eliminada", "info" as any);
                      router.push("/content");
                    } else {
                      toast("Error al eliminar", "error");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 h-9 border border-[#FF3B30]/30 rounded-sm text-[9px] font-bold uppercase tracking-widest text-[#FF3B30] hover:bg-[#FFF0F0] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar pieza
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Briefing */}
        {sidebarTab === "briefing" && (
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-280px)] hide-scrollbar">
            <BriefingPanel
              initialBriefing={initialBriefing}
              pieceId={piece.id}
            />
          </div>
        )}

        {/* Tab: Comments */}
        {sidebarTab === "comments" && (
          <div className="p-6">
            <CommentThread
              initialComments={initialComments}
              pieceId={piece.id}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Platform Toggle ──────────────────────────────────────────────────────────

const ALL_PLATFORMS = ["instagram", "tiktok", "linkedin", "youtube"];

function PlatformToggle({
  pieceId, initialPlatforms, onSave,
}: {
  pieceId: string;
  initialPlatforms: string[];
  onSave: (plats: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialPlatforms);

  const toggle = (p: string) => {
    const next = selected.includes(p)
      ? selected.filter((x) => x !== p)
      : [...selected, p];
    if (next.length === 0) return; // keep at least one
    setSelected(next);
    onSave(next);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_PLATFORMS.map((p) => (
        <button key={p} onClick={() => toggle(p)}
          className={`px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest rounded-sm border transition-all ${
            selected.includes(p)
              ? "bg-[#1C1C1C] text-white border-[#1C1C1C]"
              : "bg-white text-[#949494] border-[#E5E5E5] hover:border-[#1C1C1C]"
          }`}>
          {p}
        </button>
      ))}
    </div>
  );
}

// ─── Status Stepper ───────────────────────────────────────────────────────────

const WORKFLOW_STEPS: { status: string; label: string; color: string; bg: string }[] = [
  { status: "planning",        label: "Planning",        color: "#A8A8A8", bg: "#F8F6F6" },
  { status: "briefed",         label: "Briefed",         color: "#A8A8A8", bg: "#F8F6F6" },
  { status: "ideation",        label: "Ideation",        color: "#A8A8A8", bg: "#F8F6F6" },
  { status: "pre_production",  label: "Pre-Producción",  color: "#FF9500", bg: "#FFF7ED" },
  { status: "production",      label: "Producción",      color: "#FF9500", bg: "#FFF7ED" },
  { status: "internal_review", label: "Review Interna",  color: "#FF9500", bg: "#FFF7ED" },
  { status: "client_review",   label: "Review Cliente",  color: "#34C759", bg: "#F0FDF4" },
  { status: "client_approved", label: "Aprobado",        color: "#34C759", bg: "#F0FDF4" },
  { status: "client_changes",  label: "Con Cambios",     color: "#FF3B30", bg: "#FFF0F0" },
  { status: "rework",          label: "Rework",          color: "#FF3B30", bg: "#FFF0F0" },
  { status: "scheduled",       label: "Programado",      color: "#007AFF", bg: "#EFF6FF" },
  { status: "published",       label: "Publicado",       color: "#1C1C1C", bg: "#F8F6F6" },
];

function StatusStepper({
  currentStatus, onSelect, isPending,
}: {
  currentStatus: string;
  onSelect: (s: string) => void;
  isPending: boolean;
}) {
  const current = WORKFLOW_STEPS.find((s) => s.status === currentStatus) ?? WORKFLOW_STEPS[0];

  return (
    <div className="space-y-2">
      {/* Current badge */}
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-sm border"
        style={{ borderColor: current.color + "40", backgroundColor: current.bg }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: current.color }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: current.color }}>
          {current.label}
        </span>
        {isPending && <Loader2 className="w-3 h-3 animate-spin ml-auto" style={{ color: current.color }} />}
      </div>

      {/* Step grid */}
      <div className="grid grid-cols-2 gap-1">
        {WORKFLOW_STEPS.filter((s) => s.status !== currentStatus).map((step) => (
          <button key={step.status} onClick={() => onSelect(step.status)} disabled={isPending}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-sm border border-[#E5E5E5] hover:border-[#1C1C1C] bg-white text-left transition-all disabled:opacity-40 group">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: step.color }} />
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#949494] group-hover:text-[#1C1C1C] truncate">
              {step.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
