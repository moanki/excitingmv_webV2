import { NextResponse } from "next/server";

import { requireAdminJson } from "@/lib/auth/require-admin";
import { sendAdminTestEmail } from "@/lib/email/smtp-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { to?: unknown };
  const recipient = typeof body.to === "string" && body.to.trim() ? body.to.trim() : undefined;
  const result = await sendAdminTestEmail(recipient);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error
      },
      { status: result.status ?? 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Test email sent."
  });
}
