export function brochureFolderName(relativePath: string) {
  const parts = relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length === 2) return parts[0];
  if (parts.length === 3) return parts[1];
  return "";
}

export function brochureStoragePrefix(propertyType: "resort" | "hotels" | "liveaboards", id: string) {
  const folder = propertyType === "resort" ? "resorts" : propertyType;
  return `${folder}/${id}/brochures/`;
}

export function signedBrochureTusConfig(projectUrl: string, anonKey: string, token: string) {
  const storageUrl = projectUrl.replace(".supabase.co", ".storage.supabase.co");
  return {
    endpoint: `${storageUrl}/storage/v1/upload/resumable/sign`,
    headers: { apikey: anonKey, "x-signature": token }
  };
}
