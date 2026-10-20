export function brochureFolderName(relativePath: string) {
  const parts = relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length === 2) return parts[0];
  if (parts.length === 3 && parts[0].toLowerCase() === "resortbrochure") return parts[1];
  return "";
}
