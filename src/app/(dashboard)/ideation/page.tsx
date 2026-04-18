import { createClient } from "@/lib/supabase/server";
import { IdeationClient } from "./ideation-client";

export const dynamic = 'force-dynamic';

export default async function IdeationStudioPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase.from('clients').select('*').order('name');

  return <IdeationClient clients={clients || []} />;
}
