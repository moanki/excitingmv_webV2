import { NextResponse } from "next/server";

import { requireAdminJson } from "@/lib/auth/require-admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { to?: unknown };
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;
  const recipient =
    typeof body.to === "string" && body.to.trim() ? body.to.trim() : process.env.NOTIFICATION_EMAIL;

  if (!resendApiKey || !emailFrom || !recipient) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing email configuration.",
        configured: {
          resendApiKey: Boolean(resendApiKey),
          emailFrom: Boolean(emailFrom),
          recipient: Boolean(recipient)
        }
      },
      { status: 500 }
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [recipient],
      subject: "Exciting Maldives notification test",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h1 style="font-size:20px">Email notifications are working</h1>
          <p>This protected admin test confirms Resend accepted a notification email from the Exciting Maldives website.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "Unknown Resend error");

    return NextResponse.json(
      {
        ok: false,
        error: "Email provider rejected the notification request.",
        status: response.status,
        details
      },
      { status: response.status }
    );
  }

  return NextResponse.json({
    ok: true,
    message: `Test email queued for ${recipient}.`
  });
}
