import type { ServiceResult } from "@/lib/types";
import type { contactSchema } from "@/lib/validations";
import { sendNotificationEmail } from "@/lib/services/email-service";
import type { z } from "zod";

type ContactInput = z.infer<typeof contactSchema>;

export async function createContactRequest(
  input: ContactInput
): Promise<ServiceResult<{ delivered: boolean }>> {
  const result = await sendNotificationEmail({
    subject: "New contact enquiry",
    html: `
      <h2>New contact enquiry</h2>
      <p><strong>Name:</strong> ${input.name}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Message:</strong></p>
      <p>${input.message}</p>
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
