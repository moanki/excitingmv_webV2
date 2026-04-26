import { revalidatePath } from "next/cache";

import { updatePartnerRequestStatus } from "@/lib/services/partner-service";
import type { PartnerStatus } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        ids?: string[];
        status?: PartnerStatus;
      }
    | null;

  const ids = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
  const status = body?.status;

  if (!ids.length || !status) {
    return Response.json({ error: "Missing ids or status." }, { status: 400 });
  }

  await Promise.all(ids.map((id) => updatePartnerRequestStatus(id, status, "")));
  revalidatePath("/admin/partners");
  return Response.json({ ok: true });
}
