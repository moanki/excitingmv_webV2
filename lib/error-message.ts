export function toErrorMessage(value: unknown, fallback: string): string {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value;
  if (value && typeof value === "object") {
    const nested = (value as { message?: unknown; error?: unknown }).message ??
      (value as { error?: unknown }).error;
    if (nested !== undefined && nested !== value) return toErrorMessage(nested, fallback);
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== "{}") return serialized;
    } catch {}
  }
  return fallback;
}
