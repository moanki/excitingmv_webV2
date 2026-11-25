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

export type BrochureSelection = { resortId: string; accepted: boolean };

export function selectBrochure(
  selections: Record<string, BrochureSelection>,
  relativePath: string,
  resortId: string,
  accepted: boolean
): Record<string, BrochureSelection> {
  const next = { ...selections };
  if (accepted && resortId) {
    for (const [path, selection] of Object.entries(next)) {
      if (path !== relativePath && selection.resortId === resortId && selection.accepted) {
        next[path] = { ...selection, accepted: false };
      }
    }
  }
  next[relativePath] = { resortId, accepted: accepted && Boolean(resortId) };
  return next;
}

export function signedBrochureTusConfig(projectUrl: string, anonKey: string, token: string) {
  const storageUrl = projectUrl.replace(".supabase.co", ".storage.supabase.co");
  return {
    endpoint: `${storageUrl}/storage/v1/upload/resumable/sign`,
    headers: { apikey: anonKey, "x-signature": token }
  };
}
