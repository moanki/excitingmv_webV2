import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ServiceResult } from "@/lib/types";
import type { newsletterSubmissionSchema } from "@/lib/validations";
import { sendNotificationEmail } from "@/lib/services/email-service";
import type { z } from "zod";

type NewsletterSubmissionInput = z.infer<typeof newsletterSubmissionSchema>;

export async function createNewsletterSubmission(
  input: NewsletterSubmissionInput
): Promise<ServiceResult<{ id: string; email: string; source: string | null }>> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("newsletter_submissions")
    .insert({
      email: input.email,
      source: input.source,
      status: "new"
    })
    .select("id, email, source")
    .single();

  if (error || !data) {
    return {
      ok: false,
      error: "Failed to store newsletter submission.",
      status: 500,
      details: error
    };
  }

  void sendNotificationEmail({
    subject: "New newsletter registration",
    html: `
      <h2>New newsletter registration</h2>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Source:</strong> ${data.source ?? "website"}</p>
    `
  });

  return {
    ok: true,
    data
  };
}
