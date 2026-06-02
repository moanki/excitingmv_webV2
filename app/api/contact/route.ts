import { NextResponse } from "next/server";

import { getClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { isHoneypotFilled, verifyTurnstileToken } from "@/lib/security/turnstile";
import { createContactRequest } from "@/lib/services/contact-service";
import { contactSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const body = json && typeof json === "object" ? (json as Record<string, unknown>) : {};

  if (isHoneypotFilled(body.website) || isHoneypotFilled(body.companyWebsite)) {
    return NextResponse.json({ ok: true, message: "Contact request received." });
  }

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false, error: "Please wait before trying again." }, { status: 429 });
  }

  const turnstile = await verifyTurnstileToken(body.turnstileToken ?? body["cf-turnstile-response"], request);
  if (!turnstile.ok) {
    return NextResponse.json({ ok: false, error: "Unable to verify this request." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid contact request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createContactRequest(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, details: result.details },
      { status: result.status ?? 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Contact request received.",
    data: result.data
  });
}
