import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export const PRIVATE_RESOURCE_BUCKET = "partner-resources";
export const MAX_RESOURCE_BYTES = 50*1024*1024;
export function validatePrivateResourcePath(value: string) {
  if (!/^files\/[a-zA-Z0-9_-]+\.[a-z0-9]{1,8}$/.test(value)) throw new Error("Upload this document to the private partner library first.");
  return value;
}
export async function createPrivateResourceUpload(filename: string, size: number) {
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_RESOURCE_BYTES) throw new Error("Choose a resource up to 50 MB.");
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension || !["pdf","png","jpg","jpeg","webp","doc","docx","xls","xlsx","ppt","pptx","txt","csv"].includes(extension)) throw new Error("Unsupported resource file type.");
  const path = `files/${crypto.randomUUID()}.${extension}`;
  const {data,error} = await createSupabaseAdminClient().storage.from(PRIVATE_RESOURCE_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error("Unable to prepare private upload.");
  return {bucket:PRIVATE_RESOURCE_BUCKET,path,token:data.token};
}
