import { NextResponse } from "next/server";

import { getClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { isHoneypotFilled, verifyTurnstileToken } from "@/lib/security/turnstile";
import { createPartnerRegistration } from "@/lib/services/partner-service";
import { partnerRegistrationSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const body = json && typeof json === "object" ? (json as Record<string, unknown>) : {};

  if (isHoneypotFilled(body.website) || isHoneypotFilled(body.companyWebsite)) {
    return NextResponse.json({ ok: true, message: "Partner registration captured for admin review." });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit({ key: `partner:${ip}:${email}`, limit: 3, windowMs: 30 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Please wait before trying again." }, { status: 429 });
  }

  const turnstile = await verifyTurnstileToken(body.turnstileToken ?? body["cf-turnstile-response"], request);
  if (!turnstile.ok) {
    return NextResponse.json({ ok: false, error: "Unable to verify this request." }, { status: 400 });
  }

  if (email) {
    body.email = email;
  }

  const parsed = partnerRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid partner registration", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createPartnerRegistration(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, details: result.details },
      { status: result.status ?? 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Partner registration captured for admin review.",
    data: result.data
  });
}
