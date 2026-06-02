import { revalidatePath } from "next/cache";

import { requireAdminJson } from "@/lib/auth/require-admin";
import { updateNewsletterSubmissionStatus } from "@/lib/services/newsletter-service";

export async function POST(request: Request) {
  const auth = await requireAdminJson();
  if (!auth.ok) return auth.response;

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
