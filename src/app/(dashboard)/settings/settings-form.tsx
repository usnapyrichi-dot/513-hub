"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import {
  Building2, Key, Bell, Save, Loader2,
  Eye, EyeOff, CheckCircle2, ExternalLink,
  Users, Plus
} from "lucide-react";
import { updateWorkspaceSettings, inviteWorkspaceMember } from "@/app/actions/workspace";

function Section({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E5E5E5] shadow-sm overflow-hidden">
      <div className="px-8 py-5 border-b border-[#E5E5E5] flex items-center gap-3">
        <Icon className="w-4 h-4 text-[var(--color-accent-red)]" />
        <div>
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#1C1C1C]">{title}</h3>
          <p className="text-[10px] text-[#949494] mt-0.5">{description}</p>
        </div>
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", mono = false, readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean; readOnly?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = type === "password" ? (show ? "text" : "password") : type;
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494] block">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full h-10 px-3 border border-[#E5E5E5] rounded-sm text-[12px] text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] ${mono ? "font-mono" : ""} ${readOnly ? "bg-[#F8F6F6] text-[#949494] cursor-default" : "bg-white"} ${type === "password" ? "pr-10" : ""}`}
        />
        {type === "password" && (
          <button type="button" onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#949494] hover:text-[#1C1C1C]">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function SettingsForm({ initialData, initialMembers = [] }: { initialData: any, initialMembers?: any[] }) {
  const [agencyName,    setAgencyName]    = useState(initialData?.agency_name ?? "513 HUB");
  const [agencyTagline, setAgencyTagline] = useState(initialData?.tagline ?? "Editorial Studio");
  const [notifStatus,   setNotifStatus]   = useState(initialData?.notification_prefs?.notif_status ?? true);
  const [notifReview,   setNotifReview]   = useState(initialData?.notification_prefs?.notif_review ?? true);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  // Team Management State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviting, setInviting] = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    const result = await inviteWorkspaceMember(inviteEmail, inviteRole);
    setInviting(false);
    if (result.success) {
      alert("Invitación enviada correctamente.");
      setInviteEmail("");
    } else {
      alert(result.error);
    }
  };

  const handleSave = async () => {

    setSaving(true);
    try {
      await updateWorkspaceSettings({
        agency_name: agencyName,
        tagline: agencyTagline,
        notification_prefs: {
          notif_status: notifStatus,
          notif_review: notifReview,
        }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header title="SETTINGS" subtitle="Configuración de la agencia" />
      <div className="p-12 max-w-[720px] space-y-6 animate-fade-up">

        {/* Agency */}
        <Section icon={Building2} title="Agencia" description="Nombre e identidad que aparecen en los PDFs y cabeceras">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre de la agencia" value={agencyName}    onChange={setAgencyName}    placeholder="513 HUB" />
            <Field label="Tagline / Subtítulo"  value={agencyTagline} onChange={setAgencyTagline} placeholder="Editorial Studio" />
          </div>
          <div className="mt-5 p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1C1C1C] rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(agencyName || "5").charAt(0)}
            </div>
            <div>
              <span className="text-[12px] font-bold text-[#1C1C1C] block">{agencyName || "513 HUB"}</span>
              <span className="text-[10px] text-[var(--color-accent-red)]">{agencyTagline || "Editorial Studio"}</span>
            </div>
          </div>
        </Section>

        {/* API Keys */}
        <Section icon={Key} title="API Keys" description="Configura estas claves en el archivo .env.local del proyecto">
          <div className="space-y-4">
            <Field label="Gemini API Key"   value="Configurada en .env.local" readOnly mono />
            <Field label="Supabase URL"     value="Configurada en .env.local" readOnly mono />
            <Field label="Supabase Anon Key" value="Configurada en .env.local" readOnly mono />
          </div>
          <div className="mt-4 flex gap-4">
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#949494] hover:text-[#1C1C1C] transition-colors">
              Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#949494] hover:text-[#1C1C1C] transition-colors">
              Supabase Dashboard <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </Section>

        {/* Team Management */}
        <Section icon={Users} title="Equipo" description="Gestiona los miembros de tu agencia y sus accesos">
          <div className="space-y-6">
            {/* Invite Form */}
            <div className="flex items-end gap-3 p-4 bg-[#F8F6F6] border border-[#E5E5E5] rounded-sm">
              <div className="flex-1">
                <Field 
                  label="Email del nuevo miembro" 
                  value={inviteEmail} 
                  onChange={setInviteEmail} 
                  placeholder="ejemplo@513hub.col" 
                />
              </div>
              <div className="w-1/3 space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494] block">ROL</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E5E5E5] rounded-sm text-[12px] text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] bg-white cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="social_manager">Social Manager</option>
                  <option value="creative_copy">Creative Copy</option>
                  <option value="creative_art">Creative Art</option>
                  <option value="editor_designer">Editor / Designer</option>
                  <option value="client_viewer">Client Viewer</option>
                </select>
              </div>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail}
                className="h-10 px-4 flex items-center justify-center bg-[#1C1C1C] hover:bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors disabled:opacity-50"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invitar"}
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#949494] block">MIEMBROS ACTUALES</label>
              <div className="border border-[#E5E5E5] rounded-sm divide-y divide-[#E5E5E5]">
                {initialMembers.length === 0 ? (
                  <p className="p-4 text-xs text-[#949494]">No hay miembros aún.</p>
                ) : (
                  initialMembers.map((member: any) => (
                    <div key={member.id} className="p-4 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#FAFAFA] border border-[#E5E5E5] rounded-full flex items-center justify-center text-[10px] font-bold text-[#1C1C1C]">
                          {member.profiles?.full_name?.charAt(0) || member.profiles?.email?.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-[#1C1C1C]">{member.profiles?.full_name || member.profiles?.email}</p>
                          {member.profiles?.full_name && (
                            <p className="text-[10px] text-[#949494]">{member.profiles.email}</p>
                          )}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-[#F8F6F6] text-[#949494] text-[10px] uppercase font-bold tracking-widest rounded-sm">
                        {member.role.replace("_", " ")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notificaciones" description="Qué eventos muestran un aviso visual en la app">
          {[
            { label: "Cambios de estado",      desc: "Al mover una pieza entre columnas del Kanban",      val: notifStatus, set: setNotifStatus },
            { label: "Piezas en review cliente", desc: "Al pasar una pieza a estado Client Review",       val: notifReview, set: setNotifReview },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-4 border-b border-[#F0F0F0] last:border-0">
              <div>
                <p className="text-[11px] font-bold text-[#1C1C1C]">{item.label}</p>
                <p className="text-[10px] text-[#949494] mt-0.5">{item.desc}</p>
              </div>
              <button onClick={() => item.set((v: boolean) => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${item.val ? "bg-[#1C1C1C]" : "bg-[#E5E5E5]"}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${item.val ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </Section>

        <button onClick={handleSave} disabled={saving}
          className={`flex items-center gap-2 px-8 py-3 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${saved ? "bg-[#34C759] text-white" : "bg-[#1C1C1C] hover:bg-[var(--color-accent-red)] text-white"} disabled:opacity-50`}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Guardado" : "Guardar cambios"}
        </button>
      </div>
    </>
  );
}
