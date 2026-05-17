import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ADMIN_SESSION_COOKIE } from "@/lib/auth/bootstrap-admin";
import { env } from "@/lib/env";
import { sendNotificationEmail } from "@/lib/services/email-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  if (!cookieStore.get(ADMIN_SESSION_COOKIE)?.value) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { to?: unknown };
  const recipient = typeof body.to === "string" && body.to.trim() ? body.to.trim() : env.NOTIFICATION_EMAIL;

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !recipient) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing email configuration.",
        configured: {
          resendApiKey: Boolean(env.RESEND_API_KEY),
          emailFrom: Boolean(env.EMAIL_FROM),
          recipient: Boolean(recipient)
        }
      },
      { status: 500 }
    );
  }

  const result = await sendNotificationEmail({
    to: recipient,
    subject: "Exciting Maldives notification test",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h1 style="font-size:20px">Email notifications are working</h1>
        <p>This protected admin test confirms Resend accepted a notification email from the Exciting Maldives website.</p>
      </div>
    `
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        status: result.status,
        details: result.details
      },
      { status: result.status ?? 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Test email queued for ${recipient}.`
  });
}
