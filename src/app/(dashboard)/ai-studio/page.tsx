import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { AIStudioClient } from "./ai-studio-client";

export const dynamic = "force-dynamic";

export default async function AIStudioPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: prompts }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, brand_guidelines")
      .order("name"),
    supabase
      .from("ai_prompts")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <Header
        title="IA Studio"
        subtitle="Genera copy y prompts de vídeo con Gemini"
      />
      <AIStudioClient
        clients={clients ?? []}
        initialPrompts={prompts ?? []}
      />
    </>
  );
}
