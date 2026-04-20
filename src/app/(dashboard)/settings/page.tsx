import { getWorkspaceSettings } from "@/app/actions/workspace";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await getWorkspaceSettings();
  
  return <SettingsForm initialData={settings} />;
}
