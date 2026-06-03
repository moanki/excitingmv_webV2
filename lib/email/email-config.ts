import { z } from "zod";

import { requireAdminRole } from "@/lib/auth/require-admin";
import { encryptSecret } from "@/lib/email/encryption";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const EMAIL_CONFIG_ID = "00000000-0000-0000-0000-000000000001";

export const emailProviders = ["google_workspace", "microsoft_365", "custom_smtp"] as const;
export type EmailProvider = (typeof emailProviders)[number];
export type EmailRecipientGroup = "general" | "contact" | "enquiry" | "newsletter";

export type EmailConfiguration = {
  id: string;
  enabled: boolean;
  provider: EmailProvider;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpRequireTls: boolean;
  smtpUsername: string;
  hasPassword: boolean;
  encryptedPassword?: string | null;
  passwordIv?: string | null;
  passwordAuthTag?: string | null;
  fromName: string;
  fromEmail: string;
  replyToEmail: string;
  generalRecipients: string;
  contactRecipients: string;
  enquiryRecipients: string;
  newsletterRecipients: string;
  ccRecipients: string;
  bccRecipients: string;
  lastTestStatus: string;
  lastTestMessage: string;
  lastTestedAt: string;
  lastSuccessfulTestAt: string;
  lastSuccessfulEmailAt: string;
  lastErrorSummary: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

type EmailConfigurationRow = {
  id: string;
  enabled: boolean | null;
  provider: EmailProvider | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean | null;
  smtp_require_tls: boolean | null;
  smtp_username: string | null;
  smtp_password_encrypted: string | null;
  smtp_password_iv: string | null;
  smtp_password_auth_tag: string | null;
  from_name: string | null;
  from_email: string | null;
  reply_to_email: string | null;
  general_recipients: string | null;
  contact_recipients: string | null;
  enquiry_recipients: string | null;
  newsletter_recipients: string | null;
  cc_recipients: string | null;
  bcc_recipients: string | null;
  last_test_status: string | null;
  last_test_message: string | null;
  last_tested_at: string | null;
  last_successful_test_at: string | null;
  last_successful_email_at: string | null;
  last_error_summary: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export const providerDefaults: Record<EmailProvider, { smtpHost: string; smtpPort: number; smtpSecure: boolean; smtpRequireTls: boolean }> = {
  google_workspace: {
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpSecure: false,
    smtpRequireTls: true
  },
  microsoft_365: {
    smtpHost: "smtp.office365.com",
    smtpPort: 587,
    smtpSecure: false,
    smtpRequireTls: true
  },
  custom_smtp: {
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpRequireTls: true
  }
};

const emailListSchema = z
  .string()
  .trim()
  .transform((value) => value.split(",").map((item) => item.trim()).filter(Boolean))
  .refine((items) => items.every((item) => z.string().email().safeParse(item).success), "Enter valid comma-separated email addresses.");

export const emailConfigurationFormSchema = z.object({
  enabled: z.boolean(),
  provider: z.enum(emailProviders),
  smtpHost: z.string().trim().min(1, "SMTP host is required."),
  smtpPort: z.coerce.number().int().positive("SMTP port is required."),
  smtpSecure: z.boolean(),
  smtpRequireTls: z.boolean(),
  smtpUsername: z.string().trim().min(1, "SMTP username is required."),
  smtpPassword: z.string(),
  fromName: z.string().trim().min(1, "From name is required."),
  fromEmail: z.string().trim().email("From email must be valid."),
  replyToEmail: z.string().trim(),
  generalRecipients: z.string().trim(),
  contactRecipients: z.string().trim(),
  enquiryRecipients: z.string().trim(),
  newsletterRecipients: z.string().trim(),
  ccRecipients: z.string().trim(),
  bccRecipients: z.string().trim()
}).superRefine((value, context) => {
  if (value.replyToEmail && !z.string().email().safeParse(value.replyToEmail).success) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["replyToEmail"], message: "Reply-to email must be valid." });
  }

  for (const field of ["generalRecipients", "contactRecipients", "enquiryRecipients", "newsletterRecipients", "ccRecipients", "bccRecipients"] as const) {
    const parsed = emailListSchema.safeParse(value[field]);
    if (!parsed.success) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: parsed.error.issues[0]?.message ?? "Enter valid email addresses." });
    }
  }

  const hasGeneral = parseEmailList(value.generalRecipients).length > 0;
  const hasAnySpecific =
    parseEmailList(value.contactRecipients).length > 0 ||
    parseEmailList(value.enquiryRecipients).length > 0 ||
    parseEmailList(value.newsletterRecipients).length > 0;

  if (value.enabled && !hasGeneral && !hasAnySpecific) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["generalRecipients"],
      message: "Add general recipients or at least one specific recipient group before enabling email."
    });
  }
});

export function parseEmailList(value?: string | null) {
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

export function mapEmailConfiguration(row: EmailConfigurationRow | null): EmailConfiguration {
  const defaults = providerDefaults.google_workspace;
  return {
    id: row?.id ?? EMAIL_CONFIG_ID,
    enabled: row?.enabled ?? false,
    provider: row?.provider ?? "google_workspace",
    smtpHost: row?.smtp_host ?? defaults.smtpHost,
    smtpPort: row?.smtp_port ?? defaults.smtpPort,
    smtpSecure: row?.smtp_secure ?? defaults.smtpSecure,
    smtpRequireTls: row?.smtp_require_tls ?? defaults.smtpRequireTls,
    smtpUsername: row?.smtp_username ?? "",
    hasPassword: Boolean(row?.smtp_password_encrypted && row.smtp_password_iv && row.smtp_password_auth_tag),
    encryptedPassword: row?.smtp_password_encrypted,
    passwordIv: row?.smtp_password_iv,
    passwordAuthTag: row?.smtp_password_auth_tag,
    fromName: row?.from_name ?? "Exciting Maldives",
    fromEmail: row?.from_email ?? "",
    replyToEmail: row?.reply_to_email ?? "",
    generalRecipients: row?.general_recipients ?? "",
    contactRecipients: row?.contact_recipients ?? "",
    enquiryRecipients: row?.enquiry_recipients ?? "",
    newsletterRecipients: row?.newsletter_recipients ?? "",
    ccRecipients: row?.cc_recipients ?? "",
    bccRecipients: row?.bcc_recipients ?? "",
    lastTestStatus: row?.last_test_status ?? "not_configured",
    lastTestMessage: row?.last_test_message ?? "",
    lastTestedAt: row?.last_tested_at ?? "",
    lastSuccessfulTestAt: row?.last_successful_test_at ?? "",
    lastSuccessfulEmailAt: row?.last_successful_email_at ?? "",
    lastErrorSummary: row?.last_error_summary ?? "",
    createdBy: row?.created_by ?? "",
    updatedBy: row?.updated_by ?? "",
    createdAt: row?.created_at ?? "",
    updatedAt: row?.updated_at ?? ""
  };
}

export async function getEmailConfiguration() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_configurations")
    .select("*")
    .eq("id", EMAIL_CONFIG_ID)
    .maybeSingle();

  if (error) {
    console.error("Email configuration load failed", { message: error.message });
    return mapEmailConfiguration(null);
  }

  return mapEmailConfiguration((data as EmailConfigurationRow | null) ?? null);
}

export function getRecipientsForGroup(config: EmailConfiguration, group: EmailRecipientGroup) {
  const specific =
    group === "contact" ? config.contactRecipients :
    group === "enquiry" ? config.enquiryRecipients :
    group === "newsletter" ? config.newsletterRecipients :
    "";
  return parseEmailList(specific).length ? parseEmailList(specific) : parseEmailList(config.generalRecipients);
}

export async function saveEmailConfiguration(formData: FormData) {
  const admin = await requireAdminRole(["super_admin", "admin"]);
  const current = await getEmailConfiguration();
  const parsed = emailConfigurationFormSchema.safeParse({
    enabled: formData.get("enabled") === "on",
    provider: String(formData.get("provider") ?? "google_workspace"),
    smtpHost: String(formData.get("smtpHost") ?? ""),
    smtpPort: String(formData.get("smtpPort") ?? ""),
    smtpSecure: formData.get("smtpSecure") === "on",
    smtpRequireTls: formData.get("smtpRequireTls") === "on",
    smtpUsername: String(formData.get("smtpUsername") ?? ""),
    smtpPassword: String(formData.get("smtpPassword") ?? ""),
    fromName: String(formData.get("fromName") ?? ""),
    fromEmail: String(formData.get("fromEmail") ?? ""),
    replyToEmail: String(formData.get("replyToEmail") ?? ""),
    generalRecipients: String(formData.get("generalRecipients") ?? ""),
    contactRecipients: String(formData.get("contactRecipients") ?? ""),
    enquiryRecipients: String(formData.get("enquiryRecipients") ?? ""),
    newsletterRecipients: String(formData.get("newsletterRecipients") ?? ""),
    ccRecipients: String(formData.get("ccRecipients") ?? ""),
    bccRecipients: String(formData.get("bccRecipients") ?? "")
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Please check the email configuration fields." };
  }

  const value = parsed.data;
  const passwordValue = value.smtpPassword.trim();
  const hasExistingPassword = current.hasPassword;

  if (value.enabled && !passwordValue && !hasExistingPassword) {
    return { ok: false as const, error: "SMTP password or app password is required before enabling email." };
  }

  let passwordColumns = {
    smtp_password_encrypted: current.encryptedPassword ?? null,
    smtp_password_iv: current.passwordIv ?? null,
    smtp_password_auth_tag: current.passwordAuthTag ?? null
  };

  if (passwordValue) {
    try {
      const encrypted = encryptSecret(passwordValue);
      passwordColumns = {
        smtp_password_encrypted: encrypted.encrypted,
        smtp_password_iv: encrypted.iv,
        smtp_password_auth_tag: encrypted.authTag
      };
    } catch (error) {
      console.error("Email configuration password encryption failed", { error: error instanceof Error ? error.message : "unknown" });
      return { ok: false as const, error: "Could not secure the SMTP password. Check server email encryption settings." };
    }
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("email_configurations").upsert({
    id: EMAIL_CONFIG_ID,
    enabled: value.enabled,
    provider: value.provider,
    smtp_host: value.smtpHost,
    smtp_port: value.smtpPort,
    smtp_secure: value.smtpSecure,
    smtp_require_tls: value.smtpRequireTls,
    smtp_username: value.smtpUsername,
    ...passwordColumns,
    from_name: value.fromName,
    from_email: value.fromEmail,
    reply_to_email: value.replyToEmail || null,
    general_recipients: value.generalRecipients,
    contact_recipients: value.contactRecipients,
    enquiry_recipients: value.enquiryRecipients,
    newsletter_recipients: value.newsletterRecipients,
    cc_recipients: value.ccRecipients,
    bcc_recipients: value.bccRecipients,
    updated_by: admin.userId,
    created_by: current.createdBy || admin.userId
  }, { onConflict: "id" });

  if (error) {
    console.error("Email configuration save failed", { message: error.message });
    return { ok: false as const, error: "Could not save email configuration." };
  }

  return { ok: true as const };
}

export async function updateEmailTestStatus(input: {
  status: "success" | "failed";
  message: string;
  successfulEmail?: boolean;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  await supabase.from("email_configurations").upsert({
    id: EMAIL_CONFIG_ID,
    last_test_status: input.status,
    last_test_message: input.message,
    last_tested_at: now,
    last_successful_test_at: input.status === "success" ? now : undefined,
    last_successful_email_at: input.successfulEmail ? now : undefined,
    last_error_summary: input.status === "failed" ? input.message : null
  }, { onConflict: "id" });
}
