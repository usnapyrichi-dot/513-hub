"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, FileText, Folder, Image as ImageIcon, ExternalLink } from "lucide-react";

interface Props {
  client: {
    id: string;
    name: string;
    logo_url: string | null;
    brand_guidelines: any;
  };
}

export function ClientCard({ client }: Props) {
  const firstLetter = client.name ? client.name.charAt(0).toUpperCase() : "?";
  const hasBrandGuidelines = !!client.brand_guidelines?.tone;

  return (
    <Link href={`/clients/${client.id}`} className="block group">
      <Card className="flex flex-col rounded-[16px] relative overflow-hidden transition-all duration-300 group-hover:-translate-y-1 bg-white border border-[#E5E5E5] group-hover:border-[#1C1C1C] group-hover:shadow-[var(--shadow-hover)] h-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-surface-container-high)] group-hover:bg-[var(--color-accent-red)] transition-colors" />

        <CardHeader className="flex flex-row items-start justify-between pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-[46px] h-[46px] rounded-xl bg-[var(--color-surface-container-low)] flex items-center justify-center font-headline text-[20px] text-[var(--color-on-surface)] uppercase shadow-sm border border-[#E5E5E5]">
                {client.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={client.logo_url} alt="" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  firstLetter
                )}
              </div>
              <div>
                <CardTitle className="text-[17px] lowercase font-bold tracking-normal text-[#1C1C1C] group-hover:text-[var(--color-accent-red)] transition-colors">
                  {client.name}
                </CardTitle>
                <CardDescription className="uppercase tracking-[0.06em] text-[11px] mt-0.5 text-[#949494]">
                  {hasBrandGuidelines ? "Brand guidelines configuradas" : "Sin brand guidelines"}
                </CardDescription>
              </div>
            </div>
          </div>
          <button
            onClick={(e) => e.preventDefault()}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[#949494] hover:text-[#1C1C1C] hover:bg-[#F8F6F6] transition-all z-10 relative"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-6 pt-2">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#949494]">
                Catálogo de Modelos
              </span>
              <Badge variant="outline" className="text-[10px] rounded-sm px-2.5 py-0.5 border-[#E5E5E5] text-[#1C1C1C]">
                Ver Detalle
              </Badge>
            </div>
            <span className="px-3.5 py-1.5 rounded-sm text-[13px] font-medium bg-[#FAFAFA] text-[#1C1C1C] border border-[#E5E5E5] inline-block">
              Administrar Modelos →
            </span>
          </div>

          <div className="h-px w-full bg-[#E5E5E5]" />

          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2 h-11 px-3 text-[11px] font-bold rounded-sm border border-[#E5E5E5] bg-transparent hover:bg-[#F8F6F6] text-[#1C1C1C] cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4 text-[#949494]" />
              Brand Book
            </div>
            <div
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-2 h-11 px-3 text-[11px] font-bold rounded-sm border border-[#E5E5E5] bg-transparent hover:bg-[#F8F6F6] text-[#1C1C1C] cursor-pointer transition-colors"
            >
              <Folder className="w-4 h-4 text-[#949494]" />
              Drive
              <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
            </div>

            {/* Brand guidelines status */}
            <div className="col-span-2 rounded-sm bg-[#FAFAFA] border border-[#E5E5E5] p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-white flex items-center justify-center border border-[#E5E5E5] flex-shrink-0">
                <ImageIcon className="w-4 h-4 text-[#949494]" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#1C1C1C] tracking-widest block">
                  Brand Assets
                </span>
                {hasBrandGuidelines ? (
                  <span className="text-[10px] text-[#34C759] font-medium">
                    Tono: {(client.brand_guidelines.tone as string).slice(0, 30)}
                    {(client.brand_guidelines.tone as string).length > 30 ? "…" : ""}
                  </span>
                ) : (
                  <span className="text-[10px] text-[#CCCCCC]">Configura las guidelines →</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
