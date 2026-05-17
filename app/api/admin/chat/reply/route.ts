import { revalidatePath } from "next/cache";

import { requireAdminApiSession } from "@/lib/auth/admin-api";
import { addAdminReply } from "@/lib/services/chat-service";

export async function POST(request: Request) {
  try {
    const session = await requireAdminApiSession();
    if (!session.ok) return session.response;

    const contentType = request.headers.get("content-type") ?? "";
    let id = "";
    let message = "";
    let attachment: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      id = String(formData.get("id") ?? "");
      message = String(formData.get("message") ?? "").trim();
      const file = formData.get("attachment");
      attachment = file instanceof File ? file : null;
    } else {
      const body = (await request.json().catch(() => null)) as { id?: string; message?: string } | null;
      id = String(body?.id ?? "");
      message = String(body?.message ?? "").trim();
    }

    if (!id || (!message && !attachment)) {
      return Response.json({ ok: false, error: "Missing chat id or message." }, { status: 400 });
    }

    if (message.length > 4000) {
      return Response.json({ ok: false, error: "Message is too long." }, { status: 400 });
    }

    const result = await addAdminReply(id, message || "Attachment uploaded.", { file: attachment });
    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: result.status });
    }

    revalidatePath("/admin/chat");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin chat reply failed", error);
    return Response.json({ ok: false, error: "Unable to send admin reply." }, { status: 500 });
  }
}
