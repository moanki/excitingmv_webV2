import { NextResponse } from "next/server";

import { createContactRequest } from "@/lib/services/contact-service";
import { contactSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);

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
