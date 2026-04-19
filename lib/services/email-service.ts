import { env } from "@/lib/env";
import type { ServiceResult } from "@/lib/types";

type NotificationEmailInput = {
  subject: string;
  html: string;
  to?: string;
};

export async function sendNotificationEmail(
  input: NotificationEmailInput
): Promise<ServiceResult<{ queued: boolean }>> {
  const recipient = input.to ?? env.NOTIFICATION_EMAIL;

  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !recipient) {
    return {
      ok: false,
      error: "Missing email configuration.",
      status: 500
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [recipient],
      subject: input.subject,
      html: input.html
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "Unknown Resend error");
    return {
      ok: false,
      error: "Email provider rejected the notification request.",
      status: response.status,
      details
    };
  }

  return {
    ok: true,
    data: { queued: true }
  };
}
