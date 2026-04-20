import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ContentEditor } from "./content-editor";

export const dynamic = 'force-dynamic';

export default async function ContentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  
  // Fetch piece + assets + comments + briefing in parallel
  const [{ data: piece }, { data: assets }, { data: comments }, { data: briefing }] = await Promise.all([
    supabase
      .from('content_pieces')
      .select('id, title, description, copy_out, visual_description, content_type, status, platforms, publish_date, created_at, clients ( name, logo_url )')
      .eq('id', params.id)
      .single(),
    supabase
      .from('assets')
      .select('*')
      .eq('content_piece_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('comments')
      .select('*')
      .eq('content_piece_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('briefings')
      .select('*')
      .eq('content_piece_id', params.id)
      .maybeSingle(),
  ]);

  if (!piece) {
    notFound();
  }

  const clientObj = piece.clients as unknown as { name: string; logo_url: string } | null;
  const clientName = clientObj ? clientObj.name : 'Sin Cliente';
  const displayStatus = piece.status ? piece.status.replace('_', ' ') : 'planning';
  const displayType = piece.content_type ? piece.content_type.replace('_', ' ') : 'post';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      <Header
        title="CONTENT STUDIO"
        actions={
          <div className="flex gap-4">
            <Link href="/content">
              <Button variant="outline" className="gap-2 h-10 font-bold uppercase tracking-widest text-[10px] border-[#E5E5E5] bg-white hover:bg-[#F8F6F6] text-[#1C1C1C] rounded-sm">
                <ArrowLeft className="w-4 h-4" /> Volver a Parrilla
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-12 max-w-[1400px] mx-auto w-full animate-fade-up">
        
        {/* Top Header / Meta */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-[#1C1C1C] hover:bg-black text-[10px] uppercase tracking-widest px-3 py-1 font-bold rounded-sm text-white">
              {displayStatus}
            </Badge>
            <Badge variant="outline" className="text-[#949494] border-[#E5E5E5] text-[10px] uppercase tracking-widest px-3 py-1 font-bold rounded-sm">
              {displayType}
            </Badge>
          </div>
          <h1 className="text-4xl font-headline font-bold text-[#1C1C1C] uppercase tracking-tight">{piece.title}</h1>
          <p className="text-[#949494] mt-2 font-medium tracking-wide">
            Campaña elaborada para la marca <strong className="text-[#1C1C1C]">{clientName}</strong>
          </p>
        </div>

          {/* Interactive Editable Working Area */}
          <ContentEditor
            piece={piece}
            clientName={clientName}
            initialAssets={assets ?? []}
            initialComments={comments ?? []}
            initialBriefing={briefing ?? null}
          />

      </div>
    </div>
  );
}
