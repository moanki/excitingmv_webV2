"use client";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
export function PrivateResourceFileField({value="",resourceId}:{value?:string;resourceId?:string}) {
  const [path,setPath]=useState(value); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  return <label className="field field--full"><span>Private document</span>
    <input type="hidden" name="filePath" value={path} />
    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" disabled={busy} onChange={async event=>{
      const file=event.target.files?.[0];if(!file)return;setBusy(true);setError("");
      try {
        const response=await fetch("/api/admin/resource-files",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({filename:file.name,size:file.size})});
        const result=await response.json();if(!response.ok||!result.ok)throw new Error("Unable to prepare private upload.");
        const uploaded=await createSupabaseBrowserClient().storage.from(result.data.bucket).uploadToSignedUrl(result.data.path,result.data.token,file,{contentType:file.type||"application/octet-stream"});
        if(uploaded.error)throw new Error("Private upload failed.");setPath(result.data.path);
      }catch(e){setError(e instanceof Error?e.message:"Upload failed.");}finally{setBusy(false);}
    }}/>
    <span aria-live="polite">{busy?"Uploading private file...":path.startsWith("files/")?"Private document ready.":path?"Existing public document must be migrated or replaced.":"Upload a document to the private library."}</span>
    {resourceId && path && !path.startsWith("files/") ? <button type="button" disabled={busy} onClick={async()=>{
      setBusy(true);setError("");
      try {
        const response=await fetch("/api/admin/resource-files",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode:"migrate",resourceId})});
        const result=await response.json();if(!response.ok||!result.ok)throw new Error("Migration failed. Check whether this document is used elsewhere.");setPath(result.data.destination);
      }catch(e){setError(e instanceof Error?e.message:"Migration failed.");}finally{setBusy(false);}
    }}>Move existing document to private library</button>:null}
    {error?<span role="alert">{error}</span>:null}
  </label>;
}
