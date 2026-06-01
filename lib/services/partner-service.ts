import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { escapeHtml } from "@/lib/security/escape-html";
import type { PartnerStatus, ServiceResult } from "@/lib/types";
import { sendNotificationEmail } from "@/lib/services/email-service";
import { partnerRegistrationSchema } from "@/lib/validations";
import type { z } from "zod";

type PartnerRegistrationInput = z.infer<typeof partnerRegistrationSchema>;

export type PartnerRequestRecord = {
  id: string;
  agencyName: string;
  contactName: string;
  email: string;
  market: string;
  notes: string;
  status: PartnerStatus;
  approvedAt: string | null;
  createdAt: string;
};

type PartnerRow = {
  id: string;
  agency_name: string;
  contact_name: string;
  email: string;
  market: string | null;
  notes: string | null;
  status: PartnerStatus;
  approved_at: string | null;
  created_at: string;
};

function mapPartnerRow(row: PartnerRow): PartnerRequestRecord {
  return {
    id: row.id,
    agencyName: row.agency_name,
    contactName: row.contact_name,
    email: row.email,
    market: row.market ?? "",
    notes: row.notes ?? "",
    status: row.status,
    approvedAt: row.approved_at,
    createdAt: row.created_at
  };
}

export async function createPartnerRegistration(
  input: PartnerRegistrationInput
): Promise<ServiceResult<{ id: string; agency_name: string; email: string; status: string }>> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("agents")
    .insert({
      agency_name: input.agencyName,
      contact_name: input.contactName,
      email: input.email,
      market: input.market,
      notes: input.notes ?? null,
      status: "pending"
    })
    .select("id, agency_name, email, status")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: "Failed to store partner registration.",
      status: 500,
      details: error
    };
  }

  void sendNotificationEmail({
    group: "general",
    replyTo: data.email,
    subject: "New Partner Enquiry - Exciting Maldives",
    text: [
      "New partner registration",
      `Agency: ${data.agency_name}`,
      `Email: ${data.email}`,
      `Market: ${input.market}`,
      `Contact: ${input.contactName}`,
      `Notes: ${input.notes ?? "-"}`,
      `Timestamp: ${new Date().toISOString()}`
    ].join("\n"),
    html: `
      <h2>New partner registration</h2>
      <p><strong>Agency:</strong> ${escapeHtml(data.agency_name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      <p><strong>Market:</strong> ${escapeHtml(input.market)}</p>
      <p><strong>Contact:</strong> ${escapeHtml(input.contactName)}</p>
      <p><strong>Notes:</strong> ${escapeHtml(input.notes ?? "-")}</p>
      <p><strong>Timestamp:</strong> ${escapeHtml(new Date().toISOString())}</p>
    `
  });

  return {
    ok: true,
    data
  };
}

export async function listPartnerRequests() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as PartnerRow[]).map(mapPartnerRow);
  } catch {
    return [];
  }
}

export async function updatePartnerRequestStatus(id: string, status: PartnerStatus, notes: string) {
  const supabase = createSupabaseAdminClient();
  const payload = {
    status,
    notes: notes || null,
    approved_at: status === "approved" ? new Date().toISOString() : null
  };

  const { error } = await supabase.from("agents").update(payload).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
