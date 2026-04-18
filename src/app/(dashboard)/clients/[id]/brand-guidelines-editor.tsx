"use client";

import { useState } from "react";
import { updateBrandGuidelines } from "@/app/actions/clients";
import { Plus, X, Save, Loader2, Palette, Type, ThumbsUp, ThumbsDown } from "lucide-react";

interface Color { name: string; hex: string; }

interface Props {
  clientId: string;
  initial: {
    tone?: string;
    colors?: Color[];
    dos?: string[];
    donts?: string[];
  } | null;
}

export function BrandGuidelinesEditor({ clientId, initial }: Props) {
  const [tone, setTone] = useState(initial?.tone ?? "");
  const [colors, setColors] = useState<Color[]>(initial?.colors ?? []);
  const [dos, setDos] = useState<string[]>(initial?.dos ?? []);
  const [donts, setDonts] = useState<string[]>(initial?.donts ?? []);

  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#000000");
  const [newDo, setNewDo] = useState("");
  const [newDont, setNewDont] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateBrandGuidelines(clientId, { tone, colors, dos, donts });
    if (res.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      alert("Error: " + res.error);
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">

      {/* Tone */}
      <Section icon={Type} label="Tono de Comunicación">
        <textarea
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          placeholder="Ej: Premium, directo y aspiracional. Evitar tecnicismos. Énfasis en la experiencia de conducción y el status."
          className="w-full resize-none text-[12px] leading-relaxed text-[#1C1C1C] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm p-4 focus:outline-none focus:border-[#1C1C1C] min-h-[80px] placeholder:text-[#CCCCCC]"
        />
        <p className="text-[10px] text-[#949494]">
          Este tono se inyecta automáticamente en el AI Studio para que Gemini genere copy acorde a la marca.
        </p>
      </Section>

      {/* Colors */}
      <Section icon={Palette} label="Paleta de Colores">
        <div className="flex flex-wrap gap-2 mb-3">
          {colors.length === 0 && (
            <p className="text-[10px] text-[#CCCCCC] uppercase tracking-widest font-medium">Sin colores definidos</p>
          )}
          {colors.map((c, i) => (
            <div key={i} className="flex items-center gap-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm px-3 py-1.5 group">
              <div
                className="w-4 h-4 rounded-full border border-[#E5E5E5] flex-shrink-0"
                style={{ backgroundColor: c.hex }}
              />
              <span className="text-[11px] font-bold text-[#1C1C1C]">{c.name}</span>
              <span className="text-[10px] text-[#949494] font-mono">{c.hex}</span>
              <button
                onClick={() => setColors((prev) => prev.filter((_, idx) => idx !== i))}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#949494] hover:text-[#FF3B30] ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newColorName.trim()) {
                setColors((prev) => [...prev, { name: newColorName.trim(), hex: newColorHex }]);
                setNewColorName(""); setNewColorHex("#000000");
              }
            }}
            placeholder="Nombre del color"
            className="flex-1 h-9 px-3 border border-[#E5E5E5] rounded-sm text-[11px] text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] placeholder:text-[#CCCCCC]"
          />
          <input
            type="color"
            value={newColorHex}
            onChange={(e) => setNewColorHex(e.target.value)}
            className="w-9 h-9 border border-[#E5E5E5] rounded-sm cursor-pointer p-0.5"
          />
          <button
            onClick={() => {
              if (!newColorName.trim()) return;
              setColors((prev) => [...prev, { name: newColorName.trim(), hex: newColorHex }]);
              setNewColorName(""); setNewColorHex("#000000");
            }}
            disabled={!newColorName.trim()}
            className="w-9 h-9 bg-[#1C1C1C] disabled:opacity-30 text-white rounded-sm flex items-center justify-center hover:bg-[var(--color-accent-red)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </Section>

      {/* Dos & Donts */}
      <div className="grid grid-cols-2 gap-6">
        <Section icon={ThumbsUp} label="DO's — Qué hacer">
          <ListEditor
            items={dos}
            onAdd={(v) => setDos((p) => [...p, v])}
            onRemove={(i) => setDos((p) => p.filter((_, idx) => idx !== i))}
            placeholder="Ej: Mostrar al conductor en el coche"
            accentColor="#34C759"
            newValue={newDo}
            setNewValue={setNewDo}
          />
        </Section>
        <Section icon={ThumbsDown} label="DON'Ts — Qué evitar">
          <ListEditor
            items={donts}
            onAdd={(v) => setDonts((p) => [...p, v])}
            onRemove={(i) => setDonts((p) => p.filter((_, idx) => idx !== i))}
            placeholder="Ej: Mencionar marcas competidoras"
            accentColor="#FF3B30"
            newValue={newDont}
            setNewValue={setNewDont}
          />
        </Section>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`w-full h-12 flex items-center justify-center gap-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${
          saved
            ? "bg-[#34C759] text-white"
            : "bg-[#1C1C1C] hover:bg-[var(--color-accent-red)] text-white"
        } disabled:opacity-50`}
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "✓ Brand Guidelines Guardadas" : <><Save className="w-4 h-4" /> Guardar Guidelines</>}
      </button>
    </div>
  );
}

function Section({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-[#F0F0F0]">
        <Icon className="w-4 h-4 text-[var(--color-accent-red)]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#1C1C1C]">{label}</span>
      </div>
      {children}
    </div>
  );
}

function ListEditor({
  items, onAdd, onRemove, placeholder, accentColor, newValue, setNewValue,
}: {
  items: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void;
  placeholder: string; accentColor: string; newValue: string; setNewValue: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-[10px] text-[#CCCCCC] uppercase tracking-widest font-medium">Vacío</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm px-3 py-2 group">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: accentColor }} />
          <p className="flex-1 text-[11px] text-[#1C1C1C] leading-relaxed">{item}</p>
          <button onClick={() => onRemove(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#949494] hover:text-[#FF3B30]">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && newValue.trim()) { onAdd(newValue.trim()); setNewValue(""); } }}
          placeholder={placeholder}
          className="flex-1 text-[11px] bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm px-3 py-2 focus:outline-none focus:border-[#1C1C1C] placeholder:text-[#CCCCCC]"
        />
        <button
          onClick={() => { if (newValue.trim()) { onAdd(newValue.trim()); setNewValue(""); } }}
          disabled={!newValue.trim()}
          className="w-8 h-8 bg-[#1C1C1C] disabled:opacity-30 text-white rounded-sm flex items-center justify-center hover:bg-[var(--color-accent-red)] transition-colors flex-shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
