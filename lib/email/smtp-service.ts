import nodemailer from "nodemailer";

import { decryptSecret } from "@/lib/email/encryption";
import {
  getEmailConfiguration,
  getRecipientsForGroup,
  parseEmailList,
  updateEmailTestStatus,
  type EmailRecipientGroup
} from "@/lib/email/email-config";
import { env } from "@/lib/env";
import type { ServiceResult } from "@/lib/types";

export type SmtpEmailInput = {
  subject: string;
  html: string;
  text?: string;
  group?: EmailRecipientGroup;
  to?: string | string[];
  replyTo?: string;
};

function safeSmtpError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("disabled")) {
    return "Email notifications are disabled. Save and enable the email configuration first.";
  }

  if (message.includes("incomplete")) {
    return "Email configuration is incomplete. Save SMTP host, username, sender, and recipients first.";
  }

  if (message.includes("password is not configured")) {
    return "SMTP password is not configured. Save the SMTP password or app password first.";
  }

  if (message.includes("encryption key")) {
    return "Email password encryption is not configured. Set EMAIL_CONFIG_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY on the server.";
  }

  if (message.includes("auth") || message.includes("credential") || message.includes("login")) {
    return "Authentication failed. Please verify SMTP username and password.";
  }

  if (message.includes("tls") || message.includes("ssl") || message.includes("certificate")) {
    return "TLS connection failed. Please verify TLS settings.";
  }

  if (message.includes("recipient") || message.includes("address")) {
    return "Recipient validation failed. Please verify recipient email addresses.";
  }

  if (message.includes("connect") || message.includes("timeout") || message.includes("dns")) {
    return "Connection failed. Please verify SMTP host and port.";
  }

  return "Email delivery failed. Please verify the email configuration.";
}

async function createTransport() {
  const config = await getEmailConfiguration();

  if (!config.enabled) {
    throw new Error("Email notifications are disabled.");
  }

  if (!config.smtpHost || !config.smtpPort || !config.smtpUsername || !config.fromEmail) {
    throw new Error("Email configuration is incomplete.");
  }

  if (!config.encryptedPassword || !config.passwordIv || !config.passwordAuthTag) {
    throw new Error("SMTP password is not configured.");
  }

  const password = decryptSecret({
    encrypted: config.encryptedPassword,
    iv: config.passwordIv,
    authTag: config.passwordAuthTag
  });

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    requireTLS: config.smtpRequireTls,
    auth: {
      user: config.smtpUsername,
      pass: password
    }
  });

  return { config, transporter };
}

export async function verifySmtpConnection() {
  try {
    const { transporter } = await createTransport();
    await transporter.verify();
    await updateEmailTestStatus({ status: "success", message: "SMTP connection successful." });
    return { ok: true as const, message: "SMTP connection successful." };
  } catch (error) {
    const message = safeSmtpError(error);
    console.error("SMTP verify failed", { message });
    await updateEmailTestStatus({ status: "failed", message }).catch(() => undefined);
    return { ok: false as const, error: message };
  }
}

export async function sendSmtpEmail(input: SmtpEmailInput): Promise<ServiceResult<{ queued: boolean }>> {
  try {
    const { config, transporter } = await createTransport();
    const recipients = Array.isArray(input.to)
      ? input.to
      : input.to
        ? parseEmailList(input.to)
        : getRecipientsForGroup(config, input.group ?? "general");

    if (!recipients.length) {
      return { ok: false, error: "Missing email recipients.", status: 500 };
    }

    const cc = parseEmailList(config.ccRecipients);
    const bcc = parseEmailList(config.bccRecipients);
    const replyTo = input.replyTo || config.replyToEmail || undefined;

    await transporter.sendMail({
      from: `"${config.fromName || "Exciting Maldives"}" <${config.fromEmail}>`,
      to: recipients,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html
    });

    await updateEmailTestStatus({ status: "success", message: "Email sent successfully.", successfulEmail: true }).catch(() => undefined);
    return { ok: true, data: { queued: true } };
  } catch (error) {
    const message = safeSmtpError(error);
    console.error("SMTP send failed", { message });
    await updateEmailTestStatus({ status: "failed", message }).catch(() => undefined);
    return { ok: false, error: message, status: 500 };
  }
}

export async function sendAdminTestEmail(to?: string) {
  const timestamp = new Date().toISOString();
  const subject = "SMTP Test - Exciting Maldives Website";
  const text = [
    "SMTP test email from Exciting Maldives Admin Center.",
    `Environment URL: ${env.NEXT_PUBLIC_APP_URL}`,
    `Timestamp: ${timestamp}`
  ].join("\n");

  return sendSmtpEmail({
    to,
    subject,
    text,
    html: `
      <h2>SMTP Test - Exciting Maldives Website</h2>
      <p>This message was sent from the Admin Center Email Configuration test function.</p>
      <p><strong>Environment URL:</strong> ${env.NEXT_PUBLIC_APP_URL}</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
    `
  });
}
