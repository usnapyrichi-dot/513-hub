"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronUp, Sparkles, ArrowUp, Save,
  Calendar, User, Tag, PlusCircle, Check, Loader2, Link2, X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { generateContentIdeas } from "@/app/actions/ai";
import { createIdeationPiece, appendConceptToPiece } from "@/app/actions/ideas";
import { listPiecesForClient } from "@/app/actions/content";
import { listGems } from "@/app/actions/gems";
import { useToast } from "@/components/ui/toast";

type SaveMode = "new" | "existing";

export function IdeationClient({ clients }: { clients: any[] }) {
  const [prompt, setPrompt] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>(clients.length > 0 ? clients[0].id : "");
  const [title, setTitle] = useState("CAMPAÑA AUTO-GENERADA");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [saveMode, setSaveMode] = useState<SaveMode>("new");
  const [existingPieces, setExistingPieces] = useState<{ id: string; title: string }[]>([]);
  const [targetPieceId, setTargetPieceId] = useState("");

  const [ideas, setIdeas] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGem, setHasGem] = useState(false);
  const [gemInstruction, setGemInstruction] = useState<string | undefined>(undefined);

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  // Check if Gem is configured for selected client
  useEffect(() => {
    if (!selectedClientId) {
      setHasGem(false);
      setGemInstruction(undefined);
      return;
    }
    let active = true;
    listGems(selectedClientId).then((gems) => {
      if (!active) return;
      if (gems && gems.length > 0) {
        setHasGem(true);
        setGemInstruction(gems[0].system_instruction);
      } else {
        setHasGem(false);
        setGemInstruction(undefined);
      }
    }).catch(console.error);
    return () => { active = false; };
  }, [selectedClientId]);

  // Load existing pieces for this client when switching to "existing" mode
  useEffect(() => {
    if (saveMode === "existing" && selectedClientId) {
      listPiecesForClient(selectedClientId).then((res) => {
        if (res.success) {
          setExistingPieces(res.data);
          setTargetPieceId(res.data[0]?.id ?? "");
        }
      });
    }
  }, [saveMode, selectedClientId]);

  const handleSaveDraft = async () => {
    if (!selectedClientId) return toast("Selecciona un cliente primero", "error");
    if (!title || !content) return toast("Añade un título y contenido al lienzo", "error");

    setIsSaving(true);

    if (saveMode === "new") {
      const res = await createIdeationPiece({
        client_id: selectedClientId,
        title,
        content_type: 'reel',
        description: content
      });

      if (!res.success) {
        toast("Error guardando el borrador", "error");
      } else {
        toast("Pieza creada en Ideation", "success");
        setHasSaved(true);
        setTimeout(() => { setHasSaved(false); router.push(`/content/${res.data.id}`); }, 1200);
      }
    } else {
      // Update existing piece description
      if (!targetPieceId) return toast("Selecciona una pieza destino", "error");
      const res = await appendConceptToPiece(targetPieceId, content);

      if (!res.success) {
        toast("Error actualizando la pieza", "error");
      } else {
        toast("Concepto añadido a la pieza existente", "success");
        setHasSaved(true);
        setTimeout(() => { setHasSaved(false); router.push(`/content/${targetPieceId}`); }, 1200);
      }
    }

    setIsSaving(false);
  };

  const handleGenerate = async () => {
    if (!prompt || !selectedClientId) return;
    setIsGenerating(true);

    const result = await generateContentIdeas(selectedClientId, prompt, gemInstruction);
    if (result.success && result.ideas) {
      setIdeas(result.ideas);
      setPrompt("");
    } else {
      toast(result.error || "Error al generar ideas", "error");
    }

    setIsGenerating(false);
  };

  const handleInjectIdea = (ideaText: string) => {
    setContent((prev) => prev ? prev + "\n\n" + ideaText : ideaText);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--color-surface-container-low)] text-[var(--color-text-main)] font-body">
      {/* 
        LEFT COLUMN: AI Copilot Workspace (40%) 
      */}
      <section className="w-[40%] h-full flex flex-col border-r border-[#E5E5E5] bg-white relative">
        
        {/* Brand Context Panel (Top) */}
        <div className="p-6 border-b border-[#E5E5E5] bg-[var(--color-surface-container-lowest)]">
          
          <div className="mb-6">
            <label className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#949494] mb-2 block">
              Cliente Activo
            </label>
            <select 
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                setIdeas([]); // Reseteamos ideas al cambiar
              }}
              className="w-full h-10 px-3 border border-[#E5E5E5] rounded-sm text-sm font-bold uppercase tracking-wider text-[#1C1C1C] focus:outline-none focus:border-[var(--color-accent-red)] transition-colors"
            >
              {clients.length === 0 && <option value="">Sin clientes - ¡Crea uno primero!</option>}
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-between items-center mb-4 cursor-pointer group">
            <h3 className="text-sm font-bold text-[var(--color-text-main)] font-headline tracking-tight">Contexto de la Marca</h3>
            <div className="flex items-center gap-2">
              {hasGem && (
                <span className="text-[8px] font-bold uppercase tracking-widest bg-[#7C3AED] text-white px-2 py-0.5 rounded-sm">
                  GEM ACTIVO
                </span>
              )}
              <button className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-main)] transition-colors">
                <ChevronUp size={16} />
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] items-baseline">
              <span className="text-[var(--color-text-muted)] text-[10px] uppercase font-bold tracking-widest">Audiencia</span>
              <span className="text-sm font-medium">{selectedClient ? `Seguidores de ${selectedClient.name}` : '...'}</span>
            </div>
            <div className="grid grid-cols-[80px_1fr] items-baseline">
              <span className="text-[var(--color-text-muted)] text-[10px] uppercase font-bold tracking-widest">Tono</span>
              <span className="text-sm font-medium">Premium, directo, autoridad</span>
            </div>
          </div>
        </div>

        {/* AI Concept List (Scrollable Middle) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32 hide-scrollbar bg-[var(--color-surface-container-low)]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-muted)] font-headline tracking-widest uppercase">
              {isGenerating && <Loader2 size={14} className="animate-spin text-[var(--color-accent-red)]" />}
              {isGenerating ? "Gemini analizando..." : `Conceptos${ideas.length > 0 ? ` (${ideas.length})` : ""}`}
            </h4>
            {ideas.length > 0 && !isGenerating && (
              <button onClick={() => setIdeas([])}
                className="text-[8px] font-bold uppercase tracking-widest text-[#CCCCCC] hover:text-[#FF3B30] transition-colors">
                Limpiar todo
              </button>
            )}
          </div>

          {ideas.length === 0 && !isGenerating && (
             <div className="p-8 text-center text-[#949494] text-xs font-medium border-2 border-dashed border-[#E5E5E5] rounded-sm">
               El Copiloto IA está inactivo. Empieza a idear usando la barra inferior.
             </div>
          )}

          {ideas.map((idea, index) => {
            const badgeMatch = idea.match(/^\[(.*?)\]/);
            const badgeText = badgeMatch ? badgeMatch[1] : `CONCEPTO 0${index + 1}`;
            const cleanText = idea.replace(/^\[.*?\]\s*/, '');

            return (
              <div key={index} className="relative group">
                <div
                  onClick={() => handleInjectIdea(idea)}
                  className="bg-white p-5 rounded-sm border border-[#E5E5E5] shadow-[var(--shadow-card)] flex gap-4 cursor-pointer hover:border-[#1C1C1C] transition-colors"
                  title="Haz click para inyectar en el documento"
                >
                  <div className="text-[#D1D1D1] pt-1">
                    <PlusCircle size={16} className="group-hover:text-[var(--color-accent-red)] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-3 tracking-widest text-[10px] uppercase pr-2 bg-[#F8F6F6]">
                      {badgeText}
                    </Badge>
                    <p className="text-sm leading-relaxed text-[var(--color-text-main)] whitespace-pre-wrap">
                      {cleanText}
                    </p>
                  </div>
                </div>
                {/* Delete idea button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setIdeas(prev => prev.filter((_, i) => i !== index)); }}
                  className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-[#F0F0F0] hover:bg-[#FF3B30] hover:text-white text-[#949494] rounded-sm transition-all"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
        </div>

        {/* AI Prompt Bar (Fixed Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-[var(--color-surface-container-low)] border-t border-[#E5E5E5] z-10">
          <div className="relative flex items-center group">
            <Sparkles size={18} className="absolute left-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-red)] transition-colors" />
            <input 
              className="w-full h-14 pl-12 pr-14 bg-white border border-[#E5E5E5] rounded-sm text-sm focus:outline-none focus:border-[var(--color-accent-red)] text-[#1C1C1C] placeholder:text-gray-400" 
              placeholder="Ordena al Copiloto que genere ideas para esta marca..." 
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleGenerate() }}
              disabled={isGenerating}
            />
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
              className="absolute right-2 h-10 w-10 bg-[var(--color-text-main)] hover:bg-[var(--color-accent-red)] disabled:opacity-50 text-white rounded-sm flex items-center justify-center transition-colors"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 
        RIGHT COLUMN: Document Editor Canvas (60%) 
      */}
      <section className="w-[60%] h-full overflow-y-auto bg-[var(--color-surface-container-low)] p-12 hide-scrollbar relative">
        
        {/* Top Header Actions */}
        <div className="flex items-center justify-between mb-8 max-w-[800px] mx-auto gap-4">
          {/* Save mode toggle */}
          <div className="flex items-center bg-[#F0F0F0] rounded-sm p-0.5 gap-0.5">
            {(["new", "existing"] as SaveMode[]).map((m) => (
              <button key={m} onClick={() => setSaveMode(m)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all ${saveMode === m ? "bg-white text-[#1C1C1C] shadow-sm" : "text-[#949494] hover:text-[#1C1C1C]"}`}>
                {m === "new" ? <><PlusCircle size={12} /> Nueva Pieza</> : <><Link2 size={12} /> Pieza Existente</>}
              </button>
            ))}
          </div>

          {/* Existing piece selector */}
          {saveMode === "existing" && (
            <select value={targetPieceId} onChange={(e) => setTargetPieceId(e.target.value)}
              className="flex-1 max-w-[240px] h-8 px-3 border border-[#E5E5E5] rounded-sm text-[10px] font-bold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] bg-white appearance-none">
              {existingPieces.length === 0 && <option value="">Sin piezas para este cliente</option>}
              {existingPieces.map((p) => <option key={p.id} value={p.id}>{p.title ?? "Sin título"}</option>)}
            </select>
          )}

          {/* Save button */}
          <button onClick={handleSaveDraft} disabled={isSaving}
            className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 transition-colors ${hasSaved ? "text-[#34C759]" : "text-[#949494] hover:text-[#1C1C1C]"}`}>
            {isSaving ? <Sparkles size={14} className="animate-spin" /> : hasSaved ? <Check size={14} /> : <Save size={14} />}
            {isSaving ? "Guardando..." : hasSaved ? "Guardado" : "Guardar"}
          </button>
        </div>

        {/* The A4 Canvas Document */}
        <div className="w-full max-w-[800px] min-h-[1131px] bg-white mx-auto p-16 rounded-sm relative border border-[#E5E5E5]/50 flex flex-col shadow-[var(--shadow-elevated)]">
          
          <div className="border-b border-[#E5E5E5] pb-8 mb-10 w-full relative">
            <input 
              className="text-4xl leading-tight font-bold w-full focus:outline-none bg-transparent font-headline text-[var(--color-text-main)] tracking-tight uppercase" 
              placeholder="TÍTULO DE LA CAMPAÑA..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="flex gap-8 mt-6 text-xs text-[var(--color-text-muted)] font-medium tracking-wide uppercase">
              <div className="flex items-center gap-2"><Calendar size={14} className="text-[#1C1C1C]" /> HOY</div>
              <div className="flex items-center gap-2"><User size={14} className="text-[#1C1C1C]" /> Copiloto IA</div>
              <div className="flex items-center gap-2"><Tag size={14} className="text-[#1C1C1C]" /> Borrador</div>
            </div>
          </div>

          <div className="space-y-12 flex-1 relative">
            <div>
              <h2 className="text-xl font-bold mb-4 font-headline border-l-4 border-[var(--color-accent-red)] pl-4 tracking-tight uppercase">Briefing / Contenido</h2>
              {content.length === 0 && (
                <div className="absolute top-16 left-0 text-[#949494] pointer-events-none text-base">
                  Empieza a bocetar aquí o haz clic en un concepto de la izquierda para inyectarlo.
                </div>
              )}
              <textarea 
                className="w-full text-base leading-relaxed text-[#1C1C1C] focus:outline-none focus:bg-[#FAFAFA] rounded-sm p-4 -ml-4 transition-colors resize-none min-h-[400px]" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>

          <div className="absolute bottom-12 left-0 w-full text-center text-[#E5E5E5] text-[10px] font-bold tracking-[0.3em] uppercase font-headline">
            Confidencial — 513 Editorial Studio
          </div>
        </div>

        <div className="h-24 w-full"></div>
      </section>
    </div>
  );
}
