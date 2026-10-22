export function normalizeGoogleMapsEmbedUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const source = trimmed.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? trimmed;
  let url: URL;
  try {
    url = new URL(source.replaceAll("&amp;", "&"));
  } catch {
    throw new Error("Paste the Google Maps Embed URL or the copied iframe code.");
  }

  if (
    url.protocol !== "https:" ||
    !["www.google.com", "google.com"].includes(url.hostname) ||
    url.pathname !== "/maps/embed" ||
    !url.searchParams.has("pb") ||
    url.toString().length > 10000
  ) {
    throw new Error("Use Share > Embed a map > Copy HTML from Google Maps for this resort.");
  }

  return url.toString();
}

export function parseOptionalCoordinates(latitude: string, longitude: string) {
  const lat = latitude.trim();
  const lng = longitude.trim();
  if (!lat && !lng) return { latitude: null, longitude: null };

  const decimal = /^-?\d+(?:\.\d+)?$/;
  if (!decimal.test(lat) || !decimal.test(lng)) {
    throw new Error("Enter both latitude and longitude as decimal numbers, or leave both blank.");
  }

  const parsedLatitude = Number(lat);
  const parsedLongitude = Number(lng);
  if (Math.abs(parsedLatitude) > 90 || Math.abs(parsedLongitude) > 180) {
    throw new Error("Latitude must be between -90 and 90; longitude must be between -180 and 180.");
  }

  return { latitude: parsedLatitude, longitude: parsedLongitude };
}
