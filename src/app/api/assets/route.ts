import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceId } from "@/lib/supabase/workspace";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");
  
  if (!path) {
    return new NextResponse("Missing path", { status: 400 });
  }

  try {
    // 1. Verify Authentication & Workspace Membership
    await resolveWorkspaceId();

    // 2. Generate a 1-hour Signed URL
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from("assets")
      .createSignedUrl(path, 3600);

    if (error || !data?.signedUrl) {
      console.error("[Assets Proxy] generate signed url failed:", error);
      return new NextResponse("Not Found or Access Denied", { status: 404 });
    }

    // 3. Redirect the browser seamlessly to the signed URL
    return NextResponse.redirect(data.signedUrl);

  } catch (error) {
    console.error("[Assets Proxy] auth failed:", error);
    return new NextResponse("Unauthorized", { status: 401 });
  }
}
