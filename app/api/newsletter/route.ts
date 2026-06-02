import { NextResponse } from "next/server";

import { getClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { isHoneypotFilled, verifyTurnstileToken } from "@/lib/security/turnstile";
import { createNewsletterSubmission } from "@/lib/services/newsletter-service";
import { newsletterSubmissionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const body = json && typeof json === "object" ? (json as Record<string, unknown>) : {};

  if (isHoneypotFilled(body.website) || isHoneypotFilled(body.companyWebsite)) {
    return NextResponse.json({ ok: true, message: "Newsletter submission accepted." });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit({ key: `newsletter:${ip}:${email}`, limit: 5, windowMs: 10 * 60 * 1000 });
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

  const parsed = newsletterSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid newsletter submission", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createNewsletterSubmission(parsed.data);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, details: result.details },
      { status: result.status ?? 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Newsletter submission accepted.",
    data: result.data
  });
}
