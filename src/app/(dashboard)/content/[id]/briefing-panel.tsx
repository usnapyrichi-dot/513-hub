"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Save, Loader2, Target, Users, Zap, Calendar } from "lucide-react";
import type { Briefing } from "@/types/database";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  initialBriefing: Briefing | null;
  pieceId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BriefingPanel({ initialBriefing, pieceId }: Props) {
  const [briefing, setBriefing] = useState<Briefing | null>(initialBriefing);
  const [objective, setObjective] = useState(initialBriefing?.objective ?? "");
  const [audience, setAudience] = useState(initialBriefing?.target_audience ?? "");
  const [keyMessages, setKeyMessages] = useState<string[]>(
    initialBriefing?.key_messages ?? []
  );
  const [ephemerides, setEphemerides] = useState<string[]>(
    initialBriefing?.ephemerides ?? []
  );
  const [restrictions, setRestrictions] = useState(
    initialBriefing?.client_restrictions ?? ""
  );
  const [newMessage, setNewMessage] = useState("");
  const [newEph, setNewEph] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const supabase = createClient();

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      content_piece_id: pieceId,
      objective: objective.trim() || null,
      target_audience: audience.trim() || null,
      key_messages: keyMessages,
      ephemerides: ephemerides,
      client_restrictions: restrictions.trim() || null,
    };

    let data: Briefing | null = null;
    let error: any = null;

    if (briefing) {
      // Update existing
      const res = await supabase
        .from("briefings")
        .update(payload)
        .eq("id", briefing.id)
        .select()
        .single();
      data = res.data as Briefing;
      error = res.error;
    } else {
      // Insert new
      const res = await supabase
        .from("briefings")
        .insert(payload)
        .select()
        .single();
      data = res.data as Briefing;
      error = res.error;
    }

    if (!error && data) {
      setBriefing(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setIsSaving(false);
  };

  // ── Key messages ─────────────────────────────────────────────────────────────

  const addMessage = () => {
    const val = newMessage.trim();
    if (!val) return;
    setKeyMessages((prev) => [...prev, val]);
    setNewMessage("");
  };

  const removeMessage = (i: number) =>
    setKeyMessages((prev) => prev.filter((_, idx) => idx !== i));

  // ── Ephemerides ──────────────────────────────────────────────────────────────

  const addEph = () => {
    const val = newEph.trim();
    if (!val) return;
    setEphemerides((prev) => [...prev, val]);
    setNewEph("");
  };

  const removeEph = (i: number) =>
    setEphemerides((prev) => prev.filter((_, idx) => idx !== i));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Objetivo */}
      <BriefingSection icon={Target} label="Objetivo de la Pieza">
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="¿Qué debe lograr este contenido? (awareness, consideración, conversión...)"
          className="w-full resize-none text-[11px] leading-relaxed text-[#1C1C1C] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm p-3 focus:outline-none focus:border-[#1C1C1C] min-h-[72px] placeholder:text-[#CCCCCC]"
        />
      </BriefingSection>

      {/* Audiencia */}
      <BriefingSection icon={Users} label="Audiencia Objetivo">
        <textarea
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="Describe el perfil del público al que va dirigido..."
          className="w-full resize-none text-[11px] leading-relaxed text-[#1C1C1C] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm p-3 focus:outline-none focus:border-[#1C1C1C] min-h-[60px] placeholder:text-[#CCCCCC]"
        />
      </BriefingSection>

      {/* Key Messages */}
      <BriefingSection icon={Zap} label="Key Messages">
        <div className="space-y-2">
          {keyMessages.length === 0 && (
            <p className="text-[10px] text-[#CCCCCC] font-medium uppercase tracking-widest">
              Sin mensajes clave
            </p>
          )}
          {keyMessages.map((msg, i) => (
            <div
              key={i}
              className="flex items-start gap-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm px-3 py-2 group"
            >
              <span className="text-[9px] font-bold text-[#CCCCCC] mt-0.5 flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="flex-1 text-[11px] text-[#1C1C1C] leading-relaxed">{msg}</p>
              <button
                onClick={() => removeMessage(i)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#949494] hover:text-[#FF3B30]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add message */}
          <div className="flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMessage()}
              placeholder="Añadir mensaje clave..."
              className="flex-1 text-[11px] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm px-3 py-2 focus:outline-none focus:border-[#1C1C1C] placeholder:text-[#CCCCCC]"
            />
            <button
              onClick={addMessage}
              disabled={!newMessage.trim()}
              className="w-8 h-8 bg-[#1C1C1C] disabled:opacity-30 text-white rounded-sm flex items-center justify-center hover:bg-[#FF3B30] transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </BriefingSection>

      {/* Efemérides */}
      <BriefingSection icon={Calendar} label="Efemérides / Contexto">
        <div className="space-y-2">
          {ephemerides.length === 0 && (
            <p className="text-[10px] text-[#CCCCCC] font-medium uppercase tracking-widest">
              Sin efemérides
            </p>
          )}
          {ephemerides.map((eph, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm px-3 py-2 group"
            >
              <p className="flex-1 text-[11px] text-[#1C1C1C]">{eph}</p>
              <button
                onClick={() => removeEph(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#949494] hover:text-[#FF3B30]"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={newEph}
              onChange={(e) => setNewEph(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEph()}
              placeholder="Ej: Día del Motor, Lanzamiento S-Class..."
              className="flex-1 text-[11px] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm px-3 py-2 focus:outline-none focus:border-[#1C1C1C] placeholder:text-[#CCCCCC]"
            />
            <button
              onClick={addEph}
              disabled={!newEph.trim()}
              className="w-8 h-8 bg-[#1C1C1C] disabled:opacity-30 text-white rounded-sm flex items-center justify-center hover:bg-[#FF3B30] transition-colors flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </BriefingSection>

      {/* Restricciones */}
      <BriefingSection icon={X} label="Restricciones del Cliente">
        <textarea
          value={restrictions}
          onChange={(e) => setRestrictions(e.target.value)}
          placeholder="Cosas a evitar, colores prohibidos, competidores a no mencionar..."
          className="w-full resize-none text-[11px] leading-relaxed text-[#1C1C1C] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm p-3 focus:outline-none focus:border-[#1C1C1C] min-h-[60px] placeholder:text-[#CCCCCC]"
        />
      </BriefingSection>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full h-10 flex items-center justify-center gap-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
          saved
            ? "bg-[#34C759] text-white"
            : "bg-[#1C1C1C] hover:bg-[#FF3B30] text-white"
        } disabled:opacity-50`}
      >
        {isSaving ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : saved ? (
          "✓ Guardado"
        ) : (
          <>
            <Save className="w-3.5 h-3.5" />
            Guardar Briefing
          </>
        )}
      </button>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function BriefingSection({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-[var(--color-accent-red)]" />
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
