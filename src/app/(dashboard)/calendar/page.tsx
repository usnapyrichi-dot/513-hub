import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import Link from "next/link";
import { PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "./calendar-grid";

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const supabase = await createClient();

  const { data: pieces } = await supabase
    .from('content_pieces')
    .select('id, title, content_type, status, publish_date, clients ( name )')
    .order('publish_date', { ascending: true, nullsFirst: false });

  return (
    <>
      <Header
        title="CALENDARIO"
        subtitle="Vista mensual de publicaciones"
        actions={
          <Link href="/ideation">
            <Button variant="outline" className="gap-2 h-10 font-bold uppercase tracking-widest text-xs border-[#E5E5E5] bg-white hover:bg-[#F8F6F6] text-[#1C1C1C]">
              <PenTool className="w-4 h-4" />
              Nueva Idea
            </Button>
          </Link>
        }
      />
      <CalendarGrid pieces={(pieces ?? []) as any} />
    </>
  );
}
