import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { CreateModelModal } from "@/components/clients/create-model-modal";
import { ArrowLeft, CarFront, FileText, Image as ImageIcon, Package, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { BrandGuidelinesEditor } from "./brand-guidelines-editor";

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  // Load Client Data
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!client) {
    notFound();
  }

  // Load Car Models + Pieces stats in parallel
  const [{ data: carModels }, { data: piecesRaw }] = await Promise.all([
    supabase
      .from('car_models')
      .select('*')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('content_pieces')
      .select('id, status, title, publish_date')
      .eq('client_id', params.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);
  const pieces = piecesRaw ?? [];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header
        title="BRAND HUB Workspace"
        actions={
          <div className="flex gap-4">
            <Link href="/clients">
              <Button variant="outline" className="gap-2 h-10 font-bold uppercase tracking-widest text-[10px] border-[#E5E5E5] bg-white hover:bg-[#F8F6F6] text-[#1C1C1C] rounded-sm">
                <ArrowLeft className="w-4 h-4" /> Volver a Marcas
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-12 max-w-[1400px] mx-auto w-full animate-fade-up">

        {/* Top Meta Area */}
        <div className="mb-12">
          <div className="flex items-center gap-6 mb-6">
             <div className="w-[80px] h-[80px] bg-white border border-[#E5E5E5] rounded-sm flex items-center justify-center p-2 shadow-sm">
                {client.logo_url ? (
                  <img src={client.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-3xl font-headline font-bold uppercase text-[#D1D1D1]">
                    {client.name.charAt(0)}
                  </span>
                )}
             </div>
             <div>
               <h1 className="text-4xl font-headline font-bold text-[#1C1C1C] uppercase tracking-tight">{client.name}</h1>
               <p className="text-[#949494] mt-1 font-medium tracking-wide">
                 Área de trabajo del cliente • Panel Principal
               </p>
             </div>
          </div>

          {/* Quick stats */}
          {pieces.length > 0 && (
            <div className="flex gap-4 mt-4 flex-wrap">
              {[
                { label: "Piezas totales", value: pieces.length, color: "#1C1C1C" },
                { label: "En producción", value: pieces.filter(p => ["production","pre_production","briefed"].includes(p.status)).length, color: "#FF9500" },
                { label: "En review",     value: pieces.filter(p => ["client_review","client_approved"].includes(p.status)).length, color: "#34C759" },
                { label: "Publicadas",    value: pieces.filter(p => ["scheduled","published"].includes(p.status)).length, color: "#007AFF" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-[#E5E5E5] rounded-[10px] px-4 py-3 flex items-center gap-3">
                  <span className="text-[20px] font-bold leading-none" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494]">{s.label}</span>
                </div>
              ))}
              <Link href={`/content?client=${client.name}`}
                className="bg-[#1C1C1C] hover:bg-[var(--color-accent-red)] text-white rounded-[10px] px-4 py-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest transition-colors">
                Ver todas →
              </Link>
            </div>
          )}
        </div>

        {/* Workspace Columns */}
        <div className="flex items-start gap-12">
          {/* Main Area: Products Models List */}
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-end mb-8 border-b border-[#E5E5E5] pb-4">
               <div>
                 <h3 className="font-headline font-bold text-2xl uppercase tracking-widest text-[#1C1C1C] flex items-center gap-3">
                   <Package className="w-6 h-6 text-[var(--color-accent-red)]" />
                   Catálogo de Productos / Modelos
                 </h3>
                 <p className="text-[#949494] text-sm font-medium mt-2">Productos y modelos asignados a campañas y contenidos</p>
               </div>
               <CreateModelModal clientId={client.id} />
            </div>

            {(!carModels || carModels.length === 0) ? (
               <div className="w-full h-[300px] border-2 border-dashed border-[#E5E5E5] rounded-sm flex flex-col items-center justify-center text-[var(--color-text-muted)] bg-white/50">
                  <Package size={32} className="text-[#D1D1D1] mb-4" />
                  <p className="font-headline font-bold text-sm uppercase tracking-widest text-[#1C1C1C]">Vacío</p>
                  <p className="text-xs mt-2 text-[#949494]">No hay productos o modelos registrados para esta marca aún.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carModels.map((car) => (
                  <div key={car.id} className="bg-white border border-[#E5E5E5] rounded-sm shadow-sm hover:border-[#1C1C1C] transition-colors group flex flex-col overflow-hidden">
                    {/* Thumbnail Header */}
                    {car.thumbnail_url ? (
                      <div className="w-full h-32 bg-[#F8F6F6] border-b border-[#E5E5E5] flex items-center justify-center overflow-hidden relative group-hover:opacity-90 transition-opacity">
                         <img src={car.thumbnail_url} alt={car.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full h-12 bg-[#F8F6F6] border-b border-[#E5E5E5] flex items-center px-4">
                        {car.product_type === 'other' ? (
                          <Package className="w-4 h-4 text-[#D1D1D1]" />
                        ) : (
                          <CarFront className="w-4 h-4 text-[#D1D1D1]" />
                        )}
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                         <h4 className="text-xl font-headline font-bold text-[#1C1C1C] uppercase group-hover:text-[var(--color-accent-red)] transition-colors line-clamp-1">{car.name}</h4>
                         {car.year && (
                           <span className="text-[10px] px-2 py-1 bg-[#F8F6F6] text-[#949494] uppercase tracking-widest font-bold rounded-sm border border-[#E5E5E5] shrink-0 ml-2">
                             {car.year}
                           </span>
                         )}
                      </div>
                      
                      <div className="space-y-2 mb-6 flex-1">
                        <div className="grid grid-cols-[80px_1fr] text-xs">
                          <span className="text-[#949494] font-bold uppercase tracking-widest text-[10px]">Categoría</span>
                          <span className="text-[#1C1C1C] font-medium">{car.category || 'N/A'}</span>
                        </div>
                        {/* Show first 2 dynamic features if available */}
                        {car.features && Array.isArray(car.features) && car.features.slice(0, 2).map((feat: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-[80px_1fr] text-xs">
                            <span className="text-[#949494] font-bold uppercase tracking-widest text-[10px] truncate">{feat.key}</span>
                            <span className="text-[#1C1C1C] font-medium truncate">{feat.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-auto">
                        <Link href={`/clients/${params.id}/models/${car.id}`} className="flex-1">
                          <Button variant="outline" className="w-full bg-[#FAFAFA] text-[10px] h-8 border-[#E5E5E5] uppercase tracking-widest font-bold text-[#949494] hover:text-[#1C1C1C]">
                            Ficha Completa
                          </Button>
                        </Link>
                        {car.drive_folder_url && (
                          <a href={car.drive_folder_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="w-8 h-8 p-0 bg-[#FAFAFA] border-[#E5E5E5] text-[#949494] hover:text-[#1C1C1C]">
                              <LinkIcon className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-[320px] bg-white rounded-[16px] border border-[#E5E5E5] shadow-sm p-6 space-y-8 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-black rounded-t-[16px]" />
            
            {/* Brand Guidelines Editor */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-[#949494] uppercase tracking-[0.15em] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Brand Guidelines
              </h4>
              <BrandGuidelinesEditor
                clientId={client.id}
                initial={client.brand_guidelines}
              />
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
