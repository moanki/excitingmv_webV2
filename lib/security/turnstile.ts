export async function verifyTurnstileToken(token: unknown, request: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return { ok: true, skipped: true };
  }

  if (typeof token !== "string" || !token.trim()) {
    return { ok: false, skipped: false };
  }

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);

  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) {
    formData.set("remoteip", ip);
  }

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    return { ok: false, skipped: false };
  }

  const data = (await response.json().catch(() => null)) as { success?: boolean } | null;
  return { ok: Boolean(data?.success), skipped: false };
}

export function isHoneypotFilled(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}
