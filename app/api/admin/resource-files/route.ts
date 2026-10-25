import { NextResponse } from "next/server";
import { requireAdminJson } from "@/lib/auth/require-admin";
import { createPrivateResourceUpload, PRIVATE_RESOURCE_BUCKET, validatePrivateResourcePath } from "@/lib/storage/partner-resources";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { readJsonBody } from "@/lib/security/request-body";
export const runtime = "nodejs";
export async function POST(request:Request) {
  const auth = await requireAdminJson(); if (!auth.ok) return auth.response;
  try {
    const input = await readJsonBody(request);
    if(input.mode === "discard") {
      const path=validatePrivateResourcePath(String(input.path??""));
      const client=createSupabaseAdminClient();
      const linked=await client.from("resources").select("id").eq("file_path",path).limit(1);
      if(linked.error||linked.data?.length) throw new Error("Attached resources cannot be discarded.");
      const removed=await client.storage.from(PRIVATE_RESOURCE_BUCKET).remove([path]);
      if(removed.error) throw new Error("Unable to remove unused private file.");
      return NextResponse.json({ok:true});
    }
    if (input.mode !== "migrate") return NextResponse.json({ok:true,data:await createPrivateResourceUpload(String(input.filename??""),Number(input.size))});
    const client = createSupabaseAdminClient();
    const {data:resource,error} = await client.from("resources").select("id,file_path").eq("id",String(input.resourceId??"")).single();
    if (error || !resource) throw new Error("Resource not found.");
    if (resource.file_path.startsWith("files/")) return NextResponse.json({ok:true,data:{destination:resource.file_path}});
    const url = new URL(resource.file_path);
    if (url.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin || !url.pathname.startsWith("/storage/v1/object/public/site-assets/")) throw new Error("Re-upload external documents using private upload.");
    const source = decodeURIComponent(url.pathname.slice("/storage/v1/object/public/site-assets/".length));
    const ext = source.split(".").pop()?.toLowerCase();
    if (!ext || !/^[a-z0-9]{1,8}$/.test(ext)) throw new Error("Unsupported source path.");
    const destination = `files/${resource.id}.${ext}`;
    const checks=await Promise.all([
      client.from("resort_media").select("id").eq("file_path",resource.file_path).limit(1),
      client.from("resort_documents").select("id").eq("file_path",resource.file_path).limit(1),
      client.from("site_settings").select("value")
    ]);
    if(checks.some(check=>check.error) || checks[0].data?.length || checks[1].data?.length || JSON.stringify(checks[2].data).includes(resource.file_path)) throw new Error("Document has other public references. Review these before migrating.");
    const moved=await client.storage.from("site-assets").move(source,destination,{destinationBucket:PRIVATE_RESOURCE_BUCKET});
    if(moved.error) throw new Error("Private file move failed.");
    const updated=await client.from("resources").update({file_path:destination}).eq("file_path",resource.file_path);
    if(updated.error) {
      await client.storage.from(PRIVATE_RESOURCE_BUCKET).move(destination,source,{destinationBucket:"site-assets"});
      throw new Error("Unable to update private resource.");
    }
    return NextResponse.json({ok:true,data:{destination}});

  } catch { return NextResponse.json({ok:false,error:"Unable to prepare resource. Check the selected file and try again."},{status:400}); }
}
