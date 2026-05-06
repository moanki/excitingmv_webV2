import { revalidatePath } from "next/cache";

import { updateNewsletterSubmissionStatus } from "@/lib/services/newsletter-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        ids?: string[];
        status?: string;
      }
    | null;

  const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
  const status = String(body?.status || "general");

  if (!ids.length) {
    return Response.json({ error: "Missing newsletter ids." }, { status: 400 });
  }

  await updateNewsletterSubmissionStatus(ids, status);
  revalidatePath("/admin/newsletters");

  return Response.json({ ok: true });
}
