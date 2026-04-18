import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { PresentationsClient } from "./presentations-client";

export const dynamic = "force-dynamic";

export default async function PresentationsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name");

  return (
    <>
      <Header
        title="PRESENTACIONES"
        subtitle="Informes PDF mensuales por cliente"
      />
      <PresentationsClient clients={clients ?? []} />
    </>
  );
}
