"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, Copy, Star, Trash2, Loader2, CheckCheck,
  Film, Type, Zap, ChevronDown, BotMessageSquare,
  ChevronUp, CheckCircle2,
} from "lucide-react";
import {
  generateCopy,
  generateVideoPrompt,
  saveAiPrompt,
  togglePromptFavorite,
  deleteAiPrompt,
} from "@/app/actions/ai";
import { listGems, upsertGem, deleteGem } from "@/app/actions/gems";
import type { AIPrompt } from "@/types/database";

// ─── Types ────────────────────────────────────────────────────────────────────

type PromptMode = "copy" | "video_prompt";

const PLATFORMS = ["Instagram", "TikTok", "LinkedIn", "YouTube Shorts"];
const CONTENT_TYPES = ["Reel", "Carrusel animado", "Carrusel estático", "Story"];
const VIDEO_STYLES = [
  "Hiperrealista / Cinematográfico",
  "Brutalista / Editorial",
  "Luxury / Premium",
  "Sport / Dinámico",
  "Minimalista / Clean",
];

// ─── Mode config ──────────────────────────────────────────────────────────────

const MODES: { id: PromptMode; label: string; icon: React.ElementType; color: string }[] = [
  { id: "copy",         label: "Copy",          icon: Type,      color: "#7C3AED" },
  { id: "video_prompt", label: "Video Prompt",  icon: Film,      color: "#FF9500" },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  clients: { id: string; name: string; brand_guidelines: any }[];
  initialPrompts: AIPrompt[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AIStudioClient({ clients, initialPrompts }: Props) {
  // Generator state
  const [mode, setMode] = useState<PromptMode>("copy");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [videoStyle, setVideoStyle] = useState(VIDEO_STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Gem state
  const [gemId, setGemId] = useState<string | null>(null);
  const [gemInstruction, setGemInstruction] = useState("");
  const [gemDraft, setGemDraft] = useState("");
  const [gemOpen, setGemOpen] = useState(false);
  const [gemSaved, setGemSaved] = useState(false);

  // Library state
  const [prompts, setPrompts] = useState<AIPrompt[]>(initialPrompts);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFav, setFilterFav] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);

  // ── Load Gem from server when client changes ────────────────────────
  useEffect(() => {
    if (!clientId) return;
    let active = true;
    listGems(clientId).then((gems) => {
      if (!active) return;
      if (gems && gems.length > 0) {
        setGemId(gems[0].id);
        setGemInstruction(gems[0].system_instruction);
        setGemDraft(gems[0].system_instruction);
      } else {
        setGemId(null);
        setGemInstruction("");
        setGemDraft("");
      }
    }).catch(console.error);
    return () => { active = false; };
  }, [clientId]);

  // ── Save Gem to server ──────────────────────────────────────────────
  const handleSaveGem = async () => {
    if (!clientId) return;
    try {
      const savedG = await upsertGem(clientId, {
        id: gemId || undefined,
        name: "Default",
        system_instruction: gemDraft,
        model: "gemini-2.5-flash",
      });
      setGemId(savedG.id);
      setGemInstruction(savedG.system_instruction);
      setGemSaved(true);
      setTimeout(() => { setGemSaved(false); setGemOpen(false); }, 1200);
    } catch (e) {
      alert("Error guardando Gem");
    }
  };

  const handleClearGem = async () => {
    if (!gemId) return;
    try {
      if (confirm("¿Desactivar la Gem para este cliente?")) {
        await deleteGem(gemId);
        setGemId(null);
        setGemInstruction("");
        setGemDraft("");
      }
    } catch (e) {
      alert("Error eliminando Gem");
    }
  };

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!brief.trim() || !clientId) return;
    setIsGenerating(true);
    setResult(null);
    setSaved(false);

    // Pass gem instruction if available for this client
    const gem = gemInstruction.trim() || undefined;

    let res;
    if (mode === "copy") {
      res = await generateCopy(clientId, brief, platform, contentType, gem);
      if (res.success) setResult(res.copy ?? null);
    } else {
      res = await generateVideoPrompt(clientId, brief, videoStyle, gem);
      if (res.success) setResult(res.prompt ?? null);
    }

    if (!res.success) alert(res.error ?? "Error generando contenido");
    setIsGenerating(false);
  };

  // ── Save to library ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!result) return;
    setIsSaving(true);
    const res = await saveAiPrompt({
      prompt_type: mode,
      provider: "gemini",
      prompt: brief,
      result_text: result,
      parameters: {
        client_id: clientId,
        client_name: selectedClient?.name,
        platform: mode === "copy" ? platform : undefined,
        content_type: mode === "copy" ? contentType : undefined,
        video_style: mode === "video_prompt" ? videoStyle : undefined,
      },
    });
    if (res.success && res.prompt) {
      setPrompts((prev) => [res.prompt as AIPrompt, ...prev]);
      setSaved(true);
    }
    setIsSaving(false);
  };

  // ── Copy to clipboard ────────────────────────────────────────────────────────

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Library actions ─────────────────────────────────────────────────────────

  const handleToggleFav = async (p: AIPrompt) => {
    await togglePromptFavorite(p.id, !p.is_favorite);
    setPrompts((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, is_favorite: !x.is_favorite } : x))
    );
  };

  const handleDelete = async (p: AIPrompt) => {
    if (!confirm("¿Eliminar este prompt de la biblioteca?")) return;
    await deleteAiPrompt(p.id);
    setPrompts((prev) => prev.filter((x) => x.id !== p.id));
  };

  // ── Filtered library ────────────────────────────────────────────────────────

  const filteredPrompts = prompts.filter((p) => {
    if (filterFav && !p.is_favorite) return false;
    if (filterType !== "all" && p.prompt_type !== filterType) return false;
    return true;
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">

      {/* ── LEFT: Generator (42%) ─────────────────────────────────────────── */}
      <div className="w-[42%] flex flex-col border-r border-[#E5E5E5] bg-white overflow-y-auto hide-scrollbar">

        {/* Mode selector */}
        <div className="p-6 border-b border-[#E5E5E5]">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494] mb-3">
            Modo de generación
          </p>
          <div className="flex gap-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); setResult(null); setSaved(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    mode === m.id
                      ? "text-white border-transparent"
                      : "bg-[#FAFAFA] text-[#949494] border-[#E5E5E5] hover:border-[#1C1C1C] hover:text-[#1C1C1C]"
                  }`}
                  style={mode === m.id ? { backgroundColor: m.color, borderColor: m.color } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand context */}
        <div className="p-6 border-b border-[#E5E5E5] space-y-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
            Contexto de marca
          </p>

          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-[#CCCCCC] block mb-1.5">
              Cliente
            </label>
            <div className="relative">
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-10 pl-3 pr-8 border border-[#E5E5E5] rounded-sm text-[11px] font-bold uppercase tracking-wider text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] appearance-none bg-white"
              >
                {clients.length === 0 && <option value="">Sin clientes</option>}
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#949494] pointer-events-none" />
            </div>
          </div>

          {/* Gem Instructions Panel */}
          <div className="border border-[#E5E5E5] rounded-sm overflow-hidden">
            <button
              onClick={() => setGemOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-[#FAFAFA] hover:bg-[#F0F0F0] transition-colors"
            >
              <div className="flex items-center gap-2">
                <BotMessageSquare className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                  Gem / System Instruction
                </span>
                {gemInstruction ? (
                  <span className="flex items-center gap-1 bg-[#7C3AED] text-white text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Activo
                  </span>
                ) : (
                  <span className="text-[8px] text-[#CCCCCC] font-medium">Sin configurar</span>
                )}
              </div>
              {gemOpen
                ? <ChevronUp className="w-3.5 h-3.5 text-[#949494]" />
                : <ChevronDown className="w-3.5 h-3.5 text-[#949494]" />
              }
            </button>

            {gemOpen && (
              <div className="p-3 border-t border-[#E5E5E5] bg-white space-y-2">
                <p className="text-[9px] text-[#949494] leading-relaxed">
                  Pega aquí el system instruction de tu Gem de Google AI Studio.
                  Se inyectará en cada generación para <strong className="text-[#1C1C1C]">{selectedClient?.name ?? "este cliente"}</strong>.
                </p>
                <textarea
                  value={gemDraft}
                  onChange={(e) => setGemDraft(e.target.value)}
                  placeholder="Eres un experto en publicidad automotriz de lujo. Tu estilo es directo, aspiracional y siempre destaca la tecnología del vehículo..."
                  className="w-full resize-none text-[10px] leading-relaxed text-[#1C1C1C] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm p-2.5 focus:outline-none focus:border-[#7C3AED] min-h-[100px] placeholder:text-[#CCCCCC] font-mono"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveGem}
                    disabled={!gemDraft.trim()}
                    className={`flex-1 h-8 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all ${
                      gemSaved
                        ? "bg-[#34C759] text-white"
                        : "bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white"
                    }`}
                  >
                    {gemSaved ? "✓ Guardado" : "Guardar Gem"}
                  </button>
                  {gemInstruction && (
                    <button
                      onClick={handleClearGem}
                      className="px-3 h-8 text-[9px] font-bold uppercase tracking-widest rounded-sm border border-[#E5E5E5] text-[#949494] hover:border-[#FF3B30] hover:text-[#FF3B30] transition-all"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Brand tone badge */}
          {selectedClient?.brand_guidelines?.tone && (
            <div className="bg-[#F8F6F6] rounded-sm px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#CCCCCC] block mb-0.5">
                Tono de marca
              </span>
              <span className="text-[11px] font-medium text-[#1C1C1C]">
                {selectedClient.brand_guidelines.tone}
              </span>
            </div>
          )}

          {/* Mode-specific options */}
          {mode === "copy" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#CCCCCC] block mb-1.5">
                  Plataforma
                </label>
                <div className="relative">
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full h-9 pl-3 pr-7 border border-[#E5E5E5] rounded-sm text-[10px] font-bold uppercase tracking-wider text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] appearance-none bg-white"
                  >
                    {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#949494] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-[#CCCCCC] block mb-1.5">
                  Formato
                </label>
                <div className="relative">
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full h-9 pl-3 pr-7 border border-[#E5E5E5] rounded-sm text-[10px] font-bold uppercase tracking-wider text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] appearance-none bg-white"
                  >
                    {CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#949494] pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {mode === "video_prompt" && (
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-[#CCCCCC] block mb-1.5">
                Estilo visual
              </label>
              <div className="relative">
                <select
                  value={videoStyle}
                  onChange={(e) => setVideoStyle(e.target.value)}
                  className="w-full h-9 pl-3 pr-7 border border-[#E5E5E5] rounded-sm text-[10px] font-bold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] appearance-none bg-white"
                >
                  {VIDEO_STYLES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#949494] pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        {/* Brief input */}
        <div className="p-6 flex-1 flex flex-col gap-4">
          <div className="flex-1">
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494] block mb-2">
              {mode === "copy" ? "Brief / Concepto" : "Concepto del vídeo"}
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
              placeholder={
                mode === "copy"
                  ? "Describe el mensaje, producto o campaña... (⌘↵ genera)"
                  : "Describe la escena, el coche, la emoción que quieres transmitir..."
              }
              className="w-full resize-none text-[12px] leading-relaxed text-[#1C1C1C] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm p-4 focus:outline-none focus:border-[#1C1C1C] min-h-[120px] placeholder:text-[#CCCCCC]"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !brief.trim() || !clientId}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#1C1C1C] hover:bg-[#FF3B30] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generar con Gemini</>
            )}
          </button>

          {/* Result */}
          {result && (
            <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
                  Resultado
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(result)}
                    className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#949494] hover:text-[#1C1C1C] transition-colors"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || saved}
                    className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${
                      saved ? "text-[#34C759]" : "text-[#949494] hover:text-[#1C1C1C]"
                    }`}
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                    {saved ? "Guardado" : "Guardar"}
                  </button>
                </div>
              </div>
              <pre className="text-[11px] text-[#1C1C1C] whitespace-pre-wrap leading-relaxed font-sans">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Library (58%) ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#FAFAFA] overflow-hidden">

        {/* Library header + filters */}
        <div className="px-8 py-5 border-b border-[#E5E5E5] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--color-accent-red)]" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-[#1C1C1C]">
              Biblioteca
            </span>
            <span className="text-[11px] font-medium text-[#CCCCCC]">
              {filteredPrompts.length} prompts
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Type filter */}
            <div className="flex items-center bg-[#F0F0F0] rounded-sm p-0.5 gap-0.5">
              {[
                { id: "all", label: "Todos" },
                { id: "copy", label: "Copy" },
                { id: "video_prompt", label: "Video" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id)}
                  className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all ${
                    filterType === f.id
                      ? "bg-white text-[#1C1C1C] shadow-sm"
                      : "text-[#949494] hover:text-[#1C1C1C]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Fav filter */}
            <button
              onClick={() => setFilterFav((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border transition-all ${
                filterFav
                  ? "bg-[#FFD700] border-[#FFD700] text-[#1C1C1C]"
                  : "bg-white border-[#E5E5E5] text-[#949494] hover:border-[#1C1C1C]"
              }`}
            >
              <Star className={`w-3 h-3 ${filterFav ? "fill-current" : ""}`} />
              Favoritos
            </button>
          </div>
        </div>

        {/* Prompt grid */}
        <div className="flex-1 overflow-y-auto p-8 hide-scrollbar">
          {filteredPrompts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-8 h-8 text-[#E5E5E5] mb-3" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#CCCCCC]">
                {prompts.length === 0
                  ? "Sin prompts guardados aún"
                  : "Sin resultados con estos filtros"}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {filteredPrompts.map((p) => (
              <PromptCard
                key={p.id}
                prompt={p}
                onToggleFav={() => handleToggleFav(p)}
                onDelete={() => handleDelete(p)}
                onCopy={() => handleCopy(p.result_text ?? p.prompt)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Prompt Card ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  copy:         { label: "Copy",         color: "#7C3AED", bg: "#F5F3FF" },
  video_prompt: { label: "Video Prompt", color: "#FF9500", bg: "#FFF7ED" },
  image_prompt: { label: "Image Prompt", color: "#007AFF", bg: "#EFF6FF" },
  briefing:     { label: "Briefing",     color: "#34C759", bg: "#F0FDF4" },
};

function PromptCard({
  prompt,
  onToggleFav,
  onDelete,
  onCopy,
}: {
  prompt: AIPrompt;
  onToggleFav: () => void;
  onDelete: () => void;
  onCopy: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[prompt.prompt_type] ?? TYPE_CONFIG.copy;
  const params = prompt.parameters as any;

  return (
    <div className={`bg-white border rounded-sm transition-all ${
      prompt.is_favorite ? "border-[#FFD700]" : "border-[#E5E5E5] hover:border-[#1C1C1C]"
    }`}>
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm"
            style={{ color: cfg.color, backgroundColor: cfg.bg }}
          >
            {cfg.label}
          </span>
          {params?.client_name && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#CCCCCC]">
              {params.client_name}
            </span>
          )}
          {params?.platform && (
            <span className="text-[8px] font-medium text-[#CCCCCC]">
              · {params.platform}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onToggleFav} className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[#FFF7ED]">
            <Star className={`w-3.5 h-3.5 ${prompt.is_favorite ? "fill-[#FFD700] text-[#FFD700]" : "text-[#CCCCCC]"}`} />
          </button>
          <button onClick={onCopy} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#F0F0F0] transition-colors">
            <Copy className="w-3.5 h-3.5 text-[#949494]" />
          </button>
          <button onClick={onDelete} className="w-6 h-6 flex items-center justify-center rounded hover:bg-[#FFF0F0] transition-colors">
            <Trash2 className="w-3.5 h-3.5 text-[#CCCCCC] hover:text-[#FF3B30]" />
          </button>
        </div>
      </div>

      {/* Brief */}
      {prompt.prompt && (
        <div className="px-4 pb-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#CCCCCC] mb-1">Brief</p>
          <p className="text-[10px] text-[#949494] line-clamp-1">{prompt.prompt}</p>
        </div>
      )}

      {/* Result preview */}
      <div className="px-4 pb-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#CCCCCC] mb-1">Resultado</p>
        <p className={`text-[11px] text-[#1C1C1C] leading-relaxed whitespace-pre-wrap ${expanded ? "" : "line-clamp-3"}`}>
          {prompt.result_text}
        </p>
        {(prompt.result_text?.length ?? 0) > 150 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[9px] font-bold uppercase tracking-widest text-[#949494] hover:text-[#1C1C1C] mt-1"
          >
            {expanded ? "Ver menos" : "Ver más"}
          </button>
        )}
      </div>

      {/* Date */}
      <div className="px-4 pb-3 border-t border-[#F0F0F0] pt-2">
        <span className="text-[9px] text-[#CCCCCC] font-medium">
          {new Date(prompt.created_at).toLocaleDateString("es-ES", {
            day: "2-digit", month: "short", year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}
