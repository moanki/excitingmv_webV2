import { NextResponse } from "next/server";

import { createNewsletterSubmission } from "@/lib/services/newsletter-service";
import { newsletterSubmissionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = newsletterSubmissionSchema.safeParse(json);

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
