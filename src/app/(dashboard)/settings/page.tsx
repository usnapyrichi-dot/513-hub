import { getWorkspaceSettings, getWorkspaceMembers } from "@/app/actions/workspace";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getWorkspaceSettings();
  const members = await getWorkspaceMembers();
  
  return <SettingsForm initialData={settings} initialMembers={members} />;
}
