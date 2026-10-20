export function brochureFolderName(relativePath: string) {
  const parts = relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length === 2) return parts[0];
  if (parts.length === 3 && parts[0].toLowerCase() === "resortbrochure") return parts[1];
  return "";
}

export function signedBrochureTusConfig(projectUrl: string, anonKey: string, token: string) {
  const storageUrl = projectUrl.replace(".supabase.co", ".storage.supabase.co");
  return {
    endpoint: `${storageUrl}/storage/v1/upload/resumable/sign`,
    headers: { apikey: anonKey, "x-signature": token }
  };
}
