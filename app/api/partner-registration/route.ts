import { NextResponse } from "next/server";

import { createPartnerRegistration } from "@/lib/services/partner-service";
import { partnerRegistrationSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = partnerRegistrationSchema.safeParse(json);

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
