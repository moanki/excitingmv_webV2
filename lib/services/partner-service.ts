import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import { sendNotificationEmail } from "@/lib/services/email-service";
import { partnerRegistrationSchema } from "@/lib/validations";
import type { z } from "zod";

type PartnerRegistrationInput = z.infer<typeof partnerRegistrationSchema>;

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
    subject: "New partner registration",
    html: `
      <h2>New partner registration</h2>
      <p><strong>Agency:</strong> ${data.agency_name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Market:</strong> ${input.market}</p>
      <p><strong>Contact:</strong> ${input.contactName}</p>
    `
  });

  return {
    ok: true,
    data
  };
}
