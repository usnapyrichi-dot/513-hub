"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function CreateClientModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    const supabase = createClient();
    
    // Insert into Supabase table correctly
    const { error } = await supabase.from('clients').insert([{ name }]);
    
    setIsLoading(false);
    
    if (!error) {
      setIsOpen(false);
      setName("");
      router.refresh(); // Fetches fresh Server Components data
    } else {
      console.error("Supabase Error:", error);
      alert("Hubo un error al guardar el cliente.");
    }
  };

  return (
    <>
      <Button 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="gap-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-accent-red)] transition-colors rounded-lg font-bold px-5 h-10"
      >
        <Plus className="w-4 h-4" />
        NUEVO CLIENTE
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] w-full max-w-md rounded-[16px] shadow-[var(--shadow-elevated)] p-8 animate-fade-up border border-[#E5E5E5]/50">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-headline font-bold text-[#1C1C1C] uppercase tracking-tight">Nuevo Cliente</h2>
              <button onClick={() => setIsOpen(false)} className="text-[#949494] hover:text-[#1c1c1c] transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#949494]">Nombre de la Marca</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  autoFocus
                  placeholder="Ej: Porsche España" 
                  className="w-full h-14 px-4 rounded-sm border border-[#E5E5E5] focus:outline-none focus:border-[var(--color-accent-red)] focus:ring-1 focus:ring-[var(--color-accent-red)] text-sm shadow-sm transition-all text-[#1C1C1C]"
                  required
                />
              </div>

              <div className="flex justify-end gap-4 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-sm font-bold uppercase tracking-wider text-xs px-6 h-12">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-[var(--color-accent-red)] hover:bg-black text-white rounded-sm font-bold uppercase tracking-wider text-xs px-8 h-12 transition-colors">
                  {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Crear Cliente"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
