export async function readJsonBody(request: Request, maxBytes = 64*1024): Promise<Record<string, unknown>> {
  if (Number(request.headers.get("content-length") || 0) > maxBytes) throw new Error("Request is too large.");
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {value,done} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) throw new Error("Request is too large.");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const json: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  return json && typeof json === "object" && !Array.isArray(json) ? json as Record<string,unknown> : {};
}
