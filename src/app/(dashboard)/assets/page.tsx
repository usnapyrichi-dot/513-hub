import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { AssetsGallery } from "./assets-gallery";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const supabase = await createClient();

  const [{ data: assets }, { data: clients }] = await Promise.all([
    supabase
      .from("assets")
      .select(`
        id, file_name, file_url, file_type, mime_type,
        file_size_bytes, version, is_final, created_at,
        content_pieces (
          id, title,
          clients ( name )
        )
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name")
      .order("name"),
  ]);

  return (
    <>
      <Header
        title="BIBLIOTECA DE ASSETS"
        subtitle={`${(assets ?? []).length} archivos en total`}
      />
      <AssetsGallery
        initialAssets={(assets ?? []) as any}
        clients={clients ?? []}
      />
    </>
  );
}
