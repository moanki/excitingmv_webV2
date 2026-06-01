import { sendSmtpEmail, type SmtpEmailInput } from "@/lib/email/smtp-service";
import type { ServiceResult } from "@/lib/types";

type NotificationEmailInput = SmtpEmailInput;

export async function sendNotificationEmail(
  input: NotificationEmailInput
): Promise<ServiceResult<{ queued: boolean }>> {
  return sendSmtpEmail(input);
}
