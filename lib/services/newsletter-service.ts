import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import { sendNotificationEmail } from "@/lib/services/email-service";
import { getNotificationRecipient } from "@/lib/services/notification-settings-service";
import { newsletterSubmissionSchema } from "@/lib/validations";
import type { z } from "zod";

type NewsletterSubmissionInput = z.infer<typeof newsletterSubmissionSchema>;

export type NewsletterRecord = {
  id: string;
  fullName: string;
  agencyName: string;
  countryOfOrigin: string;
  contactNumber: string;
  email: string;
  primaryMarket: string;
  additionalNotes: string;
  source: string;
  status: string;
  exportedAt: string | null;
  createdAt: string;
};

type NewsletterRow = {
  id: string;
  email: string;
  source: string | null;
  status: string | null;
  exported_at: string | null;
  created_at: string;
  full_name?: string | null;
  agency_name?: string | null;
  country_of_origin?: string | null;
  contact_number?: string | null;
  primary_market?: string | null;
  additional_notes?: string | null;
};

function serializeFallbackSource(input: NewsletterSubmissionInput) {
  return JSON.stringify({
    source: input.source,
    fullName: input.fullName,
    agencyName: input.agencyName,
    countryOfOrigin: input.countryOfOrigin,
    contactNumber: input.contactNumber,
    primaryMarket: input.primaryMarket,
    additionalNotes: input.additionalNotes ?? ""
  });
}

function mapNewsletterRow(row: NewsletterRow): NewsletterRecord {
  let fallback = {
    source: row.source ?? "website",
    fullName: "",
    agencyName: "",
    countryOfOrigin: "",
    contactNumber: "",
    primaryMarket: "",
    additionalNotes: ""
  };

  if (row.source?.startsWith("{")) {
    try {
      fallback = {
        ...fallback,
        ...(JSON.parse(row.source) as typeof fallback)
      };
    } catch {}
  }

  return {
    id: row.id,
    fullName: row.full_name ?? fallback.fullName,
    agencyName: row.agency_name ?? fallback.agencyName,
    countryOfOrigin: row.country_of_origin ?? fallback.countryOfOrigin,
    contactNumber: row.contact_number ?? fallback.contactNumber,
    email: row.email,
    primaryMarket: row.primary_market ?? fallback.primaryMarket,
    additionalNotes: row.additional_notes ?? fallback.additionalNotes,
    source: fallback.source,
    status: row.status ?? "new",
    exportedAt: row.exported_at,
    createdAt: row.created_at
  };
}

export async function createNewsletterSubmission(
  input: NewsletterSubmissionInput
): Promise<ServiceResult<{ id: string; email: string; source: string | null }>> {
  const supabase = createSupabaseAdminClient();

  const insertPayload = {
    email: input.email,
    source: input.source,
    status: "new",
    full_name: input.fullName,
    agency_name: input.agencyName,
    country_of_origin: input.countryOfOrigin,
    contact_number: input.contactNumber,
    primary_market: input.primaryMarket,
    additional_notes: input.additionalNotes ?? ""
  };

  let data:
    | {
        id: string;
        email: string;
        source: string | null;
      }
    | null = null;

  let errorMessage = "Failed to store newsletter submission.";

  const firstAttempt = await supabase
    .from("newsletter_submissions")
    .insert(insertPayload)
    .select("id, email, source")
    .single();

  if (firstAttempt.error || !firstAttempt.data) {
    const fallbackAttempt = await supabase
      .from("newsletter_submissions")
      .insert({
        email: input.email,
        source: serializeFallbackSource(input),
        status: "new"
      })
      .select("id, email, source")
      .single();

    if (fallbackAttempt.error || !fallbackAttempt.data) {
      return {
        ok: false,
        error: errorMessage,
        status: 500,
        details: fallbackAttempt.error ?? firstAttempt.error
      };
    }

    data = fallbackAttempt.data;
  } else {
    data = firstAttempt.data;
  }

  const recipient = await getNotificationRecipient("newsletter");
  void sendNotificationEmail({
    to: recipient,
    subject: "New newsletter registration",
    html: `
      <h2>New newsletter registration</h2>
      <p><strong>Name:</strong> ${input.fullName}</p>
      <p><strong>Agency:</strong> ${input.agencyName}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Country:</strong> ${input.countryOfOrigin}</p>
      <p><strong>Contact Number:</strong> ${input.contactNumber}</p>
      <p><strong>Primary Market:</strong> ${input.primaryMarket}</p>
      <p><strong>Notes:</strong> ${input.additionalNotes ?? "-"}</p>
    `
  });

  return {
    ok: true,
    data
  };
}

export async function listNewsletterSubmissions() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("newsletter_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as NewsletterRow[]).map(mapNewsletterRow);
  } catch {
    return [];
  }
}
