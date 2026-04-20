"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2, CarFront } from "lucide-react";
import { createClientModel } from "@/app/actions/clients";
import { useRouter } from "next/navigation";

export function CreateModelModal({ clientId }: { clientId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const result = await createClientModel(clientId, formData);
    setIsSubmitting(false);

    if (result.success) {
      setIsOpen(false);
      router.refresh();
    } else {
      alert("Error: " + result.error);
    }
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-[#1C1C1C] hover:bg-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-sm font-bold text-white shadow-sm transition-all"
      >
        <Plus className="w-4 h-4 mr-2" />
        AÑADIR VEHÍCULO
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[#FAFAFA]/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-md bg-white rounded-sm shadow-[var(--shadow-elevated)] border border-[#E5E5E5] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="w-12 h-12 rounded-sm bg-[#F8F6F6] flex items-center justify-center mb-4 border border-[#E5E5E5]">
                    <CarFront className="w-6 h-6 text-[#1C1C1C]" />
                  </div>
                  <h2 className="text-2xl font-headline font-bold uppercase tracking-tight text-[#1C1C1C]">
                    Registrar Modelo
                  </h2>
                  <p className="text-[13px] text-[#949494] font-medium mt-1">
                    Añade un vehículo al catálogo de la marca
                  </p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F8F6F6] text-[#949494] hover:text-[#1C1C1C] hover:bg-[#E5E5E5] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form action={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">
                    Nombre del Modelo
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    placeholder="Ej. 911 Carrera, Macan..."
                    className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] transition-colors font-medium text-[#1C1C1C] placeholder:text-[#D1D1D1]"
                  />
                </div>

                 <div className="space-y-2">
                  <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">
                    Categoría / Segmento
                  </label>
                  <input
                    id="category"
                    name="category"
                    placeholder="Ej. SUV, Deportivo, Sedán"
                    className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] transition-colors font-medium text-[#1C1C1C] placeholder:text-[#D1D1D1]"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="year" className="text-[10px] font-bold uppercase tracking-widest text-[#949494]">
                    Año de Lanzamiento
                  </label>
                  <input
                    id="year"
                    name="year"
                    type="number"
                    defaultValue={new Date().getFullYear()}
                    className="w-full h-12 px-4 rounded-sm border border-[#E5E5E5] text-[14px] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#1C1C1C] transition-colors font-medium text-[#1C1C1C]"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[var(--color-accent-red)] hover:bg-black text-white font-bold text-[11px] uppercase tracking-widest rounded-sm transition-all relative overflow-hidden group mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                  ) : (
                    "Guardar Vehículo"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
