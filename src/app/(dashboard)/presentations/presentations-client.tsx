"use client";

import { useState } from "react";
import { FileDown, Loader2, ChevronDown, FileText, CheckCircle2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
}

interface Props {
  clients: Client[];
}

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export function PresentationsClient({ clients }: Props) {
  const now = new Date();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [year, setYear] = useState(now.getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  const selectedClient = clients.find((c) => c.id === clientId);

  const handleGenerate = async () => {
    if (!clientId) return;
    setIsGenerating(true);

    try {
      const monthLabel = `${MONTHS[month]} ${year}`;
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, monthYear: monthLabel }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error generando PDF");
      }

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `513hub_${selectedClient?.name ?? "cliente"}_${monthLabel}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setLastGenerated(monthLabel);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-12 animate-fade-up">
      <div className="max-w-[640px] space-y-8">

        {/* Config card */}
        <div className="bg-white rounded-[16px] border border-[#E5E5E5] shadow-sm p-8 space-y-6">
          <div>
            <h2 className="text-[14px] font-bold uppercase tracking-widest text-[#1C1C1C]">
              Nuevo Informe Mensual
            </h2>
            <p className="text-[11px] text-[#949494] mt-1">
              Genera un PDF con el resumen de todas las piezas del mes para el cliente seleccionado.
            </p>
          </div>

          {/* Client selector */}
          <div className="space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
              Cliente
            </label>
            <div className="relative">
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full h-12 pl-4 pr-10 border border-[#E5E5E5] rounded-sm text-[12px] font-bold uppercase tracking-wide text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] appearance-none bg-white"
              >
                {clients.length === 0 && <option value="">Sin clientes</option>}
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#949494] pointer-events-none" />
            </div>
          </div>

          {/* Month + Year */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
                Mes
              </label>
              <div className="relative">
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-10 border border-[#E5E5E5] rounded-sm text-[12px] font-bold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] appearance-none bg-white"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#949494] pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">
                Año
              </label>
              <div className="relative">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full h-12 pl-4 pr-10 border border-[#E5E5E5] rounded-sm text-[12px] font-bold text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] appearance-none bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#949494] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Preview info */}
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#949494] flex-shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-[#1C1C1C]">
                {selectedClient?.name ?? "—"} · {MONTHS[month]} {year}
              </p>
              <p className="text-[10px] text-[#949494] mt-0.5">
                Incluye portada, resumen de estadísticas y detalle de todas las piezas del periodo
              </p>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !clientId}
            className="w-full h-13 flex items-center justify-center gap-2.5 bg-[#1C1C1C] hover:bg-[var(--color-accent-red)] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold uppercase tracking-widest rounded-sm transition-colors py-4"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generando PDF...</>
            ) : (
              <><FileDown className="w-4 h-4" /> Generar y Descargar PDF</>
            )}
          </button>

          {lastGenerated && !isGenerating && (
            <div className="flex items-center gap-2 text-[#34C759]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[11px] font-bold">
                PDF de {lastGenerated} generado correctamente
              </span>
            </div>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: "📄", title: "Portada", desc: "Branding 513 HUB + nombre del cliente y mes" },
            { icon: "📊", title: "Estadísticas", desc: "Total piezas, publicadas, en producción, en review" },
            { icon: "🎬", title: "Piezas", desc: "Detalle de cada pieza con estado, plataformas y concepto" },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-[#E5E5E5] rounded-[12px] p-5 space-y-2">
              <span className="text-2xl">{item.icon}</span>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#1C1C1C]">
                {item.title}
              </p>
              <p className="text-[10px] text-[#949494] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
