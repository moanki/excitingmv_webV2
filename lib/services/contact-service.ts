import type { ServiceResult } from "@/lib/types";
import { escapeHtml } from "@/lib/security/escape-html";
import { sendNotificationEmail } from "@/lib/services/email-service";
import { contactSchema } from "@/lib/validations";
import type { z } from "zod";

type ContactInput = z.infer<typeof contactSchema>;

export async function createContactRequest(
  input: ContactInput
): Promise<ServiceResult<{ delivered: boolean }>> {
  const result = await sendNotificationEmail({
    group: "contact",
    replyTo: input.email,
    subject: "New Website Enquiry - Exciting Maldives",
    text: [
      "New contact enquiry",
      `Name: ${input.name}`,
      `Email: ${input.email}`,
      `Message: ${input.message}`,
      `Timestamp: ${new Date().toISOString()}`
    ].join("\n"),
    html: `
      <h2>New contact enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(input.email)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(input.message)}</p>
      <p><strong>Timestamp:</strong> ${escapeHtml(new Date().toISOString())}</p>
    `
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: { delivered: true }
  };
}
