import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { PenTool, LayoutTemplate } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { NewPieceModal } from "./new-piece-modal";
import { ContentList } from "./content-list";

export const dynamic = 'force-dynamic';

export default async function ContentPage() {
  const supabase = await createClient();

  const [{ data: pieces }, { data: clients }] = await Promise.all([
    supabase
      .from('content_pieces')
      .select('id, title, content_type, status, publish_date, created_at, clients ( name )')
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, name')
      .order('name'),
  ]);

  return (
    <>
      <Header
        title="CONTENT MASTER"
        actions={
          <div className="flex gap-3">
            <Link href="/ideation">
              <Button variant="outline" className="gap-2 h-10 font-bold uppercase tracking-widest text-xs border-[#E5E5E5] bg-white hover:bg-[#F8F6F6] text-[#1C1C1C]">
                <PenTool className="w-4 h-4" />
                Copiloto de Ideas
              </Button>
            </Link>
            <NewPieceModal clients={clients ?? []} />
          </div>
        }
      />

      <div className="p-12 animate-fade-up">
        {(pieces ?? []).length === 0 ? (
          <div className="w-full h-[400px] border-2 border-dashed border-[#E5E5E5] rounded-[16px] flex flex-col items-center justify-center bg-white/50">
            <div className="w-16 h-16 bg-[#F8F6F6] rounded-full flex items-center justify-center mb-6">
              <LayoutTemplate size={24} className="text-[#1C1C1C]" />
            </div>
            <p className="font-headline font-bold text-lg uppercase tracking-widest text-[#1C1C1C]">
              Parrilla Vacía
            </p>
            <p className="text-sm mt-2 text-[#949494] max-w-md text-center">
              No hay ninguna pieza de contenido todavía.
            </p>
            <Link href="/ideation" className="mt-8">
              <Button className="font-bold uppercase tracking-wider text-xs gap-2 bg-[var(--color-accent-red)] text-white hover:bg-[#1C1C1C] h-12 px-8 rounded-sm">
                <PenTool className="w-4 h-4" /> Empezar a Bocetar
              </Button>
            </Link>
          </div>
        ) : (
          <ContentList pieces={(pieces ?? []) as any} clients={clients ?? []} />
        )}
      </div>
    </>
  );
}
