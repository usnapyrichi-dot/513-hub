import { Header } from "@/components/layout/header";
import { Folder } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CreateClientModal } from "./create-client-modal";
import { ClientCard } from "./client-card";

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, logo_url, brand_guidelines')
    .order('created_at', { ascending: false });

  const clientList = clients || [];

  return (
    <>
      <Header
        title="CLIENTES & MARCAS"
        actions={<CreateClientModal />}
      />
      <div className="p-12 animate-fade-up">
        {clientList.length === 0 ? (
          <div className="w-full h-[400px] border-2 border-dashed border-[#E5E5E5] rounded-[16px] flex flex-col items-center justify-center bg-white/50">
            <div className="w-16 h-16 bg-[#F8F6F6] rounded-full flex items-center justify-center mb-6">
              <Folder size={24} className="text-[#1C1C1C]" />
            </div>
            <p className="font-headline font-bold text-lg uppercase tracking-widest text-[#1C1C1C]">
              Agencia sin clientes
            </p>
            <p className="text-sm mt-2 text-[#949494] max-w-sm text-center">
              Haz clic en "Nuevo Cliente" para registrar la primera marca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {clientList.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
